import React, { useState } from 'react';
import { PILLARS, PRE_INTERVENTION_NODES, computePillarScore, computeWeightedScore, getGrade, isCritical, WEIGHTS, GRADE_BANDS } from '../data/qidsData';
import { useApp } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import ScoreCard from '../components/ScoreCard';
import QIDSRadar from '../components/RadarChart';
import { AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';

function Heatmap({ pillarScores, rawScores }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">Sub-Parameter Heatmap</h4>
      <div className="flex flex-col gap-1.5">
        {Object.entries(PILLARS).map(([pid, pillar]) => (
          <div key={pid}>
            <div className="text-xs font-semibold mb-1" style={{ color: pillar.color }}>{pillar.short}</div>
            <div className="flex gap-1 flex-wrap">
              {pillar.subParams.map(sp => {
                const raw = rawScores[pid]?.[sp.id] || 0;
                const pct = Math.round((raw / sp.max) * 100);
                const bg = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={sp.id} title={`${sp.label}: ${pct}%`} className="cursor-default" style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: `${bg}20`, border: `1px solid ${bg}40`, color: bg,
                  }}>
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

export default function PreIntervention() {
  const { assessmentData: ctxAssessment, demoMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentData = location.state?.assessment || ctxAssessment;
  const [activeNode, setActiveNode] = useState(null);
  const [activeStep, setActiveStep] = useState('standardize');

  const rawScores = assessmentData?.rawScores || {};
  const pillarScores = {};
  Object.keys(PILLARS).forEach(id => { pillarScores[id] = computePillarScore(id, rawScores[id] || {}); });
  const unifiedScore = computeWeightedScore(pillarScores);
  const overallGrade = getGrade(unifiedScore);
  const criticalPillars = Object.entries(pillarScores).filter(([, s]) => isCritical(s));

  if (!assessmentData) {
    return (
      <div className="flex items-center justify-center flex-col gap-4 h-[calc(100vh-52px)]">
        <div className="opacity-30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <h3 className="text-lg font-bold">No Assessment Found</h3>
        <p className="text-sm text-surface-variant">Complete an assessment first to view pre-intervention analysis.</p>
        <button onClick={() => navigate('/app/assessment')} className="btn btn-primary">Start Assessment</button>
      </div>
    );
  }

  return (
    <div className="three-panel animate-fade flex h-[calc(100vh-52px)]">
      {/* Mobile summary strip — shown only on mobile */}
      <div className="mobile-panel-summary hidden">
        {Object.entries(pillarScores).map(([id, score]) => (
          <div key={id} className="shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{
            background: `${PILLARS[id].color}15`, border: `1px solid ${PILLARS[id].color}30`,
          }}>
            <span className="text-xs font-bold" style={{ color: PILLARS[id].color }}>{id}</span>
            <span className="text-sm font-extrabold" style={{ color: isCritical(score) ? '#ef4444' : '#10b981' }}>{score}</span>
          </div>
        ))}
        <div className="shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{
          background: `${overallGrade.bg}`, border: `1px solid ${overallGrade.color}40`,
        }}>
          <span className="text-xs font-bold" style={{ color: overallGrade.color }}>QIDS</span>
          <span className="text-sm font-extrabold" style={{ color: overallGrade.color }}>{unifiedScore}</span>
          <span className="text-[10px]" style={{ color: overallGrade.color }}>Grade {overallGrade.grade}</span>
        </div>
      </div>
      {/* Left sidebar */}
      <div className="panel-left w-[260px] border-r border-outline-variant bg-surface p-5 overflow-y-auto shrink-0">
        <div className="mb-4">
          <div className="px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-400 mb-2.5 inline-block bg-indigo-500/15 border border-indigo-500/30">Pre-Intervention</div>
          <h3 className="text-base font-bold mb-1">Standardize & Score</h3>
          <p className="text-xs text-surface-variant leading-relaxed">Normalize raw results to standardized scales and compute subcomponent scores and four quotient vectors</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-surface-variant">KPI</span>
          </div>
          <span className="text-xs text-emerald-500">Scoring accuracy 100%</span>
        </div>

        <div className="divider" />

        <div className="text-xs text-surface-variant uppercase tracking-wide mb-2.5">Process Nodes</div>
        {PRE_INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} className="px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all duration-150" style={{
            background: activeNode?.id === node.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? 'var(--indigo)' : 'transparent'}`,
          }}>
            <div className="text-sm font-medium mb-0.5">{node.label}</div>
            <div className="text-xs text-surface-variant leading-snug line-clamp-2">{node.desc}</div>
          </div>
        ))}
      </div>

      {/* Main canvas */}
      <div className="panel-main flex-1 overflow-y-auto p-6">
        {/* Phase swimlane */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30">Phase 1</div>
            <span className="text-sm font-bold">Pre-Intervention</span>
          </div>
          <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
              {PRE_INTERVENTION_NODES.map((node, i) => (
                <ProcessNode
                  key={node.id} node={node} color="#6366f1" index={i}
                  isLast={i === PRE_INTERVENTION_NODES.length - 1}
                  onClick={setActiveNode} active={activeNode?.id === node.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scores grid */}
        <div className="score-grid-4 grid grid-cols-4 gap-3 mb-5">
          {Object.entries(PILLARS).map(([id, pillar]) => (
            <ScoreCard key={id} pillar={pillar} score={pillarScores[id]} showWeight />
          ))}
        </div>

        {/* Unified score + grade */}
        <div className="unified-grid grid grid-cols-2 gap-4 mb-5">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5" style={{ background: overallGrade.bg }}>
            <div className="text-xs text-surface-variant mb-1">Unified QIDS Score</div>
            <div className="text-5xl font-extrabold leading-none" style={{ color: overallGrade.color }}>{unifiedScore}</div>
            <div className="text-sm text-on-surface-variant mt-1">/ 100 — Grade {overallGrade.grade}: {overallGrade.label}</div>
            <div className="progress-bar mt-3">
              <div className="progress-fill" style={{ width: `${unifiedScore}%`, background: overallGrade.color }} />
            </div>
            <div className="text-xs text-surface-variant mt-2">
              Formula: Σ(Score × Weight) / Σ(Weights) = {unifiedScore}
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
            <div className="text-xs text-surface-variant mb-3">Dynamic Weightage</div>
            {Object.entries(WEIGHTS).map(([k, w]) => (
              <div key={k} className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: PILLARS[k].color }} />
                  <span className="text-sm">{k}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-variant">×{w.toFixed(2)}</span>
                  <span className="text-sm font-semibold" style={{ color: PILLARS[k].color }}>{Math.round(pillarScores[k] * w)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical flags */}
        {criticalPillars.length > 0 && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/25 rounded-xl">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle size={14} color="#ef4444" />
              <span className="text-sm font-bold text-red-300">Critical Priority Flags</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {criticalPillars.map(([id, score]) => (
                <div key={id} className="px-3 py-1.5 bg-red-500/15 border border-red-500/30 rounded-lg text-xs text-red-300">
                  {PILLARS[id].label}: {score}/100 — Intervention Required
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap */}
        <div className="card mb-5">
          <Heatmap pillarScores={pillarScores} rawScores={rawScores} />
        </div>

        {/* Grade bands reference */}
        <div className="card">
          <h4 className="text-sm font-semibold mb-3">Grade Band Reference</h4>
          <div className="grade-bands">
            <div className="flex gap-2">
            {GRADE_BANDS.map(b => (
              <div key={b.grade} className="flex-1 px-2 py-2.5 rounded-lg text-center" style={{
                background: b.bg, border: `1px solid ${b.color}40`,
              }}>
                <div className="text-xl font-extrabold" style={{ color: b.color }}>{b.grade}</div>
                <div className="text-[10px] font-semibold" style={{ color: b.color }}>{b.label}</div>
                <div className="text-[10px] text-surface-variant mt-0.5">{b.min}–{b.max}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="panel-right w-[280px] border-l border-outline-variant bg-surface p-5 overflow-y-auto shrink-0">
        <div className="flex gap-1 mb-4 bg-surface-container-low p-1 rounded-lg">
          {['Technical', 'Quotients', 'Modules'].map(t => (
            <button key={t} className="flex-1 px-2 py-1 rounded-md text-xs font-medium border-none cursor-pointer" style={{
              background: t === 'Technical' ? 'var(--indigo)' : 'transparent',
              color: t === 'Technical' ? 'white' : 'var(--text-muted)',
            }}>{t}</button>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Info size={12} color="#818cf8" />
            <span className="text-xs font-semibold text-indigo-400">Unique IQ Measurement Model</span>
          </div>
          {['Four-parameter model: Verbal, Quantitative, Psychometric, Performance IQ', 'Equal weighting (25 marks each) for balanced assessment', 'Integration of standardized tests with performance-based tasks', 'Age and culture-adjusted scoring algorithms'].map(item => (
            <div key={item} className="flex gap-1.5 mb-1.5">
              <CheckCircle size={11} color="#10b981" className="mt-0.5 shrink-0" />
              <span className="text-xs text-on-surface-variant leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="mb-4">
          <div className="text-xs font-semibold text-indigo-400 mb-2">Standardization Algorithm</div>
          <div className="font-mono text-xs bg-black/30 px-2.5 py-2 rounded-md text-on-surface leading-relaxed">
            Standardized Score (%) =<br />(Raw Score / Max Score) × 100
          </div>
          {['Unified 0–100 scale across all quotients', 'Conversion factors: IQ=1.0, EQ=2.0, SQ=2.0, AQ=1.28', 'Sub-component weighted aggregation formula', 'Enables cross-quotient comparison and visualization'].map(item => (
            <div key={item} className="flex gap-1.5 mb-1.5 mt-1.5">
              <CheckCircle size={11} color="#10b981" className="mt-0.5 shrink-0" />
              <span className="text-xs text-on-surface-variant leading-relaxed">{item}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div>
          <div className="text-xs font-semibold text-indigo-400 mb-2">Dynamic Weightage Algorithm (DWA)</div>
          <p className="text-xs text-on-surface-variant leading-relaxed">Context-sensitive weight computation based on role, culture, and mission parameters. Weights reflect the relative developmental importance of each quotient.</p>
        </div>

        <div className="divider" />

        {/* Radar */}
        <div>
          <div className="text-xs font-semibold mb-2">Quotient Profile</div>
          <QIDSRadar data={pillarScores} size={200} />
        </div>

        {location.state?.postAssessment && (
          <>
            <div className="divider" />
            <button
              className="btn btn-primary btn-sm w-full justify-center"
              onClick={() => navigate('/app/post-intervention', { state: { assessment: assessmentData, postAssessment: location.state.postAssessment } })}
            >
              View Post-Intervention <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>

      {/* Node detail panel */}
      {activeNode && <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color="#6366f1" />}
    </div>
  );
}
