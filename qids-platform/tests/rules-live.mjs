// ─── Live Firestore rules test ───────────────────────────────────────────────
// Runs against the DEPLOYED ruleset, using two throwaway Email/Password
// accounts that are deleted at the end. This is the only way to verify rules
// without the emulator (which needs Java + firebase-tools).
//
//   node tests/rules-live.mjs
//
// It proves the properties that matter and that the app depends on:
//   * a child profile cannot exist without a guardian attestation,
//   * nobody can read or write another family's child data,
//   * a finished session is append-only (create ok, update denied),
//   * the progress doc id is pinned to <uid>_<childId>,
//   * erasure still works (owner delete allowed),
//   * clients cannot grant themselves admin.
//
// Every document created here is deleted; both accounts are deleted too.
// If signup is disabled on the project, the script exits 2 with a clear note.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const env = readEnv(path.join(ROOT, '.env'));
const API_KEY = env.VITE_FIREBASE_API_KEY;
const PROJECT = env.VITE_FIREBASE_PROJECT_ID;

if (!API_KEY || !PROJECT) {
  console.error('Missing VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID in .env');
  process.exit(2);
}

const AUTH = 'https://identitytoolkit.googleapis.com/v1';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

let passed = 0;
let failed = 0;
const failures = [];
const accounts = [];

