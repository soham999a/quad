import {
  collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, doc, serverTimestamp, deleteDoc, onSnapshot, limit,
  arrayUnion,
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

// ─── WebRTC signalling (Google-Meet-style video/audio in the live room) ───────
// The Firestore session doc IS the signalling channel. Each side owns its own
// field and writes ICE candidates with arrayUnion, so no read-modify-write
// races and no cross-writes: the evaluator publishes the offer, the candidate
// publishes the answer, and both trickle into their own candidate arrays.
// Rules mirror that ownership exactly (see firestore.rules).

/** Evaluator → candidate session description offer. */
export function publishWebRtcOffer(sessionId, offer) {
  return updateDoc(doc(db, COLLECTION, sessionId), {
    webrtcOffer: offer,
    webrtcAnswer: null,
    webrtcEvalIce: [],
    webrtcCandIce: [],
    updatedAt: serverTimestamp(),
  }).catch(() => { /* signalling is best-effort — the interview continues */ });
}

/** Candidate → evaluator session description answer. */
export function publishWebRtcAnswer(sessionId, answer) {
  return updateDoc(doc(db, COLLECTION, sessionId), {
    webrtcAnswer: answer,
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

/** Trickle one ICE candidate owned by the evaluator. */
export function addEvalIceCandidate(sessionId, candidate) {
  if (!candidate) return;
  return updateDoc(doc(db, COLLECTION, sessionId), {
    webrtcEvalIce: arrayUnion(candidate),
  }).catch(() => {});
}

/** Trickle one ICE candidate owned by the candidate. */
export function addCandidateIceCandidate(sessionId, candidate) {
  if (!candidate) return;
  return updateDoc(doc(db, COLLECTION, sessionId), {
    webrtcCandIce: arrayUnion(candidate),
  }).catch(() => {});
}

/** Tear the call state down on the session doc. */
export function clearWebRtc(sessionId) {
  return updateDoc(doc(db, COLLECTION, sessionId), {
    webrtcOffer: null,
    webrtcAnswer: null,
    webrtcEvalIce: null,
    webrtcCandIce: null,
  }).catch(() => {});
}

/** Live list of the sessions where this user is the evaluator — the realtime
 *  feed for the evaluator's dashboard, so accepted/ready/live state changes
 *  land there the instant the candidate acts. */
export function subscribeSessionsForEvaluator(uid, callback) {
  if (!uid) return () => {};
  const q = query(
    collection(db, COLLECTION),
    where('evaluatorUid', '==', uid),
    limit(50),
  );
  try {
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const tv = s => s?.updatedAt?.toMillis?.() || s?.createdAt?.toMillis?.() || 0;
        return tv(b) - tv(a);
      });
      callback(list);
    }, () => { /* rules/offline — stay silent */ });
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
