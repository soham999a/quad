import React, { useState } from 'react';
import { PILLARS, PRE_INTERVENTION_NODES, INTERVENTION_NODES, POST_INTERVENTION_NODES, INTERVENTION_MODULES,
  computePillarScore, computeWeightedScore, getGrade, isCritical, WEIGHTS, GRADE_BANDS,
  CAREER_PROFILES, SKILL_SHAPES, getCareerProfile, getSkillShape } from '../data/qidsData';
import { useApp } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { savePostAssessment } from '../services/firestoreService';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import ScoreCard from '../components/ScoreCard';
import QIDSRadar from '../components/RadarChart';
import { useToast } from '../components/Toast';
import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Minus, ArrowRight,
  Calendar, Clock, Package, Plus, ChevronDown, ChevronUp, Save, Download, ClipboardList, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const PHASES = [
  { id: 'pre', label: 'Pre-Intervention', color: '#6366f1', phase: 'Phase 1', desc: 'Standardize raw results, compute scores, and map intervention needs.' },
  { id: 'intervention', label: 'Intervention', color: '#a855f7', phase: 'Phase 2', desc: 'Targeted development programs based on gap analysis and priority flags.' },
  { id: 'post', label: 'Post-Intervention', color: '#14b8a6', phase: 'Phase 3', desc: 'Progress evaluation, outcome synthesis, and final development roadmap.' },
];

