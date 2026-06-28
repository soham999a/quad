import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Info, X } from 'lucide-react';

const FRAMEWORK_TREE = {
  root: { label: 'Quadrant Intelligence Development System (QIDS)', color: '#6366f1' },
  branches: [
    {
      id: 'pillars', label: 'The Four Pillars', color: '#6366f1',
      children: [
        { id: 'iq', label: 'Intelligence Quotient (IQ)', color: '#6366f1', children: ['Verbal Intelligence', 'Quantitative Intelligence', 'Psychometric Abilities', 'Performance Intelligence'] },
        { id: 'eq', label: 'Emotional Quotient (EQ)', color: '#10b981', children: ['Self-Awareness', 'Self-Management', 'Social Awareness', 'Relationship Management', 'Emotional Resilience'] },
        { id: 'sq', label: 'Social Quotient (SQ)', color: '#a855f7', children: ['Assessment Center Exercises', 'Cognitive Social Intelligence', 'Performance-Based Activities'] },
        { id: 'aq', label: 'Adversity Quotient (AQ)', color: '#f59e0b', children: ['Situational Agility', 'Proactive Momentum', 'Adversity Response', 'Growth Integration', 'Resilience Sustainability'] },
      ],
    },
    {
      id: 'assessment', label: 'Assessment Architecture', color: '#06b6d4',
      children: [
        { id: 'phase1', label: 'Phase 1: Pre-Intervention', color: '#6366f1', children: ['Baseline Measurement', 'Banding (Red/Yellow/Green)'] },
        { id: 'phase2', label: 'Phase 2: Strategic Intervention', color: '#a855f7', children: ['Targeted Training Modules', 'Counselling & Meetings'] },
        { id: 'phase3', label: 'Phase 3: Post-Intervention', color: '#14b8a6', children: ['Progress Evaluation', 'Future Planning'] },
      ],
    },
    {
      id: 'methodologies', label: 'Methodologies & Tools', color: '#a855f7',
      children: [
        { id: 'dec', label: 'Dynamic Emotional Competency (DEC)', color: '#10b981', children: [] },
        { id: 'rdf', label: 'Resilience Dynamics Framework', color: '#f59e0b', children: [] },
        { id: 'dwa', label: 'Dynamic Weightage Algorithm', color: '#6366f1', children: [] },
        { id: 'sim', label: 'Simulations & Role-play', color: '#a855f7', children: [] },
      ],
    },
    {
      id: 'goals', label: 'Strategic Goals', color: '#14b8a6',
      children: [
        { id: 'g1', label: 'Holistic Personality Development', color: '#14b8a6', children: [] },
        { id: 'g2', label: 'Career Guidance Alignment', color: '#06b6d4', children: [] },
        { id: 'g3', label: 'Educational System Reform', color: '#6366f1', children: [] },
        { id: 'g4', label: 'Man-making Education', color: '#a855f7', children: [] },
      ],
    },
    {
      id: 'grading', label: 'Grading Mechanism', color: '#f59e0b',
      children: [
        { id: 'ga', label: 'A: Excellent (90–100%)', color: '#10b981', children: [] },
        { id: 'gb', label: 'B: Very Good (75–89%)', color: '#06b6d4', children: [] },
        { id: 'gc', label: 'C: Good (60–74%)', color: '#f59e0b', children: [] },
        { id: 'gd', label: 'D: Satisfactory (45–59%)', color: '#f97316', children: [] },
        { id: 'ge', label: 'E: Needs Improvement (<45%)', color: '#ef4444', children: [] },
      ],
    },
  ],
};

