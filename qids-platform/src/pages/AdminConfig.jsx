import React, { useState } from 'react';
import { Settings, Upload, FileText, Package, BookOpen, BarChart2, Plus, Trash2, Edit2, Save } from 'lucide-react';

const CONFIG_SECTIONS = [
  { id: 'questionnaires', label: 'Questionnaires', icon: FileText, desc: 'Upload and manage assessment questionnaires for each pillar and context.' },
  { id: 'modules', label: 'Intervention Modules', icon: Package, desc: 'Add, edit, or upload intervention module content and rubrics.' },
  { id: 'rubrics', label: 'Scoring Rubrics', icon: BarChart2, desc: 'Configure observation and scoring rubrics for evaluators.' },
  { id: 'templates', label: 'Report Templates', icon: BookOpen, desc: 'Manage report templates and roadmap templates.' },
  { id: 'contexts', label: 'Context Configuration', icon: Settings, desc: 'Configure context-specific content, weights, and recommendations.' },
];

const PLACEHOLDER_ITEMS = {
  questionnaires: [
    { id: 'q1', name: 'IQ Psychometric Battery v1', status: 'placeholder', context: 'All', pillar: 'IQ' },
    { id: 'q2', name: 'EQ DEC Framework Questionnaire', status: 'placeholder', context: 'All', pillar: 'EQ' },
    { id: 'q3', name: 'SQ Assessment Center Tasks', status: 'placeholder', context: 'Corporate', pillar: 'SQ' },
    { id: 'q4', name: 'AQ Resilience Dynamics Survey', status: 'placeholder', context: 'All', pillar: 'AQ' },
  ],
  modules: [
    { id: 'm1', name: 'The Pause Button — EQ Module', status: 'placeholder', pillar: 'EQ', duration: '6 weeks' },
    { id: 'm2', name: 'Resilience Foundations — AQ Module', status: 'placeholder', pillar: 'AQ', duration: '6 weeks' },
    { id: 'm3', name: 'Cognitive Strengthening — IQ Module', status: 'placeholder', pillar: 'IQ', duration: '4 weeks' },
    { id: 'm4', name: 'Collaboration Dynamics — SQ Module', status: 'placeholder', pillar: 'SQ', duration: '4 weeks' },
  ],
  rubrics: [
    { id: 'r1', name: 'Observation Rubric — School Context', status: 'placeholder', context: 'School' },
    { id: 'r2', name: 'Evaluator Scoring Guide v1', status: 'placeholder', context: 'All' },
  ],
  templates: [
    { id: 't1', name: 'Individual Quotient Profile Template', status: 'placeholder' },
    { id: 't2', name: '6-Month Roadmap Template', status: 'placeholder' },
    { id: 't3', name: 'Progress Summary Template', status: 'placeholder' },
  ],
  contexts: [
    { id: 'c1', name: 'School Configuration', status: 'active', context: 'School' },
    { id: 'c2', name: 'Corporate Configuration', status: 'active', context: 'Corporate' },
    { id: 'c3', name: 'Individual Configuration', status: 'active', context: 'Individual' },
  ],
};

function ContentItem({ item, onEdit, onDelete }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)',
      borderRadius: 10, marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
          background: item.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color: item.status === 'active' ? '#10b981' : '#f59e0b',
          border: `1px solid ${item.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
        }}>
          {item.status === 'active' ? 'ACTIVE' : 'PLACEHOLDER'}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {[item.context, item.pillar, item.duration].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onEdit(item)} style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer' }}>
          <Edit2 size={12} />
        </button>
        <button onClick={() => onDelete(item.id)} style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function AdminConfig() {
  const [activeSection, setActiveSection] = useState('questionnaires');
  const [items, setItems] = useState(PLACEHOLDER_ITEMS);
  const [weights, setWeights] = useState({ IQ: 1.00, EQ: 2.00, SQ: 2.00, AQ: 1.28 });
  const [saved, setSaved] = useState(false);

  const handleDelete = (sectionId, itemId) => {
    setItems(prev => ({ ...prev, [sectionId]: prev[sectionId].filter(i => i.id !== itemId) }));
  };

  const handleSaveWeights = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const currentItems = items[activeSection] || [];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }} className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Admin / Configuration</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Manage content library, scoring configuration, and platform settings</p>
        </div>
        <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12, color: '#f59e0b' }}>
          CMS-Ready — Placeholder Mode
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        {/* Sidebar */}
        <div>
          <div className="card" style={{ padding: 8 }}>
            {CONFIG_SECTIONS.map(({ id, label, icon: Icon, desc }) => (
              <button key={id} onClick={() => setActiveSection(id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                background: activeSection === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: `1px solid ${activeSection === id ? 'var(--indigo)' : 'transparent'}`,
                color: activeSection === id ? 'white' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'all 0.15s',
              }}>
                <Icon size={14} style={{ flexShrink: 0 }} />
                {label}
              </button>
            ))}
          </div>

          {/* Dynamic Weights config */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Dynamic Weights</h4>
            {Object.entries(weights).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{k}</span>
                  <span style={{ color: '#818cf8' }}>×{v.toFixed(2)}</span>
                </label>
                <input
                  type="range" min={0.5} max={3} step={0.01} value={v}
                  onChange={e => setWeights(prev => ({ ...prev, [k]: parseFloat(e.target.value) }))}
                  style={{ width: '100%', height: 4, border: 'none', padding: 0, cursor: 'pointer', appearance: 'none', background: `linear-gradient(90deg, #6366f1 ${((v - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((v - 0.5) / 2.5) * 100}%)`, borderRadius: 2 }}
                />
              </div>
            ))}
            <button onClick={handleSaveWeights} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {saved ? <><span>✓</span> Saved</> : <><Save size={12} /> Save Weights</>}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{CONFIG_SECTIONS.find(s => s.id === activeSection)?.label}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{CONFIG_SECTIONS.find(s => s.id === activeSection)?.desc}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm"><Upload size={12} /> Upload File</button>
              <button className="btn btn-primary btn-sm"><Plus size={12} /> Add New</button>
            </div>
          </div>

          {/* Upload zone */}
          <div style={{
            border: '2px dashed rgba(99,102,241,0.3)', borderRadius: 12, padding: 24,
            textAlign: 'center', marginBottom: 16, cursor: 'pointer', transition: 'all 0.2s',
            background: 'rgba(99,102,241,0.03)',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
          >
            <Upload size={24} color="#6366f1" style={{ marginBottom: 8, opacity: 0.6 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Drop files here or click to upload</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports PDF, DOCX, XLSX, JSON</div>
          </div>

          {/* Items list */}
          {currentItems.length > 0 ? (
            currentItems.map(item => (
              <ContentItem
                key={item.id} item={item}
                onEdit={() => {}}
                onDelete={(id) => handleDelete(activeSection, id)}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Package size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>No items yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Upload content or add placeholders to get started</div>
            </div>
          )}

          {/* Info box */}
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 6 }}>Content Library Architecture</div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              This platform is built with a modular content architecture. All questionnaires, intervention modules, rubrics, and templates are stored as configurable objects — ready for database or CMS integration. Placeholder items indicate content slots awaiting real content from your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