function readEnv(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env */ }
  return out;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function signUp(tag) {
  const email = `rules-test-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const res = await post(`${AUTH}/accounts:signUp?key=${API_KEY}`, {
    email,
    password: `Q!${Math.random().toString(36).slice(2)}A9`,
    returnSecureToken: true,
  });
  if (res.status !== 200) {
    const code = res.data?.error?.message || res.status;
    console.error(`\nCould not create a test account (${code}).`);
    console.error('Email/Password sign-in may be disabled for this project —');
    console.error('enable it in Firebase → Authentication → Sign-in method, or');
    console.error('run the rules in the emulator instead.');
    process.exit(2);
  }
  const account = { uid: res.data.localId, idToken: res.data.idToken, email };
  accounts.push(account);
  return account;
}

async function fsRequest(method, docPath, { token, fields } = {}) {
  const url = docPath
    ? `${FS}/${docPath}`
    : FS;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (method === 'GET' || method === 'DELETE') {
    const res = await fetch(url, { method, headers });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  }
  const res = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(fields ? { fields } : {}),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const s = (v) => ({ stringValue: v });
const n = (v) => ({ integerValue: String(v) });
const nul = () => ({ nullValue: null });
const map = (obj) => ({
  mapValue: { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, s(v)])) },
});
const list = (arr) => ({ arrayValue: { values: arr.map((v) => (typeof v === 'string' ? s(v) : n(v))) } });

function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const isDenied = (r) => r.status === 403;
const isOk = (r) => r.status === 200 || r.status === 201;

const sessions = [];

async function main() {
  console.log(`\nLive rules test → project ${PROJECT}\n`);

  const a = await signUp('a');
  const b = await signUp('b');
  console.log(`  accounts: ${a.uid.slice(0, 6)}… / ${b.uid.slice(0, 6)}…\n`);

  const childId = `rules-test-${Date.now()}`;
  const progressId = `${a.uid}_${childId}`;
  const profilePath = `kidsProfiles/${childId}`;
  const progressPath = `kidsProgress/${progressId}`;
  const sessionId = `sess-${Date.now()}`;
  const sessionPath = `${progressPath}/sessions/${sessionId}`;
  sessions.push({ a, profilePath, progressPath, sessionPath });

  const profileNoConsent = {
    uid: s(a.uid),
    name: s('Test Kid'),
    avatar: s('🦊'),
    ageBand: s('8-10'),
    createdAt: s(new Date().toISOString()),
  };
  const profile = {
    ...profileNoConsent,
    consent: map({ attestedAt: new Date().toISOString(), attestedBy: a.uid, version: '2026-10-01' }),
  };

  // ── Unauthenticated ───────────────────────────────────────────────────────
  check('anonymous cannot read a child profile',
    isDenied(await fsRequest('GET', profilePath)));

  // ── Consent is required ───────────────────────────────────────────────────
  check('profile without consent is rejected',
    isDenied(await fsRequest('PATCH', profilePath, { token: a.idToken, fields: profileNoConsent })));

  check('profile with consent is accepted',
    isOk(await fsRequest('PATCH', profilePath, { token: a.idToken, fields: profile })));

  // ── Cross-family isolation ────────────────────────────────────────────────
  check('another account cannot read the child profile',
    isDenied(await fsRequest('GET', profilePath, { token: b.idToken })));

  check('another account cannot overwrite the child profile',
    isDenied(await fsRequest('PATCH', profilePath, { token: b.idToken, fields: profile })));

  // ── Progress doc identity is pinned ───────────────────────────────────────
  const progressFields = {
    uid: s(a.uid),
    childId: s(childId),
    active: nul(),
    schema: n(2),
    updatedAt: s(new Date().toISOString()),
  };

  check('progress doc with a mismatched id is rejected',
    isDenied(await fsRequest('PATCH', `kidsProgress/${b.uid}_${childId}`, {
      token: a.idToken, fields: progressFields,
    })));

  check('owner can create their progress doc',
    isOk(await fsRequest('PATCH', progressPath, { token: a.idToken, fields: progressFields })));

  check('another account cannot write that progress doc',
    isDenied(await fsRequest('PATCH', progressPath, { token: b.idToken, fields: progressFields })));

  // ── Sessions are append-only ──────────────────────────────────────────────
  const sessionFields = {
    id: s(sessionId),
    childId: s(childId),
    chapterId: s('gate'),
    startedAt: s(new Date().toISOString()),
    completedAt: s(new Date().toISOString()),
    choices: list(['q1', 'q2', 'q3']),
  };

  check('server-clock field (recordedAt) does not block the append',
    isOk(await fsRequest('PATCH', sessionPath, { token: a.idToken, fields: sessionFields })));

  check('a finished session cannot be rewritten',
    isDenied(await fsRequest('PATCH', sessionPath, {
      token: a.idToken,
      fields: { ...sessionFields, chapterId: s('forged') },
    })));

  check('another account cannot read the session',
    isDenied(await fsRequest('GET', sessionPath, { token: b.idToken })));

  check('another account cannot append a session',
    isDenied(await fsRequest('PATCH', `${progressPath}/sessions/foreign-${Date.now()}`, {
      token: b.idToken, fields: sessionFields,
    })));

  // ── Server-scoring records are server-only ────────────────────────────────
  // The collection has an explicit deny-all rule; even if the rule were
  // removed, Firestore denies unmatched paths, so these must hold either way.
  const shadowPath = `scoringShadow/shadow-${Date.now()}`;
  const shadowFields = {
    uid: s(a.uid),
    submissionId: s('shadow-test'),
    scoredBy: s('server'),
    result: map({ unifiedScore: '100' }),
  };
  check('a client cannot forge a server-scored record',
    isDenied(await fsRequest('PATCH', shadowPath, { token: a.idToken, fields: shadowFields })));
  check('a client cannot read server-scoring records',
    isDenied(await fsRequest('GET', shadowPath, { token: a.idToken })));

  // ── Privilege escalation ──────────────────────────────────────────────────
  check('a user cannot create a profile with role=admin',
    isDenied(await fsRequest('PATCH', `users/${b.uid}`, {
      token: b.idToken,
      fields: { uid: s(b.uid), name: s('Mallory'), role: s('admin'), plan: s('free') },
    })));

  // (No allowed-path users write: an orphaned test user doc could never be
  // deleted, since only admins may delete profiles.)
  check('a user cannot grant themselves a paid plan',
    isDenied(await fsRequest('PATCH', `users/${b.uid}`, {
      token: b.idToken,
      fields: { uid: s(b.uid), name: s('Test User'), role: s('individual'), plan: s('pro') },
    })));

  // ── Erasure still works ───────────────────────────────────────────────────
  check('owner can delete a session (erasure request)',
    isOk(await fsRequest('DELETE', sessionPath, { token: a.idToken })));

  check('owner can delete the progress doc',
    isOk(await fsRequest('DELETE', progressPath, { token: a.idToken })));

  check('owner can delete the child profile',
    isOk(await fsRequest('DELETE', profilePath, { token: a.idToken })));
}

async function cleanup() {
  for (const { a, profilePath, progressPath } of sessions) {
    try { await fsRequest('DELETE', progressPath, { token: a.idToken }); } catch { /* gone */ }
    try { await fsRequest('DELETE', profilePath, { token: a.idToken }); } catch { /* gone */ }
  }
  for (const acct of accounts) {
    const res = await post(`${AUTH}/accounts:delete?key=${API_KEY}`, { idToken: acct.idToken });
    console.log(`  cleanup ${acct.email.split('@')[0]}: ${res.status === 200 ? 'account deleted' : `could not delete (${res.status})`}`);
  }
}

try {
  await main();
} catch (e) {
  console.error('\nUnexpected error:', e.message);
  failed += 1;
} finally {
  await cleanup();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) {
  console.log('Failed checks:');
  for (const f of failures) console.log(`  - ${f}`);
  console.log('\nIf several ownership checks passed but consent/immutability');
  console.log('checks failed, the deployed rules are older than firestore.rules.');
  console.log('Redeploy:  firebase deploy --only firestore:rules\n');
}
process.exit(failed ? 1 : 0);
