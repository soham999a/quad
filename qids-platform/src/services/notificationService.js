// ─── In-app notifications ─────────────────────────────────────────────────────
// Real-time Firestore-backed bell notifications for the school/evaluator loops:
// assignment created → students, student joined → teacher, evaluator assigned
// → evaluator. Writers are fire-and-forget (a failed notification must never
// block the action that caused it); readers use onSnapshot for live updates.

import {
  collection, addDoc, updateDoc, doc, query, where, orderBy, limit,
  onSnapshot, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const NOTIFICATIONS = 'notifications';
const MAX_UNREAD_FETCH = 50;

/**
 * createNotification({ uid, type, title, body, link })
 * Fire-and-forget. `link` is an in-app route the bell opens on click.
 */
export function createNotification({ uid, type, title, body, link = '' }) {
  if (!uid || !type) return;
  try {
    addDoc(collection(db, NOTIFICATIONS), {
      uid,
      type,
      title,
      body: body || '',
      link,
      read: false,
      createdAt: serverTimestamp(),
    }).catch(() => { /* notifications must never throw into the caller */ });
  } catch { /* same */ }
}

/** Live subscription to the user's latest notifications. Returns unsubscribe. */
export function subscribeNotifications(uid, callback, max = 20) {
  if (!uid) return () => {};
  const q = query(
    collection(db, NOTIFICATIONS),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  try {
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => { /* rules or offline — stay silent */ });
  } catch {
    return () => {};
  }
}

/** Count of unread notifications (fire-and-forget, for the bell badge). */
export async function getUnreadCount(uid) {
  if (!uid) return 0;
  try {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('uid', '==', uid),
      where('read', '==', false),
      limit(MAX_UNREAD_FETCH),
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}

/** Mark one notification read. */
export async function markNotificationRead(notificationId) {
  if (!notificationId) return;
  try {
    await updateDoc(doc(db, NOTIFICATIONS, notificationId), { read: true });
  } catch { /* best-effort */ }
}

/** Mark all of the user's unread notifications read. */
export async function markAllNotificationsRead(uid) {
  if (!uid) return;
  try {
    const q = query(
      collection(db, NOTIFICATIONS),
      where('uid', '==', uid),
      where('read', '==', false),
      limit(MAX_UNREAD_FETCH),
    );
    const snap = await getDocs(q);
    await Promise.allSettled(snap.docs.map(d => updateDoc(d.ref, { read: true })));
  } catch { /* best-effort */ }
}

// ─── Event helpers (call these from the flows) ───────────────────────────────

/** Notify every student in a class that a new assessment was assigned. */
export async function notifyClassAssignment({ classId, teacherName, title, classCode }) {
  try {
    const { getClassStudents, getClass } = await import('./schoolService');
    const [cls, students] = await Promise.all([getClass(classId), getClassStudents(classId)]);
    const className = cls?.name || classCode || 'your class';
    await Promise.allSettled(students.map(s =>
      Promise.resolve(createNotification({
        uid: s.studentUid,
        type: 'assignment',
        title: 'New assessment assigned',
        body: `${teacherName} assigned "${title}" in ${className}.`,
        link: '/app/my-class',
      }))
    ));
  } catch { /* best-effort */ }
}

/** Notify the teacher that a student joined their class. */
export function notifyStudentJoined({ teacherUid, studentName, className }) {
  createNotification({
    uid: teacherUid,
    type: 'join',
    title: 'A student joined your class',
    body: `${studentName} joined ${className}.`,
    link: '/app/school',
  });
}

/** Notify a student that their attempt was recorded (teacher can see it). */
export function notifyAttemptRecorded({ studentUid, title }) {
  createNotification({
    uid: studentUid,
    type: 'attempt',
    title: 'Assessment submitted',
    body: `Your "${title}" submission was recorded. View your results.`,
    link: '/app/my-class',
  });
}

/** Notify an evaluator that a student assigned them. */
export function notifyEvaluatorAssigned({ evaluatorUid, studentName }) {
  createNotification({
    uid: evaluatorUid,
    type: 'evaluator',
    title: 'New student assigned to you',
    body: `${studentName} selected you as their evaluator.`,
    link: '/app/evaluator',
  });
}
