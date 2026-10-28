// ─── In-app notifications ─────────────────────────────────────────────────────
// Real-time Firestore-backed bell notifications for the school/evaluator loops:
// assignment created → students, student joined → teacher, evaluator assigned
// → evaluator. Writers are fire-and-forget (a failed notification must never
// block the action that caused it); readers use onSnapshot for live updates.

import {
  collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit,
  onSnapshot, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

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
  // No orderBy on purpose: `uid == x` + `orderBy(createdAt)` needs a composite
  // index this project does not ship, and the snapshot error is silent — which
  // meant the bell never rendered a single notification. Sort client-side.
  const q = query(
    collection(db, NOTIFICATIONS),
    where('uid', '==', uid),
    limit(Math.max(max, 30)),
  );
  try {
    return onSnapshot(q, snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      callback(list.slice(0, max));
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

/**
 * Bound the feed: delete the signed-in user's READ notifications older than 90
 * days, capped at 200 docs per call so it can never become a heavy query.
 * Old unread items are left alone (a real notification shouldn't vanish just
 * because the user was away); the bell's capped queries keep reads bounded.
 * Best-effort and silent on failure. Returns the number deleted.
 */
export async function cleanupOldNotifications(uid, maxAgeDays = 90) {
  if (!uid) return 0;
  try {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, NOTIFICATIONS),
      where('uid', '==', uid),
      where('read', '==', true),
      where('createdAt', '<', cutoff),
      limit(200),
    );
    const snap = await getDocs(q);
    await Promise.allSettled(snap.docs.map(d => deleteDoc(d.ref)));
    return snap.size;
  } catch { return 0; }
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

// ─── Event wiring added later (one helper per event, same discipline) ─────────

/**
 * Tell a person that an evaluator is now linked to them. Fired from every
 * direction (they picked one themselves; an admin paired them) because the
 * studio used to announce this to the evaluator only — the person whose
 * results were about to be read never heard anything.
 */
export function notifyEvaluatorLinked({ studentUid, evaluatorName = 'An evaluator', detail }) {
  createNotification({
    uid: studentUid,
    type: 'evaluator',
    title: `${evaluatorName} is now your evaluator`,
    body: detail || 'They can see your results and score your EQ, SQ and AQ rubrics. Your merged report updates when they finish.',
    link: '/app/my-evaluator',
  });
}

/**
 * Tell an evaluator that one of their people submitted something new — the
 * missing half of the loop: until now a student's activity was only visible if
 * the evaluator happened to refresh the console.
 */
export function notifyEvaluatorStudentActivity({ evaluatorUid, studentName, detail, link = '/app/evaluator' }) {
  if (!evaluatorUid) return;
  createNotification({
    uid: evaluatorUid,
    type: 'attempt',
    title: `${studentName || 'One of your students'} submitted an assessment`,
    body: detail || 'Open your console to review the result and score the pending rubrics.',
    link,
  });
}

/** Notify a student that their evaluator finished scoring one of their pillars. */
export function notifyEvaluationCompleted({ studentUid, evaluatorName = 'Your evaluator', pillar }) {
  createNotification({
    uid: studentUid,
    type: 'evaluation',
    title: `${evaluatorName} scored your ${pillar || 'assessment'} rubric`,
    body: 'The merged average is live on your progress page.',
    link: '/app/progress',
  });
}

/** Notify a teacher that a student completed their assigned assessment. */
export function notifyAssignmentCompleted({ teacherUid, studentName, title, classId }) {
  createNotification({
    uid: teacherUid,
    type: 'attempt',
    title: 'Student completed an assessment',
    body: `${studentName || 'A student'} finished "${title || 'an assigned assessment'}".`,
    link: classId ? `/app/class/${classId}` : '/app/school',
  });
}

/** Notify the guardian that a child finished a practice chapter. */
export function notifyChapterCompleted({ guardianUid, childName, chapterTitle }) {
  createNotification({
    uid: guardianUid,
    type: 'kid',
    title: 'Chapter complete',
    body: childName
      ? `${childName} finished "${chapterTitle || 'a practice chapter'}".`
      : `Finished "${chapterTitle || 'a practice chapter'}".`,
    link: '/app/kids/guardian',
  });
}

/**
 * Interview invitation — the candidate is a real platform user (they can be
 * bell'd and they get the dashboard ready-up modal).
 */
export function notifyInterviewInvited({ candidateUid, evaluatorName, sessionId, mode = 'live' }) {
  if (!candidateUid) return;
  createNotification({
    uid: candidateUid,
    type: 'interview',
    title: 'Interview invitation',
    body: `${evaluatorName || 'Your evaluator'} wants to run a ${mode === 'live' ? 'live' : ''} interview with you. Confirm on your dashboard.`,
    link: `/app/interview/candidate/${sessionId}`,
  });
}

/**
 * Interview report is final — delivered to every named party who is actually a
 * platform user. Candidates are usually external (name/email only), in which
 * case only the evaluator's copy makes sense to skip: they scored it, they're
 * already on the report page.
 */
export function notifyInterviewResult({ candidateUid, evaluatorUid, candidateName, evaluatorName, sessionId, mode = 'live' }) {
  const label = mode === 'live' ? 'Live interview' : 'Post-interview';
  if (candidateUid && candidateUid !== evaluatorUid) {
    createNotification({
      uid: candidateUid,
      type: 'interview',
      title: 'Your interview result is ready',
      body: `The ${label.toLowerCase()} with ${evaluatorName || 'your evaluator'} is scored. Open the report.`,
      link: `/app/interview/report/${sessionId}`,
    });
  }
  createNotification({
    uid: evaluatorUid,
    type: 'interview',
    title: 'Interview report completed',
    body: `${label} with ${candidateName || 'your candidate'} is scored and ready.`,
    link: `/app/interview/report/${sessionId}`,
  });
}

/**
 * Tell the admins about a role/membership event via /api/notify-admins
 * (Vercel). The server verifies the claim against the user doc, dedupes per
 * subject/kind/day and fans out to every admin — the client only reports.
 * Fire-and-forget: on localhost (no /api) or failure this is a silent no-op.
 */
export async function postToAdmins({ kind, subject, name, email, user } = {}) {
  if (!kind) return false;
  try {
    const token = await (user || auth.currentUser)?.getIdToken();
    if (!token) return false;
    const res = await fetch('/api/notify-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...(subject ? { subject } : {}),
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        kind,
      }),
    }).catch(() => null);
    return !!res?.ok;
  } catch { return false; }
}
