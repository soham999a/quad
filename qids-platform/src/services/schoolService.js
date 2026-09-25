import {
  collection, addDoc, updateDoc, getDoc, getDocs,
  query, where, doc, serverTimestamp, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const CLASSES = 'schoolClasses';
const STUDENTS = 'classStudents';
const ASSESSMENTS = 'schoolAssessments';

function sortByTimestamp(docs, field = 'createdAt') {
  return docs.sort((a, b) => {
    const ta = a[field]?.toMillis?.() ?? 0;
    const tb = b[field]?.toMillis?.() ?? 0;
    return tb - ta;
  });
}

// ─── Classes ─────────────────────────────────────────────────────────────────

function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createClass(data) {
  const classCode = generateClassCode();
  const docRef = await addDoc(collection(db, CLASSES), {
    ...data,
    classCode,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, classCode };
}

export async function getClass(classId) {
  const snap = await getDoc(doc(db, CLASSES, classId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getClassByCode(classCode) {
  const q = query(collection(db, CLASSES), where('classCode', '==', classCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getTeacherClasses(teacherUid) {
  const q = query(collection(db, CLASSES), where('teacherUid', '==', teacherUid));
  const snap = await getDocs(q);
  return sortByTimestamp(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function updateClass(classId, updates) {
  await updateDoc(doc(db, CLASSES, classId), { ...updates, updatedAt: serverTimestamp() });
}

export async function deleteClass(classId) {
  await deleteDoc(doc(db, CLASSES, classId));
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function joinClass(studentUid, studentName, classCode) {
  const classData = await getClassByCode(classCode);
  if (!classData) throw new Error('Invalid class code');

  const q = query(
    collection(db, STUDENTS),
    where('classId', '==', classData.id),
  );
  const snap = await getDocs(q);
  if (snap.docs.some(d => d.data().studentUid === studentUid)) return classData.id;

  await addDoc(collection(db, STUDENTS), {
    classId: classData.id,
    studentUid,
    name: studentName,
    joinedAt: serverTimestamp(),
  });

  return classData.id;
}

export async function getClassStudents(classId) {
  const q = query(collection(db, STUDENTS), where('classId', '==', classId));
  const snap = await getDocs(q);
  return sortByTimestamp(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'joinedAt');
}

export async function getStudentClasses(studentUid) {
  const q = query(collection(db, STUDENTS), where('studentUid', '==', studentUid));
  const snap = await getDocs(q);
  const sorted = sortByTimestamp(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'joinedAt');
  const classes = [];
  for (const d of sorted) {
    const classData = await getClass(d.classId);
    if (classData) classes.push(classData);
  }
  return classes;
}

// ─── School Assessments ──────────────────────────────────────────────────────

export async function createSchoolAssessment(data) {
  const docRef = await addDoc(collection(db, ASSESSMENTS), {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getClassAssessments(classId) {
  const q = query(collection(db, ASSESSMENTS), where('classId', '==', classId));
  const snap = await getDocs(q);
  return sortByTimestamp(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function updateSchoolAssessment(assessmentId, updates) {
  await updateDoc(doc(db, ASSESSMENTS, assessmentId), { ...updates, updatedAt: serverTimestamp() });
}

// ─── Student attempts (append-only) ───────────────────────────────────────────
// When a student completes an assessment that was assigned to their class, we
// record the attempt in its own collection so teachers can see who finished
// what — without giving students write access to the assessment documents.

export async function recordSchoolAttempt({ schoolAssessmentId, classId, teacherUid, studentUid, studentName, assessmentId }) {
  await addDoc(collection(db, 'schoolAttempts'), {
    schoolAssessmentId,
    classId,
    teacherUid,
    studentUid,
    studentName,
    assessmentId,
    completedAt: new Date().toISOString(),
  });
}

export async function getClassAttempts(classId) {
  const q = query(collection(db, 'schoolAttempts'), where('classId', '==', classId));
  const snap = await getDocs(q);
  return sortByTimestamp(snap.docs.map(d => ({ id: d.id, ...d.data() })), 'completedAt');
}
