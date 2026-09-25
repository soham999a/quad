// ─── Error intake endpoint (Vercel serverless function) ──────────────────────
// Receives batches from src/lib/errorReport.js and stores them in Firestore
// (`errorReports`, capped). No auth is required for writing (errors can occur
// pre-auth), but the payload is tightly validated and rate-limited per IP to
// prevent abuse. Firestore rules: errorReports is admin-read-only; writes
// arrive exclusively through this endpoint (Admin SDK bypasses rules).
//
// Env vars (Vercel): FIREBASE_PROJECT_ID (for Admin init). Optional:
// ERROR_RATE_LIMIT_PER_MINUTE (default 20).

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function fbAdmin() {
  if (getApps().length === 0) {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getApp();
}

const RATE = Number(process.env.ERROR_RATE_LIMIT_PER_MINUTE || 20);
const WINDOW_MS = 60 * 1000;
/** ip -> { windowStart, count } per warm instance. */
const buckets = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now - b.windowStart > WINDOW_MS) {
    buckets.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  b.count += 1;
  return b.count > RATE;
}

const MAX_BATCH = 10;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Rate limited' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const errors = Array.isArray(body?.errors) ? body.errors.slice(0, MAX_BATCH) : null;
  if (!errors) return res.status(400).json({ error: 'Expected { errors: [...] }' });

  const db = getFirestore(fbAdmin());
  const now = Date.now();
  const docs = [];
  for (const e of errors) {
    if (!e || typeof e.message !== 'string' || !e.message.trim()) continue;
    const ts = Date.parse(e.ts || '');
    docs.push({
      message: e.message.slice(0, 500),
      category: typeof e.category === 'string' ? e.category.slice(0, 24) : 'runtime',
      stack: typeof e.stack === 'string' ? e.stack.slice(0, 2000) : '',
      componentStack: typeof e.componentStack === 'string' ? e.componentStack.slice(0, 1500) : '',
      page: typeof e.page === 'string' ? e.page.slice(0, 200) : '',
      userAgent: typeof e.userAgent === 'string' ? e.userAgent.slice(0, 200) : '',
      uid: typeof e.uid === 'string' ? e.uid.slice(0, 128) : null,
      lang: typeof e.lang === 'string' ? e.lang.slice(0, 10) : 'en',
      sessionSeq: Number.isFinite(e.sessionSeq) ? Math.max(0, Math.min(9999, e.sessionSeq | 0)) : 0,
      clientTs: Number.isFinite(ts) && now - ts < MAX_AGE_MS ? new Date(ts) : new Date(now),
      serverTs: FieldValue.serverTimestamp(),
    });
  }
  if (!docs.length) return res.status(200).json({ ok: true, stored: 0 });

  try {
    // Firestore allows 500 writes per batch; ours is ≤10.
    const writer = db.batch();
    for (const d of docs) writer.create(db.collection('errorReports').doc(), d);
    await writer.commit();
    return res.status(200).json({ ok: true, stored: docs.length });
  } catch (err) {
    console.error('log-error store failed:', err);
    return res.status(500).json({ error: 'Store failed' });
  }
}