function Heatmap({ pillarScores, rawScores }) {
  return (
    <div>
      <h4 className="text-[13px] font-[600] mb-3">Sub-Parameter Heatmap</h4>
      <div className="flex flex-col gap-1.5">
        {Object.entries(PILLARS).map(([pid, pillar]) => (
          <div key={pid}>
            <div className="text-[11px] font-[600] mb-1" style={{ color: pillar.color }}>{pillar.short}</div>
            <div className="flex gap-1 flex-wrap">
              {pillar.subParams.map(sp => {
                const raw = rawScores[pid]?.[sp.id] || 0;
                const pct = sp.max > 0 ? Math.round((raw / sp.max) * 100) : 0;
                const bg = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={sp.id} title={`${sp.label}: ${pct}%`} className="px-2 py-1 text-[10px] font-[600] cursor-default" style={{
                    borderRadius: 6, background: `${bg}20`, border: `1px solid ${bg}40`, color: bg,
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

function PreSection({ pillarScores, rawScores, activeNode, setActiveNode }) {
  const unifiedScore = computeWeightedScore(pillarScores);
  const overallGrade = getGrade(unifiedScore);
  const criticalPillars = Object.entries(pillarScores).filter(([, s]) => isCritical(s));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="px-2.5 py-0.5 text-[11px] font-[600] rounded-full" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>Phase 1</div>
          <span className="text-[14px] font-bold">Standardize & Score</span>
        </div>
        <div className="rounded-[14px] p-4 overflow-x-auto" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div className="flex items-center gap-0 min-w-max">
            {PRE_INTERVENTION_NODES.map((node, i) => (
              <ProcessNode key={node.id} node={node} color="#6366f1" index={i}
                isLast={i === PRE_INTERVENTION_NODES.length - 1}
                onClick={setActiveNode} active={activeNode?.id === node.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="responsive-grid-4 gap-3 mb-5">
        {Object.entries(PILLARS).map(([id, pillar]) => (
          <ScoreCard key={id} pillar={pillar} score={pillarScores[id]} showWeight />
        ))}
      </div>

      <div className="responsive-grid-2 gap-4 mb-5">
        <div className="bg-surface-container-low border border-outline-variant rounded-[14px] p-5" style={{ background: overallGrade.bg }}>
          <div className="text-technical-sm text-surface-variant mb-1">Unified QIDS Score</div>
          <div className="text-[48px] font-[800] leading-none" style={{ color: overallGrade.color }}>{unifiedScore}</div>
          <div className="text-[13px] text-on-surface-variant mt-1">/ 100 — Grade {overallGrade.grade}: {overallGrade.label}</div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-3">
            <div className="h-full rounded-full" style={{ width: `${unifiedScore}%`, background: `linear-gradient(90deg, ${overallGrade.color}, ${overallGrade.color}80)` }} />
          </div>
          <div className="text-[11px] text-surface-variant mt-2">
            Formula: Σ(Score × Weight) / Σ(Weights) = {unifiedScore}
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant rounded-[14px] p-5">
          <div className="text-technical-sm text-surface-variant mb-3">Dynamic Weightage</div>
          {Object.entries(WEIGHTS).map(([k, w]) => (
            <div key={k} className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PILLARS[k].color }} />
                <span className="text-[13px]">{k}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-technical-sm text-surface-variant">×{w.toFixed(2)}</span>
                <span className="text-[13px] font-[600]" style={{ color: PILLARS[k].color }}>{Math.round(pillarScores[k] * w)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {criticalPillars.length > 0 && (
        <div className="mb-5 p-4 rounded-[12px]" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle size={14} color="#ef4444" />
            <span className="text-[13px] font-bold text-[#fca5a5]">Critical Priority Flags</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {criticalPillars.map(([id, score]) => (
              <div key={id} className="px-3 py-1.5 text-technical-sm text-[#fca5a5] rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {PILLARS[id].label}: {score}/100 — Intervention Required
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-5">
        <Heatmap pillarScores={pillarScores} rawScores={rawScores} />
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
        <h4 className="text-[13px] font-[600] mb-3">Grade Band Reference</h4>
        <div className="flex gap-2">
          {GRADE_BANDS.map(b => (
            <div key={b.grade} className="flex-1 px-2 py-2.5 text-center rounded-lg" style={{ background: b.bg, border: `1px solid ${b.color}40` }}>
              <div className="text-[18px] font-[800]" style={{ color: b.color }}>{b.grade}</div>
              <div className="text-[10px] font-[600]" style={{ color: b.color }}>{b.label}</div>
              <div className="text-[10px] text-surface-variant mt-0.5">{b.min}–{b.max}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreRightPanel({ pillarScores }) {
  const unifiedScore = computeWeightedScore(pillarScores);
  return (
    <>
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Info size={12} color="#818cf8" />
          <span className="text-technical-sm font-[600] text-[#818cf8]">Unique IQ Measurement Model</span>
        </div>
        {['Four-parameter model: Verbal, Quantitative, Psychometric, Performance IQ', 'Equal weighting (25 marks each) for balanced assessment', 'Integration of standardized tests with performance-based tasks', 'Age and culture-adjusted scoring algorithms'].map(item => (
          <div key={item} className="flex gap-1.5 mb-1.5">
            <CheckCircle size={11} color="#10b981" className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-on-surface-variant leading-relaxed">{item}</span>
          </div>
        ))}
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="mb-4">
        <div className="text-technical-sm font-[600] text-[#818cf8] mb-2">Standardization Algorithm</div>
        <div className="font-technical-sm text-[11px] p-2.5 rounded-[6px] text-on-surface leading-relaxed" style={{ background: 'rgba(0,0,0,0.3)' }}>
          Standardized Score (%) =<br />(Raw Score / Max Score) × 100
        </div>
        {['Unified 0–100 scale across all quotients', 'Conversion factors: IQ=1.0, EQ=2.0, SQ=2.0, AQ=1.28', 'Sub-component weighted aggregation formula', 'Enables cross-quotient comparison and visualization'].map(item => (
          <div key={item} className="flex gap-1.5 mt-1.5 mb-1">
            <CheckCircle size={11} color="#10b981" className="mt-0.5 flex-shrink-0" />
            <span className="text-[11px] text-on-surface-variant leading-relaxed">{item}</span>
          </div>
        ))}
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div>
        <div className="text-technical-sm font-[600] text-[#818cf8] mb-2">Dynamic Weightage Algorithm (DWA)</div>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">Context-sensitive weight computation based on role, culture, and mission parameters. Weights reflect the relative developmental importance of each quotient.</p>
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div>
        <div className="text-technical-sm font-[600] mb-2">Quotient Profile</div>
        <QIDSRadar data={pillarScores} size={200} />
      </div>
    </>
  );
}

function ModuleCard({ module, pillar, onToggle, expanded }) {
  const priorityColor = module.priority === 'high' ? '#ef4444' : '#f59e0b';
  return (
    <div className="rounded-[10px] overflow-hidden mb-2" style={{ background: '#1c1b1b', border: `1px solid ${pillar.color}25` }}>
      <div onClick={onToggle} className="px-3.5 py-3 cursor-pointer flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pillar.color }} />
          <span className="text-[13px] font-[600]">{module.label}</span>
          <span className="px-2 py-0.5 text-[10px] font-[600] rounded-full" style={{ background: `${priorityColor}15`, color: priorityColor, border: `1px solid ${priorityColor}30` }}>
            {module.priority.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-surface-variant">{module.duration}</span>
          {expanded ? <ChevronUp size={13} className="text-surface-variant" /> : <ChevronDown size={13} className="text-surface-variant" />}
        </div>
      </div>
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t-[0.5px] border-outline-variant">
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
          <button onClick={() => alert(`Module "${module.label}" marked for assignment. Track progress in Session Tracking.`)} className="mt-2.5 px-3 py-1.5 text-[11px] font-[500] rounded-[6px] cursor-pointer" style={{ background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, color: pillar.color }}>
            Assign Module
          </button>
        </div>
      )}
    </div>
  );
}

function RoadmapCalendar() {
  const modulesByMonth = {
    'Month 1': ['Intake & Orientation', 'EQ: The Pause Button (Week 1–2)'],
    'Month 2': ['EQ: Emotional Awareness Journey', 'AQ: Resilience Foundations (Week 1–2)'],
    'Month 3': ['SQ: Collaboration Dynamics', 'AQ: Adaptability Training'],
    'Month 4': ['IQ: Cognitive Strengthening', 'EQ: Empathy & Social Attunement'],
    'Month 5': ['SQ: Communication Mastery', 'AQ: Persistence Coaching'],
    'Month 6': ['IQ: Critical Thinking Workshop', 'Integration & Review Sessions'],
  };

  return (
    <div>
      <h4 className="text-[13px] font-[600] mb-3">6-Month Development Roadmap</h4>
      <div className="grid grid-cols-3 gap-2.5">
        {['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'].map((month, i) => (
          <div key={month} className="bg-surface-container-low border border-outline-variant rounded-[10px] p-3">
            <div className="text-[11px] font-bold text-[#a78bfa] mb-2">{month}</div>
            {(modulesByMonth[month] || []).map(m => (
              <div key={m} className="px-2 py-1 mb-1 text-[11px] text-on-surface-variant rounded-[6px]" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>{m}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function InterventionSection({ pillarScores, activeNode, setActiveNode }) {
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [expandedPillar, setExpandedPillar] = useState(null);
  const priorityPillars = Object.entries(pillarScores).sort(([, a], [, b]) => a - b).map(([id]) => id);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="px-2.5 py-0.5 text-[11px] font-[600] rounded-full" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>Phase 2</div>
          <span className="text-[14px] font-bold">Strategic Intervention</span>
        </div>
        <div className="rounded-[14px] p-4 overflow-x-auto" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex items-center gap-0 min-w-max">
            {INTERVENTION_NODES.map((node, i) => (
              <ProcessNode key={node.id} node={node} color="#a855f7" index={i} isLast={i === INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-[10px] w-fit">
        {['modules', 'roadmap', 'eq-practice'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-[7px] rounded-xl cursor-pointer text-[13px] font-[500] capitalize transition-all duration-150 border-none ${
            activeTab === t ? 'bg-[#a855f7] text-white' : 'bg-transparent text-on-surface-variant'
          }`}>{t.replace('-', ' ')}</button>
        ))}
      </div>

      {activeTab === 'modules' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold">Recommended Intervention Modules</h3>
            <button className="px-3 py-1.5 bg-surface-container-low text-on-surface text-[13px] font-[500] rounded-lg border border-outline-variant cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5"><Plus size={12} /> Add Custom Module</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {priorityPillars.map(pid => (
              <div key={pid}>
                <div onClick={() => setExpandedPillar(expandedPillar === pid ? null : pid)} className="flex items-center gap-2 mb-2.5 cursor-pointer">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PILLARS[pid].color }} />
                  <span className="text-[13px] font-bold" style={{ color: PILLARS[pid].color }}>{PILLARS[pid].label}</span>
                  {isCritical(pillarScores[pid]) && (
                    <span className="px-1.5 py-0.5 text-[10px] font-[600] text-[#ef4444] rounded" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>CRITICAL</span>
                  )}
                  <span className="ml-auto text-[11px] text-surface-variant">{expandedPillar === pid ? 'Collapse' : 'Expand'}</span>
                </div>
                {INTERVENTION_MODULES[pid].map(mod => (
                  <ModuleCard
                    key={mod.id} module={mod} pillar={PILLARS[pid]}
                    expanded={expandedModule === mod.id}
                    onToggle={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && <RoadmapCalendar />}

      {activeTab === 'eq-practice' && (
        <div>
          <h3 className="text-[15px] font-bold mb-4">Dynamic EQ Integration — The Pause Button</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: 'STOP',  desc: 'Pause the automatic emotional reaction. Create space between stimulus and response.', color: '#ef4444' },
              { step: 'THINK', desc: 'Identify the emotion. Assess the situation objectively. Consider consequences.',        color: '#f59e0b' },
              { step: 'ACT',   desc: 'Choose a deliberate, constructive response aligned with values and goals.',             color: '#10b981' },
            ].map(({ step, desc, color }) => (
              <div key={step} className="p-5 text-center rounded-[14px]" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                <div className="text-[18px] font-[800] mb-2" style={{ color }}>{step}</div>
                <p className="text-technical-sm text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-[12px]" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="text-[13px] font-[600] text-[#10b981] mb-1.5">Integration Across All Sessions</div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">The Stop-Think-Act framework is embedded as a meta-skill across all intervention modules — not just EQ sessions. Every facilitator is trained to prompt this practice during moments of challenge, conflict, or decision-making.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InterventionRightPanel({ pillarScores }) {
  return (
    <>
      <div className="text-technical-sm font-[600] text-[#a78bfa] mb-3">Module Categories</div>
      {Object.entries(INTERVENTION_MODULES).map(([pid, mods]) => (
        <div key={pid} className="mb-3">
          <div className="text-[11px] font-[600] mb-1.5" style={{ color: PILLARS[pid].color }}>{pid}</div>
          {mods.map(m => (
            <div key={m.id} className="px-2 py-1.5 mb-0.5 text-[11px] text-on-surface-variant rounded-[6px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #4e4638' }}>
              {m.label}
            </div>
          ))}
        </div>
      ))}

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="text-technical-sm font-[600] mb-2">Session Tracking</div>
      {[
        { label: 'Scheduled Sessions', val: 24, color: '#6366f1' },
        { label: 'Completed', val: 0, color: '#10b981' },
        { label: 'Pending', val: 24, color: '#f59e0b' },
      ].map(({ label, val, color }) => (
        <div key={label} className="flex justify-between mb-1.5">
          <span className="text-technical-sm text-on-surface-variant">{label}</span>
          <span className="text-technical-sm font-bold" style={{ color }}>{val}</span>
        </div>
      ))}

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="p-3 rounded-[10px] mb-4" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="text-[11px] font-[600] text-[#a78bfa] mb-1.5">Content Library</div>
        <p className="text-[11px] text-surface-variant leading-relaxed">Upload questionnaires, rubrics, and module content via Admin / Config to populate this library.</p>
        <button className="mt-2 w-full justify-center px-3 py-1.5 bg-surface-container-low text-on-surface text-[13px] font-[500] rounded-lg border border-outline-variant cursor-pointer hover:opacity-90 transition-all flex items-center gap-1.5">
          <Package size={11} /> Open Library
        </button>
      </div>

      {Object.entries(pillarScores).map(([id, score]) => (
        <div key={id} className="mb-2">
          <div className="flex justify-between mb-0.5">
            <span className="text-technical-sm" style={{ color: PILLARS[id].color }}>{id}</span>
            <span className="text-technical-sm font-[600]" style={{ color: isCritical(score) ? '#ef4444' : '#10b981' }}>{score}</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: isCritical(score) ? '#ef4444' : PILLARS[id].color }} />
          </div>
        </div>
      ))}
    </>
  );
}

function PostAssessmentForm({ assessmentData, onSubmit }) {
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

  const updateScore = (pid, subId, val) =>
    setRawScores(prev => ({ ...prev, [pid]: { ...prev[pid], [subId]: val } }));

  const handleSubmit = async () => {
    setSaving(true);
    const pillarScores = {};
    Object.keys(PILLARS).forEach(id => {
      pillarScores[id] = computePillarScore(id, rawScores[id] || {});
    });
    await onSubmit({ rawScores, pillarScores, intake: assessmentData?.intake, timestamp: new Date().toISOString() });
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <ClipboardList size={18} color="#14b8a6" />
        <h2 className="text-[18px] font-[800] m-0">Post-Intervention Assessment</h2>
        <div className="ml-auto px-3 py-1 text-[11px] font-[600] rounded-full" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: '#2dd4bf' }}>Phase 3</div>
      </div>
      <p className="text-[13px] text-surface-variant mb-6">
        Re-assess all four pillars after the intervention period. Adjust the scores to reflect current performance.
      </p>

      {Object.entries(PILLARS).map(([pid, pillar]) => (
        <div key={pid} className="mb-5 bg-surface-container-low rounded-[14px] p-5" style={{ border: `1px solid ${pillar.color}25` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pillar.color, boxShadow: `0 0 8px ${pillar.color}` }} />
            <span className="text-[14px] font-bold" style={{ color: pillar.color }}>{pillar.label}</span>
            <span className="text-technical-sm text-surface-variant">— {pillar.framework}</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {pillar.subParams.map(sp => {
              const val = rawScores[pid]?.[sp.id] ?? 0;
              const preVal = assessmentData?.rawScores?.[pid]?.[sp.id] ?? 0;
              const pct = Math.round((val / sp.max) * 100);
              return (
                <div key={sp.id} className="rounded-[10px] p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #4e4638' }}>
                  <div className="flex justify-between mb-1.5">
                    <div>
                      <div className="text-[13px] font-[600]">{sp.label}</div>
                      <div className="text-[11px] text-surface-variant">Pre: {preVal}/{sp.max}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-bold" style={{ color: pillar.color }}>{val}</div>
                      <div className="text-[10px] text-surface-variant">/ {sp.max}</div>
                    </div>
                  </div>
                  <input type="range" min={0} max={sp.max} value={val}
                    onChange={e => updateScore(pid, sp.id, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-[3px] outline-none border-none p-0 cursor-pointer appearance-none"
                    style={{
                      background: `linear-gradient(90deg, ${pillar.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-surface-variant">0</span>
                    <span className="text-[10px] font-[600]" style={{ color: pct >= 60 ? '#10b981' : '#ef4444' }}>{pct}%</span>
                    <span className="text-[10px] text-surface-variant">{sp.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={saving} className="w-full justify-center py-[14px] text-label-md font-label-md rounded-xl bg-[#14b8a6] text-white hover:opacity-90 transition-all border-none cursor-pointer flex items-center gap-2 disabled:opacity-50">
        {saving ? 'Saving...' : <><Save size={14} /> Submit Post-Assessment</>}
      </button>
    </div>
  );
}

function PostSection({ preScores, postScores, rawScores, activeNode, setActiveNode }) {
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
    Delta: postScores[id] - preScores[id],
  }));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="px-2.5 py-0.5 text-[11px] font-[600] rounded-full" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', color: '#2dd4bf' }}>Phase 3</div>
          <span className="text-[14px] font-bold">Post-Intervention Evaluation</span>
        </div>
        <div className="rounded-[14px] p-4 overflow-x-auto" style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.15)' }}>
          <div className="flex items-center gap-0 min-w-max">
            {POST_INTERVENTION_NODES.map((node, i) => (
              <ProcessNode key={node.id} node={node} color="#14b8a6" index={i} isLast={i === POST_INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="responsive-grid-3 gap-3 mb-5">
        {[
          { label: 'Pre-Intervention Score', val: preUnified, color: '#6366f1', grade: getGrade(preUnified) },
          { label: 'Post-Intervention Score', val: postUnified, color: '#14b8a6', grade: getGrade(postUnified) },
          { label: 'Overall Improvement', val: delta, color: delta >= 0 ? '#10b981' : '#ef4444', isPercent: false, isDelta: true },
        ].map(({ label, val, color, grade, isDelta }) => (
          <div key={label} className="bg-surface-container-low text-center rounded-[14px] p-5" style={{ border: `1px solid ${color}30` }}>
            <div className="text-[11px] text-surface-variant mb-1">{label}</div>
            <div className="text-[40px] font-[800] leading-none" style={{ color }}>
              {isDelta ? (delta >= 0 ? `+${delta}` : delta) : val}
            </div>
            {grade && <div className="text-technical-sm mt-1" style={{ color: grade.color }}>Grade {grade.grade}: {grade.label}</div>}
            {isDelta && <div className="text-technical-sm text-surface-variant mt-1">points gained</div>}
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-[10px] w-fit">
        {['comparison', 'radar', 'career', 'idp'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-[7px] rounded-xl cursor-pointer text-[13px] font-[500] capitalize transition-all duration-150 border-none ${
            activeTab === t ? 'bg-[#14b8a6] text-white' : 'bg-transparent text-on-surface-variant'
          }`}>{t}</button>
        ))}
      </div>

      {activeTab === 'comparison' && (
        <div>
          <h3 className="text-[15px] font-bold mb-4">Before vs After Comparison</h3>
          <div className="bg-surface-container-low border border-outline-variant rounded-[14px] p-5 mb-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparisonData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1c1b1b', border: '1px solid #4e4638', borderRadius: 8, color: 'white', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#d1c5b3' }} />
                <Bar dataKey="Pre" fill="#6366f1" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Post" fill="#14b8a6" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const d = postScores[id] - preScores[id];
              const pct = preScores[id] > 0 ? Math.round((d / preScores[id]) * 100) : 0;
              return (
                <div key={id} className="bg-surface-container-low rounded-[12px] p-3.5" style={{ border: `1px solid ${pillar.color}25` }}>
                  <div className="text-[11px] font-[600] mb-1.5" style={{ color: pillar.color }}>{pillar.short}</div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-technical-sm text-surface-variant">{preScores[id]}</span>
                    <ArrowRight size={12} className="text-surface-variant" />
                    <span className="text-[14px] font-bold" style={{ color: pillar.color }}>{postScores[id]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {d > 0 ? <TrendingUp size={12} color="#10b981" /> : d < 0 ? <TrendingDown size={12} color="#ef4444" /> : <Minus size={12} className="text-surface-variant" />}
                    <span className="text-technical-sm font-[600]" style={{ color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : '#353534' }}>
                      {d > 0 ? `+${d}` : d} pts ({pct > 0 ? '+' : ''}{pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'radar' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
            <h4 className="text-[13px] font-[600] mb-3">Pre vs Post Radar</h4>
            <QIDSRadar data={preScores} compare={postScores} size={280} />
          </div>
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
            <h4 className="text-[13px] font-[600] mb-3">Skill Shape Topology</h4>
            <div className="text-center p-5">
              <div className="text-[72px] font-[900] mb-3 leading-none" style={{ background: 'linear-gradient(135deg, #6366f1, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{skillShape}</div>
              <div className="text-body-md font-bold mb-2">{skillShapeData?.label}</div>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">{skillShapeData?.desc}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'career' && (
        <div>
          <h3 className="text-[15px] font-bold mb-4">Career Guidance & Recommendations</h3>
          <div className="p-6 rounded-[16px] mb-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div className="flex items-start gap-4">
              <div>
                <div className="text-[11px] text-surface-variant mb-1">Recommended Track</div>
                <h3 className="text-[18px] font-[800] mb-1.5">{careerProfile.label}</h3>
                <div className="text-technical-sm text-[#818cf8] mb-2">Condition: {careerProfile.condition}</div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed mb-3">{careerProfile.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {careerProfile.roles.map(r => (
                    <span key={r} className="px-2.5 py-1 text-technical-sm text-[#818cf8] rounded-full" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <h4 className="text-[13px] font-[600] mb-3">All Career Profiles</h4>
          <div className="grid grid-cols-2 gap-2.5">
            {CAREER_PROFILES.map(cp => (
              <div key={cp.id} className="p-3.5 rounded-[10px]" style={{
                background: cp.id === careerProfile.id ? 'rgba(99,102,241,0.1)' : '#1c1b1b',
                border: `1px solid ${cp.id === careerProfile.id ? 'rgba(99,102,241,0.4)' : '#4e4638'}`,
              }}>
                <div className="flex gap-2 items-start">
                  <div>
                    <div className="text-technical-sm font-[600] mb-0.5">{cp.label}</div>
                    <div className="text-[11px] text-surface-variant">{cp.condition}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'idp' && (
        <div>
          <h3 className="text-[15px] font-bold mb-4">Individual Development Plan (IDP)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <h4 className="text-[13px] font-[600] text-[#14b8a6] mb-3">Achieved Milestones</h4>
              {Object.entries(PILLARS).filter(([id]) => postScores[id] > preScores[id]).map(([id, p]) => (
                <div key={id} className="flex gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981' }}>
                    <span className="text-[9px] text-[#10b981]">✓</span>
                  </div>
                  <span className="text-[13px] text-on-surface-variant">{p.label}: {preScores[id]} → {postScores[id]} (+{postScores[id] - preScores[id]})</span>
                </div>
              ))}
            </div>
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <h4 className="text-[13px] font-[600] text-[#f59e0b] mb-3">Maintenance Roadmap</h4>
              {['Monthly self-assessment check-ins', 'Quarterly facilitator review sessions', 'Annual full QIDS reassessment', 'Ongoing EQ practice (Stop-Think-Act)', 'Peer accountability partnerships'].map(item => (
                <div key={item} className="flex gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-1.5 flex-shrink-0" />
                  <span className="text-technical-sm text-on-surface-variant">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostRightPanel({ preScores, postScores }) {
  const preUnified = computeWeightedScore(preScores);
  const postUnified = computeWeightedScore(postScores);
  const delta = postUnified - preUnified;
  const skillShape = getSkillShape(postScores);
  const skillShapeData = SKILL_SHAPES.find(s => s.id === skillShape);

  return (
    <>
      <div className="text-technical-sm font-[600] text-[#2dd4bf] mb-3">Outcome Summary</div>
      <div className="p-3.5 rounded-[10px] mb-4" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
        <div className="text-[11px] text-surface-variant mb-1">Unified Score Change</div>
        <div className="text-[28px] font-[800] text-[#14b8a6] leading-none">{preUnified} → {postUnified}</div>
        <div className="text-technical-sm font-[600]" style={{ color: delta >= 0 ? '#10b981' : '#ef4444' }}>{delta >= 0 ? `+${delta}` : delta} points ({preUnified > 0 ? Math.round((delta / preUnified) * 100) : 0}%)</div>
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <div className="text-technical-sm font-[600] mb-2.5">Skill Shape</div>
      <div className="p-3 text-center rounded-[10px] mb-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="text-[36px] font-[900] text-[#818cf8] leading-none">{skillShape}</div>
        <div className="text-technical-sm text-on-surface-variant">{skillShapeData?.label}</div>
      </div>

      <div className="border-t-[0.5px] border-outline-variant my-3" />

      <QIDSRadar data={preScores} compare={postScores} size={200} />
    </>
  );
}

export default function Progress() {
  const { assessmentData: ctxAssessment, postData: ctxPostData, setPostData } = useApp();
  const { user } = useAuth();
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
  const preScores = {};
  Object.keys(PILLARS).forEach(id => {
    preScores[id] = computePillarScore(id, rawScores[id] || {});
  });

  const postRaw = postData?.rawScores || {};
  const postScores = {};
  Object.keys(PILLARS).forEach(id => {
    postScores[id] = computePillarScore(id, postRaw[id] || {});
  });

  const handlePostSubmit = async (data) => {
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
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)] flex-col gap-4">
        <div className="opacity-30">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <h3 className="text-[18px] font-bold">No Assessment Found</h3>
        <p className="text-label-md text-surface-variant">Complete an assessment first to view your progress timeline.</p>
        <button onClick={() => navigate('/app/assessment')} className="px-6 py-2 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none">Start Assessment</button>
      </div>
    );
  }

  const showPostForm = activePhase === 'post' && !postData && !submitted;

  return (
    <div className="flex h-[calc(100vh-52px)] animate-fade">
      {/* Mobile phase selector */}
      <div className="hide-desktop p-3 border-b-[0.5px] border-outline-variant bg-surface-container-lowest flex gap-1 overflow-x-auto">
        {PHASES.map(phase => {
          const active = activePhase === phase.id;
          return (
            <button key={phase.id} onClick={() => setActivePhase(phase.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-[600] cursor-pointer border-none whitespace-nowrap transition-all ${
                active ? 'text-white' : 'text-surface-variant bg-transparent'
              }`}
              style={{ background: active ? phase.color : 'transparent' }}>
              {phase.label}
            </button>
          );
        })}
      </div>

      {/* Mobile summary strip */}
      <div className="hide-desktop p-3 flex gap-2 overflow-x-auto border-b-[0.5px] border-outline-variant">
        {Object.entries(PILLARS).map(([id, pillar]) => (
          <div key={id} className="flex-shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{
            background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`,
          }}>
            <span className="text-[11px] font-bold" style={{ color: pillar.color }}>{id}</span>
            <span className="text-[13px] font-[800]" style={{ color: isCritical(preScores[id]) ? '#ef4444' : '#10b981' }}>{preScores[id]}</span>
          </div>
        ))}
      </div>

      {/* Left sidebar - hidden on mobile */}
      <div className="w-[220px] border-r-[0.5px] border-outline-variant bg-surface-container-lowest p-5 overflow-y-auto flex-shrink-0 hide-mobile">
        <h3 className="text-[15px] font-bold mb-1">Progress Timeline</h3>
        <p className="text-technical-sm text-surface-variant mb-5">Track your journey through all phases</p>

        <div className="flex flex-col gap-2 mb-5">
          {PHASES.map((phase, i) => {
            const active = activePhase === phase.id;
            const completed = (phase.id === 'post' && postData) ||
                            (phase.id === 'intervention' && assessmentData) ||
                            (phase.id === 'pre' && assessmentData);
            return (
              <button key={phase.id} onClick={() => {
                if (phase.id === 'post' && !postData && !submitted) { /* stay or show form */ }
                setActivePhase(phase.id);
              }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer text-left transition-all duration-150" style={{
                background: active ? `${phase.color}15` : 'transparent',
                border: `1px solid ${active ? phase.color : 'transparent'}`,
              }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  background: phase.color,
                  boxShadow: active ? `0 0 8px ${phase.color}` : 'none',
                }} />
                <div className="flex-1">
                  <div className="text-technical-sm font-[600]" style={{ color: active ? phase.color : '#e5e2e1' }}>
                    {phase.label}
                  </div>
                  <div className="text-[10px] text-surface-variant">{phase.phase}</div>
                </div>
                {completed && <span className="text-[9px] text-[#10b981]">✓</span>}
              </button>
            );
          })}
        </div>

        {activePhase === 'pre' && (
          <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">Process Nodes</div>
        )}
        {activePhase === 'pre' && PRE_INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1 transition-all duration-150" style={{
            background: activeNode?.id === node.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#6366f1' : 'transparent'}`,
          }}>
            <div className="text-technical-sm font-[500]">{node.label}</div>
          </div>
        ))}

        {activePhase === 'intervention' && (
          <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">Process Nodes</div>
        )}
        {activePhase === 'intervention' && INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1 transition-all duration-150" style={{
            background: activeNode?.id === node.id ? 'rgba(139,92,246,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#a855f7' : 'transparent'}`,
          }}>
            <div className="text-technical-sm font-[500]">{node.label}</div>
          </div>
        ))}

        {activePhase === 'post' && !showPostForm && (
          <>
            <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">Score Delta</div>
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const d = postScores[id] - preScores[id];
              return (
                <div key={id} className="flex justify-between items-center mb-2">
                  <span className="text-technical-sm" style={{ color: pillar.color }}>{id}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-technical-sm text-surface-variant">{preScores[id]} →</span>
                    <span className="text-technical-sm font-bold" style={{ color: pillar.color }}>{postScores[id]}</span>
                    <span className="text-[11px] font-[600]" style={{ color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : '#353534' }}>
                      {d > 0 ? `+${d}` : d}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="border-t-[0.5px] border-outline-variant my-3" />
            <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">Process Nodes</div>
            {POST_INTERVENTION_NODES.map(node => (
              <div key={node.id} onClick={() => setActiveNode(node)} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1 transition-all duration-150" style={{
                background: activeNode?.id === node.id ? 'rgba(20,184,166,0.15)' : 'transparent',
                border: `1px solid ${activeNode?.id === node.id ? '#14b8a6' : 'transparent'}`,
              }}>
                <div className="text-technical-sm font-[500]">{node.label}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main content */}
      {showPostForm ? (
        <div className="flex-1 overflow-y-auto animate-fade">
          <PostAssessmentForm assessmentData={assessmentData} onSubmit={handlePostSubmit} />
        </div>
      ) : activePhase === 'pre' ? (
        <PreSection pillarScores={preScores} rawScores={rawScores} activeNode={activeNode} setActiveNode={setActiveNode} />
      ) : activePhase === 'intervention' ? (
        <InterventionSection pillarScores={preScores} activeNode={activeNode} setActiveNode={setActiveNode} />
      ) : (
        <PostSection preScores={preScores} postScores={postScores} rawScores={rawScores} activeNode={activeNode} setActiveNode={setActiveNode} />
      )}

      {/* Right panel - hidden on mobile */}
      <div className="w-[260px] border-l-[0.5px] border-outline-variant bg-surface-container-lowest p-5 overflow-y-auto flex-shrink-0 hide-mobile">
        {activePhase === 'pre' && <PreRightPanel pillarScores={preScores} />}
        {activePhase === 'intervention' && <InterventionRightPanel pillarScores={preScores} />}
        {activePhase === 'post' && !showPostForm && <PostRightPanel preScores={preScores} postScores={postScores} />}
        {showPostForm && (
          <div className="p-3.5 rounded-[10px]" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
            <div className="text-technical-sm font-[600] text-[#2dd4bf] mb-2">Instructions</div>
            <p className="text-technical-sm text-on-surface-variant leading-relaxed">Fill in the post-intervention scores for each sub-parameter. The form pre-fills with your pre-intervention scores so you can adjust based on observed progress.</p>
          </div>
        )}
        {!showPostForm && (
          <button className="w-full justify-center mt-3 px-3 py-1.5 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none flex items-center gap-1.5" onClick={() => navigate('/app/report')}>
            <Download size={12} /> Generate Report
          </button>
        )}
      </div>

      {activeNode && (() => {
        const phase = PHASES.find(p => p.id === activePhase);
        return <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color={phase?.color || '#6366f1'} />;
      })()}
    </div>
  );
}
