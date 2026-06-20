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
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sub-Parameter Heatmap</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(PILLARS).map(([pid, pillar]) => (
          <div key={pid}>
            <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 4 }}>{pillar.short}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {pillar.subParams.map(sp => {
                const raw = rawScores[pid]?.[sp.id] || 0;
                const pct = Math.round((raw / sp.max) * 100);
                const bg = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={sp.id} title={`${sp.label}: ${pct}%`} style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: `${bg}20`, border: `1px solid ${bg}40`, color: bg,
                    cursor: 'default',
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
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Phase 1</div>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Standardize & Score</span>
        </div>
        <div style={{
          background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 14, padding: 16, overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
            {PRE_INTERVENTION_NODES.map((node, i) => (
              <ProcessNode key={node.id} node={node} color="#6366f1" index={i}
                isLast={i === PRE_INTERVENTION_NODES.length - 1}
                onClick={setActiveNode} active={activeNode?.id === node.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="score-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {Object.entries(PILLARS).map(([id, pillar]) => (
          <ScoreCard key={id} pillar={pillar} score={pillarScores[id]} showWeight />
        ))}
      </div>

      <div className="unified-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{
          background: 'var(--navy-4)', border: '1px solid var(--border)', borderRadius: 14, padding: 20,
          background: `linear-gradient(135deg, ${overallGrade.bg}, rgba(0,0,0,0.2))`,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Unified QIDS Score</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: overallGrade.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{unifiedScore}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>/ 100 — Grade {overallGrade.grade}: {overallGrade.label}</div>
          <div className="progress-bar" style={{ marginTop: 12 }}>
            <div className="progress-fill" style={{ width: `${unifiedScore}%`, background: `linear-gradient(90deg, ${overallGrade.color}, ${overallGrade.color}80)` }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Formula: Σ(Score × Weight) / Σ(Weights) = {unifiedScore}
          </div>
        </div>

        <div style={{ background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Dynamic Weightage</div>
          {Object.entries(WEIGHTS).map(([k, w]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PILLARS[k].color }} />
                <span style={{ fontSize: 13 }}>{k}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>×{w.toFixed(2)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: PILLARS[k].color }}>{Math.round(pillarScores[k] * w)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {criticalPillars.length > 0 && (
        <div style={{ marginBottom: 20, padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>Critical Priority Flags</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {criticalPillars.map(([id, score]) => (
              <div key={id} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
                {PILLARS[id].label}: {score}/100 — Intervention Required
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <Heatmap pillarScores={pillarScores} rawScores={rawScores} />
      </div>

      <div className="card">
        <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Grade Band Reference</h4>
        <div className="grade-bands">
          <div style={{ display: 'flex', gap: 8 }}>
          {GRADE_BANDS.map(b => (
            <div key={b.grade} style={{
              flex: 1, padding: '10px 8px', borderRadius: 8, textAlign: 'center',
              background: b.bg, border: `1px solid ${b.color}40`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: b.color, fontFamily: 'Space Grotesk' }}>{b.grade}</div>
              <div style={{ fontSize: 10, color: b.color, fontWeight: 600 }}>{b.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{b.min}–{b.max}</div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreRightPanel({ pillarScores }) {
  const unifiedScore = computeWeightedScore(pillarScores);
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Info size={12} color="#818cf8" />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>Unique IQ Measurement Model</span>
        </div>
        {['Four-parameter model: Verbal, Quantitative, Psychometric, Performance IQ', 'Equal weighting (25 marks each) for balanced assessment', 'Integration of standardized tests with performance-based tasks', 'Age and culture-adjusted scoring algorithms'].map(item => (
          <div key={item} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <CheckCircle size={11} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 8 }}>Standardization Algorithm</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          Standardized Score (%) =<br />(Raw Score / Max Score) × 100
        </div>
        {['Unified 0–100 scale across all quotients', 'Conversion factors: IQ=1.0, EQ=2.0, SQ=2.0, AQ=1.28', 'Sub-component weighted aggregation formula', 'Enables cross-quotient comparison and visualization'].map(item => (
          <div key={item} style={{ display: 'flex', gap: 6, marginBottom: 5, marginTop: 6 }}>
            <CheckCircle size={11} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 8 }}>Dynamic Weightage Algorithm (DWA)</div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Context-sensitive weight computation based on role, culture, and mission parameters. Weights reflect the relative developmental importance of each quotient.</p>
      </div>

      <div className="divider" />

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Quotient Profile</div>
        <QIDSRadar data={pillarScores} size={200} />
      </div>
    </>
  );
}

function ModuleCard({ module, pillar, onToggle, expanded }) {
  const priorityColor = module.priority === 'high' ? '#ef4444' : '#f59e0b';
  return (
    <div style={{
      background: 'var(--navy-4)', border: `1px solid ${pillar.color}25`,
      borderRadius: 10, overflow: 'hidden', marginBottom: 8,
    }}>
      <div onClick={onToggle} style={{
        padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: pillar.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{module.label}</span>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: `${priorityColor}15`, color: priorityColor, border: `1px solid ${priorityColor}30` }}>
            {module.priority.toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{module.duration}</span>
          {expanded ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 10, marginBottom: 10 }}>{module.desc}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} color="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{module.duration}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} color="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{module.sessions} sessions</span>
            </div>
          </div>
          <button onClick={() => alert(`Module "${module.label}" marked for assignment. Track progress in Session Tracking.`)} style={{
            marginTop: 10, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, color: pillar.color, cursor: 'pointer',
          }}>
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
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>6-Month Development Roadmap</h4>
      <div className="roadmap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'].map((month, i) => (
          <div key={month} style={{
            background: 'var(--navy-4)', border: '1px solid var(--border-light)',
            borderRadius: 10, padding: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>{month}</div>
            {(modulesByMonth[month] || []).map(m => (
              <div key={m} style={{
                padding: '4px 8px', marginBottom: 4, borderRadius: 6,
                background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                fontSize: 11, color: 'var(--text-secondary)',
              }}>{m}</div>
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
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: '3px 10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>Phase 2</div>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Strategic Intervention</span>
        </div>
        <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 14, padding: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
            {INTERVENTION_NODES.map((node, i) => (
              <ProcessNode key={node.id} node={node} color="#a855f7" index={i} isLast={i === INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {['modules', 'roadmap', 'eq-practice'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === t ? '#a855f7' : 'transparent',
            color: activeTab === t ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
            textTransform: 'capitalize',
          }}>{t.replace('-', ' ')}</button>
        ))}
      </div>

      {activeTab === 'modules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recommended Intervention Modules</h3>
            <button className="btn btn-secondary btn-sm"><Plus size={12} /> Add Custom Module</button>
          </div>
          <div className="modules-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {priorityPillars.map(pid => (
              <div key={pid}>
                <div onClick={() => setExpandedPillar(expandedPillar === pid ? null : pid)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PILLARS[pid].color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: PILLARS[pid].color }}>{PILLARS[pid].label}</span>
                  {isCritical(pillarScores[pid]) && (
                    <span style={{ padding: '2px 6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>CRITICAL</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{expandedPillar === pid ? 'Collapse' : 'Expand'}</span>
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
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Dynamic EQ Integration — The Pause Button</h3>
          <div className="eq-practice-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { step: 'STOP',  desc: 'Pause the automatic emotional reaction. Create space between stimulus and response.', color: '#ef4444' },
              { step: 'THINK', desc: 'Identify the emotion. Assess the situation objectively. Consider consequences.',        color: '#f59e0b' },
              { step: 'ACT',   desc: 'Choose a deliberate, constructive response aligned with values and goals.',             color: '#10b981' },
            ].map(({ step, desc, color }) => (
              <div key={step} style={{
                padding: 20, background: `${color}10`, border: `1px solid ${color}30`,
                borderRadius: 14, textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Space Grotesk', marginBottom: 8 }}>{step}</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 6 }}>Integration Across All Sessions</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>The Stop-Think-Act framework is embedded as a meta-skill across all intervention modules — not just EQ sessions. Every facilitator is trained to prompt this practice during moments of challenge, conflict, or decision-making.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InterventionRightPanel({ pillarScores }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', marginBottom: 12 }}>Module Categories</div>
      {Object.entries(INTERVENTION_MODULES).map(([pid, mods]) => (
        <div key={pid} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: PILLARS[pid].color, fontWeight: 600, marginBottom: 6 }}>{pid}</div>
          {mods.map(m => (
            <div key={m.id} style={{ padding: '5px 8px', marginBottom: 3, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', fontSize: 11, color: 'var(--text-secondary)' }}>
              {m.label}
            </div>
          ))}
        </div>
      ))}

      <div className="divider" />

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Session Tracking</div>
      {[
        { label: 'Scheduled Sessions', val: 24, color: '#6366f1' },
        { label: 'Completed', val: 0, color: '#10b981' },
        { label: 'Pending', val: 24, color: '#f59e0b' },
      ].map(({ label, val, color }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
        </div>
      ))}

      <div className="divider" />

      <div style={{ padding: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>Content Library</div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>Upload questionnaires, rubrics, and module content via Admin / Config to populate this library.</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
          <Package size={11} /> Open Library
        </button>
      </div>

      {Object.entries(pillarScores).map(([id, score]) => (
        <div key={id} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: PILLARS[id].color }}>{id}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: isCritical(score) ? '#ef4444' : '#10b981' }}>{score}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${score}%`, background: isCritical(score) ? '#ef4444' : PILLARS[id].gradient }} />
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
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <ClipboardList size={18} color="#14b8a6" />
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Post-Intervention Assessment</h2>
        <div style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 20, fontSize: 11, color: '#2dd4bf', fontWeight: 600 }}>Phase 3</div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Re-assess all four pillars after the intervention period. Adjust the scores to reflect current performance.
      </p>

      {Object.entries(PILLARS).map(([pid, pillar]) => (
        <div key={pid} style={{ marginBottom: 20, background: 'var(--navy-4)', border: `1px solid ${pillar.color}25`, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: pillar.color, boxShadow: `0 0 8px ${pillar.color}` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: pillar.color }}>{pillar.label}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {pillar.framework}</span>
          </div>
          <div className="grid-2" style={{ gap: 14 }}>
            {pillar.subParams.map(sp => {
              const val = rawScores[pid]?.[sp.id] ?? 0;
              const preVal = assessmentData?.rawScores?.[pid]?.[sp.id] ?? 0;
              const pct = Math.round((val / sp.max) * 100);
              return (
                <div key={sp.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{sp.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pre: {preVal}/{sp.max}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: pillar.color }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ {sp.max}</div>
                    </div>
                  </div>
                  <input type="range" min={0} max={sp.max} value={val}
                    onChange={e => updateScore(pid, sp.id, parseInt(e.target.value))}
                    style={{
                      width: '100%', height: 6, borderRadius: 3, outline: 'none', border: 'none',
                      padding: 0, cursor: 'pointer', appearance: 'none',
                      background: `linear-gradient(90deg, ${pillar.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>0</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: pct >= 60 ? '#10b981' : '#ef4444' }}>{pct}%</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sp.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={saving} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, borderRadius: 12, background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
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
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ padding: '3px 10px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 20, fontSize: 11, color: '#2dd4bf', fontWeight: 600 }}>Phase 3</div>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Post-Intervention Evaluation</span>
        </div>
        <div style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 14, padding: 16, overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
            {POST_INTERVENTION_NODES.map((node, i) => (
              <ProcessNode key={node.id} node={node} color="#14b8a6" index={i} isLast={i === POST_INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
            ))}
          </div>
        </div>
      </div>

      <div className="score-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Pre-Intervention Score', val: preUnified, color: '#6366f1', grade: getGrade(preUnified) },
          { label: 'Post-Intervention Score', val: postUnified, color: '#14b8a6', grade: getGrade(postUnified) },
          { label: 'Overall Improvement', val: delta, color: delta >= 0 ? '#10b981' : '#ef4444', isPercent: false, isDelta: true },
        ].map(({ label, val, color, grade, isDelta }) => (
          <div key={label} style={{
            background: 'var(--navy-4)', border: `1px solid ${color}30`,
            borderRadius: 14, padding: 20, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 40, fontWeight: 800, color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>
              {isDelta ? (delta >= 0 ? `+${delta}` : delta) : val}
            </div>
            {grade && <div style={{ fontSize: 12, color: grade.color, marginTop: 4 }}>Grade {grade.grade}: {grade.label}</div>}
            {isDelta && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>points gained</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {['comparison', 'radar', 'career', 'idp'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === t ? '#14b8a6' : 'transparent',
            color: activeTab === t ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {activeTab === 'comparison' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Before vs After Comparison</h3>
          <div style={{ background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparisonData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--navy-4)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                <Bar dataKey="Pre" fill="#6366f1" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Post" fill="#14b8a6" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="post-compare-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const d = postScores[id] - preScores[id];
              const pct = preScores[id] > 0 ? Math.round((d / preScores[id]) * 100) : 0;
              return (
                <div key={id} style={{ background: 'var(--navy-4)', border: `1px solid ${pillar.color}25`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 6 }}>{pillar.short}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{preScores[id]}</span>
                    <ArrowRight size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: pillar.color }}>{postScores[id]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {d > 0 ? <TrendingUp size={12} color="#10b981" /> : d < 0 ? <TrendingDown size={12} color="#ef4444" /> : <Minus size={12} color="var(--text-muted)" />}
                    <span style={{ fontSize: 12, fontWeight: 600, color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : 'var(--text-muted)' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Pre vs Post Radar</h4>
            <QIDSRadar data={preScores} compare={postScores} size={280} />
          </div>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Skill Shape Topology</h4>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{
                fontSize: 72, fontWeight: 900, fontFamily: 'Space Grotesk',
                background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 12,
              }}>{skillShape}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{skillShapeData?.label}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{skillShapeData?.desc}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'career' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Career Guidance & Recommendations</h3>
          <div style={{
            padding: 24, background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Recommended Track</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{careerProfile.label}</h3>
                <div style={{ fontSize: 12, color: '#818cf8', marginBottom: 8 }}>Condition: {careerProfile.condition}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{careerProfile.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {careerProfile.roles.map(r => (
                    <span key={r} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12, color: '#818cf8' }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>All Career Profiles</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CAREER_PROFILES.map(cp => (
              <div key={cp.id} style={{
                padding: 14, background: cp.id === careerProfile.id ? 'rgba(99,102,241,0.1)' : 'var(--navy-4)',
                border: `1px solid ${cp.id === careerProfile.id ? 'rgba(99,102,241,0.4)' : 'var(--border-light)'}`,
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{cp.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cp.condition}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'idp' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Individual Development Plan (IDP)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#14b8a6', marginBottom: 12 }}>Achieved Milestones</h4>
              {Object.entries(PILLARS).filter(([id]) => postScores[id] > preScores[id]).map(([id, p]) => (
                <div key={id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: '#10b981' }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.label}: {preScores[id]} → {postScores[id]} (+{postScores[id] - preScores[id]})</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 12 }}>Maintenance Roadmap</h4>
              {['Monthly self-assessment check-ins', 'Quarterly facilitator review sessions', 'Annual full QIDS reassessment', 'Ongoing EQ practice (Stop-Think-Act)', 'Peer accountability partnerships'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginTop: 5, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item}</span>
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
      <div style={{ fontSize: 12, fontWeight: 600, color: '#2dd4bf', marginBottom: 12 }}>Outcome Summary</div>
      <div style={{ padding: 14, background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Unified Score Change</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#14b8a6', fontFamily: 'Space Grotesk' }}>{preUnified} → {postUnified}</div>
        <div style={{ fontSize: 12, color: delta >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{delta >= 0 ? `+${delta}` : delta} points ({Math.round((delta / preUnified) * 100)}%)</div>
      </div>

      <div className="divider" />

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Skill Shape</div>
      <div style={{ padding: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#818cf8', fontFamily: 'Space Grotesk' }}>{skillShape}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{skillShapeData?.label}</div>
      </div>

      <div className="divider" />

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', flexDirection: 'column', gap: 16 }}>
        <div style={{ opacity: 0.3 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>No Assessment Found</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Complete an assessment first to view your progress timeline.</p>
        <button onClick={() => navigate('/app/assessment')} className="btn btn-primary">Start Assessment</button>
      </div>
    );
  }

  const showPostForm = activePhase === 'post' && !postData && !submitted;

  return (
    <div className="three-panel animate-fade" style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      {/* Mobile summary strip */}
      <div className="mobile-panel-summary" style={{ display: 'none' }}>
        {Object.entries(PILLARS).map(([id, pillar]) => (
          <div key={id} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 8,
            background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 11, color: pillar.color, fontWeight: 700 }}>{id}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: isCritical(preScores[id]) ? '#ef4444' : '#10b981' }}>{preScores[id]}</span>
          </div>
        ))}
      </div>

      {/* Left sidebar */}
      <div className="panel-left" style={{ width: 220, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Progress Timeline</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Track your journey through all phases</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {PHASES.map((phase, i) => {
            const active = activePhase === phase.id;
            const completed = (phase.id === 'post' && postData) ||
                              (phase.id === 'intervention' && assessmentData) ||
                              (phase.id === 'pre' && assessmentData);
            return (
              <button key={phase.id} onClick={() => {
                if (phase.id === 'post' && !postData && !submitted) { /* stay or show form */ }
                setActivePhase(phase.id);
              }} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                background: active ? `${phase.color}15` : 'transparent',
                border: `1px solid ${active ? phase.color : 'transparent'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: phase.color, flexShrink: 0,
                  boxShadow: active ? `0 0 8px ${phase.color}` : 'none',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: active ? phase.color : 'var(--text-primary)' }}>
                    {phase.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{phase.phase}</div>
                </div>
                {completed && <span style={{ fontSize: 9, color: '#10b981' }}>✓</span>}
              </button>
            );
          })}
        </div>

        {activePhase === 'pre' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Process Nodes</div>
        )}
        {activePhase === 'pre' && PRE_INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            background: activeNode?.id === node.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#6366f1' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{node.label}</div>
          </div>
        ))}

        {activePhase === 'intervention' && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Process Nodes</div>
        )}
        {activePhase === 'intervention' && INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            background: activeNode?.id === node.id ? 'rgba(139,92,246,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#a855f7' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{node.label}</div>
          </div>
        ))}

        {activePhase === 'post' && !showPostForm && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Score Delta</div>
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const d = postScores[id] - preScores[id];
              return (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: pillar.color }}>{id}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{preScores[id]} →</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pillar.color }}>{postScores[id]}</span>
                    <span style={{ fontSize: 11, color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                      {d > 0 ? `+${d}` : d}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="divider" />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Process Nodes</div>
            {POST_INTERVENTION_NODES.map(node => (
              <div key={node.id} onClick={() => setActiveNode(node)} style={{
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                background: activeNode?.id === node.id ? 'rgba(20,184,166,0.15)' : 'transparent',
                border: `1px solid ${activeNode?.id === node.id ? '#14b8a6' : 'transparent'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{node.label}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main content */}
      {showPostForm ? (
        <div style={{ flex: 1, overflowY: 'auto' }} className="animate-fade">
          <PostAssessmentForm assessmentData={assessmentData} onSubmit={handlePostSubmit} />
        </div>
      ) : activePhase === 'pre' ? (
        <PreSection pillarScores={preScores} rawScores={rawScores} activeNode={activeNode} setActiveNode={setActiveNode} />
      ) : activePhase === 'intervention' ? (
        <InterventionSection pillarScores={preScores} activeNode={activeNode} setActiveNode={setActiveNode} />
      ) : (
        <PostSection preScores={preScores} postScores={postScores} rawScores={rawScores} activeNode={activeNode} setActiveNode={setActiveNode} />
      )}

      {/* Right panel */}
      <div className="panel-right" style={{ width: 260, borderLeft: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        {activePhase === 'pre' && <PreRightPanel pillarScores={preScores} />}
        {activePhase === 'intervention' && <InterventionRightPanel pillarScores={preScores} />}
        {activePhase === 'post' && !showPostForm && <PostRightPanel preScores={preScores} postScores={postScores} />}
        {showPostForm && (
          <div style={{ padding: 14, background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#2dd4bf', marginBottom: 8 }}>Instructions</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Fill in the post-intervention scores for each sub-parameter. The form pre-fills with your pre-intervention scores so you can adjust based on observed progress.</p>
          </div>
        )}
        {!showPostForm && (
          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => navigate('/app/report')}>
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
