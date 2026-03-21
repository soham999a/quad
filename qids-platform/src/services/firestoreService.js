import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Assessments ──────────────────────────────────────────────────────────────

export async function saveAssessment(uid, data) {
  try {
    const ref = await addDoc(collection(db, 'assessments'), {
      uid, ...data, phase: 'pre',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) { console.warn('saveAssessment failed:', e.message); return null; }
}

export async function getLatestAssessment(uid) {
  try {
    const q = query(collection(db, 'assessments'), where('uid', '==', uid), where('phase', '==', 'pre'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) { console.warn('getLatestAssessment failed:', e.message); return null; }
}

export async function getLatestPostAssessment(uid) {
  try {
    const q = query(collection(db, 'assessments'), where('uid', '==', uid), where('phase', '==', 'post'), orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (e) { console.warn('getLatestPostAssessment failed:', e.message); return null; }
}

export async function getUserAssessments(uid) {
  try {
    const q = query(collection(db, 'assessments'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('getUserAssessments failed:', e.message); return []; }
}

export async function getUserReports(uid) {
  try {
    const q = query(collection(db, 'reports'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.warn('getUserReports failed:', e.message); return []; }
}

export async function savePostAssessment(uid, assessmentId, data) {
  try {
    const ref = await addDoc(collection(db, 'assessments'), {
      uid, ...data, phase: 'post', linkedAssessmentId: assessmentId,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) { console.warn('savePostAssessment failed:', e.message); return null; }
}

export async function saveReport(uid, reportData) {
  try {
    const ref = await addDoc(collection(db, 'reports'), { uid, ...reportData, createdAt: serverTimestamp() });
    return ref.id;
  } catch (e) { console.warn('saveReport failed:', e.message); return null; }
}

export async function updateUserProfile(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
  } catch (e) { console.warn('updateUserProfile failed:', e.message); }
}

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) { console.warn('getUserProfile failed:', e.message); return null; }
}

export async function saveInterventionPlan(uid, assessmentId, plan) {
  try {
    await setDoc(doc(db, 'interventionPlans', `${uid}_${assessmentId}`), {
      uid, assessmentId, ...plan, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  } catch (e) { console.warn('saveInterventionPlan failed:', e.message); }
}

export async function getInterventionPlan(uid, assessmentId) {
  try {
    const snap = await getDoc(doc(db, 'interventionPlans', `${uid}_${assessmentId}`));
    return snap.exists() ? snap.data() : null;
  } catch (e) { console.warn('getInterventionPlan failed:', e.message); return null; }
}
