// ─── Server-side scoring endpoint ────────────────────────────────────────────
// The browser posts an answer sheet at item level; the server derives the
// section totals itself, scores them with the shared engine
// (shared/scoring/qids.js) and records its own result.
//
// Two documents are written, both server-only:
//   assessmentRecords/{submissionId}        full audit trail (answers, hashes)
//   assessmentVerifications/{assessmentId}  compact summary a credential reads
//
// Auth:  Firebase ID token (same pattern as /api/generate-questions).
// Write: Admin SDK only — Firestore rules deny clients all access to both
//        collections, so a record cannot be forged or edited after scoring.
//
// Env (Vercel): FIREBASE_PROJECT_ID, optional SUBMIT_RATE_LIMIT_PER_HOUR.

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { buildSubmissionRecord, buildVerificationSummary, SubmissionError, MAX_BODY_BYTES } from './_lib/submitCore.js';

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

  // ── Derive + score ────────────────────────────────────────────────────────
  let prepared;
  try {
    const body = readBody(req);
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
      throw new SubmissionError('Payload too large', 413);
    }
    prepared = buildSubmissionRecord({ body, uid });
  } catch (e) {
    if (e instanceof SubmissionError) {
      return res.status(e.status).json({ error: { message: e.message, details: e.details } });
    }
    console.error('submit-assessment validation failed:', e.message);
    return res.status(400).json({ error: { message: 'Invalid submission' } });
  }

  const { record, submissionId, mismatches } = prepared;
  const db = getFirestore(fbAdmin());

  // ── Persist (idempotent: the submission id is the document id) ────────────
  const ref = db.collection('assessmentRecords').doc(submissionId);
  try {
    await ref.create({ ...record, receivedAt: FieldValue.serverTimestamp() });
  } catch (e) {
    // 6 / already-exists: the client retried the same submission. That is a
    // success, not an error — the first attempt already scored it.
    if (e?.code === 6 || e?.code === 'already-exists') {
      return res.status(200).json({ ok: true, submissionId, duplicate: true });
    }
    console.error('submit-assessment write failed:', e?.message);
    return res.status(500).json({ error: { message: 'Could not record the submission. Retry.' } });
  }

  // The compact copy exists so a credential can be verified with one read.
  if (record.clientAssessmentId) {
    try {
      await db.collection('assessmentVerifications').doc(record.clientAssessmentId).set(
        { ...buildVerificationSummary(prepared), uid, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
    } catch (e) {
      // The audit record is already safe; a missing summary only downgrades the
      // credential badge, so this must not fail the submission.
      console.error('verification summary write failed:', e?.message);
    }
  }

  if (mismatches.length) {
    console.warn('submit-assessment sheet mismatch:', submissionId, mismatches.join(','));
  }

  return res.status(201).json({
    ok: true,
    submissionId,
    scoredBy: 'server',
    attested: record.attested,
    mismatches,
    result: {
      unifiedScore: record.result.unifiedScore,
      grade: record.result.grade,
      pillarScores: record.result.pillarScores,
    },
    shares: record.shares,
  });
}
