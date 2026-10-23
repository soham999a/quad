// ─── Server-side scoring endpoint (shadow mode) ──────────────────────────────
// The browser posts an answer sheet; the server scores it with the same engine
// the UI uses (shared/scoring/qids.js) and stores its own result.
//
// Slice 1 writes to `scoringShadow`, not `assessments`. Nothing reads it yet —
// that is the point: it lets us compare server and client results on real
// traffic before switching the app's source of truth and locking the
// assessments collection to server-only writes.
//
// Auth:  Firebase ID token (same pattern as /api/generate-questions).
// Write: Admin SDK only. Firestore rules deny clients all access to the
//        collection, so a shadow record cannot be forged or edited.
//
// Env (Vercel): FIREBASE_PROJECT_ID, optional SUBMIT_RATE_LIMIT_PER_HOUR.

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { buildShadowRecord, SubmissionError, MAX_BODY_BYTES } from './_lib/submitCore.js';

function fbAdmin() {
  if (getApps().length === 0) {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getApp();
}

const RATE_LIMIT = Number(process.env.SUBMIT_RATE_LIMIT_PER_HOUR || 40);
/** uid -> { windowStart, count } — per-instance first-line limit. */
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

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
      throw new SubmissionError('Payload too large', 413);
    }
    try { return JSON.parse(req.body); } catch { throw new SubmissionError('Body must be valid JSON'); }
  }
  throw new SubmissionError('Body must be a JSON object');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: { message: 'Sign in to submit an assessment.' } });

  let uid;
  try {
    const decoded = await getAuth(fbAdmin()).verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired session. Sign in again.' } });
  }

  if (rateLimited(uid)) {
    return res.status(429).json({ error: { message: `Submission limit reached (${RATE_LIMIT}/hour).` } });
  }

  // ── Score ────────────────────────────────────────────────────────────────
  let prepared;
  try {
    const body = readBody(req);
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
      throw new SubmissionError('Payload too large', 413);
    }
    prepared = buildShadowRecord({ body, uid });
  } catch (e) {
    if (e instanceof SubmissionError) {
      return res.status(e.status).json({ error: { message: e.message, details: e.details } });
    }
    console.error('submit-assessment validation failed:', e.message);
    return res.status(400).json({ error: { message: 'Invalid submission' } });
  }

  // ── Persist (idempotent: the submission id is the document id) ────────────
  const ref = getFirestore(fbAdmin()).collection('scoringShadow').doc(prepared.submissionId);
  try {
    await ref.create({ ...prepared.record, receivedAt: FieldValue.serverTimestamp() });
    return res.status(201).json({ ok: true, submissionId: prepared.submissionId, scoredBy: 'server' });
  } catch (e) {
    // 6 / already-exists: the client retried the same submission. That is a
    // success, not an error — the first attempt already scored it.
    if (e?.code === 6 || e?.code === 'already-exists') {
      return res.status(200).json({ ok: true, submissionId: prepared.submissionId, duplicate: true });
    }
    console.error('submit-assessment write failed:', e?.message);
    return res.status(500).json({ error: { message: 'Could not record the submission. Retry.' } });
  }
}
