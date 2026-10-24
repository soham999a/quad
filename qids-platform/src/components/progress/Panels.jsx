import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { TrendingUp as TrendIcon } from 'lucide-react';
import { PILLARS } from '../../data/qidsData';
import { getUserAssessments } from '../../services/firestoreService';
import { reportError } from '../../lib/errorReport';
import { TrendLines } from '../charts';

// ─── Progress panels ────────────────────────────────────────────────────────
// Two read-only views lifted out of Progress.jsx so that page is about flow
// (pre → intervention → post) rather than about drawing.
//
// Both are presentational plus one fetch; neither owns state that the page
// needs, which is what made them safe to separate.

export function Heatmap({ pillarScores, rawScores }) {
  const { t } = useTranslation();
  return (
    <div>
      <h4 className="text-[13px] font-medium mb-3">{t("Progress.sub_parameter_heatmap")}</h4>
      <div className="flex flex-col gap-1.5">
        {Object.entries(PILLARS).map(([pid, pillar]) => (
          <div key={pid}>
            <div className="text-[11px] font-medium mb-1" style={{ color: pillar.color }}>{pillar.short}</div>
            <div className="flex gap-1 flex-wrap">
              {pillar.subParams.map(sp => {
                const raw = rawScores[pid]?.[sp.id] || 0;
                const pct = sp.max > 0 ? Math.round((raw / sp.max) * 100) : 0;
                const bg = pct >= 75 ? 'var(--status-ok)' : pct >= 60 ? 'var(--status-warn)' : 'var(--status-err)';
                return (
                  <div
                    key={sp.id}
                    title={`${sp.label}: ${pct}%`}
                    className="px-2 py-1 text-[10px] font-medium cursor-default"
                    style={{ borderRadius: 6, background: `${bg}20`, border: `1px solid ${bg}40`, color: bg }}
                  >
                    {sp.label.split(' ')[0]} {pct}%
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GrowthTrendPanel — pillar trajectories across assessment attempts.
 * The reassessment step made visible: one line per pillar over every recorded
 * attempt. Hidden entirely when there is only one attempt — a trend of one
 * point is noise, not insight.
 */
export function GrowthTrendPanel({ uid, currentId }) {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    let alive = true;
    getUserAssessments(uid).then(list => {
      if (!alive) return;
      const pts = (list || [])
        .filter(a => a?.pillarScores && Object.keys(a.pillarScores).length > 0)
        .map(a => ({
          date: a.timestamp || a.createdAt?.toDate?.()?.toISOString?.() || null,
          ...Object.fromEntries(Object.entries(a.pillarScores).map(([k, v]) => [k, Math.round(v)])),
        }))
        .filter(p => p.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setAttempts(pts);
    }).catch(e => {
      // A trend that cannot load simply does not render — but it is still worth
      // knowing the history fetch is failing.
      reportError(e, { kind: 'growth-trend' });
      setAttempts([]);
    });
    return () => { alive = false; };
  }, [uid]);

  if (attempts === null || attempts.length < 2) return null;

  const deltas = ['IQ', 'EQ', 'SQ', 'AQ'].map(id => {
    const first = attempts[0][id];
    const last = attempts[attempts.length - 1][id];
    return last != null && first != null ? last - first : 0;
  });
  const net = deltas.reduce((s, d) => s + d, 0);
  const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div data-tour="prog-trend" className="mb-4 border-[0.5px] border-outline-variant rounded-md bg-surface-container-lowest p-4 md:p-5 animate-fade">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendIcon size={14} className="text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-surface-variant">{t("inter.growth_n", { n: attempts.length })}</span>
        </div>
        <span className="text-[11px] font-medium" style={{ color: net > 0 ? 'var(--status-ok)' : net < 0 ? 'var(--status-err)' : 'var(--neutral-ink-500)' }}>
          Net {net > 0 ? `+${net}` : net} since first assessment
        </span>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <TrendLines
          points={attempts}
          series={['IQ', 'EQ', 'SQ', 'AQ'].map(id => ({ key: id, color: PILLARS[id].color, label: id }))}
          height={200}
          formatDate={fmtDate}
        />
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {['IQ', 'EQ', 'SQ', 'AQ'].map((id, i) => (
          <span key={id} className="flex items-center gap-1.5 text-[11px] text-surface-variant">
            <span className="w-2 h-2 rounded-full" style={{ background: PILLARS[id].color }} />{id}
            <span className="font-medium" style={{ color: deltas[i] > 0 ? 'var(--status-ok)' : deltas[i] < 0 ? 'var(--status-err)' : 'inherit' }}>
              {deltas[i] > 0 ? `+${deltas[i]}` : deltas[i]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
