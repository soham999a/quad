import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PILLARS } from '../data/qidsData';
import { ChevronRight, BookOpen, Target, Briefcase, BarChart2 } from 'lucide-react';

function PillarCard({ pillar, onClick, active }) {
  return (
    <div onClick={onClick} style={{
      background: active ? `${pillar.color}15` : 'var(--navy-4)',
      border: `1px solid ${active ? pillar.color : 'var(--border-light)'}`,
      borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: pillar.gradient }} />
      <div style={{
        display: 'inline-flex', padding: '4px 12px', borderRadius: 20,
        background: `${pillar.color}20`, border: `1px solid ${pillar.color}40`,
        fontSize: 14, fontWeight: 800, color: pillar.color, marginBottom: 10,
        fontFamily: 'Space Grotesk',
      }}>{pillar.short}</div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{pillar.label}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{pillar.framework}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, color: pillar.color, fontSize: 12 }}>
        Explore <ChevronRight size={12} />
      </div>
    </div>
  );
}

function PillarDetail({ pillar }) {
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'subparams', label: 'Sub-Parameters', icon: BarChart2 },
    { id: 'methods', label: 'Assessment', icon: Target },
    { id: 'career', label: 'Career Guidance', icon: Briefcase },
  ];

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${pillar.color}15, ${pillar.color}05)`,
        border: `1px solid ${pillar.color}30`, borderRadius: 16, padding: 28, marginBottom: 20,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: pillar.gradient }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{
              display: 'inline-flex', padding: '6px 16px', borderRadius: 20,
              background: `${pillar.color}20`, border: `1px solid ${pillar.color}40`,
              fontSize: 18, fontWeight: 800, color: pillar.color, marginBottom: 12,
              fontFamily: 'Space Grotesk',
            }}>{pillar.short}</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{pillar.label}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.7 }}>{pillar.description}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Dynamic Weight</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>×{pillar.weight.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>in unified score</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'inline-block' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Framework: </span>
          <span style={{ fontSize: 12, color: pillar.color, fontWeight: 600 }}>{pillar.framework}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: tab === id ? pillar.color : 'transparent',
            color: tab === id ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, color: pillar.color, marginBottom: 12 }}>Core Components</h4>
            {pillar.subParams.map(sp => (
              <div key={sp.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: pillar.color, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{sp.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sp.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, color: pillar.color, marginBottom: 12 }}>Development Focus</h4>
            {pillar.developmentFocus.map(d => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: `${pillar.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: pillar.color }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'subparams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pillar.subParams.map((sp, i) => (
            <div key={sp.id} style={{
              background: 'var(--navy-4)', border: '1px solid var(--border-light)',
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 8 }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{sp.label}</span>
                </div>
                <div style={{ fontSize: 12, color: pillar.color, fontWeight: 600 }}>Max: {sp.max} pts</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{sp.desc}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(sp.max / pillar.subParams.reduce((s, p) => s + p.max, 0)) * 100}%`, background: pillar.gradient }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {Math.round((sp.max / pillar.subParams.reduce((s, p) => s + p.max, 0)) * 100)}% of total pillar score
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'methods' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, color: pillar.color, marginBottom: 12 }}>Assessment Methods</h4>
            {pillar.assessmentMethods.map(m => (
              <div key={m} style={{
                padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                background: `${pillar.color}10`, border: `1px solid ${pillar.color}20`,
                fontSize: 13, color: 'var(--text-secondary)',
              }}>{m}</div>
            ))}
          </div>
          <div className="card">
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Interpretation Guide</h4>
            {[
              { range: '90–100', label: 'Exceptional strength — leverage as core asset', color: '#10b981' },
              { range: '75–89', label: 'Strong capability — maintain and refine', color: '#06b6d4' },
              { range: '60–74', label: 'Adequate — targeted enhancement recommended', color: '#f59e0b' },
              { range: '45–59', label: 'Below average — structured intervention needed', color: '#f97316' },
              { range: '<45', label: 'Critical gap — priority intervention required', color: '#ef4444' },
            ].map(({ range, label, color }) => (
              <div key={range} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 50 }}>{range}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'career' && (
        <div className="card">
          <h4 style={{ fontSize: 13, fontWeight: 600, color: pillar.color, marginBottom: 12 }}>Career Alignment</h4>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{pillar.careerAlignment}</p>
          <div style={{ padding: 16, background: `${pillar.color}08`, border: `1px solid ${pillar.color}20`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>High {pillar.short} Profile Roles</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {pillar.id === 'IQ' && ['Research Scientist', 'Software Engineer', 'Data Analyst', 'Financial Analyst', 'Academic Researcher'].map(r => (
                <span key={r} style={{ padding: '4px 10px', borderRadius: 20, background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, fontSize: 12, color: pillar.color }}>{r}</span>
              ))}
              {pillar.id === 'EQ' && ['HR Director', 'Counselor', 'Team Lead', 'Customer Success', 'Therapist', 'Coach'].map(r => (
                <span key={r} style={{ padding: '4px 10px', borderRadius: 20, background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, fontSize: 12, color: pillar.color }}>{r}</span>
              ))}
              {pillar.id === 'SQ' && ['Community Leader', 'Educator', 'Social Worker', 'PR Manager', 'Diplomat'].map(r => (
                <span key={r} style={{ padding: '4px 10px', borderRadius: 20, background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, fontSize: 12, color: pillar.color }}>{r}</span>
              ))}
              {pillar.id === 'AQ' && ['Entrepreneur', 'Crisis Manager', 'Military Officer', 'Emergency Responder', 'Startup Founder'].map(r => (
                <span key={r} style={{ padding: '4px 10px', borderRadius: 20, background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, fontSize: 12, color: pillar.color }}>{r}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FourPillars() {
  const { pillarId } = useParams();
  const navigate = useNavigate();
  const [active, setActive] = useState(pillarId || 'IQ');
  const pillar = PILLARS[active];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }} className="animate-fade">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>The Four Pillars of Holistic Development</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>Each pillar represents a core dimension of human intelligence and capability within the QIDS framework.</p>

      {/* Pillar selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {Object.values(PILLARS).map(p => (
          <PillarCard key={p.id} pillar={p} active={active === p.id} onClick={() => { setActive(p.id); navigate(`/pillars/${p.id}`); }} />
        ))}
      </div>

      {/* Detail */}
      {pillar && <PillarDetail pillar={pillar} />}

      {/* Innovative Features */}
      <div style={{
        marginTop: 32, padding: 24,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
        border: '1px solid var(--border)', borderRadius: 16,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>Innovative Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Dynamic Emotional Integration', desc: 'Real-time emotional adaptability using hybrid digital-physical simulations and dynamic weightage algorithms.', color: '#10b981' },
            { label: 'Resilience Dynamics Framework', desc: 'A revolutionary approach to understanding and developing adversity quotient as a dynamic, interconnected system.', color: '#f59e0b' },
            { label: 'Integrated Assessment', desc: 'Multi-method assessment capturing interactions between domains for a holistic view of individual capabilities.', color: '#6366f1' },
          ].map(f => (
            <div key={f.label} style={{ padding: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: `1px solid ${f.color}20` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
