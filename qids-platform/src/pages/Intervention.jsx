import React, { useState } from 'react';
import { PILLARS, INTERVENTION_NODES, INTERVENTION_MODULES, computePillarScore, isCritical } from '../data/qidsData';
import { useApp } from '../App';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import { Calendar, Clock, Users, Package, Plus, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const MONTHS = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'];

function ModuleCard({ module, pillar, onToggle, expanded }) {
  const priorityColor = module.priority === 'high' ? '#ef4444' : '#f59e0b';
  return (
    <div className="bg-surface-container-low rounded-lg overflow-hidden mb-2" style={{ border: `1px solid ${pillar.color}25` }}>
      <div onClick={onToggle} className="px-3.5 py-3 cursor-pointer flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: pillar.color, flexShrink: 0 }} />
          <span className="text-technical-sm font-semibold">{module.label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${priorityColor}15`, color: priorityColor, border: `1px solid ${priorityColor}30` }}>
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
          <button className="mt-2.5 px-3 py-1.5 rounded-md text-[11px] font-medium cursor-pointer" style={{ background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, color: pillar.color }} onClick={() => alert(`Module "${module.label}" marked for assignment. Track progress in Session Tracking.`)}>
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
      <h4 className="text-technical-sm font-semibold mb-3">6-Month Development Roadmap</h4>
      <div className="roadmap-grid grid grid-cols-3 gap-2.5">
        {MONTHS.map((month, i) => (
          <div key={month} className="bg-surface-container-low border border-outline-variant rounded-lg p-3">
            <div className="text-[11px] font-bold text-indigo-400 mb-2">{month}</div>
            {(modulesByMonth[month] || []).map(m => (
              <div key={m} className="px-2 py-1 mb-1 rounded-md text-[11px] text-on-surface-variant bg-indigo-500/10 border border-indigo-500/20">
                {m}
              </div>
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
    <div className="three-panel animate-fade flex h-[calc(100vh-52px)]">
      {/* Mobile summary strip */}
      <div className="mobile-panel-summary hidden">
        {Object.entries(pillarScores).map(([id, score]) => (
          <div key={id} className="shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: `${PILLARS[id].color}15`, border: `1px solid ${PILLARS[id].color}30` }}>
            <span className="text-[11px] font-bold" style={{ color: PILLARS[id].color }}>{id}</span>
            <span className="text-[13px] font-extrabold" style={{ color: isCritical(score) ? '#ef4444' : '#10b981' }}>{score}</span>
          </div>
        ))}
      </div>
      {/* Left sidebar */}
      <div className="panel-left w-60 border-r border-outline-variant bg-background p-5 overflow-y-auto shrink-0">
        <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-purple-400 inline-block mb-3 bg-purple-500/15 border border-purple-500/30">Phase 2</div>
        <h3 className="text-[15px] font-bold mb-2">Strategic Intervention</h3>
        <p className="text-technical-sm text-surface-variant leading-relaxed mb-4">Targeted development programs based on gap analysis and priority flags.</p>

        <div className="divider" />

        <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">Gap Analysis</div>
        {Object.entries(pillarScores).map(([id, score]) => (
          <div key={id} className="mb-2">
            <div className="flex justify-between mb-0.5">
              <span className="text-technical-sm" style={{ color: PILLARS[id].color }}>{id}</span>
              <span className="text-technical-sm font-semibold" style={{ color: isCritical(score) ? '#ef4444' : '#10b981' }}>{score}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${score}%`, background: isCritical(score) ? '#ef4444' : PILLARS[id].color }} />
            </div>
          </div>
        ))}

        <div className="divider" />

        <div className="text-[11px] text-surface-variant uppercase tracking-wide mb-2.5">Process Nodes</div>
        {INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1" style={{ background: activeNode?.id === node.id ? 'rgba(139,92,246,0.15)' : 'transparent', border: `1px solid ${activeNode?.id === node.id ? '#a855f7' : 'transparent'}` }}>
            <div className="text-technical-sm font-medium">{node.label}</div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="panel-main flex-1 overflow-y-auto p-6">
        {/* Phase swimlane */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-purple-400 bg-purple-500/15 border border-purple-500/30">Phase 2</div>
            <span className="text-[14px] font-bold">Strategic Intervention</span>
          </div>
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 overflow-x-auto">
            <div className="flex items-center gap-0 min-w-max">
              {INTERVENTION_NODES.map((node, i) => (
                <ProcessNode key={node.id} node={node} color="#a855f7" index={i} isLast={i === INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-lg w-fit">
          {['modules', 'roadmap', 'eq-practice'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className="px-4 py-1.5 rounded-lg cursor-pointer border-none text-[13px] font-medium capitalize" style={{ background: activeTab === t ? '#a855f7' : 'transparent', color: activeTab === t ? 'white' : 'var(--text-secondary)' }}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>

        {activeTab === 'modules' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-bold">Recommended Intervention Modules</h3>
              <button className="btn btn-secondary btn-sm"><Plus size={12} /> Add Custom Module</button>
            </div>
            <div className="modules-grid grid grid-cols-2 gap-4">
              {priorityPillars.map(pid => (
                <div key={pid}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PILLARS[pid].color }} />
                    <span className="text-[13px] font-bold" style={{ color: PILLARS[pid].color }}>{PILLARS[pid].label}</span>
                    {isCritical(pillarScores[pid]) && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-red-500 bg-red-500/15 border border-red-500/30">CRITICAL</span>
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
            <h3 className="text-[15px] font-bold mb-4">Dynamic EQ Integration — The Pause Button</h3>
            <div className="eq-practice-grid grid grid-cols-3 gap-3">
              {[
                { step: 'STOP',  desc: 'Pause the automatic emotional reaction. Create space between stimulus and response.', color: '#ef4444' },
                { step: 'THINK', desc: 'Identify the emotion. Assess the situation objectively. Consider consequences.',        color: '#f59e0b' },
                { step: 'ACT',   desc: 'Choose a deliberate, constructive response aligned with values and goals.',             color: '#10b981' },
              ].map(({ step, desc, color }) => (
                <div key={step} className="p-5 rounded-xl text-center" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                  <div className="text-lg font-extrabold mb-2" style={{ color }}>{step}</div>
                  <p className="text-technical-sm text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-[13px] font-semibold text-emerald-500 mb-1.5">Integration Across All Sessions</div>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">The Stop-Think-Act framework is embedded as a meta-skill across all intervention modules — not just EQ sessions. Every facilitator is trained to prompt this practice during moments of challenge, conflict, or decision-making.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="panel-right w-[260px] border-l border-outline-variant bg-background p-5 overflow-y-auto shrink-0">
        <div className="text-technical-sm font-semibold text-purple-400 mb-3">Module Categories</div>
        {Object.entries(INTERVENTION_MODULES).map(([pid, mods]) => (
          <div key={pid} className="mb-3">
            <div className="text-[11px] font-semibold mb-1.5" style={{ color: PILLARS[pid].color }}>{pid}</div>
            {mods.map(m => (
              <div key={m.id} className="px-2 py-1.5 mb-0.5 rounded-md text-[11px] text-on-surface-variant bg-white/5 border border-outline-variant">
                {m.label}
              </div>
            ))}
          </div>
        ))}

        <div className="divider" />

        <div className="text-technical-sm font-semibold mb-2">Session Tracking</div>
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

        <div className="divider" />

        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="text-[11px] font-semibold text-purple-400 mb-1.5">Content Library</div>
          <p className="text-[11px] text-surface-variant leading-relaxed">Upload questionnaires, rubrics, and module content via Admin / Config to populate this library.</p>
          <button className="btn btn-secondary btn-sm mt-2 w-full justify-center">
            <Package size={11} /> Open Library
          </button>
        </div>
      </div>

      {activeNode && <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color="#a855f7" />}
    </div>
  );
}
