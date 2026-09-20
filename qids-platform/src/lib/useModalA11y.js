import { useEffect, useRef } from 'react';

/**
 * useModalA11y — shared focus-trap + scroll-lock for overlay surfaces
 * (command palette, mobile drawer, modals).
 *
 * While `open`:
 *   - body scroll is locked
 *   - Tab / Shift+Tab cycle inside the container (never reach the page behind)
 *   - focus moves into the container on open (unless the child manages it,
 *     e.g. the palette focuses its input) and returns to the trigger on close
 *
 * Returns a ref to attach to the dialog container element.
 */
export default function useModalA11y({ open, onClose }) {
  const containerRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose?.(); return; }
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;
      const focusables = container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      } else if (!container.contains(document.activeElement)) {
        // Focus escaped (or started outside) — pull it back in.
        e.preventDefault(); first.focus();
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      html.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return containerRef;
}
