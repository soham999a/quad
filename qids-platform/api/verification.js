// ─── Credential verification (Vercel serverless function) ───────────────────
// Answers one question for a credential: did the *server* score this, and do
// the numbers it shows match what the server recorded?
//
//   GET /api/verification?id=<assessmentId>
//     → { ok, verification: { attested, unifiedScore, grade, pillarScores,
//         shares, completeness, inputHash, scoredAt, engine } }
//
// Access:
//   * the owner (Bearer ID token whose uid matches) — always
//   * anyone, once the credential is published to `publicCredentials`
//   * otherwise 404, which the UI reports as "not server-verified"
//
// The verification doc holds no answers, no intake and no uid in its response,
// so a public caller learns nothing beyond the badge and the public numbers.

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function fbAdmin() {
  if (getApps().length === 0) {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getApp();
}

const ID_SAFE = /^[A-Za-z0-9_-]{1,128}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: { message: 'Method not allowed' } });
  }

  const id = String(req.query.id || '');
  if (!ID_SAFE.test(id)) {
    return res.status(400).json({ ok: false, error: { message: 'A valid assessment id is required' } });
  }

  const db = getFirestore(fbAdmin());

  let snap;
  try {
    snap = await db.collection('assessmentVerifications').doc(id).get();
  } catch (e) {
    console.error('verification lookup failed:', e?.message);
    return res.status(503).json({ ok: false, error: { message: 'Verification is temporarily unavailable' } });
  }

  if (!snap.exists) {
    return res.status(404).json({ ok: false, reason: 'not-recorded' });
  }

  const data = snap.data();

  // Owner check first: a token is only used to widen access, never required.
  let isOwner = false;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const decoded = await getAuth(fbAdmin()).verifyIdToken(header.slice(7));
      isOwner = decoded.uid === data.uid;
    } catch { /* invalid token — fall through to the public check */ }
  }

  let isPublic = false;
  if (!isOwner) {
    try {
      const pub = await db.collection('publicCredentials').doc(id).get();
      isPublic = pub.exists;
    } catch (e) {
      console.error('public credential lookup failed:', e?.message);
    }
  }

  if (!isOwner && !isPublic) {
    return res.status(404).json({ ok: false, reason: 'not-recorded' });
  }

  return res.status(200).json({
    ok: true,
    verification: {
      attested: data.attested === true,
      mismatchCount: data.mismatchCount ?? 0,
      unifiedScore: data.unifiedScore ?? null,
      grade: data.grade ?? null,
      pillarScores: data.pillarScores ?? null,
      skillShape: data.skillShape ?? null,
      shares: data.shares ?? null,
      completeness: data.completeness ?? null,
      inputHash: data.inputHash ?? null,
      engine: data.engine ?? null,
      scoredAt: data.scoredAt ?? null,
    },
  });
}
