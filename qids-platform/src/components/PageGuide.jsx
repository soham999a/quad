import React, { useEffect, useState } from 'react';
import { X, BookOpen, MousePointer2 } from 'lucide-react';
import useModalA11y from '../lib/useModalA11y';
import { guideForPath } from '../lib/pageGuides';
import { useLocation } from 'react-router-dom';
import GuideTour from './GuideTour';

/**
 * PageGuide — the per-tab manual, opened by the "?" button in the top bar
 * (or the Shift+/ shortcut). A slide-over panel on desktop, a sheet on mobile.
 * Each guide can carry a `tour` script; "Show me around" runs it — a coach-mark
 * walkthrough that points at each real element on THIS page, one by one.
 * Content is resolved from the current route, so it is always about the page
 * you are actually looking at.
 */

// ── Per-page tour scripts (selectors map to data-tour attrs in the pages) ────
const PAGE_TOURS = {
  '/app/dashboard': [
    { selector: '[data-tour="dash-hero"]', title: 'Your next step', body: 'This card always shows the single most useful action right now — start, continue, or reassess.' },
    { selector: '[data-tour="dash-stats"]', title: 'Your snapshot', body: 'Live counters for where you are in the cycle: assessment status, evaluator, latest result.' },
    { selector: '[data-tour="dash-activity"]', title: 'Recent activity', body: 'Your latest assessments and results live here — open any of them for the full breakdown.' },
    { selector: '[data-tour="guide"]', title: 'Any page, any time', body: 'Every tab has this ? button. It opens a guide for exactly the page you are on.' },
  ],
  '/app/progress': [
    { selector: '[data-tour="prog-phases"]', title: 'Three phases', body: 'Pre is your baseline. Intervention is the work. Post measures what changed. Move between them here.' },
    { selector: '[data-tour="prog-trend"]', title: 'Growth trend', body: 'With two or more assessments, your IQ/EQ/SQ/AQ trajectories are charted across time.' },
    { selector: '[data-tour="prog-right"]', title: 'Context panel', body: 'Score deltas, process nodes and the report generator for the phase you are viewing.' },
  ],
  '/app/individual': [
    { selector: '[data-tour="ind-begin"]', title: 'Begin when ready', body: 'Starts the guided run: Intake, then IQ, EQ, SQ and AQ. Budget 40–60 minutes; you can pause anytime.' },
    { selector: '[data-tour="guide"]', title: 'During the test', body: 'Keyboard works here: A–D picks options, 1–5 for scales, and focus mode keeps distractions away.' },
  ],
  '/app/school': [
    { selector: '[data-tour="class-code"]', title: 'Join codes', body: 'Students enrol themselves with this six-character code — copy it and share it. No imports needed.' },
    { selector: '[data-tour="guide"]', title: 'Per-class depth', body: 'Open a class for completion status; Analytics adds cohort averages, grade distribution and CSV export.' },
  ],
  '/app/report': [
    { selector: '[data-tour="report-export"]', title: 'Print-perfect output', body: 'Export prints exactly what you preview — all interface chrome is stripped by the print stylesheet.' },
  ],
  '/app/talent': [
    { selector: '[data-tour="talent-ranking"]', title: 'Role Fit Ranking', body: 'Candidates ranked against the 8-dimension vector of your target role — fit, not just totals.' },
  ],
};

export default function PageGuide({ open, onClose }) {
  const location = useLocation();
  const modalRef = useModalA11y({ open, onClose });
  const [tourSteps, setTourSteps] = useState(null);

  // A route change invalidates any running mini-tour (its targets are per-page).
  useEffect(() => { setTourSteps(null); }, [location.pathname]);

  const guide = guideForPath(location.pathname);
  const tour = PAGE_TOURS[location.pathname] || null;

  // NOTE: the GuideTour renders OUTSIDE the `open` guard on purpose —
  // "Show me around" closes the panel and then starts the tour; if the tour
  // lived inside the guarded subtree it would unmount with the panel.
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[130] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={`${guide.title} guide`}
          style={{ background: 'color-mix(in oklab, var(--background) 55%, transparent)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div
            ref={modalRef}
            className="w-full sm:max-w-[420px] h-full bg-surface-container-lowest border-l border-border overflow-y-auto animate-fade flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-2.5">
                <BookOpen size={15} className="text-gold" />
                <span className="label-eyebrow !mb-0">GUIDE</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close guide"
                className="p-2 border border-sidebar-border text-muted-foreground hover:text-on-surface transition-colors cursor-pointer bg-transparent"
              >
                <X size={14} />
              </button>
            </div>

            <div className="px-6 py-6 flex-1">
              <h2 className="font-display text-[22px] text-on-surface mb-2">{guide.title}</h2>
              <p className="text-body-md text-muted-foreground leading-relaxed mb-6">{guide.intro}</p>

              {tour && (
                <button
                  type="button"
                  onClick={() => { onClose(); setTourSteps(tour); }}
                  className="btn-primary w-full !py-3 flex items-center justify-center gap-2 mb-8"
                >
                  <MousePointer2 size={14} /> Show me around
                </button>
              )}

              <div className="space-y-6">
                {guide.tips.map((tip) => (
                  <div key={tip.title} className="border-l-2 border-gold/50 pl-4">
                    <div className="text-label-md font-label-md text-on-surface mb-1.5">{tip.title}</div>
                    <p className="text-technical-sm font-technical-sm text-muted-foreground leading-relaxed">{tip.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <kbd className="chip !py-1 !px-2 text-[10px]">ESC to close</kbd>
              <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">QIDS · {guide.title}</span>
            </div>
          </div>
        </div>
      )}

      {tourSteps && (
        <GuideTour steps={tourSteps} onDone={() => setTourSteps(null)} />
      )}
    </>
  );
}
