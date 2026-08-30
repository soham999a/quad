const ROLE_DESTINATIONS = {
  teacher: '/app/school',
  evaluator: '/app/evaluator',
  admin: '/app/admin',
  employer: '/app/talent',
};

export function destinationFor(role) {
  return ROLE_DESTINATIONS[role] || '/app/dashboard';
}

/**
 * Resolve where a signed-in user should land after auth/onboarding.
 * Users who have not completed onboarding are routed into the wizard
 * (unless they're already deep in a journey via `next`). This is the
 * single source of truth for "post-auth destination", so auth and
 * onboarding never disagree.
 */
export function resolveDestination(role, onboarding) {
  const onboarded = onboarding && onboarding.completed === true;
  if (!onboarded) return '/onboarding';
  return destinationFor(role);
}

/** Context-augmented route per persona (used after onboarding completes). */
export function postOnboardingDestination(persona, contextId) {
  if (persona === 'employer' || contextId === 'corporate') return destinationFor('employer');
  if (persona === 'teacher') return destinationFor('teacher');
  if (persona === 'evaluator') return destinationFor('evaluator');
  return destinationFor('individual');
}

export function sanitizeNext(next) {
  if (typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
