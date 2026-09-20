import { useEffect, useRef, useState } from 'react';

/**
 * Keyboard-first answering (blueprint P3 "focus mode" companion).
 *
 * One cursor over the visible question list:
 *   ↑/↓ or j/k  — move to the previous/next answerable question
 *   1–5         — answer the focused question (rating or option index by mode)
 *   a–d         — answer the focused MCQ (index mode)
 *   answering auto-advances to the next question
 *
 * Skips keystrokes typed into inputs/textareas. Visual focus is marked with
 * [data-kb-focus="true"] and kept scrolled into view.
 *
 * mode: 'index'  → onAnswer(i, optionIndex0Based)   (MCQ lists)
 *       'rating' → onAnswer(i, rating1to5)          (Likert lists)
 */
export function useKeyboardAnswering({
  count,
  isAnswerable = () => true,
  getOptionCount = () => 5,
  onAnswer,
  mode = 'rating',
  enabled = true,
  deps = [],
}) {
  const [cursor, setCursor] = useState(0);
  const cursorRef = useRef(0);
  const answerRef = useRef(onAnswer);
  answerRef.current = onAnswer;

  // Reset the cursor whenever the visible list identity changes.
  useEffect(() => { cursorRef.current = 0; setCursor(0); }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the focused question in view.
  useEffect(() => {
    document.querySelector('[data-kb-focus="true"]')
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [cursor]);

  function move(delta) {
    let i = cursorRef.current + delta;
    while (i >= 0 && i < count && !isAnswerable(i)) i += delta;
    if (i >= 0 && i < count) { cursorRef.current = i; setCursor(i); }
  }

  useEffect(() => {
    if (!enabled || count === 0) return;
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const tag = t?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || t?.isContentEditable) return;

      if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); move(1); return; }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); move(-1); return; }

      const i = cursorRef.current;
      if (i >= count || !isAnswerable(i)) return;

      const opts = getOptionCount(i);
      const n = Number.parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= opts) {
        e.preventDefault();
        answerRef.current(i, mode === 'rating' ? n : n - 1);
        move(1);
        return;
      }
      if (mode === 'index' && /^[a-d]$/i.test(e.key)) {
        const idx = e.key.toLowerCase().charCodeAt(0) - 97;
        if (idx < opts) {
          e.preventDefault();
          answerRef.current(i, idx);
          move(1);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, count, mode, isAnswerable, getOptionCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return cursor;
}

/** Hint line shown above keyboard-answerable lists. */
export function KeyboardHint() {
  return (
    <div className="hidden md:flex items-center gap-3 mb-3 text-technical-sm font-technical-sm text-muted-foreground">
      <kbd className="chip !py-0.5 !px-1.5 text-[9px]">↑↓</kbd>
      <span>move</span>
      <kbd className="chip !py-0.5 !px-1.5 text-[9px]">1–5</kbd>
      <span>answer · auto-advance</span>
    </div>
  );
}

/** Focus highlight wrapper for a question card. */
export function kbFocusStyle(focused) {
  return focused
    ? { boxShadow: 'inset 2px 0 0 0 var(--gold)' }
    : undefined;
}
