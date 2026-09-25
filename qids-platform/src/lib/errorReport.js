// ─── Lightweight error reporting (Sentry-free) ────────────────────────────────
// Client errors land in a Firestore-backed store via /api/log-error, and the
// Admin Panel shows the latest ones. Design goals: never disturb the user,
// batch rather than spam, and cap payload size. If the endpoint is missing
// (plain dev server), the batch is dropped silently — local console still
// shows everything.

import { auth } from '../firebase';

const ENDPOINT = '/api/log-error';
const FLUSH_INTERVAL = 15_000;
const MAX_BATCH = 10;
const MAX_BUFFER = 30;
const RING = 25;

let buffer = [];
let flushTimer = null;
let sessionSeq = 0;
let lastReports = new Map(); // dedupe: identical message within 60s sends once
const RING_BUFFER = [];

export function recentErrors() {
  return [...RING_BUFFER];
}

function classify(error) {
  if (!error) return 'unknown';
  const msg = String(error.message || error);
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'network';
  if (/permission|denied/i.test(msg)) return 'permission';
  if (/quota|resource-exhausted|429/i.test(msg)) return 'quota';
  if (/timeout|abort/i.test(msg)) return 'timeout';
  return 'runtime';
}

function pushRing(entry) {
  RING_BUFFER.push(entry);
  if (RING_BUFFER.length > RING) RING_BUFFER.shift();
}

export function reportError(error, context = {}) {
  try {
    const message = String(error?.message || error || 'Unknown error').slice(0, 500);
    const now = Date.now();
    const dedupeKey = `${classify(error)}:${message}`;
    const last = lastReports.get(dedupeKey) || 0;
    if (now - last < 60_000) return; // same error within a minute — skip
    lastReports.set(dedupeKey, now);
    if (lastReports.size > 100) {
      const oldest = [...lastReports.entries()].sort((a, b) => a[1] - b[1])[0];
      if (oldest) lastReports.delete(oldest[0]);
    }

    const entry = {
      message,
      category: classify(error),
      stack: String(error?.stack || '').slice(0, 2000),
      componentStack: String(context.componentStack || '').slice(0, 1500),
      page: typeof location !== 'undefined' ? location.pathname : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
      uid: auth?.currentUser?.uid || null,
      lang: typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') || 'en' : 'en',
      sessionSeq: ++sessionSeq,
      ts: new Date().toISOString(),
    };
    pushRing(entry);

    buffer.push(entry);
    if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
    if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_INTERVAL);
  } catch { /* reporting must never throw */ }
}

function flush() {
  flushTimer = null;
  if (!buffer.length) return;
  const batch = buffer.splice(0, MAX_BATCH).map(e => e);
  const body = JSON.stringify({ errors: batch });
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => { /* offline — drop; the ring buffer keeps it for diagnostics */ });
}

// ─── Global handlers ─────────────────────────────────────────────────────────
if (typeof window !== 'undefined' && !window.__qidsErrorHandlers) {
  window.__qidsErrorHandlers = true;

  window.addEventListener('error', (event) => {
    // Vite/HMR and extension noise are not app errors.
    if (event.message?.includes('ResizeObserver')) return;
    reportError(event.error || new Error(event.message), { kind: 'window' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), { kind: 'promise' });
  });
}
