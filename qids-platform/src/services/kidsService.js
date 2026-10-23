// ─── Kids 4Q Practice — persistence ──────────────────────────────────────────
// Local-first, append-only. A child's finished chapter is an immutable session
// document; only the single in-progress chapter lives on the mutable parent doc.
// That removes three production problems at once:
//
//   * no session-array cap that silently stops syncing,
//   * no last-write-wins erasing a chapter played on another device,
//   * no way to rewrite a completed session after the fact.
//
// Firestore shape:
//   kidsProfiles/{childId}
//     { uid, name, avatar, ageBand, consent:{attestedAt, attestedBy, version} }
//   kidsProgress/{uid_childId}
//     { uid, childId, active: KidsSession | null, schema: 2, updatedAt }
//   kidsProgress/{uid_childId}/sessions/{sessionId}   (create-only)
//     { ...KidsSession, recordedAt: serverTimestamp }
//
// Everything derived (nodes, badges, tally, streak) is computed in
// core/kids/progress.ts — never stored.

import {
  collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeProgress, practiceEvidence } from '../core/kids/progress';

const PROFILES_KEY = 'qids-kids-profiles';
const PROGRESS_KEY = 'qids-kids-progress';

/** Bump when the attestation wording changes — consent is versioned. */
export const CONSENT_VERSION = '2026-10-01';

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* best-effort */ }
}

