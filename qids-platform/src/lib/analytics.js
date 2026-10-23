// ─── Product analytics (funnel events) ────────────────────────────────────────
// One tiny fire-and-forget writer: logEvent(uid, 'assessment_complete', {...})
// → Firestore `analytics_events`. Never throws, never blocks the UI — analytics
// must cost the product nothing when it fails. AdminPanel aggregates these into
// the acquisition → activation funnel.

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const EVENTS = new Set([
  'signed_up',            // account created (email or Google)
  'signed_in',            // any successful login
  'onboarding_done',      // completed the onboarding wizard
  'intake_done',          // assessment intake step submitted
  'assessment_started',   // first answer recorded
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
      props,
      ts: serverTimestamp(),
    }).catch(() => {});
  } catch { /* never surface analytics failures */ }
}
