// ─── Firebase auth error → human copy ─────────────────────────────────────────
// Raw Firebase messages leak codes and jargon ("auth/wrong-password: The
// password is invalid or the user does not have a password."). This maps the
// codes users actually hit to calm, actionable wording. Unknown codes fall
// through to the original message so nothing is silently swallowed.

const MAP = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email. Create one below.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/user-disabled': 'This account has been disabled. Contact support.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/email-already-in-use': 'An account already exists with that email. Sign in instead.',
  'auth/weak-password': 'Password is too weak — use at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow popups and retry.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
};

export default function friendlyAuthError(err, fallback = 'Something went wrong. Please try again.') {
  const code = err?.code || '';
  return MAP[code] || err?.message || fallback;
}