function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `kid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function progressPath(uid, childId) {
  return `${uid}_${childId}`;
}

/**
 * Union of two session lists by id, keeping the version that has more recorded
 * decisions. This is what makes an offline chapter and a synced chapter merge
 * instead of one overwriting the other.
 */
function mergeSessions(a, b) {
  const map = new Map();
  for (const session of [...a, ...b]) {
    const prev = map.get(session.id);
    if (!prev) { map.set(session.id, session); continue; }
    const richer = (session.choices?.length || 0) >= (prev.choices?.length || 0) ? session : prev;
    map.set(session.id, {
      ...richer,
      completedAt: session.completedAt || prev.completedAt,
    });
  }
  return [...map.values()];
}

// ── Profiles ─────────────────────────────────────────────────────────────────

export async function loadKidsProfiles(uid) {
  const local = readJSON(PROFILES_KEY, []);
  if (!uid) return local;
  try {
    const snap = await getDocs(query(collection(db, 'kidsProfiles'), where('uid', '==', uid)));
    const remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!remote.length) return local;
    const byId = new Map(local.map(p => [p.id, p]));
    for (const p of remote) byId.set(p.id, p);
    const merged = [...byId.values()];
    writeJSON(PROFILES_KEY, merged);

    // Profiles created while offline exist only locally: push them up so the
    // account — not the browser — is the source of truth.
    const remoteIds = new Set(remote.map(p => p.id));
    for (const profile of merged) {
      if (remoteIds.has(profile.id) || !profile.consent) continue;
      setDoc(doc(db, 'kidsProfiles', profile.id), { uid, ...profile })
        .catch(e => console.warn('loadKidsProfiles: pending profile sync failed:', e.message));
    }
    return merged;
  } catch (e) {
    console.warn('loadKidsProfiles fell back to local:', e.message);
    return local;
  }
}

/**
 * Creating a child profile requires an explicit guardian attestation — the
 * profile is children's personal data, and the attestation is the record that
 * an adult accepted responsibility for it.
 */
export async function createKidsProfile(uid, { name, avatar, ageBand, consent }) {
  if (!consent) throw new Error('guardian consent is required to create a child profile');

  const profile = {
    id: newId(),
    name: String(name || '').trim().slice(0, 40) || 'Explorer',
    avatar: avatar || '🦊',
    ageBand: ageBand === '8-10' ? '8-10' : '11-14',
    consent: {
      attestedAt: new Date().toISOString(),
      attestedBy: uid || null,
      version: CONSENT_VERSION,
    },
    createdAt: new Date().toISOString(),
  };

  const local = readJSON(PROFILES_KEY, []);
  writeJSON(PROFILES_KEY, [...local, profile]);

  if (uid) {
    try {
      await setDoc(doc(db, 'kidsProfiles', profile.id), { uid, ...profile });
    } catch (e) {
      console.warn('createKidsProfile sync failed (kept locally):', e.message);
    }
  }
  return profile;
}

export async function removeKidsProfile(uid, childId) {
  writeJSON(PROFILES_KEY, readJSON(PROFILES_KEY, []).filter(p => p.id !== childId));
  const store = readJSON(PROGRESS_KEY, {});
  delete store[childId];
  writeJSON(PROGRESS_KEY, store);

  if (!uid) return;
  const path = progressPath(uid, childId);
  try {
    // Erasure must remove every session document, not just the summary.
    const sessions = await getDocs(collection(db, 'kidsProgress', path, 'sessions'));
    await Promise.all(sessions.docs.map(s => deleteDoc(s.ref).catch(() => {})));
  } catch (e) {
    console.warn('removeKidsProfile: session cleanup failed:', e.message);
  }
  try { await deleteDoc(doc(db, 'kidsProgress', path)); } catch { /* may not exist */ }
  try { await deleteDoc(doc(db, 'kidsProfiles', childId)); } catch { /* may not exist */ }
}

// ── Progress ─────────────────────────────────────────────────────────────────

export async function loadKidsProgress(uid, childId) {
  if (!childId) return normalizeProgress(null, 'unknown');

  const local = normalizeProgress(readJSON(PROGRESS_KEY, {})[childId], childId);
  if (!uid) return local;

  const path = progressPath(uid, childId);
  try {
    const [parentSnap, sessionsSnap] = await Promise.all([
      getDoc(doc(db, 'kidsProgress', path)),
      getDocs(collection(db, 'kidsProgress', path, 'sessions')),
    ]);

    const remoteSessions = sessionsSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    const active = parentSnap.exists() ? parentSnap.data().active : null;
    if (active) remoteSessions.push(active);

    if (!parentSnap.exists() && !remoteSessions.length) return local;

    // Self-healing append: a chapter finished while the summary write failed
    // (offline, flaky link) still lives on this device. Push anything the
    // server doesn't have yet so it can never be stranded locally forever.
    const remoteIds = new Set(remoteSessions.map(s => s.id));
    for (const session of local.sessions) {
      if (!session.completedAt || remoteIds.has(session.id)) continue;
      setDoc(doc(db, 'kidsProgress', path, 'sessions', session.id), {
        ...session,
        recordedAt: serverTimestamp(),
      }).catch(e => console.warn('loadKidsProgress: pending session sync failed:', e.message));
    }

    const merged = normalizeProgress(
      {
        childId,
        sessions: mergeSessions(local.sessions, remoteSessions),
        updatedAt: parentSnap.exists() ? parentSnap.data().updatedAt || null : local.updatedAt,
      },
      childId,
    );

    const store = readJSON(PROGRESS_KEY, {});
    store[childId] = merged;
    writeJSON(PROGRESS_KEY, store);
    return merged;
  } catch (e) {
    console.warn('loadKidsProgress fell back to local:', e.message);
    return local;
  }
}

/**
 * Persist after a decision, a chapter start, or a completion.
 * `prev` lets us append only the sessions that finished in this write.
 */
export async function saveKidsProgress(uid, next, prev = null) {
  if (!next?.childId) return;

  const store = readJSON(PROGRESS_KEY, {});
  store[next.childId] = next;
  writeJSON(PROGRESS_KEY, store);

  if (!uid) return;

  const path = progressPath(uid, next.childId);
  const previousIds = new Set(
    (prev?.sessions || []).filter(s => s.completedAt).map(s => s.id),
  );
  const active = next.sessions.find(s => !s.completedAt) || null;
  const finished = next.sessions.filter(s => s.completedAt && !previousIds.has(s.id));

  try {
    await setDoc(
      doc(db, 'kidsProgress', path),
      {
        uid,
        childId: next.childId,
        active,
        schema: 2,
        updatedAt: next.updatedAt || new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (e) {
    // Keep going: the session documents are the durable record, and a failed
    // summary write must not block them. The next load re-appends anything
    // still missing from the server.
    console.warn('saveKidsProgress: summary sync failed (kept locally):', e.message);
  }

  // Finished chapters are immutable documents: created once, never rewritten.
  for (const session of finished) {
    try {
      await setDoc(doc(db, 'kidsProgress', path, 'sessions', session.id), {
        ...session,
        recordedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('saveKidsProgress: session append failed:', e.message);
    }
  }
}

// ── Data rights ──────────────────────────────────────────────────────────────

/** Everything stored about one child, for a guardian data request. */
export async function exportKidsData(uid, childId) {
  const profiles = readJSON(PROFILES_KEY, []);
  const profile = profiles.find(p => p.id === childId) || null;
  const progress = await loadKidsProgress(uid, childId);
  return {
    exportedAt: new Date().toISOString(),
    childId,
    profile,
    progress,
    evidence: practiceEvidence(progress),
  };
}

// ── Local-only reads (instant paint) ─────────────────────────────────────────

export function peekKidsProgress(childId) {
  return normalizeProgress(readJSON(PROGRESS_KEY, {})[childId], childId);
}

export function peekKidsProfiles() {
  return readJSON(PROFILES_KEY, []);
}

export const AVATARS = ['🦊', '🐼', '🦉', '🐙', '🦁', '🐢', '🦄', '🐝', '🐳', '🦋'];
