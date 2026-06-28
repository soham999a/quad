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
  const isActive = item.status === 'active';
  return (
    <div className="flex items-center justify-between px-3.5 py-3 bg-surface-container-low border border-outline-variant rounded-lg mb-1.5">
      <div className="flex items-center gap-2.5">
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border`} style={{
          background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color: isActive ? '#10b981' : '#f59e0b',
          borderColor: isActive ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
        }}>
          {isActive ? 'ACTIVE' : 'PLACEHOLDER'}
        </div>
        <div>
          <div className="text-sm font-medium">{item.name}</div>
          <div className="text-xs text-surface-variant">
            {[item.context, item.pillar, item.duration].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => onEdit(item)} className="px-2 py-1.5 rounded-md cursor-pointer" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
          <Edit2 size={12} />
        </button>
        <button onClick={() => onDelete(item.id)} className="px-2 py-1.5 rounded-md cursor-pointer" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
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
    <div className="p-8 max-w-[1100px] mx-auto animate-fade">
      <div className="flex justify-between items-start mb-7">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Admin / Configuration</h1>
          <p className="text-sm text-surface-variant">Manage content library, scoring configuration, and platform settings</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
          CMS-Ready — Placeholder Mode
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '240px 1fr' }}>
        {/* Sidebar */}
        <div>
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-2">
            {CONFIG_SECTIONS.map(({ id, label, icon: Icon, desc }) => (
              <button key={id} onClick={() => setActiveSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 text-sm font-medium text-left transition-all ${activeSection === id ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]' : 'bg-transparent text-on-surface-variant border border-transparent'}`}>
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Dynamic Weights config */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">Dynamic Weights</h4>
            {Object.entries(weights).map(([k, v]) => (
              <div key={k} className="mb-2.5">
                <label className="flex justify-between">
                  <span>{k}</span>
                  <span style={{ color: '#818cf8' }}>×{v.toFixed(2)}</span>
                </label>
                <input
                  type="range" min={0.5} max={3} step={0.01} value={v}
                  onChange={e => setWeights(prev => ({ ...prev, [k]: parseFloat(e.target.value) }))}
                  className="w-full h-1 border-none p-0 cursor-pointer appearance-none rounded-sm"
                  style={{
                    background: `linear-gradient(90deg, #6366f1 ${((v - 0.5) / 2.5) * 100}%, rgba(255,255,255,0.1) ${((v - 0.5) / 2.5) * 100}%)`,
                  }}
                />
              </div>
            ))}
            <button onClick={handleSaveWeights} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#6366f1] text-white font-medium hover:opacity-90 cursor-pointer transition-all mt-1">
              {saved ? <><span>✓</span> Saved</> : <><Save size={12} /> Save Weights</>}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold">{CONFIG_SECTIONS.find(s => s.id === activeSection)?.label}</h3>
              <p className="text-xs text-surface-variant mt-0.5">{CONFIG_SECTIONS.find(s => s.id === activeSection)?.desc}</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface cursor-pointer transition-all"><Upload size={12} /> Upload File</button>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#6366f1] text-white font-medium hover:opacity-90 cursor-pointer transition-all"><Plus size={12} /> Add New</button>
            </div>
          </div>

          {/* Upload zone */}
          <label htmlFor="file-upload" className="block p-6 text-center mb-4 cursor-pointer transition-all rounded-xl border-2 border-dashed" style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.03)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(99,102,241,0.8)'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.03)'; }}
            onDrop={e => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
              e.currentTarget.style.background = 'rgba(99,102,241,0.03)';
              const file = e.dataTransfer.files[0];
              if (file) alert(`File "${file.name}" received. Backend integration required to process uploads.`);
            }}
          >
            <input id="file-upload" type="file" accept=".pdf,.docx,.xlsx,.json" className="hidden"
              onChange={e => { const f = e.target.files[0]; if (f) alert(`File "${f.name}" received. Backend integration required to process uploads.`); }} />
            <Upload size={24} color="#6366f1" className="mb-2 opacity-60" />
            <div className="text-sm text-on-surface-variant mb-1">Drop files here or click to upload</div>
            <div className="text-xs text-surface-variant">Supports PDF, DOCX, XLSX, JSON</div>
          </label>

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
            <div className="text-center p-10 text-surface-variant">
              <Package size={32} className="mb-2 opacity-30 mx-auto" />
              <div className="text-sm">No items yet</div>
              <div className="text-xs mt-1">Upload content or add placeholders to get started</div>
            </div>
          )}

          {/* Info box */}
          <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div className="text-xs font-semibold mb-1.5" style={{ color: '#818cf8' }}>Content Library Architecture</div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This platform is built with a modular content architecture. All questionnaires, intervention modules, rubrics, and templates are stored as configurable objects — ready for database or CMS integration. Placeholder items indicate content slots awaiting real content from your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
