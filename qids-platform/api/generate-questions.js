// ─── Groq proxy (Vercel serverless function) ──────────────────────────────────
// Keeps the Groq API key server-side so it never ships inside the client
// bundle. Verifies the caller's Firebase ID token and applies a per-user
// rate limit so a scripted client cannot drain the quota.
//
// Env vars (Vercel):
//   GROQ_API_KEY            — server-side Groq key (falls back to VITE_GROQ_API_KEY)
//   FIREBASE_PROJECT_ID     — for token audience verification
//   (optional) GROQ_RATE_LIMIT_PER_HOUR — default 30

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// One-time admin SDK init (module scope, reused across warm invocations).
function fbAdmin() {
  if (getApps().length === 0) {
    // On Vercel, GOOGLE_APPLICATION_CREDENTIALS or the metadata server
    // provides credentials automatically. Initialize without args.
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getApp();
}

const RATE_LIMIT = Number(process.env.GROQ_RATE_LIMIT_PER_HOUR || 30);
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
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });

  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: { message: 'Server is missing GROQ_API_KEY.' } });

  // ── Auth: require a valid Firebase ID token ────────────────────────────────
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { message: 'Sign in to generate questions.' } });
  }
  let uid;
  try {
    const decoded = await getAuth(fbAdmin()).verifyIdToken(token);
    uid = decoded.uid;
  } catch (e) {
    return res.status(401).json({ error: { message: 'Invalid or expired session. Sign in again.' } });
  }

  // ── Rate limit: per user, per hour ─────────────────────────────────────────
  if (rateLimited(uid)) {
    return res.status(429).json({
      error: { message: `Generation limit reached (${RATE_LIMIT}/hour). Try again later.` },
    });
  }

  try {
    const { messages, temperature = 0.7, maxTokens = 1500, jsonMode = true } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'messages[] is required.' } });
    }

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (e) {
    console.error('groq proxy failed:', e);
    return res.status(502).json({ error: { message: 'Upstream Groq request failed.' } });
  }
}
