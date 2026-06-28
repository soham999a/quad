import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PILLARS } from '../data/qidsData';
import { ChevronRight, BookOpen, Target, Briefcase, BarChart2 } from 'lucide-react';

function PillarCard({ pillar, onClick, active }) {
  return (
    <div onClick={onClick} className={`relative overflow-hidden rounded-[14px] p-5 cursor-pointer transition-all duration-200 ${active ? '' : 'bg-surface-container-low border border-outline-variant'}`} style={{
      background: active ? `${pillar.color}15` : undefined,
      border: active ? `1px solid ${pillar.color}` : undefined,
    }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: pillar.color }} />
      <div className="inline-flex px-3 py-1 rounded-full mb-2.5 text-label-md font-label-md font-extrabold" style={{
        background: `${pillar.color}20`,
        border: `1px solid ${pillar.color}40`,
        color: pillar.color,
      }}>{pillar.short}</div>
      <h3 className="text-label-md font-bold mb-1.5">{pillar.label}</h3>
      <p className="text-technical-sm text-surface-variant leading-relaxed">{pillar.framework}</p>
      <div className="flex items-center gap-1 mt-3 text-technical-sm" style={{ color: pillar.color }}>
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
      <div className="relative overflow-hidden rounded-[16px] p-7 mb-5" style={{
        background: `${pillar.color}08`,
        border: `1px solid ${pillar.color}30`,
      }}>
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: pillar.color }} />
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex px-4 py-1.5 rounded-full mb-3 text-[18px] font-label-md font-extrabold" style={{
              background: `${pillar.color}20`,
              border: `1px solid ${pillar.color}40`,
              color: pillar.color,
            }}>{pillar.short}</div>
            <h2 className="text-headline-md font-extrabold mb-2">{pillar.label}</h2>
            <p className="text-label-md text-on-surface-variant max-w-[600px] leading-[1.7]">{pillar.description}</p>
          </div>
          <div className="text-right">
            <div className="text-technical-sm text-surface-variant mb-1">Dynamic Weight</div>
            <div className="text-[28px] font-headline-md font-extrabold" style={{ color: pillar.color }}>×{pillar.weight.toFixed(2)}</div>
            <div className="text-technical-sm text-surface-variant">in unified score</div>
          </div>
        </div>
        <div className="mt-3 py-2 px-3.5 bg-white/5 rounded-lg inline-block">
          <span className="text-technical-sm text-surface-variant">Framework: </span>
          <span className="text-technical-sm font-semibold" style={{ color: pillar.color }}>{pillar.framework}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-[10px] w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg cursor-pointer border-none text-label-md font-medium transition-all duration-150 ${tab === id ? '' : 'text-on-surface-variant'}`} style={{
            background: tab === id ? pillar.color : 'transparent',
            color: tab === id ? 'white' : undefined,
          }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h4 className="text-label-md font-semibold mb-3" style={{ color: pillar.color }}>Core Components</h4>
            {pillar.subParams.map(sp => (
              <div key={sp.id} className="flex items-start gap-2.5 mb-2.5">
                <div className="size-[6px] rounded-full mt-1 shrink-0" style={{ background: pillar.color }} />
                <div>
                  <div className="text-label-md font-medium">{sp.label}</div>
                  <div className="text-technical-sm text-surface-variant mt-0.5">{sp.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h4 className="text-label-md font-semibold mb-3" style={{ color: pillar.color }}>Development Focus</h4>
            {pillar.developmentFocus.map(d => (
              <div key={d} className="flex items-center gap-2 mb-2">
                <div className="size-5 rounded-md flex items-center justify-center shrink-0" style={{ background: `${pillar.color}20` }}>
                  <div className="size-[6px] rounded-full" style={{ background: pillar.color }} />
                </div>
                <span className="text-label-md text-on-surface-variant">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'subparams' && (
        <div className="flex flex-col gap-3">
          {pillar.subParams.map((sp, i) => (
            <div key={sp.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-technical-sm text-surface-variant mr-2">#{i + 1}</span>
                  <span className="text-label-md font-semibold">{sp.label}</span>
                </div>
                <div className="text-technical-sm font-semibold" style={{ color: pillar.color }}>Max: {sp.max} pts</div>
              </div>
              <p className="text-label-md text-on-surface-variant mb-2.5">{sp.desc}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(sp.max / pillar.subParams.reduce((s, p) => s + p.max, 0)) * 100}%`, background: pillar.color }} />
              </div>
              <div className="text-technical-sm text-surface-variant mt-1">
                {Math.round((sp.max / pillar.subParams.reduce((s, p) => s + p.max, 0)) * 100)}% of total pillar score
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'methods' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <h4 className="text-label-md font-semibold mb-3" style={{ color: pillar.color }}>Assessment Methods</h4>
            {pillar.assessmentMethods.map(m => (
              <div key={m} className="py-2 px-3 mb-1.5 rounded-lg text-label-md text-on-surface-variant" style={{
                background: `${pillar.color}10`,
                border: `1px solid ${pillar.color}20`,
              }}>{m}</div>
            ))}
          </div>
          <div className="card">
            <h4 className="text-label-md font-semibold mb-3">Interpretation Guide</h4>
            {[
              { range: '90–100', label: 'Exceptional strength — leverage as core asset', color: '#10b981' },
              { range: '75–89', label: 'Strong capability — maintain and refine', color: '#06b6d4' },
              { range: '60–74', label: 'Adequate — targeted enhancement recommended', color: '#f59e0b' },
              { range: '45–59', label: 'Below average — structured intervention needed', color: '#f97316' },
              { range: '<45', label: 'Critical gap — priority intervention required', color: '#ef4444' },
            ].map(({ range, label, color }) => (
              <div key={range} className="flex gap-2.5 mb-2 items-start">
                <span className="text-[11px] font-bold min-w-[50px]" style={{ color }}>{range}</span>
                <span className="text-technical-sm text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'career' && (
        <div className="card">
          <h4 className="text-label-md font-semibold mb-3" style={{ color: pillar.color }}>Career Alignment</h4>
          <p className="text-label-md text-on-surface-variant leading-[1.7] mb-4">{pillar.careerAlignment}</p>
          <div className="p-4 rounded-[10px]" style={{
            background: `${pillar.color}08`,
            border: `1px solid ${pillar.color}20`,
          }}>
            <div className="text-technical-sm text-surface-variant mb-2">High {pillar.short} Profile Roles</div>
            <div className="flex flex-wrap gap-2">
              {pillar.id === 'IQ' && ['Research Scientist', 'Software Engineer', 'Data Analyst', 'Financial Analyst', 'Academic Researcher'].map(r => (
                <span key={r} className="px-2.5 py-1 rounded-full text-technical-sm" style={{
                  background: `${pillar.color}15`,
                  border: `1px solid ${pillar.color}30`,
                  color: pillar.color,
                }}>{r}</span>
              ))}
              {pillar.id === 'EQ' && ['HR Director', 'Counselor', 'Team Lead', 'Customer Success', 'Therapist', 'Coach'].map(r => (
                <span key={r} className="px-2.5 py-1 rounded-full text-technical-sm" style={{
                  background: `${pillar.color}15`,
                  border: `1px solid ${pillar.color}30`,
                  color: pillar.color,
                }}>{r}</span>
              ))}
              {pillar.id === 'SQ' && ['Community Leader', 'Educator', 'Social Worker', 'PR Manager', 'Diplomat'].map(r => (
                <span key={r} className="px-2.5 py-1 rounded-full text-technical-sm" style={{
                  background: `${pillar.color}15`,
                  border: `1px solid ${pillar.color}30`,
                  color: pillar.color,
                }}>{r}</span>
              ))}
              {pillar.id === 'AQ' && ['Entrepreneur', 'Crisis Manager', 'Military Officer', 'Emergency Responder', 'Startup Founder'].map(r => (
                <span key={r} className="px-2.5 py-1 rounded-full text-technical-sm" style={{
                  background: `${pillar.color}15`,
                  border: `1px solid ${pillar.color}30`,
                  color: pillar.color,
                }}>{r}</span>
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
    <div className="page-pad max-w-[1100px] mx-auto animate-fade">
      <h1 className="text-headline-md font-extrabold mb-1">The Four Pillars of Holistic Development</h1>
      <p className="text-label-md text-surface-variant mb-7">Each pillar represents a core dimension of human intelligence and capability within the QIDS framework.</p>

      {/* Pillar selector */}
      <div className="grid grid-cols-4 gap-3 mb-7">
        {Object.values(PILLARS).map(p => (
          <PillarCard key={p.id} pillar={p} active={active === p.id} onClick={() => { setActive(p.id); navigate(`/app/pillars/${p.id}`); }} />
        ))}
      </div>

      {/* Detail */}
      {pillar && <PillarDetail pillar={pillar} />}

      {/* Innovative Features */}
      <div className="mt-8 p-6 bg-surface-container-low border border-outline-variant rounded-[16px]">
        <h3 className="text-[16px] font-bold mb-4 text-center">Innovative Features</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Dynamic Emotional Integration', desc: 'Real-time emotional adaptability using hybrid digital-physical simulations and dynamic weightage algorithms.', color: '#10b981' },
            { label: 'Resilience Dynamics Framework', desc: 'A revolutionary approach to understanding and developing adversity quotient as a dynamic, interconnected system.', color: '#f59e0b' },
            { label: 'Integrated Assessment', desc: 'Multi-method assessment capturing interactions between domains for a holistic view of individual capabilities.', color: '#6366f1' },
          ].map(f => (
            <div key={f.label} className="p-4 bg-white/5 rounded-[10px]" style={{ border: `1px solid ${f.color}20` }}>
              <div className="size-2 rounded-full mb-2" style={{ background: f.color }} />
              <div className="text-label-md font-bold mb-1.5">{f.label}</div>
              <div className="text-technical-sm text-on-surface-variant leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
