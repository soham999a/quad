import React from 'react';
import { RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Printer, FileText, TrendingUp, TrendingDown, Target, Zap, Shield, Download, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PipReportData, Insight } from '../../core/report/pip';
import { BAND_COLOR, thresholdMeta, AGILITY_META } from '../../core/runner/format';
import type { RadarPoint } from '../../core/report/pip';
import type { RadarDimension } from '../../core/types';

const DIM_LABELS: Record<string, string> = {
  IQ: 'Intelligence', EQ: 'Emotional', SQ: 'Social', AQ: 'Adaptability',
  CT: 'Critical Thinking', DQ: 'Decision Quality', LA: 'Learning Agility', PR: 'Professional Readiness',
};

function PageShell({ page, title, children, breakAfter = true }: { page: string; title: string; children: React.ReactNode; breakAfter?: boolean }) {
  return (
    <section className={`pip-page bg-surface-container-lowest border-[0.5px] border-outline-variant ${breakAfter ? 'pip-page-break' : ''}`}>
      <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b-[0.5px] border-outline-variant">
        <div className="flex items-center gap-3">
          <FileText size={14} className="text-primary" />
          <span className="text-technical-sm font-technical-sm text-surface-variant">PERFORMANCE INTELLIGENCE PROFILE</span>
          <span className="text-surface-variant/40">·</span>
          <span className="text-label-md font-label-md text-on-background">{title}</span>
        </div>
        <div className="text-technical-sm font-technical-sm text-surface-variant">{page} / 4</div>
      </div>
      <div className="px-6 md:px-8 py-6 md:py-8">{children}</div>
    </section>
  );
}

function SectionTitle({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div className="mb-5">
      {kicker && <div className="text-technical-sm font-technical-sm text-primary mb-1 uppercase tracking-widest">{kicker}</div>}
      <h3 className="text-label-md font-label-md text-on-background">{children}</h3>
    </div>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="px-2 py-1 text-technical-sm font-technical-sm rounded-full" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      {children}
    </span>
  );
}

