import { useEffect } from 'react';

/**
 * Per-page document titles — "Page · QIDS".
 * Restores the default title on unmount so stale titles never leak
 * across navigations (e.g. Landing leaving "Login · QIDS" behind).
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · QIDS` : 'QIDS — Quadrant Intelligence Development System';
    return () => { document.title = prev; };
  }, [title]);
}
