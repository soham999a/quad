import { useTranslation } from 'react-i18next';
import usePageTitle from '../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import EmptyState from '../components/EmptyState';
import { PILLARS, PRE_INTERVENTION_NODES, INTERVENTION_NODES, POST_INTERVENTION_NODES, INTERVENTION_MODULES, CAREER_PROFILES, SKILL_SHAPES } from '../data/qidsData';
import { computeWeightedScore, getGrade, isCritical, WEIGHTS, GRADE_BANDS, getCareerProfile, getSkillShape, IQ_MAX_SCORE, evaluateQidsAssessment, computeQidsPillarScores } from '../core/engine/qids';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAssessments } from '../services/firestoreService';
import { LineChart as ReLine, Line } from 'recharts';
import { TrendingUp as TrendIcon } from 'lucide-react';
import { savePostAssessment } from '../services/firestoreService';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import ScoreCard from '../components/ScoreCard';
import QIDSRadar from '../components/RadarChart';
import { useToast } from '../components/Toast';
import { AlertTriangle, CheckCircle, Check, Info, TrendingUp, TrendingDown, Minus, ArrowRight, Calendar, Clock, Package, Plus, ChevronDown, ChevronUp, Save, Download, ClipboardList, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
const PHASES = [{
  id: 'pre',
  label: 'Pre-Intervention',
  color: 'var(--phase-pre)',
  phase: 'Phase 1',
  desc: 'Standardize raw results, compute scores, and map intervention needs.'
}, {
  id: 'intervention',
  label: 'Intervention',
  color: 'var(--phase-int)',
  phase: 'Phase 2',
  desc: 'Targeted development programs based on gap analysis and priority flags.'
}, {
  id: 'post',
  label: 'Post-Intervention',
  color: 'var(--phase-post)',
  phase: 'Phase 3',
  desc: 'Progress evaluation, outcome synthesis, and final development roadmap.'
}];
const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
function Heatmap({
  pillarScores,
  rawScores
}) {
  const {
    t
  } = useTranslation();
  return <div>
      <h4 className="text-[13px] font-[600] mb-3">{t("Progress.sub_parameter_heatmap")}</h4>
      <div className="flex flex-col gap-1.5">
        {Object.entries(PILLARS).map(([pid, pillar]) => <div key={pid}>
            <div className="text-[11px] font-[600] mb-1" style={{
          color: pillar.color
        }}>{pillar.short}</div>
            <div className="flex gap-1 flex-wrap">
              {pillar.subParams.map(sp => {
            const raw = rawScores[pid]?.[sp.id] || 0;
            const pct = sp.max > 0 ? Math.round(raw / sp.max * 100) : 0;
            const bg = pct >= 75 ? 'var(--status-ok)' : pct >= 60 ? 'var(--status-warn)' : 'var(--status-err)';
            return <div key={sp.id} title={`${sp.label}: ${pct}%`} className="px-2 py-1 text-[10px] font-[600] cursor-default" style={{
              borderRadius: 6,
              background: `${bg}20`,
              border: `1px solid ${bg}40`,
              color: bg
            }}>
                    {sp.label.split(' ')[0]} {pct}%
                  </div>;
          })}
            </div>
          </div>)}
      </div>
    </div>;
}

/**
 * GrowthTrendPanel — pillar trajectories across assessment attempts.
 * Blueprints' Reassess step made visible: one line per pillar over every
 * recorded attempt. Hidden entirely when there is only one attempt —
 * a trend of one point is noise, not insight.
 */
function GrowthTrendPanel({
  uid,
  currentId
}) {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState(null);
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    getUserAssessments(uid).then(list => {
      if (!alive) return;
      const pts = (list || []).filter(a => a?.pillarScores && Object.keys(a.pillarScores).length > 0).map(a => ({
        date: a.timestamp || a.createdAt?.toDate?.()?.toISOString?.() || null,
        ...Object.fromEntries(Object.entries(a.pillarScores).map(([k, v]) => [k, Math.round(v)]))
      })).filter(p => p.date).sort((a, b) => new Date(a.date) - new Date(b.date));
      setAttempts(pts);
    }).catch(() => setAttempts([]));
    return () => {
      alive = false;
    };
  }, [uid]);
  if (attempts === null || attempts.length < 2) return null;
  const deltas = ['IQ', 'EQ', 'SQ', 'AQ'].map(id => {
    const first = attempts[0][id];
    const last = attempts[attempts.length - 1][id];
    return last != null && first != null ? last - first : 0;
  });
  const net = deltas.reduce((s, d) => s + d, 0);
  const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  return <div data-tour="prog-trend" className="mb-4 border-[0.5px] border-outline-variant rounded-3xl bg-surface-container-lowest p-4 md:p-5 animate-fade">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendIcon size={14} className="text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-surface-variant">{t("inter.growth_n", { n: attempts.length })}</span>
        </div>
        <span className="text-[11px] font-[600]" style={{
        color: net > 0 ? 'var(--status-ok)' : net < 0 ? 'var(--status-err)' : 'var(--neutral-ink-500)'
      }}>
          Net {net > 0 ? `+${net}` : net} since first assessment
        </span>
      </div>
      <div style={{
      width: '100%',
      height: 200
    }}>
        <ResponsiveContainer>
          <ReLine data={attempts} margin={{
          top: 4,
          right: 8,
          bottom: 0,
          left: -18
        }}>
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{
            fontSize: 10,
            fill: 'var(--neutral-ink-500)'
          }} stroke="var(--outline-variant)" />
            <YAxis domain={[0, 100]} tick={{
            fontSize: 10,
            fill: 'var(--neutral-ink-500)'
          }} stroke="var(--outline-variant)" />
            <Tooltip contentStyle={{
            background: 'var(--surface-1)',
            border: '0.5px solid var(--outline-variant)',
            borderRadius: 8,
            fontSize: 12
          }} labelStyle={{
            color: 'var(--neutral-ink-500)'
          }} labelFormatter={fmtDate} />
            {['IQ', 'EQ', 'SQ', 'AQ'].map((id, i) => <Line key={id} type="monotone" dataKey={id} stroke={PILLARS[id].color} strokeWidth={2} dot={{
            r: 3
          }} activeDot={{
            r: 5
          }} isAnimationActive={false} />)}
          </ReLine>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {['IQ', 'EQ', 'SQ', 'AQ'].map((id, i) => <span key={id} className="flex items-center gap-1.5 text-[11px] text-surface-variant">
            <span className="w-2 h-2 rounded-full" style={{
          background: PILLARS[id].color
        }} />{id}
            <span className="font-[600]" style={{
          color: deltas[i] > 0 ? 'var(--status-ok)' : deltas[i] < 0 ? 'var(--status-err)' : 'inherit'
        }}>
              {deltas[i] > 0 ? `+${deltas[i]}` : deltas[i]}
            </span>
          </span>)}
      </div>
    </div>;
}
function PreSection({
  pillarScores,
  rawScores,
  activeNode,
  setActiveNode
}) {
  const {
    t
  } = useTranslation();
  const unifiedScore = computeWeightedScore(pillarScores);
  const overallGrade = getGrade(unifiedScore);
  const criticalPillars = Object.entries(pillarScores).filter(([, s]) => isCritical(s));
  const {
    user
  } = useAuth();
  return <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <GrowthTrendPanel uid={user?.uid} />
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="px-2.5 py-0.5 text-[11px] font-[600] rounded-full" style={{
          background: 'var(--phase-pre-tint)',
          border: '1px solid var(--phase-pre-line)',
          color: 'var(--phase-pre-soft)'
        }}>{t("Progress.phase_1")}</div>
          <span className="text-[14px] font-bold">{t("Progress.standardize_score")}</span>
        </div>
        <div className="rounded-2xl p-4 overflow-x-auto" style={{
        background: 'var(--phase-pre-fill)',
        border: '1px solid var(--phase-pre-line)'
      }}>
          <div className="flex items-center gap-0 min-w-max">
            {PRE_INTERVENTION_NODES.map((node, i) => <ProcessNode key={node.id} node={node} color="var(--phase-pre)" index={i} isLast={i === PRE_INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />)}
          </div>
        </div>
      </div>

      <div className="responsive-grid-4 gap-3 mb-5">
        {Object.entries(PILLARS).map(([id, pillar]) => <ScoreCard key={id} pillar={pillar} score={pillarScores[id]} showWeight />)}
      </div>

      <div className="responsive-grid-2 gap-4 mb-5">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5" style={{
        background: overallGrade.bg
      }}>
          <div className="text-technical-sm text-surface-variant mb-1">{t("Progress.unified_qids_score")}</div>
          <div className="text-[48px] font-[800] leading-none" style={{
          color: overallGrade.color
        }}>{unifiedScore}</div>
          <div className="text-[13px] text-on-surface-variant mt-1">/ 100 — Grade {overallGrade.grade}: {overallGrade.label}</div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-3">
            <div className="h-full rounded-full" style={{
            width: `${unifiedScore}%`,
            background: `linear-gradient(90deg, ${overallGrade.color}, ${overallGrade.color}80)`
          }} />
          </div>
          <div className="text-[11px] text-surface-variant mt-2">
            Formula: Σ(Score × Weight) / Σ(Weights) = {unifiedScore}
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
          <div className="text-technical-sm text-surface-variant mb-3">{t("Progress.dynamic_weightage")}</div>
          {Object.entries(WEIGHTS).map(([k, w]) => <div key={k} className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
              background: PILLARS[k].color
            }} />
                <span className="text-[13px]">{k}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-technical-sm text-surface-variant">×{w.toFixed(2)}</span>
                <span className="text-[13px] font-[600]" style={{
              color: PILLARS[k].color
            }}>{Math.round(pillarScores[k] * w)}</span>
              </div>
            </div>)}
        </div>
      </div>

      {criticalPillars.length > 0 && <div className="mb-5 p-4 rounded-2xl" style={{
      background: 'var(--status-err-panel)',
      border: '1px solid var(--status-err-line)'
    }}>
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle size={14} color="var(--status-err)" />
            <span className="text-[13px] font-bold text-[var(--status-err-soft)]">{t("Progress.critical_priority_flags")}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {criticalPillars.map(([id, score]) => <div key={id} className="px-3 py-1.5 text-technical-sm text-[var(--status-err-soft)] rounded-lg" style={{
          background: 'var(--status-err-panel-strong)',
          border: '1px solid var(--status-err-line)'
        }}>
                {PILLARS[id].label}: {score}/100 — Intervention Required
              </div>)}
          </div>
        </div>}

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-5">
        <Heatmap pillarScores={pillarScores} rawScores={rawScores} />
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
        <h4 className="text-[13px] font-[600] mb-3">{t("Progress.grade_band_reference")}</h4>
        <div className="flex flex-wrap gap-2">
          {GRADE_BANDS.map(b => <div key={b.grade} className="flex-1 px-2 py-2.5 text-center rounded-lg" style={{
          background: b.bg,
          border: `1px solid ${b.color}40`
        }}>
              <div className="text-[18px] font-[800]" style={{
            color: b.color
          }}>{b.grade}</div>
              <div className="text-[10px] font-[600]" style={{
            color: b.color
          }}>{b.label}</div>
              <div className="text-[10px] text-surface-variant mt-0.5">{b.min}–{b.max}</div>
            </div>)}
        </div>
      </div>
    </div>;
}
function PreRightPanel({
  pillarScores
}) {
  const {
    t
  } = useTranslation();
  const unifiedScore = computeWeightedScore(pillarScores);
  return <>
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={12} color="var(--phase-pre-soft)" />
          <span className="text-technical-sm font-[600] text-[var(--phase-pre-soft)]">{t("Progress.unique_iq_measurement_model")}</span>
        </div>
        {['Four-parameter model: Verbal, Quantitative, Psychometric, Performance IQ', 'Equal weighting (25 marks each) for balanced assessment', 'Integration of standardized tests with performance-based tasks', 'Age and culture-adjusted scoring algorithms'].map(item => <div key={item} className="flex gap-1.5 mb-1.5">
            <CheckCircle size={11} color="var(--status-ok)" className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-on-surface-variant leading-relaxed">{item}</span>
          </div>)}
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="mb-4">
        <div className="text-technical-sm font-[600] text-[var(--phase-pre-soft)] mb-2">{t("Progress.standardization_algorithm")}</div>
        <div className="font-technical-sm text-[11px] p-2.5 rounded-md text-on-surface leading-relaxed" style={{
        background: 'var(--tint-scrim)'
      }}>{t("Progress.standardized_score")}<br />{t("Progress.raw_score_max_score")}</div>
        {['Unified 0–100 scale across all quotients', 'Conversion factors: IQ=1.0, EQ=2.0, SQ=2.0, AQ=1.28', 'Sub-component weighted aggregation formula', 'Enables cross-quotient comparison and visualization'].map(item => <div key={item} className="flex gap-1.5 mt-1.5 mb-1">
            <CheckCircle size={11} color="var(--status-ok)" className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-on-surface-variant leading-relaxed">{item}</span>
          </div>)}
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div>
        <div className="text-technical-sm font-[600] text-[var(--phase-pre-soft)] mb-2">{t("Progress.dynamic_weightage_algorithm_dwa")}</div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">{t("Progress.context_sensitive_weight_computation")}</p>
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div>
        <div className="text-technical-sm font-[600] mb-2">{t("Progress.quotient_profile")}</div>
        <QIDSRadar data={pillarScores} size={200} />
      </div>
    </>;
}
function ModuleCard({
  module,
  pillar,
  onToggle,
  expanded
}) {
  const priorityColor = module.priority === 'high' ? 'var(--status-err)' : 'var(--status-warn)';
  const [assigned, setAssigned] = useState(false);
  const handleKey = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };
  return <div className="rounded-3xl overflow-hidden mb-2" style={{
    background: 'var(--neutral-carbon)',
    border: `1px solid ${pillar.color}25`
  }}>
      <div onClick={onToggle} onKeyDown={handleKey} role="button" tabIndex={0} aria-expanded={expanded} aria-label={`${module.label} details`} className="px-3.5 py-3 cursor-pointer focus-visible:outline focus-visible:outline-gold flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
          background: pillar.color
        }} />
          <span className="text-[13px] font-[600]">{module.label}</span>
          <span className="px-2 py-0.5 text-[10px] font-[600] rounded-full" style={{
          background: `${priorityColor}15`,
          color: priorityColor,
          border: `1px solid ${priorityColor}30`
        }}>
            {module.priority.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-surface-variant">{module.duration}</span>
          {expanded ? <ChevronUp size={13} className="text-surface-variant" /> : <ChevronDown size={13} className="text-surface-variant" />}
        </div>
      </div>
      {expanded && <div className="px-3.5 pb-3.5 border-t-[0.5px] border-outline-variant">
          <p className="text-technical-sm text-on-surface-variant leading-relaxed mt-2.5 mb-2.5">{module.desc}</p>
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-surface-variant" />
              <span className="text-[11px] text-surface-variant">{module.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={11} className="text-surface-variant" />
              <span className="text-[11px] text-surface-variant">{module.sessions} sessions</span>
            </div>
          </div>
          <button onClick={() => setAssigned(true)} disabled={assigned} className="mt-2.5 px-3 py-1.5 text-[11px] font-[500] rounded-md cursor-pointer disabled:opacity-70 disabled:cursor-default" style={{
        background: `${pillar.color}15`,
        border: `1px solid ${pillar.color}30`,
        color: pillar.color
      }}>
            {assigned ? 'Assigned ✓' : 'Assign Module'}
          </button>
        </div>}
    </div>;
}
function RoadmapCalendar() {
  const {
    t
  } = useTranslation();
  const modulesByMonth = {
    'Month 1': ['Intake & Orientation', 'EQ: The Pause Button (Week 1–2)'],
    'Month 2': ['EQ: Emotional Awareness Journey', 'AQ: Resilience Foundations (Week 1–2)'],
    'Month 3': ['SQ: Collaboration Dynamics', 'AQ: Adaptability Training'],
    'Month 4': ['IQ: Cognitive Strengthening', 'EQ: Empathy & Social Attunement'],
    'Month 5': ['SQ: Communication Mastery', 'AQ: Persistence Coaching'],
    'Month 6': ['IQ: Critical Thinking Workshop', 'Integration & Review Sessions']
  };
  return <div>
      <h4 className="text-[13px] font-[600] mb-3">{t("Progress.6_month_development_roadmap")}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'].map((month, i) => <div key={month} className="bg-surface-container-low border border-outline-variant rounded-3xl p-3">
            <div className="text-[11px] font-bold text-[var(--phase-int-soft)] mb-2">{month}</div>
            {(modulesByMonth[month] || []).map(m => <div key={m} className="px-2 py-1 mb-1 text-[11px] text-on-surface-variant rounded-md" style={{
          background: 'var(--phase-int-panel)',
          border: '1px solid var(--phase-int-line)'
        }}>{m}</div>)}
          </div>)}
      </div>
    </div>;
}
function InterventionSection({
  pillarScores,
  activeNode,
  setActiveNode
}) {
  const {
    t
  } = useTranslation();
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [expandedPillar, setExpandedPillar] = useState(null);
  const priorityPillars = Object.entries(pillarScores).sort(([, a], [, b]) => a - b).map(([id]) => id);
  return <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="px-2.5 py-0.5 text-[11px] font-[600] rounded-full" style={{
          background: 'var(--phase-int-tint)',
          border: '1px solid var(--phase-int-line)',
          color: 'var(--phase-int-soft)'
        }}>{t("Progress.phase_2")}</div>
          <span className="text-[14px] font-bold">{t("Progress.strategic_intervention")}</span>
        </div>
        <div className="rounded-2xl p-4 overflow-x-auto" style={{
        background: 'var(--phase-int-fill)',
        border: '1px solid var(--phase-int-line)'
      }}>
          <div className="flex items-center gap-0 min-w-max">
            {INTERVENTION_NODES.map((node, i) => <ProcessNode key={node.id} node={node} color="var(--phase-int)" index={i} isLast={i === INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />)}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-3xl w-fit">
        {['modules', 'roadmap', 'eq-practice'].map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-[7px] rounded-xl cursor-pointer text-[13px] font-[500] capitalize transition-all duration-150 border-none ${activeTab === t ? 'bg-[var(--phase-int)] text-on-primary' : 'bg-transparent text-on-surface-variant'}`}>{t.replace('-', ' ')}</button>)}
      </div>

      {activeTab === 'modules' && <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold">{t("Progress.recommended_intervention_modules")}</h3>
            <button onClick={() => toast('Custom modules are coming in a future release.', 'info')} className="px-3 py-1.5 bg-surface-container-low text-on-surface text-[13px] font-[500] rounded-lg border border-outline-variant cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5"><Plus size={12} />{t("Progress.add_custom_module")}</button>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {priorityPillars.map(pid => <div key={pid}>
                <div onClick={() => setExpandedPillar(expandedPillar === pid ? null : pid)} onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpandedPillar(expandedPillar === pid ? null : pid);
            }
          }} role="button" tabIndex={0} aria-expanded={expandedPillar === pid} className="flex items-center gap-2 mb-2.5 cursor-pointer focus-visible:outline focus-visible:outline-gold">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
              background: PILLARS[pid].color
            }} />
                  <span className="text-[13px] font-bold" style={{
              color: PILLARS[pid].color
            }}>{PILLARS[pid].label}</span>
                  {isCritical(pillarScores[pid]) && <span className="px-1.5 py-0.5 text-[10px] font-[600] text-[var(--status-err)] rounded" style={{
              background: 'var(--status-err-tint)',
              border: '1px solid var(--status-err-line)'
            }}>{t("Progress.critical")}</span>}
                  <span className="ml-auto text-[11px] text-surface-variant">{expandedPillar === pid ? 'Collapse' : 'Expand'}</span>
                </div>
                {INTERVENTION_MODULES[pid].map(mod => <ModuleCard key={mod.id} module={mod} pillar={PILLARS[pid]} expanded={expandedModule === mod.id} onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)} />)}
              </div>)}
          </div>
        </div>}

      {activeTab === 'roadmap' && <RoadmapCalendar />}

      {activeTab === 'eq-practice' && <div>
          <h3 className="text-[15px] font-bold mb-4">{t("Progress.dynamic_eq_integration_the")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[{
          step: 'STOP',
          desc: 'Pause the automatic emotional reaction. Create space between stimulus and response.',
          color: 'var(--status-err)'
        }, {
          step: 'THINK',
          desc: 'Identify the emotion. Assess the situation objectively. Consider consequences.',
          color: 'var(--status-warn)'
        }, {
          step: 'ACT',
          desc: 'Choose a deliberate, constructive response aligned with values and goals.',
          color: 'var(--status-ok)'
        }].map(({
          step,
          desc,
          color
        }) => <div key={step} className="p-5 text-center rounded-2xl" style={{
          background: alpha(color, 10),
          border: `1px solid ${alpha(color, 30)}`
        }}>
                <div className="text-[18px] font-[800] mb-2" style={{
            color
          }}>{step}</div>
                <p className="text-technical-sm text-on-surface-variant leading-relaxed">{desc}</p>
              </div>)}
          </div>
          <div className="mt-5 p-4 rounded-2xl" style={{
        background: 'var(--status-ok-panel)',
        border: '1px solid var(--status-ok-line)'
      }}>
            <div className="text-[13px] font-[600] text-[var(--status-ok)] mb-1.5">{t("Progress.integration_across_all_sessions")}</div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">{t("Progress.the_stop_think_act")}</p>
          </div>
        </div>}
    </div>;
}
function InterventionRightPanel({
  pillarScores
}) {
  const {
    t
  } = useTranslation();
  return <>
      <div className="text-technical-sm font-[600] text-[var(--phase-int-soft)] mb-3">{t("Progress.module_categories")}</div>
      {Object.entries(INTERVENTION_MODULES).map(([pid, mods]) => <div key={pid} className="mb-3">
          <div className="text-[11px] font-[600] mb-1.5" style={{
        color: PILLARS[pid].color
      }}>{pid}</div>
          {mods.map(m => <div key={m.id} className="px-2 py-1.5 mb-0.5 text-[11px] text-on-surface-variant rounded-[2px]" style={{
        background: 'var(--tint-subtle)',
        border: '1px solid var(--bone-line)'
      }}>
              {m.label}
            </div>)}
        </div>)}

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="text-technical-sm font-[600] mb-2">{t("Progress.session_tracking")}</div>
      {[{
      label: 'Scheduled Sessions',
      val: 24,
      color: 'var(--phase-pre)'
    }, {
      label: 'Completed',
      val: 0,
      color: 'var(--status-ok)'
    }, {
      label: 'Pending',
      val: 24,
      color: 'var(--status-warn)'
    }].map(({
      label,
      val,
      color
    }) => <div key={label} className="flex justify-between mb-1.5">
          <span className="text-technical-sm text-on-surface-variant">{label}</span>
          <span className="text-technical-sm font-bold" style={{
        color
      }}>{val}</span>
        </div>)}

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="p-3 rounded-3xl mb-4" style={{
      background: 'var(--phase-int-panel)',
      border: '1px solid var(--phase-int-line)'
    }}>
        <div className="text-[11px] font-[600] text-[var(--phase-int-soft)] mb-1.5">{t("Progress.content_library")}</div>
        <p className="text-[11px] text-surface-variant leading-relaxed">{t("Progress.upload_questionnaires_rubrics_and")}</p>
        <button onClick={() => toast('The content library is coming in a future release.', 'info')} className="mt-2 w-full justify-center px-3 py-1.5 bg-surface-container-low text-on-surface text-[13px] font-[500] rounded-lg border border-outline-variant cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5">
          <Package size={11} />{t("Progress.open_library")}</button>
      </div>

      {Object.entries(pillarScores).map(([id, score]) => <div key={id} className="mb-2">
          <div className="flex justify-between mb-0.5">
            <span className="text-technical-sm" style={{
          color: PILLARS[id].color
        }}>{id}</span>
            <span className="text-technical-sm font-[600]" style={{
          color: isCritical(score) ? 'var(--status-err)' : 'var(--status-ok)'
        }}>{score}</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
          width: `${score}%`,
          background: isCritical(score) ? 'var(--status-err)' : PILLARS[id].color
        }} />
          </div>
        </div>)}
    </>;
}
function PostAssessmentForm({
  assessmentData,
  onSubmit
}) {
  const {
    t
  } = useTranslation();
  const [rawScores, setRawScores] = useState(() => {
    const pre = assessmentData?.rawScores || {};
    const init = {};
    Object.keys(PILLARS).forEach(pid => {
      init[pid] = {};
      PILLARS[pid].subParams.forEach(sp => {
        init[pid][sp.id] = pre[pid]?.[sp.id] ?? 0;
      });
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const updateScore = (pid, subId, val) => setRawScores(prev => ({
    ...prev,
    [pid]: {
      ...prev[pid],
      [subId]: val
    }
  }));
  const handleSubmit = async () => {
    setSaving(true);
    const {
      result,
      pillarScores
    } = evaluateQidsAssessment({
      rawScores,
      intake: assessmentData?.intake,
      ageGroup: assessmentData?.ageGroup
    });
    await onSubmit({
      rawScores,
      pillarScores,
      result,
      unifiedScore: result.unifiedScore,
      grade: result.grade,
      intake: assessmentData?.intake,
      timestamp: new Date().toISOString()
    });
    setSaving(false);
  };
  return <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <ClipboardList size={18} color="var(--phase-post)" />
        <h2 className="text-[18px] font-[800] m-0">{t("Progress.post_intervention_assessment")}</h2>
        <div className="ml-auto px-3 py-1 text-[11px] font-[600] rounded-full" style={{
        background: 'var(--phase-post-tint)',
        border: '1px solid var(--phase-post-line)',
        color: 'var(--phase-post-soft)'
      }}>{t("Progress.phase_3")}</div>
      </div>
      <p className="text-[13px] text-surface-variant mb-6">{t("Progress.re_assess_all_four")}</p>

      {Object.entries(PILLARS).map(([pid, pillar]) => <div key={pid} className="mb-5 bg-surface-container-low rounded-2xl p-5" style={{
      border: `1px solid ${pillar.color}25`
    }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{
          background: pillar.color,
          boxShadow: `0 0 8px ${pillar.color}`
        }} />
            <span className="text-[14px] font-bold" style={{
          color: pillar.color
        }}>{pillar.label}</span>
            <span className="text-technical-sm text-surface-variant">— {pillar.framework}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pillar.subParams.map(sp => {
          const val = rawScores[pid]?.[sp.id] ?? 0;
          const preVal = assessmentData?.rawScores?.[pid]?.[sp.id] ?? 0;
          const pct = Math.round(val / sp.max * 100);
          return <div key={sp.id} className="rounded-[2px] p-3.5" style={{
            background: 'var(--tint-hairline)',
            border: '1px solid var(--bone-line)'
          }}>
                  <div className="flex justify-between mb-1.5">
                    <div>
                      <div className="text-[13px] font-[600]">{sp.label}</div>
                      <div className="text-[11px] text-surface-variant">Pre: {preVal}/{sp.max}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-bold" style={{
                  color: pillar.color
                }}>{val}</div>
                      <div className="text-[10px] text-surface-variant">/ {sp.max}</div>
                    </div>
                  </div>
                  <input type="range" min={0} max={sp.max} value={val} onChange={e => updateScore(pid, sp.id, parseInt(e.target.value))} className="w-full h-1.5 rounded-[3px] outline-none border-none p-0 cursor-pointer appearance-none" style={{
              background: `linear-gradient(90deg, ${pillar.color} ${pct}%, var(--tint-mid) ${pct}%)`
            }} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-surface-variant">0</span>
                    <span className="text-[10px] font-[600]" style={{
                color: pct >= 60 ? 'var(--status-ok)' : 'var(--status-err)'
              }}>{pct}%</span>
                    <span className="text-[10px] text-surface-variant">{sp.max}</span>
                  </div>
                </div>;
        })}
          </div>
        </div>)}

      <button onClick={handleSubmit} disabled={saving} className="w-full justify-center py-[14px] text-label-md font-label-md rounded-xl bg-[var(--phase-post)] text-on-primary hover:opacity-90 transition-all border-none cursor-pointer flex items-center gap-2 disabled:opacity-50">
        {saving ? 'Saving...' : <><Save size={14} />{t("Progress.submit_post_assessment")}</>}
      </button>
    </div>;
}
function PostSection({
  preScores,
  postScores,
  rawScores,
  activeNode,
  setActiveNode
}) {
  const {
    t
  } = useTranslation();
  const preUnified = computeWeightedScore(preScores);
  const postUnified = computeWeightedScore(postScores);
  const delta = postUnified - preUnified;
  const [activeTab, setActiveTab] = useState('comparison');
  const careerProfile = getCareerProfile(postScores);
  const skillShape = getSkillShape(postScores);
  const skillShapeData = SKILL_SHAPES.find(s => s.id === skillShape);
  const comparisonData = Object.entries(PILLARS).map(([id]) => ({
    name: id,
    Pre: preScores[id],
    Post: postScores[id],
    Delta: postScores[id] - preScores[id]
  }));
  return <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="px-2.5 py-0.5 text-[11px] font-[600] rounded-full" style={{
          background: 'var(--phase-post-tint)',
          border: '1px solid var(--phase-post-line)',
          color: 'var(--phase-post-soft)'
        }}>{t("Progress.phase_3")}</div>
          <span className="text-[14px] font-bold">{t("Progress.post_intervention_evaluation")}</span>
        </div>
        <div className="rounded-2xl p-4 overflow-x-auto" style={{
        background: 'var(--phase-post-fill)',
        border: '1px solid var(--phase-post-line)'
      }}>
          <div className="flex items-center gap-0 min-w-max">
            {POST_INTERVENTION_NODES.map((node, i) => <ProcessNode key={node.id} node={node} color="var(--phase-post)" index={i} isLast={i === POST_INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />)}
          </div>
        </div>
      </div>

      <div className="responsive-grid-3 gap-3 mb-5">
        {[{
        label: 'Pre-Intervention Score',
        val: preUnified,
        color: 'var(--phase-pre)',
        grade: getGrade(preUnified)
      }, {
        label: 'Post-Intervention Score',
        val: postUnified,
        color: 'var(--phase-post)',
        grade: getGrade(postUnified)
      }, {
        label: 'Overall Improvement',
        val: delta,
        color: delta >= 0 ? 'var(--status-ok)' : 'var(--status-err)',
        isPercent: false,
        isDelta: true
      }].map(({
        label,
        val,
        color,
        grade,
        isDelta
      }) => <div key={label} className="bg-surface-container-low text-center rounded-2xl p-5" style={{
        border: `1px solid ${alpha(color, 30)}`
      }}>
            <div className="text-[11px] text-surface-variant mb-1">{label}</div>
            <div className="text-[40px] font-[800] leading-none" style={{
          color
        }}>
              {isDelta ? delta >= 0 ? `+${delta}` : delta : val}
            </div>
            {grade && <div className="text-technical-sm mt-1" style={{
          color: grade.color
        }}>Grade {grade.grade}: {grade.label}</div>}
            {isDelta && <div className="text-technical-sm text-surface-variant mt-1">{t("Progress.points_gained")}</div>}
          </div>)}
      </div>

      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-3xl w-fit">
        {['comparison', 'radar', 'career', 'idp'].map(t => <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-[7px] rounded-xl cursor-pointer text-[13px] font-[500] capitalize transition-all duration-150 border-none ${activeTab === t ? 'bg-[var(--phase-post)] text-on-primary' : 'bg-transparent text-on-surface-variant'}`}>{t}</button>)}
      </div>

      {activeTab === 'comparison' && <div>
          <h3 className="text-[15px] font-bold mb-4">{t("Progress.before_vs_after_comparison")}</h3>
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 mb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparisonData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tint-soft)" />
                <XAxis dataKey="name" tick={{
              fill: 'var(--neutral-mid)',
              fontSize: 12
            }} />
                <YAxis domain={[0, 100]} tick={{
              fill: 'var(--neutral-dim)',
              fontSize: 11
            }} />
                <Tooltip contentStyle={{
              background: 'var(--bone-panel)',
              border: '1px solid var(--bone-line)',
              borderRadius: 2,
              color: 'var(--neutral-dark)',
              fontSize: 12
            }} />
                <Legend wrapperStyle={{
              fontSize: 12,
              color: 'var(--neutral-mid)'
            }} />
                <Bar dataKey="Pre" fill="var(--phase-pre)" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Post" fill="var(--phase-post)" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Object.entries(PILLARS).map(([id, pillar]) => {
          const d = postScores[id] - preScores[id];
          const pct = preScores[id] > 0 ? Math.round(d / preScores[id] * 100) : 0;
          return <div key={id} className="bg-surface-container-low rounded-2xl p-3.5" style={{
            border: `1px solid ${pillar.color}25`
          }}>
                  <div className="text-[11px] font-[600] mb-1.5" style={{
              color: pillar.color
            }}>{pillar.short}</div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-technical-sm text-surface-variant">{preScores[id]}</span>
                    <ArrowRight size={12} className="text-surface-variant" />
                    <span className="text-[14px] font-bold" style={{
                color: pillar.color
              }}>{postScores[id]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {d > 0 ? <TrendingUp size={12} color="var(--status-ok)" /> : d < 0 ? <TrendingDown size={12} color="var(--status-err)" /> : <Minus size={12} className="text-surface-variant" />}
                    <span className="text-technical-sm font-[600]" style={{
                color: d > 0 ? 'var(--status-ok)' : d < 0 ? 'var(--status-err)' : 'var(--neutral-ink-500)'
              }}>
                      {d > 0 ? `+${d}` : d} pts ({pct > 0 ? '+' : ''}{pct}%)
                    </span>
                  </div>
                </div>;
        })}
          </div>
        </div>}

      {activeTab === 'radar' && <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
            <h4 className="text-[13px] font-[600] mb-3">{t("Progress.pre_vs_post_radar")}</h4>
            <QIDSRadar data={preScores} compare={postScores} size={280} />
          </div>
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
            <h4 className="text-[13px] font-[600] mb-3">{t("Progress.skill_shape_topology")}</h4>
            <div className="text-center p-5">
              <div className="text-[72px] font-[900] mb-3 leading-none" style={{
            background: 'linear-gradient(135deg, var(--phase-pre), var(--phase-post))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>{skillShape}</div>
              <div className="text-body-md font-bold mb-2">{skillShapeData?.label}</div>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">{skillShapeData?.desc}</p>
            </div>
          </div>
        </div>}

      {activeTab === 'career' && <div>
          <h3 className="text-[15px] font-bold mb-4">{t("Progress.career_guidance_recommendations")}</h3>
          <div className="p-6 rounded-3xl mb-4" style={{
        background: 'var(--phase-pre-panel)',
        border: '1px solid var(--phase-pre-line)'
      }}>
            <div className="flex items-start gap-4">
              <div>
                <div className="text-[11px] text-surface-variant mb-1">{t("Progress.recommended_track")}</div>
                <h3 className="text-[18px] font-[800] mb-1.5">{careerProfile.label}</h3>
                <div className="text-technical-sm text-[var(--phase-pre-soft)] mb-2">{t("inter.condition", { x: careerProfile.condition })}</div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed mb-3">{careerProfile.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {careerProfile.roles.map(r => <span key={r} className="px-2.5 py-1 text-technical-sm text-[var(--phase-pre-soft)] rounded-full" style={{
                background: 'var(--phase-pre-tint)',
                border: '1px solid var(--phase-pre-line)'
              }}>{r}</span>)}
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-[13px] font-[600] mb-3">{t("Progress.all_career_profiles")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CAREER_PROFILES.map(cp => <div key={cp.id} className="p-3.5 rounded-3xl" style={{
          background: cp.id === careerProfile.id ? 'color-mix(in srgb, var(--phase-pre) 10%, transparent)' : 'var(--neutral-carbon)',
          border: `1px solid ${cp.id === careerProfile.id ? 'color-mix(in srgb, var(--phase-pre) 40%, transparent)' : 'var(--bone-line)'}`
        }}>
                <div className="flex gap-2 items-start">
                  <div>
                    <div className="text-technical-sm font-[600] mb-0.5">{cp.label}</div>
                    <div className="text-[11px] text-surface-variant">{cp.condition}</div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>}

      {activeTab === 'idp' && <div>
          <h3 className="text-[15px] font-bold mb-4">{t("Progress.individual_development_plan_idp")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <h4 className="text-[13px] font-[600] text-[var(--phase-post)] mb-3">{t("Progress.achieved_milestones")}</h4>
              {Object.entries(PILLARS).filter(([id]) => postScores[id] > preScores[id]).map(([id, p]) => <div key={id} className="flex gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{
              background: 'var(--status-ok-line)',
              border: '1px solid var(--status-ok)'
            }}>
                    <Check size={10} className="text-[var(--status-ok)]" />
                  </div>
                  <span className="text-[13px] text-on-surface-variant">{p.label}: {preScores[id]} {'>'} {postScores[id]} (+{postScores[id] - preScores[id]})</span>
                </div>)}
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <h4 className="text-[13px] font-[600] text-[var(--status-warn)] mb-3">{t("Progress.maintenance_roadmap")}</h4>
              {['Monthly self-assessment check-ins', 'Quarterly facilitator review sessions', 'Annual full QIDS reassessment', 'Ongoing EQ practice (Stop-Think-Act)', 'Peer accountability partnerships'].map(item => <div key={item} className="flex gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-warn)] mt-1.5 flex-shrink-0" />
                  <span className="text-technical-sm text-on-surface-variant">{item}</span>
                </div>)}
            </div>
          </div>
        </div>}
    </div>;
}
function PostRightPanel({
  preScores,
  postScores
}) {
  const {
    t
  } = useTranslation();
  const preUnified = computeWeightedScore(preScores);
  const postUnified = computeWeightedScore(postScores);
  const delta = postUnified - preUnified;
  const skillShape = getSkillShape(postScores);
  const skillShapeData = SKILL_SHAPES.find(s => s.id === skillShape);
  return <>
      <div className="text-technical-sm font-[600] text-[var(--phase-post-soft)] mb-3">{t("Progress.outcome_summary")}</div>
      <div className="p-3.5 rounded-3xl mb-4" style={{
      background: 'var(--phase-post-panel)',
      border: '1px solid var(--phase-post-line)'
    }}>
        <div className="text-[11px] text-surface-variant mb-1">{t("Progress.unified_score_change")}</div>
        <div className="text-[28px] font-[800] text-[var(--phase-post)] leading-none">{preUnified} {'>'} {postUnified}</div>
        <div className="text-technical-sm font-[600]" style={{
        color: delta >= 0 ? 'var(--status-ok)' : 'var(--status-err)'
      }}>{delta >= 0 ? `+${delta}` : delta} points ({preUnified > 0 ? Math.round(delta / preUnified * 100) : 0}%)</div>
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="text-technical-sm font-[600] mb-2.5">{t("Progress.skill_shape")}</div>
      <div className="p-3 text-center rounded-3xl mb-4" style={{
      background: 'var(--phase-pre-panel)',
      border: '1px solid var(--phase-pre-line)'
    }}>
        <div className="text-[36px] font-[900] text-[var(--phase-pre-soft)] leading-none">{skillShape}</div>
        <div className="text-technical-sm text-on-surface-variant">{skillShapeData?.label}</div>
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <QIDSRadar data={preScores} compare={postScores} size={200} />
    </>;
}
export default function Progress() {
  const {
    t
  } = useTranslation();
  usePageTitle('Progress');
  const {
    assessmentData: ctxAssessment,
    postData: ctxPostData,
    setPostData
  } = useApp();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const assessmentData = location.state?.assessment || ctxAssessment;
  const [activePhase, setActivePhase] = useState('pre');
  const [activeNode, setActiveNode] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [localPostData, setLocalPostData] = useState(location.state?.postAssessment || null);
  const postData = localPostData || ctxPostData;
  const rawScores = assessmentData?.rawScores || {};
  const preScores = computeQidsPillarScores(rawScores);
  const postRaw = postData?.rawScores || {};
  const postScores = computeQidsPillarScores(postRaw);
  const handlePostSubmit = async data => {
    try {
      if (user && assessmentData?.id) {
        await savePostAssessment(user.uid, assessmentData.id, data);
      }
      setPostData(data);
      setLocalPostData(data);
      setSubmitted(true);
      toast('Post-assessment saved successfully!', 'success');
      setActivePhase('post');
    } catch (e) {
      console.warn('Post-assessment save failed:', e);
      toast('Saved locally — sync failed. Check connection.', 'error');
      setPostData(data);
      setLocalPostData(data);
      setSubmitted(true);
      setActivePhase('post');
    }
  };
  if (!assessmentData) {
    return <EmptyState icon={ClipboardList} title={t("Progress.no_assessment_found")} description="Complete an assessment first to view your progress timeline." actionLabel="Start Assessment" onAction={() => navigate('/app/assessment')} />;
  }
  const showPostForm = activePhase === 'post' && !postData && !submitted;
  return <div className="flex h-full animate-fade">
      {/* Mobile phase selector */}
      <div className="hide-desktop p-3 border-b-[0.5px] border-outline-variant bg-surface-container-lowest flex gap-1 overflow-x-auto">
        {PHASES.map(phase => {
        const active = activePhase === phase.id;
        return <button key={phase.id} onClick={() => setActivePhase(phase.id)} className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-[600] cursor-pointer border-none whitespace-nowrap transition-all ${active ? 'text-on-primary' : 'text-surface-variant bg-transparent'}`} style={{
          background: active ? phase.color : 'transparent'
        }}>
              {phase.label}
            </button>;
      })}
      </div>

      {/* Mobile summary strip */}
      <div className="hide-desktop p-3 flex gap-2 overflow-x-auto border-b-[0.5px] border-outline-variant">
        {Object.entries(PILLARS).map(([id, pillar]) => <div key={id} className="flex-shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{
        background: `${pillar.color}15`,
        border: `1px solid ${pillar.color}30`
      }}>
            <span className="text-[11px] font-bold" style={{
          color: pillar.color
        }}>{id}</span>
            <span className="text-[13px] font-[800]" style={{
          color: isCritical(preScores[id]) ? 'var(--status-err)' : 'var(--status-ok)'
        }}>{preScores[id]}</span>
          </div>)}
      </div>

      {/* Left sidebar - hidden on mobile */}
      <div data-tour="prog-phases" className="w-[220px] border-r-[0.5px] border-outline-variant bg-surface-container-lowest p-5 overflow-y-auto flex-shrink-0 hide-mobile">
        <h3 className="text-[15px] font-bold mb-1">{t("Progress.progress_timeline")}</h3>
        <p className="text-technical-sm text-surface-variant mb-5">{t("Progress.track_your_journey_through")}</p>

        <div className="flex flex-col gap-2 mb-5">
          {PHASES.map((phase, i) => {
          const active = activePhase === phase.id;
          const completed = phase.id === 'post' && postData || phase.id === 'intervention' && assessmentData || phase.id === 'pre' && assessmentData;
          return <button key={phase.id} onClick={() => {
            if (phase.id === 'post' && !postData && !submitted) {/* stay or show form */}
            setActivePhase(phase.id);
          }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-3xl cursor-pointer text-left transition-all duration-150" style={{
            background: active ? alpha(phase.color, 15) : 'transparent',
            border: `1px solid ${active ? phase.color : 'transparent'}`
          }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
              background: phase.color,
              boxShadow: active ? `0 0 8px ${phase.color}` : 'none'
            }} />
                <div className="flex-1">
                  <div className="text-technical-sm font-[600]" style={{
                color: active ? phase.color : 'var(--neutral-warm)'
              }}>
                    {phase.label}
                  </div>
                  <div className="text-[10px] text-surface-variant">{phase.phase}</div>
                </div>
                {completed && <Check size={10} className="text-[var(--status-ok)]" />}
              </button>;
        })}
        </div>

        {activePhase === 'pre' && <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">{t("Progress.process_nodes")}</div>}
        {activePhase === 'pre' && PRE_INTERVENTION_NODES.map(node => <div key={node.id} onClick={() => setActiveNode(node)} onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveNode(node);
        }
      }} role="button" tabIndex={0} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1 transition-all duration-150 focus-visible:outline focus-visible:outline-gold" style={{
        background: activeNode?.id === node.id ? 'var(--phase-pre-tint)' : 'transparent',
        border: `1px solid ${activeNode?.id === node.id ? 'var(--phase-pre)' : 'transparent'}`
      }}>
            <div className="text-technical-sm font-[500]">{node.label}</div>
          </div>)}

        {activePhase === 'intervention' && <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">{t("Progress.process_nodes")}</div>}
        {activePhase === 'intervention' && INTERVENTION_NODES.map(node => <div key={node.id} onClick={() => setActiveNode(node)} onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveNode(node);
        }
      }} role="button" tabIndex={0} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1 transition-all duration-150 focus-visible:outline focus-visible:outline-gold" style={{
        background: activeNode?.id === node.id ? 'var(--phase-int-tint)' : 'transparent',
        border: `1px solid ${activeNode?.id === node.id ? 'var(--phase-int)' : 'transparent'}`
      }}>
            <div className="text-technical-sm font-[500]">{node.label}</div>
          </div>)}

        {activePhase === 'post' && !showPostForm && <>
            <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">{t("Progress.score_delta")}</div>
            {Object.entries(PILLARS).map(([id, pillar]) => {
          const d = postScores[id] - preScores[id];
          return <div key={id} className="flex justify-between items-center mb-2">
                  <span className="text-technical-sm" style={{
              color: pillar.color
            }}>{id}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-technical-sm text-surface-variant">{preScores[id]} {'>'}</span>
                    <span className="text-technical-sm font-bold" style={{
                color: pillar.color
              }}>{postScores[id]}</span>
                    <span className="text-[11px] font-[600]" style={{
                color: d > 0 ? 'var(--status-ok)' : d < 0 ? 'var(--status-err)' : 'var(--neutral-ink-500)'
              }}>
                      {d > 0 ? `+${d}` : d}
                    </span>
                  </div>
                </div>;
        })}
            <div className="border-t-[0.5px] border-outline-variant my-3" />
            <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">{t("Progress.process_nodes")}</div>
            {POST_INTERVENTION_NODES.map(node => <div key={node.id} onClick={() => setActiveNode(node)} onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveNode(node);
          }
        }} role="button" tabIndex={0} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1 transition-all duration-150 focus-visible:outline focus-visible:outline-gold" style={{
          background: activeNode?.id === node.id ? 'var(--phase-post-tint)' : 'transparent',
          border: `1px solid ${activeNode?.id === node.id ? 'var(--phase-post)' : 'transparent'}`
        }}>
                <div className="text-technical-sm font-[500]">{node.label}</div>
              </div>)}
          </>}
      </div>

      {/* Main content */}
      {showPostForm ? <div className="flex-1 overflow-y-auto animate-fade">
          <PostAssessmentForm assessmentData={assessmentData} onSubmit={handlePostSubmit} />
        </div> : activePhase === 'pre' ? <PreSection pillarScores={preScores} rawScores={rawScores} activeNode={activeNode} setActiveNode={setActiveNode} /> : activePhase === 'intervention' ? <InterventionSection pillarScores={preScores} activeNode={activeNode} setActiveNode={setActiveNode} /> : <PostSection preScores={preScores} postScores={postScores} rawScores={rawScores} activeNode={activeNode} setActiveNode={setActiveNode} />}

      {/* Right panel - hidden on mobile */}
      <div data-tour="prog-right" className="w-[260px] border-l-[0.5px] border-outline-variant bg-surface-container-lowest p-5 overflow-y-auto flex-shrink-0 hide-mobile">
        {activePhase === 'pre' && <PreRightPanel pillarScores={preScores} />}
        {activePhase === 'intervention' && <InterventionRightPanel pillarScores={preScores} />}
        {activePhase === 'post' && !showPostForm && <PostRightPanel preScores={preScores} postScores={postScores} />}
        {showPostForm && <div className="p-3.5 rounded-3xl" style={{
        background: 'var(--phase-post-panel)',
        border: '1px solid var(--phase-post-line)'
      }}>
            <div className="text-technical-sm font-[600] text-[var(--phase-post-soft)] mb-2">{t("Progress.instructions")}</div>
            <p className="text-technical-sm text-on-surface-variant leading-relaxed">{t("Progress.fill_in_the_post")}</p>
          </div>}
        {!showPostForm && <button className="w-full justify-center mt-3 px-3 py-1.5 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none flex items-center gap-1.5" onClick={() => navigate('/app/report')}>
            <Download size={12} />{t("Progress.generate_report")}</button>}
      </div>

      {activeNode && (() => {
      const phase = PHASES.find(p => p.id === activePhase);
      return <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color={phase?.color || 'var(--phase-pre)'} />;
    })()}
    </div>;
}