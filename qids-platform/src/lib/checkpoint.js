// ─── Assessment checkpointing (blueprint P2) ──────────────────────────────
// Two layers so work is never lost:
//   1. localStorage   — instant, per-device, written on every change (debounced).
//   2. Firestore doc  — cross-device resume, written at most every ~20s.
// Cleared on submit. Firestore failures never block the local layer.

import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const KEY_PREFIX = 'qids-checkpoint:';

// ── Local layer (fast, per-device) ──────────────────────────────────────────

export function loadCheckpoint(kind, uid) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + kind + ':' + (uid || 'anon'));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Discard checkpoints older than 30 days — stale state is worse than none.
    if (parsed.savedAt && Date.now() - parsed.savedAt > 30 * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(KEY_PREFIX + kind + ':' + (uid || 'anon'));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckpoint(kind, uid, state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      KEY_PREFIX + kind + ':' + (uid || 'anon'),
      JSON.stringify({ ...state, savedAt: Date.now() }),
    );
  } catch {
    // Storage full or unavailable — checkpointing is best-effort by design.
  }
}

export function clearCheckpoint(kind, uid) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY_PREFIX + kind + ':' + (uid || 'anon'));
  } catch {
    // ignore
  }
  clearRemoteCheckpoint(kind, uid).catch(() => {});
}

// ── Remote layer (cross-device) ─────────────────────────────────────────────
// One doc per user+kind: /assessmentCheckpoints/{uid}_{kind}. Rules allow
// owner-only read/write. Writes are caller-throttled; loads merge nothing —
// the local layer wins when both exist (it is newer in practice).

const REMOTE_WINDOW_MS = 20 * 1000;
const lastRemoteWrite = new Map();

function remoteId(kind, uid) {
  return `${uid || 'anon'}_${kind.replace(/[^a-zA-Z0-9-]/g, '_')}`;
}

export async function saveRemoteCheckpoint(kind, uid, state) {
  if (!uid) return false; // anonymous sessions stay local-only
  try {
    const now = Date.now();
    const last = lastRemoteWrite.get(remoteId(kind, uid)) || 0;
    if (now - last < REMOTE_WINDOW_MS) return false; // throttle
    lastRemoteWrite.set(remoteId(kind, uid), now);
    await setDoc(doc(db, 'assessmentCheckpoints', remoteId(kind, uid)), {
      uid,
      kind,
      state,
      savedAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false; // never let the remote layer break the local one
  }
}

export async function loadRemoteCheckpoint(kind, uid) {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'assessmentCheckpoints', remoteId(kind, uid)));
    if (!snap.exists()) return null;
    const data = snap.data();
    // Prefer the local copy when it is fresher than the remote one.
    const local = loadCheckpoint(kind, uid);
    const remoteAt = data.savedAt?.toMillis?.() ?? 0;
    if (local?.savedAt && local.savedAt >= remoteAt) return null;
    return { ...data.state, savedAt: remoteAt || Date.now() };
  } catch {
    return null;
  }
}

export async function clearRemoteCheckpoint(kind, uid) {
  if (!uid) return;
  try {
    await deleteDoc(doc(db, 'assessmentCheckpoints', remoteId(kind, uid)));
  } catch {
    // ignore
  }
}
