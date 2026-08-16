import React, { useMemo, useState } from 'react';
import { BookOpen, Radar, Target, Users, BarChart3, Building2, Search, ArrowUpRight } from 'lucide-react';
import { ROLE_PROFILES, RADAR_DIMENSIONS, RFI_THRESHOLDS } from '../../core/data/enterprise';
import { computeRFI, evaluateRoleMatches } from '../../core/engine/scoring';
import { thresholdMeta } from '../../core/runner/format';
import type { RoleDimension, RoleProfile } from '../../core/types';

const ROLE_DIMS: RoleDimension[] = ['Cog', 'CT', 'EQ', 'SQ', 'AQ', 'DQ', 'LA', 'Int'];

const DIM_WEIGHT_LABELS: Record<RoleDimension, string> = {
  Cog: 'Cognitive', CT: 'Critical Thinking', EQ: 'Emotional', SQ: 'Social',
  AQ: 'Adaptability', DQ: 'Decision Quality', LA: 'Learning Agility', Int: 'Integrity',
};

function RoleCard({ role }: { role: RoleProfile }) {
  const [open, setOpen] = useState(false);
  const top = useMemo(
    () => (Object.entries(role.weights) as [RoleDimension, number][])
      .sort((a, b) => b[1] - a[1])
      .filter(([, v]) => v > 0)
      .slice(0, 3),
    [role],
  );

  return (
    <div className="card card-hover overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer bg-transparent border-none touch-target">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-9 h-9 flex-shrink-0 rounded-lg border-[0.5px] border-outline-variant bg-primary/10 flex items-center justify-center">
            <Target size={15} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-label-md font-label-md text-on-background">{role.label}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant truncate">{role.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden md:flex gap-1">
            {top.map(([d, v]) => (
              <span key={d} className="chip">{DIM_WEIGHT_LABELS[d]} {v}%</span>
            ))}
          </div>
          <ArrowUpRight size={14} className={`text-surface-variant transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="mb-4">
            <div className="kicker mb-3">Competency Weight Profile</div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
              {ROLE_DIMS.filter(d => (role.weights[d] ?? 0) > 0).map(d => {
                const w = role.weights[d] ?? 0;
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-32 flex-shrink-0 text-technical-sm font-technical-sm text-surface-variant">{DIM_WEIGHT_LABELS[d]}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${w >= 20 ? '#ebc073' : w >= 10 ? '#94a3b8' : '#475569'}88, ${w >= 20 ? '#ebc073' : w >= 10 ? '#94a3b8' : '#475569'})` }} />
                    </div>
                    <span className="w-8 text-right text-technical-sm font-technical-sm text-on-surface">{w}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {RFI_THRESHOLDS.map(t => (
              <span key={t.level} className="chip">{t.label}: {t.min}%+</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RFI Explorer: what-if candidate scorer ────────────────────────────────────

const DEFAULT_CANDIDATE: Record<RoleDimension, number> = {
  Cog: 60, CT: 55, EQ: 65, SQ: 60, AQ: 55, DQ: 50, LA: 55, Int: 60,
};

function RfiExplorer() {
  const [candidate, setCandidate] = useState<Record<RoleDimension, number>>(DEFAULT_CANDIDATE);
  const matches = useMemo(() => evaluateRoleMatches(candidate), [candidate]);

  const set = (d: RoleDimension, v: number) => setCandidate(c => ({ ...c, [d]: v }));

  return (
    <div>
      <p className="text-body-md text-surface-variant leading-relaxed mb-8">
        Set a candidate profile across the 8 competency dimensions and see the Role Fit Index for all roles in real time.
      </p>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <div className="kicker mb-4">Candidate Profile</div>
          <div className="flex flex-col gap-4">
            {ROLE_DIMS.map(d => (
              <div key={d} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label-md font-label-md text-on-background">{DIM_WEIGHT_LABELS[d]}</span>
                  <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-label-md font-label-md flex items-center justify-center">{candidate[d]}</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={candidate[d]}
                  onChange={e => set(d, Number(e.target.value))}
                  className="w-full cursor-pointer" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="kicker mb-4">Role Fit Ranking</div>
          <div className="flex flex-col gap-3">
            {matches.map((r, idx) => {
              const meta = thresholdMeta(r.threshold);
              return (
                <div key={r.roleId} className="card card-hover">
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="min-w-0">
                        <div className="text-label-md font-label-md text-on-background">{r.roleLabel}</div>
                        <div className="text-technical-sm font-technical-sm text-surface-variant">{r.roleId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-headline-md font-headline-md" style={{ color: meta.color }}>{r.matchPct}%</span>
                      <span className="chip" style={{ background: meta.bg, color: meta.color, borderColor: 'transparent' }}>{meta.label}</span>
                    </div>
                  </div>
                  <div className="px-4 pb-4 grid grid-cols-8 gap-2">
                    {Object.entries(r.dimensionScores).map(([d, v]) => (
                      <div key={d} className="text-center">
                        <div className="text-technical-sm font-technical-sm text-surface-variant mb-1">{d}</div>
                        <div className="h-[4px] rounded-full bg-surface-container-high overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${v}%`, background: v >= 70 ? '#10b981' : v >= 40 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Heatmap: roles × dimensions ───────────────────────────────────────────────

function RoleHeatmap() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest border-b-[0.5px] border-outline-variant">
            <th className="py-3 pr-4 font-normal">Role</th>
            {ROLE_DIMS.map(d => <th key={d} className="py-3 pr-3 font-normal text-center">{d}</th>)}
            <th className="py-3 font-normal text-right">Weighted</th>
          </tr>
        </thead>
        <tbody>
          {ROLE_PROFILES.map(r => {
            const total = Object.values(r.weights).reduce((a, b) => a + b, 0);
            return (
              <tr key={r.id} className="border-b-[0.5px] border-outline-variant">
                <td className="py-3 pr-4">
                  <div className="text-label-md font-label-md text-on-background">{r.label}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">{r.id}</div>
                </td>
                {ROLE_DIMS.map(d => {
                  const w = r.weights[d] ?? 0;
                  const color = w >= 20 ? '#ebc073' : w >= 10 ? '#94a3b8' : '#3f3f3f';
                  return (
                    <td key={d} className="py-3 pr-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-technical-sm font-technical-sm"
                        style={{ color, background: `${color}15` }}>{w}%</span>
                    </td>
                  );
                })}
                <td className="py-3 text-right text-label-md font-label-md text-primary">{total}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Dashboard shell ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'roles', label: 'Role Library', icon: BookOpen },
  { id: 'explorer', label: 'RFI Explorer', icon: Radar },
  { id: 'heatmap', label: 'Weight Heatmap', icon: BarChart3 },
];

export default function EmployerDashboard() {
  const [tab, setTab] = useState('roles');
  const [query, setQuery] = useState('');

  const roles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROLE_PROFILES;
    return ROLE_PROFILES.filter(r => r.label.toLowerCase().includes(q) || r.id.includes(q) || r.description.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="page-pad max-w-[1520px] mx-auto animate-fade pb-24 md:pb-16">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">Employer Intelligence</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Talent Intelligence Console</h1>
        <p className="text-body-md text-surface-variant max-w-2xl mt-4 leading-relaxed">
          Browse the role competency library, explore role-fit scoring against candidate profiles, and compare weight profiles across all 11 roles.
        </p>
        <div className="gradient-rule mt-6" />
      </section>

      <div className="flex items-center justify-between gap-6 mb-8 border-b-[0.5px] border-outline-variant">
        <div className="flex items-center gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 text-label-md font-label-md transition-all cursor-pointer border-[0.5px] touch-target ${tab === t.id ? 'bg-primary text-on-primary border-primary' : 'bg-transparent border-transparent text-surface-variant hover:text-primary'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        {tab === 'roles' && (
          <div className="hidden md:flex items-center gap-2 rounded-full border-[0.5px] border-outline-variant px-4 py-2">
            <Search size={14} className="text-surface-variant" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search roles…"
              className="bg-transparent text-body-md text-on-background outline-none placeholder:text-surface-variant w-48" />
          </div>
        )}
      </div>

      {tab === 'roles' && (
        <div className="flex flex-col gap-3">
          {roles.map(r => <RoleCard key={r.id} role={r} />)}
          {roles.length === 0 && <div className="text-technical-sm font-technical-sm text-surface-variant py-10 text-center">No roles match “{query}”.</div>}
        </div>
      )}
      {tab === 'explorer' && <RfiExplorer />}
      {tab === 'heatmap' && <RoleHeatmap />}
    </div>
  );
}
