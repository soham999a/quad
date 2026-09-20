import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useMemo } from 'react';
import { RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, Target, Zap, Brain, ArrowLeft, FileText } from 'lucide-react';
import { BAND_COLOR, thresholdMeta, INTEGRITY_META, AGILITY_META } from '../../core/runner/format';
import { buildPipReport } from '../../core/report/pip';
import PipReport from './PipReport';
const WS_LABELS = {
  Ownership: 'Ownership', Curiosity: 'Curiosity', Execution: 'Execution',
  LearningAgility: 'Learning Agility', Communication: 'Communication', Integrity: 'Integrity',
};

const MODULE_LABELS = {
  CR: 'Cognitive Readiness', CT: 'Critical Thinking', SJT: 'Workplace Judgement', EI: 'Emotional Intelligence',
  AQ: 'Adaptability & Resilience', WS: 'Work Style', INT: 'Integrity & Risk', DQ: 'Decision Quality',
  LR: 'Leadership Readiness', ST: 'Strategic Thinking', PL: 'People Leadership', OI: 'Organisational Impact',
  RIQ: 'Role Intelligence',
};

function WorkStyleRadar({ profile }) {
  const data = Object.entries(profile).map(([k, v]) => ({ subject: WS_LABELS[k] || k, A: v, fullMark: 10 }));
  return (
    <div className="card p-5 md:p-6">
      <ResponsiveContainer width="100%" height={300}>
        <ReRadar data={data} outerRadius="68%">
          <PolarGrid stroke="var(--gold-grid)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--neutral-mid)', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar dataKey="A" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.22} strokeWidth={2} dot={{ fill: 'var(--gold)', r: 3 }} />
          <Tooltip contentStyle={{ background: 'var(--neutral-carbon-deep)', border: '1px solid var(--gold-line)', borderRadius: 8, color: 'var(--neutral-warm)', fontSize: 12 }} />
        </ReRadar>
      </ResponsiveContainer>
    </div>
  );
}

