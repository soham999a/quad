import {
  collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, doc, serverTimestamp, deleteDoc, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'interviewSessions';

/** Save a new interview session. */
export async function saveInterviewSession(data) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Update an existing interview session by ID. */
export async function updateInterviewSession(sessionId, updates) {
  const ref = doc(db, COLLECTION, sessionId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/** Get a single interview session by ID. */
export async function getInterviewSession(sessionId) {
  const snap = await getDoc(doc(db, COLLECTION, sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** List all interview sessions for a user (as candidate or evaluator). */
export async function getUserInterviewSessions(uid) {
  const q = query(
    collection(db, COLLECTION),
    where('candidateUid', '==', uid),
  );
  const evQ = query(
    collection(db, COLLECTION),
    where('evaluatorUid', '==', uid),
  );

  const [candidateSnap, evaluatorSnap] = await Promise.all([
    getDocs(q),
    getDocs(evQ),
  ]);

  const sessions = new Map();
  candidateSnap.forEach(s => sessions.set(s.id, { id: s.id, ...s.data() }));
  evaluatorSnap.forEach(s => sessions.set(s.id, { id: s.id, ...s.data() }));

  return Array.from(sessions.values()).sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

/** List sessions where user is the evaluator (for interviewer dashboard). */
export async function getEvaluatorSessions(uid) {
  const q = query(
    collection(db, COLLECTION),
    where('evaluatorUid', '==', uid),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

/** Delete an interview session. */
export async function deleteInterviewSession(sessionId) {
  await deleteDoc(doc(db, COLLECTION, sessionId));
}

/** Live subscription to one session — the realtime spine of candidate sync
 *  (question advance, candidate typing, ready-up state). */
export function subscribeSession(sessionId, callback, onError = () => {}) {
  if (!sessionId) return () => {};
  try {
    return onSnapshot(doc(db, COLLECTION, sessionId), snap => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    }, onError);
  } catch {
    return () => {};
  }
}

/** Live list of the sessions where this user is the candidate (their hub). */
export function subscribeSessionsForCandidate(uid, callback) {
  if (!uid) return () => {};
  // No orderBy here on purpose: `candidateUid == uid` + `orderBy(createdAt)`
  // needs a composite index that this project does not define, and the
  // failure is silent (snapshot error) — the hub would just look empty. Sort
  // client-side instead, the same convention the other services follow.
  const q = query(
    collection(db, COLLECTION),
    where('candidateUid', '==', uid),
    limit(50),
  );
  try {
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      callback(list);
    }, () => { /* rules/offline — stay silent */ });
  } catch {
    return () => {};
  }
}
