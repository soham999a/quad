import {
  collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, doc, serverTimestamp, deleteDoc,
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
