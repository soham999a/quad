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
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
          background: isSelected ? `${node.color}20` : 'transparent',
          border: `1px solid ${isSelected ? node.color + '60' : 'transparent'}`,
          marginBottom: 4, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown size={12} color={node.color} /> : <ChevronRight size={12} color={node.color} />
        ) : (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 13, fontWeight: hasChildren ? 600 : 400, color: isSelected ? 'white' : 'var(--text-secondary)' }}>
          {node.label}
        </span>
        {NODE_DETAILS[node.id] && <Info size={11} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />}
      </div>
      {hasChildren && isExpanded && (
        <div style={{ borderLeft: `1px solid ${node.color}30`, marginLeft: 16, paddingLeft: 8 }}>
          {node.children.map(child => (
            typeof child === 'string' ? (
              <div key={child} style={{ padding: '5px 12px', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
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
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }} className="animate-fade">
      {/* Left: Tree */}
      <div style={{ width: 340, borderRight: '1px solid var(--border-light)', padding: 24, overflowY: 'auto', background: 'var(--navy-2)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Framework Architecture</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Click any node to explore details</p>

        {/* Root */}
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15))',
          border: '1px solid rgba(99,102,241,0.4)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Quadrant Intelligence Development System</div>
          <div style={{ fontSize: 11, color: '#818cf8', marginTop: 2 }}>QIDS — Holistic Development Platform</div>
        </div>

        {FRAMEWORK_TREE.branches.map(branch => (
          <TreeNode key={branch.id} node={branch} depth={0} expanded={expanded} onToggle={toggle} onSelect={select} selected={selected} />
        ))}
      </div>

      {/* Center: Visual Map */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>QIDS System Architecture</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Interactive framework map — click any branch to explore</p>

        {/* Mind map visual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FRAMEWORK_TREE.branches.map(branch => (
            <div key={branch.id} style={{
              background: 'var(--navy-4)', border: `1px solid ${branch.color}30`,
              borderLeft: `3px solid ${branch.color}`, borderRadius: 12, padding: 16,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
              onClick={() => { toggle(branch.id); select(branch); }}
              onMouseEnter={e => e.currentTarget.style.borderColor = branch.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = `${branch.color}30`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded[branch.id] ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: branch.color, boxShadow: `0 0 8px ${branch.color}` }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{branch.label}</span>
                </div>
                {expanded[branch.id] ? <ChevronDown size={14} color={branch.color} /> : <ChevronRight size={14} color={branch.color} />}
              </div>

              {expanded[branch.id] && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 20 }}>
                  {branch.children.map(child => (
                    <div key={child.id} onClick={e => { e.stopPropagation(); select(child); }} style={{
                      padding: '6px 12px', borderRadius: 8,
                      background: `${child.color}15`, border: `1px solid ${child.color}40`,
                      fontSize: 12, color: child.color, fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
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
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Grading Mechanism</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { g: 'A', label: 'Excellent', range: '90–100', color: '#10b981' },
              { g: 'B', label: 'Very Good', range: '75–89', color: '#06b6d4' },
              { g: 'C', label: 'Good', range: '60–74', color: '#f59e0b' },
              { g: 'D', label: 'Satisfactory', range: '45–59', color: '#f97316' },
              { g: 'E', label: 'Needs Improvement', range: '<45', color: '#ef4444' },
            ].map(({ g, label, range, color }) => (
              <div key={g} style={{
                flex: 1, padding: '12px 10px', borderRadius: 10, textAlign: 'center',
                background: `${color}15`, border: `1px solid ${color}40`,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Space Grotesk' }}>{g}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 2 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{range}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Standardization formula */}
        <div style={{
          marginTop: 24, padding: 20, borderRadius: 12,
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 8 }}>Standardization Algorithm</h4>
          <div style={{
            fontFamily: 'monospace', fontSize: 14, color: 'var(--text-primary)',
            background: 'rgba(0,0,0,0.3)', padding: '10px 16px', borderRadius: 8,
          }}>
            Standardized Score (%) = (Raw Score / Maximum Possible Score) × 100
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[['IQ', '×1.00', '#6366f1'], ['EQ', '×2.00', '#10b981'], ['SQ', '×2.00', '#a855f7'], ['AQ', '×1.28', '#f59e0b']].map(([k, w, c]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{k}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Detail Panel */}
      {detail && (
        <div style={{
          width: 280, borderLeft: '1px solid var(--border-light)',
          background: 'var(--navy-2)', padding: 24, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>{NODE_DETAILS[detail.id]?.title || detail.label}</h3>
            <button onClick={() => setDetail(null)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}><X size={13} /></button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {NODE_DETAILS[detail.id]?.desc || 'Select a node to view details.'}
          </p>
          {detail.children && detail.children.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Components</div>
              {detail.children.map(c => (
                <div key={typeof c === 'string' ? c : c.id} style={{
                  padding: '6px 10px', marginBottom: 4, borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)',
                  fontSize: 12, color: 'var(--text-secondary)',
                }}>
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
