// ─── Admin signal endpoint (Vercel serverless function) ──────────────────────
// Reports membership events to every admin ("a new evaluator signed up",
// "user X became an evaluator"). Clients cannot read other users' profiles
// (firestore.rules: /users is owner/admin read only), so client-side fan-out
// to admins is impossible by design — the Admin SDK does it here instead.
//
// Trust model: the caller is authenticated (Firebase ID token) and the claim
// is *verified server-side* against users/{subject}: a notification is only
// written if that user's role actually is 'evaluator'. No forged signals,
// and events are deduped per (kind, subject) within 24h so repeated client
// calls or role toggles cannot spam the admin feed.
//
// Env vars (Vercel): FIREBASE_PROJECT_ID. Optional:
// NOTIFY_ADMIN_RATE_LIMIT_PER_HOUR (default 12).

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// One-time admin SDK init (module scope, reused across warm invocations).
function fbAdmin() {
  if (getApps().length === 0) {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getApp();
}

const KINDS = new Set(['evaluator-signup', 'evaluator-role']);
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

const RATE_LIMIT = Number(process.env.NOTIFY_ADMIN_RATE_LIMIT_PER_HOUR || 12);
/** uid -> { windowStart, count } — per-instance; fine as a first-line limit. */
const buckets = new Map();
const WINDOW_MS = 60 * 60 * 1000;

function rateLimited(uid) {
  const now = Date.now();
  const b = buckets.get(uid);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(uid, { windowStart: now, count: 1 });
    return false;
  }
  b.count += 1;
  return b.count > RATE_LIMIT;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth: require a valid Firebase ID token ────────────────────────────────
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  let uid;
  try {
    const decoded = await getAuth(fbAdmin()).verifyIdToken(token);
    uid = decoded.uid;
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (rateLimited(uid)) return res.status(429).json({ error: 'Rate limited' });

  // ── Body ────────────────────────────────────────────────────────────────────
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  const kind = body?.kind;
  if (!KINDS.has(kind)) return res.status(400).json({ error: 'Unknown kind' });

  // The member the event is about: self-signup defaults to the caller;
  // an admin changing someone else's role passes the target uid explicitly.
  const subject = typeof body.subject === 'string' && body.subject.length <= 128 && body.subject.trim()
    ? body.subject.trim()
    : uid;
  const name = typeof body.name === 'string' ? body.name.slice(0, 80) : '';
  const email = typeof body.email === 'string' ? body.email.slice(0, 120) : '';

  try {
    const db = getFirestore(fbAdmin());

    // ── Verify the claim against the real profile (Admin SDK, rules bypass) ──
    const userSnap = await db.collection('users').doc(subject).get();
    if (!userSnap.exists || userSnap.get('role') !== 'evaluator') {
      // Not an evaluator (yet/anymore) — nothing to report. 200 keeps the
      // client's fire-and-forget chain happy without error noise.
      return res.status(200).json({ ok: true, stored: 0, reason: 'not-evaluator' });
    }

    // ── Dedupe: one signal per (kind, subject) per day ───────────────────────
    const dedupeKey = `${kind}:${subject}`;
    const cutoff = new Date(Date.now() - DEDUPE_WINDOW_MS);
    const recent = await db.collection('notifications')
      .where('dedupeKey', '==', dedupeKey)
      .where('createdAt', '>', cutoff)
      .limit(1)
      .get();
    if (!recent.empty) {
      return res.status(200).json({ ok: true, stored: 0, reason: 'deduped' });
    }

    // ── Fan out to every admin ───────────────────────────────────────────────
    const admins = await db.collection('users').where('role', '==', 'admin').get();
    if (admins.empty) return res.status(200).json({ ok: true, stored: 0, reason: 'no-admins' });

    const who = name ? name : (email || 'Someone');
    const title = kind === 'evaluator-signup'
      ? 'New evaluator signed up'
      : 'New evaluator role granted';
    const bodyText = kind === 'evaluator-signup'
      ? `${who}${email ? ` (${email})` : ''} chose the evaluator role — review them in the Admin Panel.`
      : `${who}${email ? ` (${email})` : ''} now holds the evaluator role.`;

    const writer = db.batch();
    admins.forEach((admin) => {
      writer.create(db.collection('notifications').doc(), {
        uid: admin.id,
        type: 'admin',
        title,
        body: bodyText.slice(0, 280),
        link: '/app/admin',
        read: false,
        dedupeKey,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await writer.commit();
    return res.status(200).json({ ok: true, stored: admins.size });
  } catch (err) {
    console.error('notify-admins failed:', err);
    return res.status(500).json({ error: 'Notify failed' });
  }
}
