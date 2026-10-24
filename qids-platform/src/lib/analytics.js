// ─── Product analytics (funnel events) ────────────────────────────────────────
// One tiny fire-and-forget writer: logEvent(uid, 'assessment_complete', {...})
// → Firestore `analytics_events`. Never throws, never blocks the UI — analytics
// must cost the product nothing when it fails. AdminPanel aggregates these into
// the acquisition → activation funnel and the per-step assessment drop-off.
//
// Every event carries the release and a coarse device class, so a change in the
// funnel can be read against the deploy and the device that produced it.

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { RELEASE, deviceClass } from './release';

const EVENTS = new Set([
  'signed_up',            // account created (email or Google)
  'signed_in',            // any successful login
  'onboarding_done',      // completed the onboarding wizard
  'intake_done',          // assessment intake step submitted
  'assessment_started',   // first answer recorded
  'assessment_step_completed', // one pillar finished (step index in props)
  'assessment_resumed',   // returned to a saved checkpoint
  'assessment_abandoned', // left with the assessment unfinished
  'assessment_complete',  // full QIDS assessment submitted
  'enterprise_started',   // enterprise/role battery begun
  'enterprise_complete',  // enterprise battery submitted
  'credential_published', // made a public credential
  // Kids 4Q Practice — the practice funnel. Without these the module cannot
  // answer the only question that matters: where do children stop?
  'kids_profile_created',   // guardian added a child profile
  'kids_chapter_started',   // first decision on a chapter
  'kids_choice',            // one decision recorded (scene-level drop-off)
  'kids_chapter_completed', // chapter finished
  'kids_chapter_abandoned', // left with the chapter unfinished
  'kids_data_exported',     // guardian requested their child's data
]);

export function logEvent(uid, name, props = {}) {
  if (!EVENTS.has(name) || !uid) return;
  try {
    addDoc(collection(db, 'analytics_events'), {
      uid,
      name,
      props: { ...props, device: props.device || deviceClass() },
      release: RELEASE,
      ts: serverTimestamp(),
    }).catch(() => {});
  } catch { /* never surface analytics failures */ }
}

// ── Events that must survive a page unload ───────────────────────────────────
// Firestore writes do not flush reliably while a page is being torn down, so an
// abandonment event queued at `pagehide` is persisted locally and sent on the
// next visit. Losing the most interesting event in the funnel is not acceptable.

const QUEUE_KEY = 'qids-funnel-queue';
const QUEUE_MAX = 25;

/** @param {string} uid @param {string} name @param {object} props */
export function queueEvent(uid, name, props = {}) {
  if (!uid || !EVENTS.has(name)) return;
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ uid, name, props: { ...props, device: props.device || deviceClass() }, queuedAt: Date.now() });
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_MAX)));
  } catch { /* storage full or blocked — the event is simply lost */ }
}

/** Send anything a previous visit could not deliver. Safe to call often. */
export function flushQueuedEvents() {
  let queue = [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    queue = JSON.parse(raw);
    window.localStorage.removeItem(QUEUE_KEY);
  } catch { return; }
  if (!Array.isArray(queue)) return;
  for (const item of queue.slice(-QUEUE_MAX)) {
    if (!item?.uid || !item?.name) continue;
    logEvent(item.uid, item.name, item.props || {});
  }
}

/**
 * Identify a step by its index. Kept here so the writer and the admin view
 * cannot disagree about what "step 3" means.
 */
export const ASSESSMENT_STEPS = [
  'intake',
  'iq',
  'eq',
  'sq',
  'aq',
  'review',
];
