import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, TrendingUp, ClipboardList, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { useApp } from '../App';
import { CONTEXTS, PILLARS } from '../data/qidsData';

const PHASE_CARDS = [
  { num: 1, label: 'Pre-Intervention Assessment', desc: 'Initial comprehensive assessment to establish baseline measurements across all four quotient dimensions.', color: '#6366f1', path: '/pre-intervention', icon: ClipboardList },
  { num: 2, label: 'Strategic Intervention', desc: 'Targeted development programs designed based on assessment results and gap analysis.', color: '#a855f7', path: '/intervention', icon: Zap },
  { num: 3, label: 'Post-Intervention Evaluation', desc: 'Follow-up assessment to measure progress, effectiveness, and generate final development roadmap.', color: '#14b8a6', path: '/post-intervention', icon: TrendingUp },
];

const FEATURES = [
  { label: 'Dynamic Emotional Integration', desc: 'Real-time emotional adaptability using hybrid digital-physical simulations and dynamic weightage algorithms.', color: '#10b981' },
  { label: 'Resilience Dynamics Framework', desc: 'A revolutionary approach to understanding and developing adversity quotient as a dynamic, interconnected system.', color: '#f59e0b' },
  { label: 'Integrated Assessment', desc: 'Multi-method assessment capturing interactions between domains for a holistic view of individual capabilities.', color: '#6366f1' },
];

export default function Overview() {
  const navigate = useNavigate();
  const { context, setContext } = useApp();
  const ctx = CONTEXTS.find(c => c.id === context) || CONTEXTS[0];

  return (
    <div className="px-6 py-6 animate-fade max-w-[1200px] mx-auto">
      {/* Hero */}
      <div className="rounded-[20px] px-10 py-12 mb-8 relative overflow-hidden border border-outline-variant" style={{ background: 'rgba(99,102,241,0.12)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border" style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}>Patented Framework</div>
            <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}>Enterprise Grade</div>
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.15] mb-4">
            <span className="gradient-text">Quadrant Intelligence</span><br />
            Development System
          </h1>
          <p className="text-base text-on-surface-variant max-w-[560px] leading-relaxed mb-7">
            A paradigm shift in personality development and assessment — moving beyond traditional academic metrics to embrace a holistic approach encompassing intellectual, emotional, social, and adversity-handling capabilities.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button className="inline-flex items-center gap-2 px-6 py-3 text-base rounded-lg bg-[#6366f1] text-white font-medium hover:opacity-90 cursor-pointer transition-all" onClick={() => navigate('/app/assessment')}>
              <ClipboardList size={16} /> Start Assessment
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 text-base rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface cursor-pointer transition-all" onClick={() => navigate('/app/framework')}>
              <Brain size={16} /> View Framework
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 text-base rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface cursor-pointer transition-all" onClick={() => navigate('/app/report')}>
              Generate Report <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Vision */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 border-l-[3px] border-l-[#6366f1]">
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#818cf8' }}>Vision</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            To create a comprehensive framework that identifies and nurtures multiple dimensions of human capability, provides personalized development pathways, and establishes a foundation for lifelong learning and growth.
          </p>
        </div>

        {/* Context Selector */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Application Context</h3>
          <div className="grid grid-cols-2 gap-2">
            {CONTEXTS.map(c => (
              <button key={c.id} onClick={() => setContext(c.id)} className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium text-left flex items-center gap-2 transition-all ${context === c.id ? 'bg-[#6366f1]/20 text-white border border-[#6366f1]' : 'bg-white/5 text-on-surface-variant border border-outline-variant'}`}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-surface-variant mt-2.5">{ctx.desc}</p>
        </div>
      </div>

      {/* Three Phase Process */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-5">Three-Phase Evaluation Process</h2>
        <div className="grid grid-cols-3 gap-4">
          {PHASE_CARDS.map(({ num, label, desc, color, path, icon: Icon }) => (
            <div key={num} onClick={() => navigate(path)} className="bg-surface-container-low rounded-2xl p-6 cursor-pointer transition-all relative overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
              <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                <span className="text-lg font-extrabold" style={{ color }}>{num}</span>
              </div>
              <h3 className="text-base font-bold mb-2">{label}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color }}>
                Explore <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Four Pillars Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-5">The Four Pillars of Holistic Development</h2>
        <div className="grid grid-cols-4 gap-4">
          {Object.values(PILLARS).map(p => (
            <div key={p.id} onClick={() => navigate(`/app/pillars/${p.id}`)} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 cursor-pointer transition-all"
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
            >
              <div className="inline-flex px-2.5 py-1 rounded-full text-sm font-bold mb-3" style={{ background: `${p.color}20`, border: `1px solid ${p.color}40`, color: p.color }}>{p.short}</div>
              <h4 className="text-sm font-semibold mb-2">{p.label}</h4>
              <p className="text-xs text-surface-variant leading-relaxed mb-3">{p.description.slice(0, 80)}...</p>
              <div className="text-xs text-surface-variant">Weight: ×{p.weight.toFixed(2)}</div>
              <div className="h-[2px] rounded-sm mt-3" style={{ background: p.color }} />
            </div>
          ))}
        </div>
      </div>

      {/* Innovative Features */}
      <div className="rounded-2xl p-7 border border-outline-variant" style={{ background: 'rgba(99,102,241,0.15)' }}>
        <h2 className="text-lg font-bold mb-5 text-center">Innovative Features</h2>
        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.label} className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${f.color}20` }}>
              <div className="w-2 h-2 rounded-full mb-2.5" style={{ background: f.color }} />
              <h4 className="text-sm font-bold mb-2">{f.label}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
