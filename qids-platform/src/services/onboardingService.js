import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'onboarding';

/**
 * Default onboarding state (the wizard's starting shape).
 * `contextId` aligns with CONTEXTS ids; `persona` aligns with auth roles.
 */
export const ONBOARDING_DEFAULT = {
  contextId: '',
  persona: '',
  goalId: '',
  ageGroup: '',
  purpose: '',
  plan: 'free',
  completed: false,
};

/** Load a user's saved onboarding progress (for resume). */
export async function getOnboarding(uid) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, uid));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.warn('getOnboarding failed:', e.message);
    return null;
  }
}

/** Persist onboarding progress (safe to call on every step change). */
export async function saveOnboarding(uid, state) {
  try {
    await setDoc(doc(db, COLLECTION, uid), {
      ...state,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn('saveOnboarding failed:', e.message);
    return false;
  }
}

/** Mark onboarding complete once the user reaches the end of the wizard. */
export async function completeOnboarding(uid, state) {
  return saveOnboarding(uid, { ...state, completed: true });
}