function InsightRow({ icon, item, tone }: { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; item: Insight; tone: 'good' | 'bad' }) {
  const color = tone === 'good' ? '#10b981' : '#ef4444';
  const Icon = icon;
  return (
    <div className="flex items-start gap-3 py-3 border-b-[0.5px] border-outline-variant last:border-b-0">
      <Icon size={14} className="mt-1 flex-shrink-0" style={{ color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-label-md font-label-md text-on-background">{item.name}</span>
          <span className="text-technical-sm font-technical-sm text-surface-variant">T {item.tScore}</span>
        </div>
        <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">{item.descriptor}</p>
      </div>
    </div>
  );
}

// ── Page 1: Executive Summary ─────────────────────────────────────────────────

function PiiGauge({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = Math.min(score / max, 1) * 100;
  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 264} 264`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] leading-none font-headline-md text-on-background">{score}</span>
        <span className="text-technical-sm font-technical-sm text-surface-variant mt-1">/ {max}</span>
      </div>
    </div>
  );
}

function Page1({ p }: { p: PipReportData['page1'] }) {
  return (
    <PageShell page="01" title="Executive Summary">
      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <SectionTitle kicker="Performance Intelligence Index">PII Composite</SectionTitle>
          <PiiGauge score={p.piiScore} max={p.piiMax} color={p.hiringConfidence.color} />
          <div className="mt-4 text-center">
            <div className="text-label-md font-label-md" style={{ color: p.hiringConfidence.color }}>{p.piiBand} · {p.piiLabel}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">Top {100 - p.percentile}% banded against peer cohort</div>
          </div>
          <div className="mt-6 border-[0.5px] border-outline-variant bg-surface-container-low p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-technical-sm font-technical-sm text-surface-variant">Learning Agility Index</div>
              <div className="text-label-md font-label-md text-on-background">{AGILITY_META[p.learningAgility.label]?.label || p.learningAgility.label} · {p.learningAgility.score}/10</div>
            </div>
            <div className="h-[6px] bg-surface-variant/20 overflow-hidden">
              <div className="h-full" style={{ width: `${p.learningAgility.score * 10}%`, background: '#6366f1' }} />
            </div>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <SectionTitle kicker="Top 3 Strengths"><span className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" /> Strengths</span></SectionTitle>
              {p.strengths.map(s => <InsightRow key={s.name} icon={TrendingUp} item={s} tone="good" />)}
            </div>
            <div>
              <SectionTitle kicker="Top 3 Risks"><span className="flex items-center gap-2"><TrendingDown size={14} className="text-red-400" /> Risk Areas</span></SectionTitle>
              {p.risks.map(s => (
                <div key={s.name}>
                  {s.flagged && <div className="flex items-center gap-2 text-technical-sm font-technical-sm text-red-400 mb-2"><AlertTriangle size={12} /> Integrity flag — review before placement</div>}
                  <InsightRow icon={TrendingDown} item={s} tone="bad" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="border-[0.5px] border-outline-variant bg-surface-container-low p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-primary" />
            <span className="text-label-md font-label-md text-on-background">Role Recommendation</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-headline-md font-headline-md text-on-background">{p.roleRecommendation.role}</span>
            <span className="text-label-md font-label-md text-primary">{p.roleRecommendation.matchPct}%</span>
          </div>
          <p className="text-body-md text-on-surface-variant leading-relaxed">{p.roleRecommendation.statement}</p>
          {p.roleRecommendation.alternatives.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {p.roleRecommendation.alternatives.map(alt => (
                <div key={alt.role} className="flex items-center justify-between text-technical-sm font-technical-sm text-surface-variant">
                  <span>{alt.role}</span>
                  <span className="text-on-surface">{alt.matchPct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-[0.5px] border-outline-variant bg-surface-container-low p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={14} style={{ color: p.hiringConfidence.color }} />
            <span className="text-label-md font-label-md text-on-background">Hiring Confidence</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Pill color={p.hiringConfidence.color}>{p.hiringConfidence.level}</Pill>
            <span className="text-technical-sm font-technical-sm text-surface-variant">{p.piiScore} PII</span>
          </div>
          <p className="text-body-md text-on-surface-variant leading-relaxed">{p.hiringConfidence.rationale}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-technical-sm font-technical-sm text-surface-variant">Percentile rank</span>
            <span className="text-label-md font-label-md text-on-background">Top {100 - p.percentile}%</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ── Page 2: Dimensional Radar + Table ─────────────────────────────────────────

function DimensionalRadar({ points, norm }: { points: RadarPoint[]; norm: Record<RadarDimension, number> }) {
  const data = points.map(pt => ({ subject: DIM_LABELS[pt.dimension] || pt.dimension, Candidate: pt.score, 'Peer Norm': norm[pt.dimension] }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <ReRadar data={data} outerRadius="70%">
        <PolarGrid stroke="rgba(148,163,184,0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="Candidate" stroke="#B8924A" fill="#B8924A" fillOpacity={0.28} strokeWidth={2} dot={{ fill: '#B8924A', r: 3 }} />
        <Radar dataKey="Peer Norm" stroke="#64748b" fill="#64748b" fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 4" />
        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }} />
      </ReRadar>
    </ResponsiveContainer>
  );
}

function Page2({ p }: { p: PipReportData['page2'] }) {
  return (
    <PageShell page="02" title="Dimensional Intelligence">
      <SectionTitle kicker="8-Axis Radar">Candidate vs Peer Cohort</SectionTitle>
      <div className="grid md:grid-cols-2 gap-8">
        <DimensionalRadar points={p.radar} norm={p.peerNorm} />
        <div>
          <div className="flex flex-col">
            {p.radar.map(pt => (
              <div key={pt.dimension} className="flex items-center justify-between gap-3 py-2.5 border-b-[0.5px] border-outline-variant last:border-b-0">
                <div className="w-28 flex-shrink-0">
                  <div className="text-label-md font-label-md text-on-background">{pt.dimension}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">{DIM_LABELS[pt.dimension]}</div>
                </div>
                <div className="flex-1 h-[5px] bg-surface-container-high overflow-hidden mx-3">
                  <div className="h-full" style={{ width: `${Math.max(pt.score, 2)}%`, background: BAND_COLOR[pt.band] || '#B8924A' }} />
                </div>
                <div className="w-24 flex-shrink-0 text-right">
                  <span className="text-label-md font-label-md text-on-background">{pt.tScore}</span>
                  <span className="text-technical-sm font-technical-sm text-surface-variant ml-2">T·P{String(pt.percentile).padStart(2, '0')}</span>
                </div>
                <div className="w-20 flex-shrink-0 text-right">
                  <Pill color={BAND_COLOR[pt.band] || '#B8924A'}>{pt.band}</Pill>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ── Page 3: Competency Heatmap ────────────────────────────────────────────────

function Page3({ p }: { p: PipReportData['page3'] }) {
  return (
    <PageShell page="03" title="Competency Heatmap">
      <SectionTitle kicker="Sub-Dimension Performance">
        Module × competency scores <span className="text-surface-variant">— gold highlights the top role-fit relevance</span>
      </SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest border-b-[0.5px] border-outline-variant">
              <th className="py-3 pr-4 font-normal">Module</th>
              <th className="py-3 pr-4 font-normal">Competency</th>
              <th className="py-3 pr-4 font-normal text-right">Raw</th>
              <th className="py-3 pr-4 font-normal text-right">T</th>
              <th className="py-3 pr-4 font-normal text-right">Pct</th>
              <th className="py-3 font-normal text-right">Band</th>
            </tr>
          </thead>
          <tbody>
            {p.rows.map((r, i) => (
              <tr key={i} className="border-b-[0.5px] border-outline-variant"
                style={r.roleRelevant ? { background: 'rgba(235,192,115,0.06)' } : undefined}>
                <td className="py-3 pr-4 text-label-md font-label-md text-on-background">{r.module}</td>
                <td className="py-3 pr-4">
                  <span className="text-body-md text-on-surface-variant">{r.name}</span>
                  {r.roleRelevant && <Pill color="#B8924A">role-fit</Pill>}
                </td>
                <td className="py-3 pr-4 text-right text-technical-sm font-technical-sm text-surface-variant">{r.raw}/{r.max}</td>
                <td className="py-3 pr-4 text-right text-label-md font-label-md text-on-background">{r.tScore}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-technical-sm font-technical-sm text-surface-variant">{r.pct}%</span>
                    <div className="w-20 h-[5px] bg-surface-container-high overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.max(r.pct, 2)}%`, background: r.pct >= 75 ? '#10b981' : r.pct >= 60 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <Pill color={BAND_COLOR[r.band] || '#94a3b8'}>{r.band}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

// ── Page 4: Work-Style Derived Insights ───────────────────────────────────────

const PAGE4_SECTIONS = (p: PipReportData['page4']) => [
  { kicker: 'Works best under', label: 'Optimal Conditions', item: p.worksBestUnder },
  { kicker: 'Needs support when', label: 'Support Requirement', item: p.needsSupportWhen },
  { kicker: 'Communication style', label: 'Interaction', item: p.communicationStyle },
  { kicker: 'Leadership style', label: 'People', item: p.leadershipStyle },
  { kicker: 'Decision style', label: 'Decisions', item: p.decisionStyle },
  { kicker: 'Learning preference', label: 'Upskilling', item: p.learningPreference },
  { kicker: 'Execution preference', label: 'Delivery', item: p.executionPreference },
];

function Page4({ p }: { p: PipReportData['page4'] }) {
  const sections = PAGE4_SECTIONS(p);
  return (
    <PageShell page="04" title="Behavioural & Work-Style Insights" breakAfter={false}>
      <SectionTitle kicker="Derived From Work-Style, Judgement & Agility Data">
        How the candidate tends to work, communicate and lead
      </SectionTitle>
      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map(s => (
          <div key={s.kicker} className="border-[0.5px] border-outline-variant bg-surface-container-low p-5">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-1">{s.kicker}</div>
            <div className="text-label-md font-label-md text-primary mb-2">{s.item.label}</div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{s.item.detail}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

// ── Full report + print ───────────────────────────────────────────────────────

export default function PipReport({ data }: { data: PipReportData }) {
  const onPrint = () => window.print();

  return (
    <div className="pip-report">
      <div className="hidden md:flex items-center justify-between mb-6 print:hidden">
        <div>
          <div className="text-technical-sm font-technical-sm text-primary mb-1 uppercase tracking-widest">PIP · {data.header.tier}</div>
          <h1 className="text-headline-md font-headline-md text-on-background page-headline">Performance Intelligence Profile</h1>
          <p className="text-body-md text-surface-variant mt-2 leading-relaxed">
            {data.header.name} · {data.header.date} · Target: {data.header.targetRole} · Assessor: {data.header.assessorOrg}
          </p>
        </div>
        <button onClick={onPrint}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary-container text-label-md font-label-md hover:opacity-90 transition-opacity cursor-pointer border-none">
          <Printer size={14} /> PRINT / PDF
        </button>
      </div>

      <div className="flex flex-col gap-8 md:gap-10 print:gap-0 print:block">
        <Page1 p={data.page1} />
        <Page2 p={data.page2} />
        <Page3 p={data.page3} />
        <Page4 p={data.page4} />
      </div>
    </div>
  );
}