const NODE_DETAILS = {
  pillars: { title: 'The Four Pillars', desc: 'QIDS measures four core dimensions of human intelligence and capability: IQ, EQ, SQ, and AQ. Each pillar is assessed through specialized frameworks and contributes to the unified holistic profile.' },
  assessment: { title: 'Assessment Architecture', desc: 'A three-phase evaluation process: Pre-Intervention baseline, Strategic Intervention, and Post-Intervention progress evaluation. Each phase uses standardized instruments and scoring algorithms.' },
  methodologies: { title: 'Methodologies & Tools', desc: 'QIDS employs proprietary frameworks including the Dynamic Emotional Competency (DEC) model, Resilience Dynamics Framework (RDF), and Dynamic Weightage Algorithm (DWA) for context-sensitive scoring.' },
  goals: { title: 'Strategic Goals', desc: 'QIDS aims to transform personality development through holistic assessment, career alignment, educational reform, and man-making education — building complete human beings, not just skilled workers.' },
  grading: { title: 'Grading Mechanism', desc: 'Standardized Score = (Raw Score / Max Possible Score) × 100. Scores are banded into five grades (A–E). Any parameter below 60% is automatically flagged as Critical Priority for intervention.' },
  dec: { title: 'Dynamic Emotional Competency (DEC)', desc: 'Unlike static EQ models, DEC measures real-time emotional adaptability. It uses hybrid digital-physical simulations to assess emotional responses in context, not just self-reported traits.' },
  rdf: { title: 'Resilience Dynamics Framework', desc: 'RDF treats adversity quotient as a dynamic, developable system of interconnected capabilities — not a fixed trait. It maps resilience across five dimensions with targeted development pathways.' },
  dwa: { title: 'Dynamic Weightage Algorithm (DWA)', desc: 'Context-sensitive weight computation: IQ×1.0, EQ×2.0, SQ×2.0, AQ×1.28. Weights reflect the relative importance of each quotient in holistic development and career readiness.' },
};

