import React, { useState } from 'react';
import { PILLARS, INTERVENTION_NODES, INTERVENTION_MODULES, computePillarScore, isCritical } from '../data/qidsData';
import { useApp } from '../App';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import { Calendar, Clock, Users, Package, Plus, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const MONTHS = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];

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
          <button style={{
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

function RoadmapCalendar({ gapPillars }) {
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {MONTHS.map((month, i) => (
          <div key={month} style={{
            background: 'var(--navy-4)', border: '1px solid var(--border-light)',
            borderRadius: 10, padding: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>{month}</div>
            {(modulesByMonth[month] || []).map(m => (
              <div key={m} style={{
                padding: '4px 8px', marginBottom: 4, borderRadius: 6,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                fontSize: 11, color: 'var(--text-secondary)',
              }}>{m}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Intervention() {
  const { assessmentData, demoMode } = useApp();
  const [activeNode, setActiveNode] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');

  const rawScores = assessmentData?.rawScores || {};
  const pillarScores = {};
  Object.keys(PILLARS).forEach(id => { pillarScores[id] = computePillarScore(id, rawScores[id] || {}); });
  const gapPillars = Object.entries(pillarScores).filter(([, s]) => isCritical(s)).map(([id]) => id);
  const priorityPillars = Object.entries(pillarScores).sort(([, a], [, b]) => a - b).map(([id]) => id);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }} className="animate-fade">
      {/* Left sidebar */}
      <div style={{ width: 240, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '4px 10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, fontSize: 11, color: '#a78bfa', fontWeight: 600, display: 'inline-block', marginBottom: 12 }}>Phase 2</div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Strategic Intervention</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>Targeted development programs based on gap analysis and priority flags.</p>

        <div className="divider" />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Gap Analysis</div>
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

        <div className="divider" />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Process Nodes</div>
        {INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            background: activeNode?.id === node.id ? 'rgba(139,92,246,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#a855f7' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{node.label}</div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Phase swimlane */}
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

        {/* Tabs */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {priorityPillars.map(pid => (
                <div key={pid}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PILLARS[pid].color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: PILLARS[pid].color }}>{PILLARS[pid].label}</span>
                    {isCritical(pillarScores[pid]) && (
                      <span style={{ padding: '2px 6px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, fontSize: 10, color: '#ef4444', fontWeight: 600 }}>CRITICAL</span>
                    )}
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

        {activeTab === 'roadmap' && <RoadmapCalendar gapPillars={gapPillars} />}

        {activeTab === 'eq-practice' && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Dynamic EQ Integration — The Pause Button</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { step: 'STOP', desc: 'Pause the automatic emotional reaction. Create space between stimulus and response.', color: '#ef4444', icon: '⏸' },
                { step: 'THINK', desc: 'Identify the emotion. Assess the situation objectively. Consider consequences.', color: '#f59e0b', icon: '🧠' },
                { step: 'ACT', desc: 'Choose a deliberate, constructive response aligned with values and goals.', color: '#10b981', icon: '✅' },
              ].map(({ step, desc, color, icon }) => (
                <div key={step} style={{
                  padding: 20, background: `${color}10`, border: `1px solid ${color}30`,
                  borderRadius: 14, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
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

      {/* Right panel */}
      <div style={{ width: 260, borderLeft: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
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

        <div style={{ padding: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>Content Library</div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>Upload questionnaires, rubrics, and module content via Admin / Config to populate this library.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
            <Package size={11} /> Open Library
          </button>
        </div>
      </div>

      {activeNode && <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color="#a855f7" />}
    </div>
  );
}
