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
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }} className="animate-fade">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08), rgba(20,184,166,0.06))',
        border: '1px solid var(--border)',
        borderRadius: 20, padding: '48px 40px', marginBottom: 32,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>Patented Framework</div>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 11, color: '#34d399', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>Enterprise Grade</div>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            <span className="gradient-text">Quadrant Intelligence</span><br />
            Development System
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.7, marginBottom: 28 }}>
            A paradigm shift in personality development and assessment — moving beyond traditional academic metrics to embrace a holistic approach encompassing intellectual, emotional, social, and adversity-handling capabilities.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/assessment')}>
              <ClipboardList size={16} /> Start Assessment
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/framework')}>
              <Brain size={16} /> View Framework
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/report')}>
              Generate Report <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Vision */}
        <div className="card" style={{ borderLeft: '3px solid var(--indigo)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#818cf8' }}>Vision</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            To create a comprehensive framework that identifies and nurtures multiple dimensions of human capability, provides personalized development pathways, and establishes a foundation for lifelong learning and growth.
          </p>
        </div>

        {/* Context Selector */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Application Context</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CONTEXTS.map(c => (
              <button key={c.id} onClick={() => setContext(c.id)} style={{
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: context === c.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${context === c.id ? 'var(--indigo)' : 'var(--border-light)'}`,
                color: context === c.id ? 'white' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
              }}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>{ctx.desc}</p>
        </div>
      </div>

      {/* Three Phase Process */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Three-Phase Evaluation Process</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PHASE_CARDS.map(({ num, label, desc, color, path, icon: Icon }) => (
            <div key={num} onClick={() => navigate(path)} style={{
              background: 'var(--navy-4)', border: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
              <div style={{
                width: 40, height: 40, borderRadius: 12, marginBottom: 16,
                background: `${color}20`, border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Space Grotesk' }}>{num}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{label}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, color, fontSize: 12, fontWeight: 500 }}>
                Explore <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Four Pillars Summary */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>The Four Pillars of Holistic Development</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Object.values(PILLARS).map(p => (
            <div key={p.id} onClick={() => navigate(`/pillars/${p.id}`)} style={{
              background: 'var(--navy-4)', border: '1px solid var(--border-light)',
              borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; }}
            >
              <div style={{
                display: 'inline-flex', padding: '4px 10px', borderRadius: 20,
                background: `${p.color}20`, border: `1px solid ${p.color}40`,
                fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 12,
              }}>{p.short}</div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{p.label}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{p.description.slice(0, 80)}...</p>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weight: ×{p.weight.toFixed(2)}</div>
              <div style={{ height: 2, background: p.gradient, borderRadius: 1, marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Innovative Features */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.12), rgba(20,184,166,0.08))',
        border: '1px solid var(--border)', borderRadius: 16, padding: 28,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Innovative Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 12,
              padding: 20, border: `1px solid ${f.color}20`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, marginBottom: 10, boxShadow: `0 0 8px ${f.color}` }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{f.label}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
