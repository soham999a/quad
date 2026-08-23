const ROLE_DESTINATIONS = {
  teacher: '/app/school',
  evaluator: '/app/evaluator',
  admin: '/app/admin',
  employer: '/app/talent',
};

export function destinationFor(role) {
  return ROLE_DESTINATIONS[role] || '/app/dashboard';
}

export function sanitizeNext(next) {
  if (typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