function TreeNode({ node, depth = 0, expanded, onToggle, onSelect, selected }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded[node.id];
  const isSelected = selected === node.id;

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div
        onClick={() => { if (hasChildren) onToggle(node.id); onSelect(node); }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 transition-all"
        style={{
          background: isSelected ? `${node.color}20` : 'transparent',
          border: `1px solid ${isSelected ? node.color + '60' : 'transparent'}`,
        }}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown size={12} color={node.color} /> : <ChevronRight size={12} color={node.color} />
        ) : (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
        )}
        <span className={`text-sm ${hasChildren ? 'font-semibold' : 'font-normal'} ${isSelected ? 'text-white' : 'text-on-surface-variant'}`}>
          {node.label}
        </span>
        {NODE_DETAILS[node.id] && <Info size={11} className="text-surface-variant ml-auto" />}
      </div>
      {hasChildren && isExpanded && (
        <div style={{ borderLeft: `1px solid ${node.color}30`, marginLeft: 16, paddingLeft: 8 }}>
          {node.children.map(child => (
            typeof child === 'string' ? (
              <div key={child} className="px-3 py-1.5 text-xs text-surface-variant flex items-center gap-1.5">
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: node.color, opacity: 0.5 }} />
                {child}
              </div>
            ) : (
              <TreeNode key={child.id} node={child} depth={0} expanded={expanded} onToggle={onToggle} onSelect={onSelect} selected={selected} />
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default function FrameworkMap() {
  const [expanded, setExpanded] = useState({ pillars: true, grading: true });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const select = (node) => {
    setSelected(node.id);
    if (NODE_DETAILS[node.id]) setDetail(node);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] animate-fade">
      {/* Left: Tree */}
      <div className="w-[340px] border-r border-outline-variant p-6 overflow-y-auto bg-surface-container-low">
        <h2 className="text-base font-bold mb-1">Framework Architecture</h2>
        <p className="text-xs text-surface-variant mb-5">Click any node to explore details</p>

        {/* Root */}
        <div className="px-4 py-3 rounded-lg mb-4 border" style={{ background: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)' }}>
          <div className="text-sm font-bold text-white">Quadrant Intelligence Development System</div>
          <div className="text-xs mt-0.5" style={{ color: '#818cf8' }}>QIDS — Holistic Development Platform</div>
        </div>

        {FRAMEWORK_TREE.branches.map(branch => (
          <TreeNode key={branch.id} node={branch} depth={0} expanded={expanded} onToggle={toggle} onSelect={select} selected={selected} />
        ))}
      </div>

      {/* Center: Visual Map */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">QIDS System Architecture</h2>
        <p className="text-sm text-surface-variant mb-7">Interactive framework map — click any branch to explore</p>

        {/* Mind map visual */}
        <div className="flex flex-col gap-3">
          {FRAMEWORK_TREE.branches.map(branch => (
            <div key={branch.id}
              className="rounded-xl p-4 cursor-pointer transition-all border-l-[3px]"
              style={{ background: 'var(--navy-4)', borderColor: `${branch.color}30`, borderLeftColor: branch.color }}
              onClick={() => { toggle(branch.id); select(branch); }}
              onMouseEnter={e => e.currentTarget.style.borderColor = branch.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = `${branch.color}30`}
            >
              <div className={`flex items-center justify-between ${expanded[branch.id] ? 'mb-3' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: branch.color }} />
                  <span className="text-sm font-bold text-white">{branch.label}</span>
                </div>
                {expanded[branch.id] ? <ChevronDown size={14} color={branch.color} /> : <ChevronRight size={14} color={branch.color} />}
              </div>

              {expanded[branch.id] && (
                <div className="flex flex-wrap gap-2 pl-5">
                  {branch.children.map(child => (
                    <div key={child.id} onClick={e => { e.stopPropagation(); select(child); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                      style={{ background: `${child.color}15`, border: `1px solid ${child.color}40`, color: child.color }}
                      onMouseEnter={e => e.currentTarget.style.background = `${child.color}25`}
                      onMouseLeave={e => e.currentTarget.style.background = `${child.color}15`}
                    >
                      {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grading visual */}
        <div className="mt-7">
          <h3 className="text-base font-bold mb-4">Grading Mechanism</h3>
          <div className="flex gap-2">
            {[
              { g: 'A', label: 'Excellent', range: '90–100', color: '#10b981' },
              { g: 'B', label: 'Very Good', range: '75–89', color: '#06b6d4' },
              { g: 'C', label: 'Good', range: '60–74', color: '#f59e0b' },
              { g: 'D', label: 'Satisfactory', range: '45–59', color: '#f97316' },
              { g: 'E', label: 'Needs Improvement', range: '<45', color: '#ef4444' },
            ].map(({ g, label, range, color }) => (
              <div key={g} className="flex-1 px-2.5 py-3 rounded-lg text-center" style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                <div className="text-2xl font-extrabold" style={{ color }}>{g}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</div>
                <div className="text-[10px] text-surface-variant mt-0.5">{range}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Standardization formula */}
        <div className="mt-6 p-5 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: '#818cf8' }}>Standardization Algorithm</h4>
          <div className="font-mono text-sm text-on-surface bg-black/30 px-4 py-2.5 rounded-lg">
            Standardized Score (%) = (Raw Score / Maximum Possible Score) × 100
          </div>
          <div className="mt-3 flex gap-4 flex-wrap">
            {[['IQ', '×1.00', '#6366f1'], ['EQ', '×2.00', '#10b981'], ['SQ', '×2.00', '#a855f7'], ['AQ', '×1.28', '#f59e0b']].map(([k, w, c]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: c }}>{k}</span>
                <span className="text-xs text-surface-variant">{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Detail Panel */}
      {detail && (
        <div className="w-[280px] border-l border-outline-variant bg-surface-container-low p-6 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold">{NODE_DETAILS[detail.id]?.title || detail.label}</h3>
            <button onClick={() => setDetail(null)} className="p-1 bg-transparent text-on-surface-variant hover:bg-surface-container-low cursor-pointer transition-all rounded"><X size={13} /></button>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {NODE_DETAILS[detail.id]?.desc || 'Select a node to view details.'}
          </p>
          {detail.children && detail.children.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-surface-variant uppercase tracking-widest mb-2">Components</div>
              {detail.children.map(c => (
                <div key={typeof c === 'string' ? c : c.id} className="px-2.5 py-1.5 mb-1 rounded-md text-xs text-on-surface-variant" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)' }}>
                  {typeof c === 'string' ? c : c.label}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