function ModuleBars({ moduleScores }) {
  const rows = Object.entries(moduleScores)
    .filter(([, s]) => s && s.max > 0)
    .sort((a, b) => b[1].tScore - a[1].tScore);

  return (
    <div className="flex flex-col">
      {rows.map(([id, s], idx) => (
        <div key={id} className="py-3 border-b-[0.5px] border-outline-variant last:border-b-0 group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-6 h-6 rounded-full bg-surface-container-high text-surface-variant text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0 group-hover:text-primary group-hover:bg-primary/15 transition-colors">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="text-label-md font-label-md text-on-background">{id}</span>
              <span className="text-technical-sm font-technical-sm text-surface-variant truncate">{MODULE_LABELS[id] || id}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-technical-sm font-technical-sm" style={{ color: BAND_COLOR[s.band] || 'var(--slate-muted)' }}>
                {s.band} · P{String(s.percentile).padStart(2, '0')}
              </span>
              <span className="text-label-md font-label-md text-on-background w-8 text-right">{s.tScore}</span>
            </div>
          </div>
          <div className="h-[6px] rounded-full bg-surface-container-high overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(s.tScore, 2)}%`, background: `linear-gradient(90deg, ${BAND_COLOR[s.band] || 'var(--phase-pre)'}88, ${BAND_COLOR[s.band] || 'var(--phase-pre)'})` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RfiList({ rfi }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {rfi?.map((r, idx) => {
        const meta = thresholdMeta(r.threshold);
        return (
          <div key={r.roleId} className="card card-hover p-4 md:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="text-label-md font-label-md text-on-background">{r.roleLabel}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">{r.roleId}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-headline-md font-headline-md" style={{ color: meta.color }}>{r.matchPct}%</span>
                <span className="chip" style={{ background: meta.bg, color: meta.color, borderColor: 'transparent' }}>{meta.label}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2">
              {Object.entries(r.dimensionScores).map(([d, v]) => (
                <div key={d} className="text-center">
                  <div className="text-technical-sm font-technical-sm text-surface-variant mb-1">{d}</div>
                  <div className="h-[4px] rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${v}%`, background: v >= 70 ? 'var(--status-ok)' : v >= 40 ? 'var(--status-warn)' : 'var(--status-err)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!rfi?.length && <div className="text-technical-sm font-technical-sm text-surface-variant py-6 text-center">No role fits evaluated for this mode.</div>}
    </div>
  );
}

export default function EnterpriseResults({ result, deployed, answers, onRestart }) {
  usePageTitle('Enterprise results');
  const [view, setView] = useState('overview');
  const pii = result?.pii;
  const agility = result?.learningAgility;
  const ws = result?.workStyle;
  const integrity = result?.integrity;
  const moduleScores = result?.moduleScores || {};

  const integrityMeta = integrity ? INTEGRITY_META[integrity.band] : null;
  const pip = useMemo(() => deployed && answers ? buildPipReport(result, deployed, answers) : null, [result, deployed, answers]);

  return (
    <div className="page-pad max-w-[1520px] mx-auto animate-fade pb-24 md:pb-16">
      <section className="mb-10 md:mb-14">
        <div className="flex items-center gap-4">
          <button onClick={onRestart} className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
            <ArrowLeft size={14} /> New assessment
          </button>
        </div>
        <div className="kicker mt-6 mb-3">Performance Intelligence Profile</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Assessment Results</h1>
        <div className="gradient-rule mt-6" />
      </section>

      {pip && (
        <div className="flex items-center gap-2 mb-8">
          {[{ id: 'overview', label: 'Overview' }, { id: 'report', label: 'PIP Report' }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className={`px-5 py-2.5 rounded-full text-label-md font-label-md transition-all cursor-pointer border-[0.5px] touch-target ${view === t.id ? 'bg-primary text-on-primary border-primary' : 'bg-transparent border-outline-variant text-surface-variant hover:text-primary hover:border-primary'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {view === 'report' && pip ? (
        <PipReport data={pip} />
      ) : (
        <>
      {/* PII header */}
      {pii && (
        <section className="relative mb-10 md:mb-14 card overflow-hidden p-6 md:p-10"
          style={{ background: 'radial-gradient(ellipse at 12% 0%, var(--gold-soft), transparent 55%), linear-gradient(180deg, var(--tint-hairline), transparent 45%), var(--color-surface-container-lowest)' }}>
          <div aria-hidden="true" className="absolute right-0 top-0 h-full w-1/3 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 100% 0%, var(--gold-tint), transparent 60%)' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="kicker mb-3">Professional Intelligence Index</div>
              <div className="text-gradient text-[64px] leading-none font-headline-md">{pii.score}</div>
              <div className="text-label-md font-label-md text-primary mt-3">{pii.label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1 max-w-md">{pii.desc}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              {agility && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center"><Zap size={14} className="text-primary" /></span>
                    <span className="text-technical-sm font-technical-sm text-surface-variant">Learning Agility</span>
                  </div>
                  <div className="text-label-md font-label-md text-on-background">{AGILITY_META[agility.label]?.label || agility.label}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">{agility.score}/10</div>
                </div>
              )}
              {integrity && integrityMeta && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${integrityMeta.color}22` }}>
                      <Shield size={14} style={{ color: integrityMeta.color }} />
                    </span>
                    <span className="text-technical-sm font-technical-sm text-surface-variant">Integrity</span>
                  </div>
                  <div className="text-label-md font-label-md" style={{ color: integrityMeta.color }}>{integrity.band}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">{integrityMeta.label}</div>
                </div>
              )}
              {result?.riq && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${BAND_COLOR[result.riq.band] || 'var(--phase-pre)'}22` }}>
                      <Target size={14} style={{ color: BAND_COLOR[result.riq.band] || 'var(--phase-pre)' }} />
                    </span>
                    <span className="text-technical-sm font-technical-sm text-surface-variant">RIQ</span>
                  </div>
                  <div className="text-label-md font-label-md" style={{ color: BAND_COLOR[result.riq.band] || 'var(--phase-pre)' }}>{result.riq.score} · {result.riq.band}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant truncate">{result.riq.track}</div>
                </div>
              )}
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center"><Brain size={14} className="text-primary" /></span>
                  <span className="text-technical-sm font-technical-sm text-surface-variant">Battery</span>
                </div>
                <div className="text-label-md font-label-md text-on-background">{result?.tier}</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant">Professional battery</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-12 gap-8 md:gap-12">
        {/* Module T-scores */}
        <div className="md:col-span-7">
          <div className="flex items-center gap-3 mb-5">
            <span className="kicker">Module Performance</span>
          </div>
          <div className="gradient-rule mb-6" />
          <ModuleBars moduleScores={moduleScores} />
        </div>

        {/* Work style */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="kicker">Work Style Profile</span>
          </div>
          <div className="gradient-rule mb-6" />
          {ws ? (
            <>
              <WorkStyleRadar profile={ws.profile} />
              <div className="mt-4 card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Target size={15} className="text-primary flex-shrink-0" />
                  </span>
                  <span className="text-label-md font-label-md text-on-background">{ws.archetype.label}</span>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mb-3">{ws.archetype.strengths}</p>
                {ws.archetype.watchouts && <p className="text-body-md text-amber-400/90 leading-relaxed">{ws.archetype.watchouts}</p>}
                {ws.watchouts?.length > 0 && (
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-2">
                    Watch-outs: {ws.watchouts.join(', ')}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-technical-sm font-technical-sm text-surface-variant py-6">Work style items not deployed in this tier.</div>
          )}
        </div>
      </div>

      {/* Role Intelligence */}
      {result?.riq && (
        <section className="mt-12 md:mt-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="kicker">Role Intelligence</span>
          </div>
          <div className="gradient-rule mb-6" />
          <div className="relative card overflow-hidden p-6 md:p-8"
            style={{ background: 'radial-gradient(ellipse at 90% 0%, var(--gold-tint), transparent 55%), linear-gradient(180deg, var(--tint-hairline), transparent 45%), var(--color-surface-container-lowest)' }}>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="text-technical-sm font-technical-sm text-surface-variant mb-1 uppercase tracking-widest">RIQ · {result.riq.track}</div>
                <div className="text-headline-md font-headline-md text-on-background">{result.riq.trackLabel}</div>
                <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Role-specific applied knowledge and professional vocabulary, scored on a 20–80 T-band scale.
                </p>
              </div>
              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <div className="text-[40px] leading-none font-headline-md text-gradient">{result.riq.score}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">T-score</div>
                </div>
                <div className="text-center">
                  <div className="chip text-label-md font-label-md" style={{ background: `${BAND_COLOR[result.riq.band]}22`, color: BAND_COLOR[result.riq.band] || 'var(--phase-pre)', borderColor: `${BAND_COLOR[result.riq.band] || 'var(--phase-pre)'}44` }}>
                    {result.riq.band}
                  </div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">P{String(result.riq.percentile).padStart(2, '0')}</div>
                </div>
              </div>
            </div>
            <div className="mt-5 h-[6px] rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(result.riq.score, 2)}%`, background: `linear-gradient(90deg, ${BAND_COLOR[result.riq.band] || 'var(--phase-pre)'}88, ${BAND_COLOR[result.riq.band] || 'var(--phase-pre)'})` }} />
            </div>
          </div>
        </section>
      )}

      {/* Role Fit Index */}
      <section className="mt-12 md:mt-16">
        <div className="flex items-center gap-3 mb-5">
          <span className="kicker">Role Fit Index</span>
        </div>
        <div className="gradient-rule mb-6" />
        <RfiList rfi={result?.rfi} />
      </section>

      {integrity?.flaggedItems?.length > 0 && (
        <section className="mt-10 md:mt-12 rounded-xl border-[0.5px] border-error/30 bg-error/5 p-5 md:p-6">
          <div className="text-label-md font-label-md text-error mb-2">Flagged items for review</div>
          <div className="text-technical-sm font-technical-sm text-on-surface-variant">{integrity.flaggedItems.join(', ')}</div>
        </section>
      )}
        </>
      )}
    </div>
  );
}
