// ─── Kids 4Q Practice — persistence ──────────────────────────────────────────
// Local-first by design: the module must work on localhost (and offline) even
// before Firestore rules are deployed. Every read falls back to localStorage,
// every write goes to localStorage first and then syncs to Firestore when the
// user is signed in. A failed sync never loses the child's session.
//
// Documents:
//   kidsProfiles/{childId}            → { uid, name, avatar, ageBand, createdAt }
//   kidsProgress/{uid_childId}        → { uid, childId, sessions[], events[] }
//
// Progress stores only what happened. Nodes, badges and tallies are derived in
// core/kids/progress.ts.

import {
  collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizeProgress } from '../core/kids/progress';

const PROFILES_KEY = 'qids-kids-profiles';
const PROGRESS_KEY = 'qids-kids-progress';

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

export const AVATARS = ['🦊', '🐼', '🦉', '🐙', '🦁', '🐢', '🦄', '🐝', '🐳', '🦋'];

// ── Profiles ─────────────────────────────────────────────────────────────────

export async function loadKidsProfiles(uid) {
  const local = readJSON(PROFILES_KEY, []);
  if (!uid) return local;
  try {
    const snap = await getDocs(query(collection(db, 'kidsProfiles'), where('uid', '==', uid)));
    const remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!remote.length) return local;
    // Remote wins on id collision; keep local-only profiles (created offline).
    const byId = new Map(local.map(p => [p.id, p]));
    for (const p of remote) byId.set(p.id, p);
    const merged = [...byId.values()].filter(p => !p.deleted);
    writeJSON(PROFILES_KEY, merged);
    return merged;
  } catch (e) {
    console.warn('loadKidsProfiles fell back to local:', e.message);
    return local;
  }
}

export async function createKidsProfile(uid, { name, avatar, ageBand }) {
  const profile = {
    id: newId(),
    name: String(name || '').trim().slice(0, 40) || 'Explorer',
    avatar: avatar || AVATARS[0],
    ageBand: ageBand === '8-10' ? '8-10' : '11-14',
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
  const local = readJSON(PROFILES_KEY, []).filter(p => p.id !== childId);
  writeJSON(PROFILES_KEY, local);
  const progress = readJSON(PROGRESS_KEY, {});
  delete progress[childId];
  writeJSON(PROGRESS_KEY, progress);

  if (uid) {
    try {
      await deleteDoc(doc(db, 'kidsProfiles', childId));
    } catch (e) {
      console.warn('removeKidsProfile sync failed:', e.message);
    }
    try {
      await deleteDoc(doc(db, 'kidsProgress', `${uid}_${childId}`));
    } catch { /* progress doc may not exist */ }
  }
}

// ── Progress ─────────────────────────────────────────────────────────────────

export async function loadKidsProgress(uid, childId) {
  if (!childId) return normalizeProgress(null, 'unknown');
  const local = readJSON(PROGRESS_KEY, {})[childId];
  if (!uid) return normalizeProgress(local, childId);
  try {
    const snap = await getDoc(doc(db, 'kidsProgress', `${uid}_${childId}`));
    if (snap.exists()) {
      const remote = normalizeProgress({ ...snap.data(), childId }, childId);
      // Prefer the longer session log — covers writes made before the sync failed.
      const localP = normalizeProgress(local, childId);
      const chosen = remote.sessions.length >= localP.sessions.length ? remote : localP;
      const store = readJSON(PROGRESS_KEY, {});
      store[childId] = chosen;
      writeJSON(PROGRESS_KEY, store);
      return chosen;
    }
    return normalizeProgress(local, childId);
  } catch (e) {
    console.warn('loadKidsProgress fell back to local:', e.message);
    return normalizeProgress(local, childId);
  }
}

export async function saveKidsProgress(uid, progress) {
  if (!progress?.childId) return;
  const store = readJSON(PROGRESS_KEY, {});
  store[progress.childId] = progress;
  writeJSON(PROGRESS_KEY, store);

  if (!uid) return;
  try {
    await setDoc(
      doc(db, 'kidsProgress', `${uid}_${progress.childId}`),
      {
        uid,
        childId: progress.childId,
        sessions: progress.sessions,
        events: progress.events || [],
        updatedAt: progress.updatedAt || new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn('saveKidsProgress sync failed (kept locally):', e.message);
  }
}

/** Local-only read, used to paint instantly before the network answers. */
export function peekKidsProgress(childId) {
  const local = readJSON(PROGRESS_KEY, {})[childId];
  return normalizeProgress(local, childId);
}

export function peekKidsProfiles() {
  return readJSON(PROFILES_KEY, []);
}
