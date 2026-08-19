import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterviewSession } from '../../services/interviewService';
import { RUBRIC_DIMENSIONS } from '../../core/data/interviewRubrics';
import { PILLARS } from '../../data/qidsData';
import {
  Brain, Download, ChevronRight, AlertCircle, BarChart3,
  Target, Users,
} from 'lucide-react';

const SHAPES = {
  T: { label: 'T-Shaped', desc: 'Deep in one area, broad across others', color: 'var(--color-primary)' },
  I: { label: 'I-Shaped', desc: 'Deep specialist in one domain', color: 'var(--color-info)' },
  X: { label: 'X-Shaped', desc: 'Balanced high performance across all areas', color: 'var(--color-success)' },
  M: { label: 'M-Shaped', desc: 'Multi-disciplinary strength across 3+ areas', color: 'var(--color-warning)' },
};

const SCORE_COLORS = ['#EB7C5E', '#EBC073', '#6EA9F5', '#72D9A0'];

export default function InterviewReport() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getInterviewSession(sessionId)
      .then(s => {
        if (!s) { setError('Session not found'); return; }
        setSession(s);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="page-pad max-w-[1100px] mx-auto animate-fade py-16">
        <div className="card p-8">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="page-pad max-w-[1100px] mx-auto animate-fade py-16 text-center">
        <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
        <div className="text-body-md font-body-md text-surface-variant mb-6">{error || 'Session not found'}</div>
        <button onClick={() => navigate('/app/interview')} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  const { mergedScores, pillarScores, unifiedScore, grade, skillShape, evaluatorAssessment, mode } = session;
  const shape = skillShape ? SHAPES[skillShape] : null;

  // Compute radar dimensions for the 8 rubric dimensions
  const maxScore = 5;
  const radarPoints = RUBRIC_DIMENSIONS.map((d, i) => {
    const score = mergedScores?.[d.id] ?? 0;
    return {
      label: d.shortLabel,
      fullLabel: d.label,
      score,
      angle: (i / RUBRIC_DIMENSIONS.length) * 2 * Math.PI - Math.PI / 2,
    };
  });

  return (
    <div className="page-pad max-w-[1100px] mx-auto animate-fade">
      {/* Hero */}
      <section className="card-gold p-8 md:p-12 mb-8 text-center">
        <div className="kicker mb-3">Interview Assessment Report</div>
        <h1 className="text-headline-lg font-headline-lg text-on-background mb-2">{session.candidateName}</h1>
        {session.role && <div className="text-body-md font-body-md text-surface-variant mb-6">{session.role}</div>}
        <div className="text-body-sm font-body-sm text-surface-variant mb-8">
          {mode === 'live' ? 'Live Interview' : 'Post-Interview'} · Scored by {session.evaluatorName}
        </div>

        {/* Score Gauge */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={grade?.color || 'var(--color-primary)'}
                strokeWidth="8"
                strokeDasharray={`${(unifiedScore / 100) * 314} 314`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[28px] font-technical-sm text-on-background">{Math.round(unifiedScore || 0)}</div>
              <div className="text-technical-sm font-technical-sm" style={{ color: grade?.color }}>GRADE {grade?.grade}</div>
            </div>
          </div>
        </div>

        {/* Skill Shape Badge */}
        {shape && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low border-[0.5px] border-outline-variant">
            <Target size={14} style={{ color: shape.color }} />
            <span className="text-label-md font-label-md" style={{ color: shape.color }}>{shape.label}</span>
            <span className="text-body-sm font-body-sm text-surface-variant">— {shape.desc}</span>
          </div>
        )}
      </section>

      {/* Dimension Scores */}
      <section className="mb-8">
        <div className="kicker mb-4">Dimension Scores</div>
        <div className="gradient-rule mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RUBRIC_DIMENSIONS.map((d, i) => {
            const score = mergedScores?.[d.id] ?? 0;
            const pct = (score / maxScore) * 100;
            const evScore = evaluatorAssessment?.find(e => e.dimensionId === d.id)?.score;
            return (
              <div key={d.id} className="card p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-label-sm font-label-sm text-on-background">{d.label}</div>
                  <div className="flex items-center gap-2">
                    {mode === 'post' && evScore != null && (
                      <span className="text-technical-sm font-technical-sm text-surface-variant">Ev: {evScore}</span>
                    )}
                    <span className="text-[18px] font-technical-sm text-on-background">{score.toFixed(1)}</span>
                    <span className="text-technical-sm font-technical-sm text-surface-variant">/5</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: SCORE_COLORS[i % SCORE_COLORS.length] }}
                  />
                </div>
                <div className="text-technical-sm font-technical-sm text-surface-variant mt-2">
                  Maps to {PILLARS.find(p => p.id === d.pillar)?.short || d.pillar}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pillar Radar + Bars */}
      {pillarScores && (
        <section className="mb-8">
          <div className="kicker mb-4">QIDS Pillar Scores</div>
          <div className="gradient-rule mb-6" />
          <div className="responsive-grid-12 gap-6">
            {/* Radar */}
            <div className="md:col-span-5 col-span-full card p-6 md:p-8 flex items-center justify-center">
              <svg viewBox="-110 -110 220 220" className="w-full max-w-[280px]">
                {/* Grid circles */}
                {[25, 50, 75, 100].map(r => (
                  <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                ))}
                {/* Axis lines */}
                {PILLARS.map((p, i) => {
                  const angle = (i / PILLARS.length) * 2 * Math.PI - Math.PI / 2;
                  const x = Math.cos(angle) * 100;
                  const y = Math.sin(angle) * 100;
                  return <line key={p.id} x1="0" y1="0" x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
                })}
                {/* Data polygon */}
                <polygon
                  points={PILLARS.map((p, i) => {
                    const angle = (i / PILLARS.length) * 2 * Math.PI - Math.PI / 2;
                    const r = (pillarScores[p.id] || 0);
                    return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
                  }).join(' ')}
                  fill="rgba(235,192,115,0.15)"
                  stroke="rgba(235,192,115,0.8)"
                  strokeWidth="1.5"
                />
                {/* Data points + labels */}
                {PILLARS.map((p, i) => {
                  const angle = (i / PILLARS.length) * 2 * Math.PI - Math.PI / 2;
                  const r = (pillarScores[p.id] || 0);
                  const x = Math.cos(angle) * r;
                  const y = Math.sin(angle) * r;
                  const lx = Math.cos(angle) * 115;
                  const ly = Math.sin(angle) * 115;
                  return (
                    <g key={p.id}>
                      <circle cx={x} cy={y} r="3" fill={p.color} />
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        fill="var(--color-on-surface)" fontSize="9" fontFamily="var(--font-technical)">
                        {p.short}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Pillar Bars */}
            <div className="md:col-span-7 col-span-full space-y-3">
              {PILLARS.map(p => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-label-sm font-label-sm text-on-background">{p.short}</span>
                    </div>
                    <span className="text-[18px] font-technical-sm text-on-background">{pillarScores[p.id] || 0}</span>
                  </div>
                  <div className="h-2 bg-surface-container-high overflow-hidden">
                    <div className="h-full" style={{ width: `${pillarScores[p.id] || 0}%`, background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-12 mb-16">
        <button onClick={() => navigate('/app/interview')} className="btn-outline">
          ← BACK TO DASHBOARD
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="btn-outline flex items-center gap-2">
            <Download size={14} />
            DOWNLOAD
          </button>
          <button onClick={() => navigate('/app/interview/setup')} className="btn-primary glow flex items-center gap-2">
            NEW SESSION
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
