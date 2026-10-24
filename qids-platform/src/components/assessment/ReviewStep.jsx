import { useTranslation } from 'react-i18next';
import { PILLARS } from '../../data/qidsData';
import { evaluateQidsAssessment, getGrade } from '../../core/engine/qids';

// ─── Review & submit ────────────────────────────────────────────────────────
// The last screen before a score exists: what was recorded, what each pillar
// currently scores, and — when a pillar has no answers at all — a warning that
// submitting now records a zero rather than an absence.
//
// Extracted from Assessment.jsx so the page reads as flow, not as maths.

export default function ReviewStep({ intake, rawScores }) {
  const { t } = useTranslation();
  const { result, pillarScores } = evaluateQidsAssessment({ rawScores, intake });
  const unified = result.unifiedScore ?? 0;
  const grade = result.grade ?? getGrade(unified);

  // A pillar with no recorded answers produces a score of 0 that looks like a
  // real result. Say so before submit rather than after.
  const emptyPillars = Object.keys(PILLARS).filter(id => {
    const section = rawScores?.[id];
    return !section || Object.keys(section).length === 0;
  });

  return (
    <div>
      {/* Intake summary */}
      <div className="text-technical-sm font-technical-sm text-primary mb-6">{t("Assessment.vi_review_submit")}</div>
      {emptyPillars.length > 0 && (
        <div role="status" className="mb-5 border-[0.5px] border-warning/40 bg-warning/10 px-4 py-3 text-technical-sm font-technical-sm text-warning">
          {t("Assessment.no_answers_in", "No answers recorded in")} {emptyPillars.join(', ')} — {
            t("Assessment.no_answers_hint", "that section will score 0. You can still submit, or go back to fill it in.")
          }
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {Object.entries(intake).filter(([k]) => !['consent', 'purpose'].includes(k)).map(([k, v]) => (
          <div key={k} className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-1">
              {k.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-label-md font-label-md text-on-surface">{String(v) || '—'}</div>
          </div>
        ))}
      </div>

      {/* Pillar scores */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const score = pillarScores[id];
          const isIQ = id === 'IQ';
          const displayMax = isIQ ? 125 : 100;
          const pct = Math.min(Math.round((score / displayMax) * 100), 100);
          const g = getGrade(isIQ ? Math.round((score / 125) * 100) : score);
          return (
            <div key={id} className="p-4 bg-surface-container-low border-[0.5px] text-center" style={{ borderColor: `${pillar.color}30` }}>
              <div className="text-technical-sm font-technical-sm mb-2" style={{ color: pillar.color }}>{pillar.short}</div>
              <div className="text-[32px] font-label-md leading-none text-on-surface">{score}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">/ {displayMax} | Grade {g.grade}</div>
              {isIQ && <div className="text-[9px] font-technical-sm text-primary mt-1">{t("Assessment.incl_ai_visual_bonus")}</div>}
              <div className="h-1 bg-outline-variant/40 mt-3">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified score */}
      <div
        className="p-6 border-[0.5px] text-center"
        style={{ borderColor: `${grade.color}40`, backgroundColor: `${grade.color}10` }}
      >
        <div className="text-technical-sm font-technical-sm text-surface-variant mb-2 uppercase tracking-widest">
          {t("Assessment.unified_qids_score")}
        </div>
        <div className="text-[56px] font-label-md leading-none" style={{ color: grade.color }}>{unified}</div>
        <div className="text-label-md font-label-md mt-2" style={{ color: grade.color }}>
          Grade {grade.grade}: {grade.label}
        </div>
        <div className="text-technical-sm font-technical-sm text-surface-variant mt-3">
          {t("Assessment.weighted_iq_125_100")}
        </div>
      </div>
    </div>
  );
}
