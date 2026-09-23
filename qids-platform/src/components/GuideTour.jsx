import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

/**
 * GuideTour — coach-mark walkthrough engine.
 *
 * Guarantees (the "one, then the other, properly" contract):
 *   1. Every step ALWAYS renders, strictly one at a time — a step whose target
 *      is missing or hidden falls back to a centered card instead of being
 *      skipped, so the sequence never jumps or silently drops steps.
 *   2. The target is scrolled into view with an INSTANT scroll, then measured
 *      on the next frame — no smooth-scroll race where the spotlight is left
 *      pointing at where the element used to be.
 *   3. The spotlight re-measures on every scroll/resize, so the ring stays
 *      glued to its element even if the user scrolls mid-step.
 *
 * Completed state persists in localStorage so the first-run tour runs once;
 * "Replay tour" and per-page "Show me around" reuse this engine.
 */

const LS_KEY = 'qids-tour-done-v1';

export function isTourDone() {
  try { return window.localStorage.getItem(LS_KEY) === '1'; } catch { return true; }
}
export function markTourDone() {
  try { window.localStorage.setItem(LS_KEY, '1'); } catch { /* best effort */ }
}
/** Re-arm the first-run tour (used by the "Replay tour" palette action). */
export function resetTour() {
  try { window.localStorage.removeItem(LS_KEY); } catch { /* best effort */ }
}

export default function GuideTour({ steps, onDone }) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null); // null = no visible target → centered card
  const finishedRef = useRef(false);

  const step = steps[idx];
  const total = steps.length;
  const last = idx >= total - 1;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    markTourDone();
    onDone?.();
  }, [onDone]);

  const next = useCallback(() => {
    if (idx + 1 >= total) finish();
    else setIdx(idx + 1);
  }, [idx, total, finish]);

  const back = useCallback(() => {
    setIdx(i => Math.max(0, i - 1));
  }, []);

  // Measure + reveal the current step's target.
  // SYNCHRONOUS on purpose: scrollIntoView (instant) updates scroll position
  // synchronously, so measuring immediately after gives the final rect. No rAF,
  // so this works even when the tab is throttled or occluded.
  useLayoutEffect(() => {
    if (!step) return undefined;

    const el = step.selector ? document.querySelector(step.selector) : null;
    const r = el ? el.getBoundingClientRect() : null;
    if (!el || !r || (r.width === 0 && r.height === 0)) {
      // Target not rendered / hidden (e.g. desktop-only button on mobile):
      // show this step as a centered card — never skip it.
      setRect(null);
      return undefined;
    }

    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    const r2 = el.getBoundingClientRect();
    setRect({ top: r2.top, left: r2.left, width: r2.width, height: r2.height });
    return undefined;
  }, [idx, step]);

  // Keep the spotlight glued to its element through scroll/resize.
  useEffect(() => {
    if (!step?.selector) return undefined;
    const onMove = () => {
      const el = document.querySelector(step.selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener('scroll', onMove, { capture: true, passive: true });
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, { capture: true });
      window.removeEventListener('resize', onMove);
    };
  }, [idx, step]);

  // Keyboard: ESC ends, →/Enter advances, ← goes back.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, next, back]);

  if (!step) return null;

  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const cardW = Math.min(320, vw - 32);
  const cardH = 190; // approximate, for centering

  const hasTarget = !!rect;
  const placeBelow = rect ? (vh - (rect.top + rect.height)) > cardH + 30 || rect.top < cardH + 30 : true;

  const cardStyle = hasTarget
    ? {
        position: 'fixed',
        width: cardW,
        top: placeBelow ? rect.top + rect.height + 14 : Math.max(12, rect.top - cardH - 14),
        left: Math.max(16, Math.min(rect.left, vw - cardW - 16)),
      }
    : {
        position: 'fixed',
        width: cardW,
        top: Math.max(24, (vh - cardH) / 2),
        left: (vw - cardW) / 2,
      };

  return createPortal(
    <div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true" aria-label={t('tour.dialog')}>
      {/* Dimmer, with a transparent hole around the target when it exists */}
      <div
        className="absolute inset-0"
        style={{
          background: 'color-mix(in oklab, var(--background) 72%, transparent)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          ...(hasTarget ? {
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rect.left - pad}px ${rect.top - pad}px, ${rect.left - pad}px ${rect.top + rect.height + pad}px, ${rect.left + rect.width + pad}px ${rect.top + rect.height + pad}px, ${rect.left + rect.width + pad}px ${rect.top - pad}px, ${rect.left - pad}px ${rect.top - pad}px)`,
          } : {}),
        }}
        onMouseDown={next}
      />

      {/* Spotlight ring — moves with the element */}
      {hasTarget && (
        <div
          className="absolute rounded-lg pointer-events-none qids-tour-ring"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            transition: 'top .25s ease, left .25s ease, width .25s ease, height .25s ease',
          }}
        />
      )}

      {/* Coach card — one at a time. Deliberately NOT using animate-fade-up:
          its from{opacity:0} frame can stick when the tab is throttled or the
          compositor is busy, leaving the card invisible. Visibility must never
          depend on an animation. */}
      <div
        className="bg-surface-container-lowest border border-border p-5"
        style={{
          ...cardStyle,
          boxShadow: '0 24px 80px color-mix(in oklab, var(--background) 60%, transparent)',
          transition: 'top .25s ease, left .25s ease',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="label-eyebrow !mb-0">{step.kicker || t('tour.step', { n: idx + 1, total })}</span>
          <button type="button" onClick={finish} aria-label={t('tour.end')} className="p-1 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-on-surface transition-colors -mt-1 -mr-1">
            <X size={14} />
          </button>
        </div>
        <h3 className="font-display text-[17px] text-on-surface mb-1.5">{step.title}</h3>
        <p className="text-technical-sm font-technical-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className="rounded-full transition-all" style={{
                width: i === idx ? 16 : 6, height: 6,
                background: i === idx ? 'var(--gold)' : 'var(--outline-variant)',
              }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {idx > 0 && (
              <button type="button" onClick={back} className="btn-outline !py-1.5 !px-3 !text-[11px] flex items-center gap-1">
                <ArrowLeft size={11} /> {t('tour.back')}
              </button>
            )}
            <button type="button" onClick={next} className="btn-primary !py-1.5 !px-3.5 !text-[11px] flex items-center gap-1.5">
              {last ? t('tour.finish') : t('tour.next')} <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
