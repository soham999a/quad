import usePageTitle from '../../lib/usePageTitle';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Building2, Target } from 'lucide-react';
import { buildModeSteps, ENTERPRISE_TIERS, modulesForTier, ENTERPRISE_MODULES } from '../../core/modes';
import { ROLE_PROFILES } from '../../core/data/enterprise';
import { deployTier, deployedCount, deployRoleTrack } from '../../core/runner/deploy';
import { getTrackForProfile } from '../../core/data/roleTracks';
import { moduleComplete, moduleAnsweredCount, assessmentComplete } from '../../core/runner/validate';
import { evaluateEnterpriseAssessment } from '../../core/engine/moduleScoring';
import { useAuth } from '../../context/AuthContext';
import { saveEnterpriseResult } from '../../services/firestoreService';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint, loadRemoteCheckpoint, saveRemoteCheckpoint } from '../../lib/checkpoint';
import { logEvent } from '../../lib/analytics';
import RunnerItems from './RunnerItems';
import EnterpriseResults from './EnterpriseResults';

const MODE_ICONS = { enterprise: Building2, role: Target };

function moduleDef(id) {
  return ENTERPRISE_MODULES.find(m => m.id === id);
}

function riqModuleDef() {
  return ENTERPRISE_MODULES.find(m => m.id === 'RIQ');
}

export default function EnterpriseRunner({ mode = 'enterprise', initialTier }) {
  usePageTitle('Enterprise assessment');
  const { tier: tierParam } = useParams();
  const { user } = useAuth();
  const [phase, setPhase] = useState('setup');
  const [tier, setTier] = useState(initialTier || tierParam || 'QGRA');
  const [intake, setIntake] = useState({ name: '', email: '', org: '' });
  const [targetRole, setTargetRole] = useState('');
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [deployed, setDeployed] = useState(null);
  const [answers, setAnswers] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);

  const roleTrack = mode === 'role' && targetRole ? getTrackForProfile(targetRole) : undefined;

  // ── Checkpoint/resume (blueprint P2) ───────────────────────────────────────
  // The seeded deployment is fully reproducible from `seed`, so restoring
  // { phase, tier, intake, targetRole, seed, answers, stepIndex } reconstructs
  // the session exactly. Mode is part of the key so role/enterprise don't collide.
  const cpKind = 'enterprise:' + mode;
  const cpRef = useRef(null);
  const [resumeState, setResumeState] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const pick = (cp) => (cp && cp.phase === 'running' && cp.seed !== undefined ? cp : null);
    const local = pick(loadCheckpoint(cpKind, user?.uid));
    if (local) { setResumeState(local); return; }
    (async () => {
      const remote = pick(await loadRemoteCheckpoint(cpKind, user?.uid));
      if (!cancelled && remote) setResumeState(remote);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Save while running or reviewing (not on setup/done).
  // Local every 600ms; cross-device layer throttled internally (~20s).
  useEffect(() => {
    if (phase !== 'running' && phase !== 'review') return;
    if (cpRef.current) clearTimeout(cpRef.current);
    cpRef.current = setTimeout(() => {
      const state = { phase, tier, intake, targetRole, seed, answers, stepIndex };
      saveCheckpoint(cpKind, user?.uid, state);
      saveRemoteCheckpoint(cpKind, user?.uid, state);
    }, 600);
    return () => clearTimeout(cpRef.current);
  }, [phase, tier, intake, targetRole, seed, answers, stepIndex, user]);

  const resumeSession = () => {
    if (!resumeState) return;
    const restored = deployTier(resumeState.tier || 'QGRA', resumeState.seed);
    if (resumeState.targetRole) {
      const track = getTrackForProfile(resumeState.targetRole);
      if (track) restored.RIQ = deployRoleTrack(track.meta.id, resumeState.tier || 'QGRA', resumeState.seed);
    }
    setTier(resumeState.tier || 'QGRA');
    setIntake(resumeState.intake || { name: '', email: '', org: '' });
    setTargetRole(resumeState.targetRole || '');
    setSeed(resumeState.seed);
    setDeployed(restored);
    setAnswers(resumeState.answers || {});
    setStepIndex(resumeState.stepIndex ?? 0);
    setPhase('running');
    setResumeState(null);
  };

  const discardResume = () => {
    clearCheckpoint(cpKind, user?.uid);
    setResumeState(null);
  };

  const steps = useMemo(() => {
    const base = buildModeSteps(mode, tier);
    if (!roleTrack) return base;
    const riq = riqModuleDef();
    const riqModule = roleTrack.meta.deployed[tier] ?? roleTrack.meta.deployed.QGRA;
    return [
      ...base,
      {
        id: 'RIQ',
        label: `${roleTrack.meta.label} Track`,
        module: 'RIQ',
        deployCount: Math.min(riqModule, roleTrack.meta.bank),
        timeMin: riq?.timeMin ?? 8,
        instructions: `Role Intelligence track: ${roleTrack.meta.label}. Applied role knowledge items.`,
      },
    ];
  }, [mode, tier, roleTrack]);

  const modules = useMemo(() => {
    const base = modulesForTier(tier);
    if (roleTrack && riqModuleDef()) return [...base, riqModuleDef()];
    return base;
  }, [tier, roleTrack]);

  const start = () => {
    const d = deployTier(tier, seed);
    if (roleTrack) d.RIQ = deployRoleTrack(roleTrack.meta.id, tier, seed);
    setDeployed(d);
    setAnswers({});
    setStepIndex(0);
    setPhase('running');
    if (user?.uid) logEvent(user.uid, 'enterprise_started', { tier });
  };

  const onChange = (itemId, value) => setAnswers(prev => ({ ...prev, [itemId]: value }));

  const totalItems = deployed ? deployedCount(deployed) : 0;
  const answeredItems = deployed
    ? Object.entries(deployed).reduce((s, [id, items]) => s + moduleAnsweredCount(items, answers), 0)
    : 0;

  const submit = async () => {
    const roleIds = mode === 'role' && targetRole ? [targetRole] : undefined;
    const res = evaluateEnterpriseAssessment(mode, tier, deployed, answers, intake, roleIds, roleTrack?.meta.id);
    setResult(res);
    setPhase('done');
    clearCheckpoint(cpKind, user?.uid);
    if (!user?.uid) return;
    logEvent(user.uid, 'enterprise_complete', { tier });
    try {
      // Compact persistence: the seeded deployment is fully reproducible from
      // {tier, targetRole, seed}, so we store only the id sequence + answers.
      // Avoids ballooning docs toward the 1MB Firestore ceiling (QLIA + RIQ).
      const deployedIds = Object.fromEntries(
        Object.entries(deployed || {}).map(([mid, items]) => [mid, items.map(i => i.id)]),
      );
      await saveEnterpriseResult(user.uid, {
        tier, mode, intake, targetRole, roleIds,
        seed, deployedIds, answers, result: res,
      });
    } catch (e) {
      console.error('Failed to persist enterprise result:', e);
    }
  };

  const restart = () => {
    setResult(null);
    setDeployed(null);
    setPhase('setup');
    setAnswers({});
    clearCheckpoint(cpKind, user?.uid);
  };

  // ── SETUP ───────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const Icon = MODE_ICONS[mode] || Building2;
    return (
      <div className="page-pad max-w-[1400px] mx-auto animate-fade pb-24 md:pb-16">
        <section className="mb-12 fade-up">
          <div className="flex items-center gap-3 mb-3">
            <Icon size={14} className="text-primary" />
            <span className="kicker">{mode === 'role' ? 'Role Intelligence' : 'Enterprise Assessment'}</span>
          </div>
          <h1 className="text-headline-md font-headline-md text-on-background page-headline">
            {mode === 'role' ? 'Role Fit Assessment' : 'Professional Intelligence Assessment'}
          </h1>
          <p className="text-body-md text-surface-variant max-w-2xl mt-4 leading-relaxed">
            {mode === 'role'
              ? 'QGRA battery with a role-specific track generating your Role Fit Index across 8 competency dimensions.'
              : 'Tier-based professional intelligence assessment with adaptive difficulty, PII scoring, work style profiling and role recommendations.'}
          </p>
          <div className="gradient-rule mt-6 max-w-2xl" />
        </section>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-10 items-start">
          <div className="min-w-0">
        <section className="mb-10 fade-up" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="kicker">Select Battery</span>
            </div>
            <div className="text-technical-sm font-technical-sm text-surface-variant">{tier} battery</div>
          </div>
          {/* Resume banner — shown when an in-progress session exists */}
          {resumeState && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border-[0.5px] border-primary/40 bg-primary/5">
              <div className="flex-1">
                <div className="text-label-md font-label-md text-on-surface">Unfinished session found</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">
                  Saved {new Date(resumeState.savedAt).toLocaleString()} — {resumeState.tier} battery, section {String((resumeState.stepIndex ?? 0) + 1).padStart(2, '0')}. Continue where you left off.
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={resumeSession} className="px-4 py-2 btn-primary !py-2 !text-[12px]">
                  Resume
                </button>
                <button onClick={discardResume} className="px-4 py-2 btn-outline !py-2 !text-[12px]">
                  Discard
                </button>
              </div>
            </div>
          )}

          <div className="gradient-rule mb-6" />
          <div className="grid md:grid-cols-3 gap-4">
            {ENTERPRISE_TIERS.map((t, ti) => {
              const selected = tier === t.id;
              const count = modulesForTier(t.id).reduce((s, m) => s + m.deployed, 0);
              const mins = modulesForTier(t.id).reduce((s, m) => s + m.timeMin, 0);
              return (
                <button key={t.id}
                  onClick={() => setTier(t.id)}
                  aria-pressed={selected}
                  style={{ animationDelay: `${120 + ti * 60}ms` }}
                  className={`relative text-left p-5 md:p-6 card card-hover fade-up cursor-pointer transition-all duration-200 ${selected ? 'card-gold' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-label-md font-label-md tracking-widest ${selected ? 'text-primary' : 'text-on-background'}`}>{t.id}</div>
                    {selected && (
                      <span className="chip" style={{ background: 'var(--gold-soft)', color: 'var(--color-primary)', borderColor: 'var(--gold-line-strong)' }}>
                        <Check size={12} /> Selected
                      </span>
                    )}
                  </div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant leading-relaxed mb-4">{t.desc}</div>
                  <div className="flex items-center justify-between">
                    <span className={`text-technical-sm font-technical-sm ${selected ? 'text-primary' : 'text-surface-variant'}`}>{count} items · ~{mins} min</span>
                    <span className="text-technical-sm font-technical-sm text-outline">×{t.scaling}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {modulesForTier(tier).map(m => (
              <span key={m.id} className="chip">{m.id} <span className="text-primary/80">· {m.deployed}</span></span>
            ))}
          </div>
        </section>

        <section className="mb-10 fade-up" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="kicker">Candidate Details</span>
          </div>
          <div className="gradient-rule mb-6" />
          <div className="grid md:grid-cols-3 gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-technical-sm font-technical-sm text-surface-variant">Full name <span className="text-primary">*</span></span>
              <input value={intake.name} onChange={e => setIntake({ ...intake, name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                className="px-4 py-3 rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest text-body-md text-on-background outline-none focus:border-primary placeholder:text-outline" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-technical-sm font-technical-sm text-surface-variant">Email <span className="text-outline">(optional)</span></span>
              <input value={intake.email} onChange={e => setIntake({ ...intake, email: e.target.value })}
                placeholder="you@org.com" type="email"
                className="px-4 py-3 rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest text-body-md text-on-background outline-none focus:border-primary placeholder:text-outline" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-technical-sm font-technical-sm text-surface-variant">Organisation <span className="text-outline">(optional)</span></span>
              <input value={intake.org} onChange={e => setIntake({ ...intake, org: e.target.value })}
                placeholder="Company / institution"
                className="px-4 py-3 rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest text-body-md text-on-background outline-none focus:border-primary placeholder:text-outline" />
            </label>
          </div>
          {mode === 'role' && (
            <div className="mt-6">
              <div className="text-technical-sm font-technical-sm text-surface-variant mb-3">Target role <span className="text-outline">(optional — scopes RFI and deploys a RIQ track)</span></div>
              <div className="flex flex-col gap-3">
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)}
                  className="px-4 py-3 rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest text-body-md text-on-background outline-none focus:border-primary cursor-pointer w-full md:w-1/2">
                  <option value="">All 11 roles</option>
                  {ROLE_PROFILES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {roleTrack && (
                  <div className="flex items-center gap-2 w-full md:w-1/2 px-3.5 py-2.5 rounded-full border-[0.5px] border-primary/40 bg-primary/10 text-technical-sm font-technical-sm text-primary">
                    <Target size={13} /> RIQ track: {roleTrack.meta.label} · {Math.min(roleTrack.meta.deployed[tier] ?? 8, roleTrack.meta.bank)} items
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="fade-up flex flex-col md:flex-row md:items-center gap-5" style={{ animationDelay: '260ms' }}>
          <button onClick={start} disabled={!intake.name.trim()}
            className="btn-primary glow w-full md:w-auto">
            BEGIN ASSESSMENT <ArrowRight size={14} />
          </button>
          <div className="flex flex-col gap-1">
            <div className="text-technical-sm font-technical-sm text-surface-variant">
              {tier} · {modules.reduce((s, m) => s + (m.id === 'RIQ' && roleTrack ? Math.min(roleTrack.meta.deployed[tier] ?? 8, roleTrack.meta.bank) : m.deployed), 0)} items · est. {modules.reduce((s, m) => s + m.timeMin, 0)} min
            </div>
            <div className="text-technical-sm font-technical-sm text-outline">
              {intake.name.trim() ? 'Ready to begin — take your time, answers are saved per section.' : 'Enter your full name to enable the assessment.'}
            </div>
          </div>
        </div>
          </div>

          <aside className="hidden lg:block fade-up" style={{ animationDelay: '220ms' }}>
            <div className="sticky top-24 space-y-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={14} className="text-primary" />
                  <span className="kicker">Assessment Brief</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-technical-sm font-technical-sm text-surface-variant">Battery</span>
                    <span className="chip">{tier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-technical-sm font-technical-sm text-surface-variant">Items</span>
                    <span className="text-technical-sm font-technical-sm text-on-background">
                      {modules.reduce((s, m) => s + (m.id === 'RIQ' && roleTrack ? Math.min(roleTrack.meta.deployed[tier] ?? 8, roleTrack.meta.bank) : m.deployed), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-technical-sm font-technical-sm text-surface-variant">Est. time</span>
                    <span className="text-technical-sm font-technical-sm text-on-background">~{modules.reduce((s, m) => s + m.timeMin, 0)} min</span>
                  </div>
                </div>
                <div className="gradient-rule my-4" />
                <div className="flex flex-wrap gap-2">
                  {modules.map(m => (
                    <span key={m.id} className="chip">
                      {m.id} <span className="text-primary/80">· {m.id === 'RIQ' && roleTrack ? Math.min(roleTrack.meta.deployed[tier] ?? 8, roleTrack.meta.bank) : m.deployed}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={14} className="text-primary" />
                  <span className="kicker">You'll receive</span>
                </div>
                <ul className="space-y-3">
                  {[
                    'Professional Intelligence Index (PII)',
                    'Work Style Profile',
                    'Role Fit Index (RFI)',
                    ...(modules.some(m => m.id === 'RIQ') ? ['Role Intelligence Quotient (RIQ)'] : []),
                  ].map(label => (
                    <li key={label} className="flex items-center gap-2.5 text-body-md text-on-background">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                        <Check size={11} />
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return <EnterpriseResults result={result} deployed={deployed} answers={answers} onRestart={restart} />;
  }

  // ── RUNNING / REVIEW ────────────────────────────────────────────────────────
  const currentStep = steps[stepIndex];
  const currentModule = currentStep?.module ? moduleDef(currentStep.module) : null;
  const currentItems = currentModule ? deployed?.[currentModule.id] ?? [] : [];
  const stepComplete = currentModule ? moduleComplete(currentModule, currentItems, answers) : true;
  const allComplete = deployed ? assessmentComplete(modules, deployed, answers) : false;

  const goNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex(i => i + 1);
    else setPhase('review');
  };

  const goBack = () => {
    if (phase === 'review' || stepIndex > 0) {
      setPhase('running');
      setStepIndex(Math.max(0, stepIndex - 1));
    }
  };

  const progressPct = totalItems ? Math.round((answeredItems / totalItems) * 100) : 0;

  const header = (
    <section className="mb-8 md:mb-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button onClick={() => { setResult(null); setPhase('setup'); }}
          className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
          <ArrowLeft size={14} /> Exit
        </button>
        <div className="flex items-center gap-3 text-technical-sm font-technical-sm text-surface-variant">
          <span className="flex items-center gap-1"><ClipboardList size={13} /> {answeredItems}/{totalItems}</span>
          <span>{tier}</span>
        </div>
      </div>
      <div className="h-[6px] rounded-full bg-surface-container-high overflow-hidden mb-6">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--gold-bright), var(--gold))' }} />
      </div>
      {/* Step markers */}
      <div className="flex items-center gap-2 mb-7" aria-label="Section progress">
        {steps.map((step, i) => {
          const mod = step.module ? moduleDef(step.module) : null;
          const items = mod ? deployed?.[mod.id] ?? [] : [];
          const done = mod ? items.length > 0 && moduleComplete(mod, items, answers) : false;
          const current = phase === 'running' && i === stepIndex;
          return (
            <button key={step.id} onClick={() => { setPhase('running'); setStepIndex(i); }}
              aria-label={`${step.label}${done ? ' complete' : ''}`} aria-current={current ? 'step' : undefined}
              title={step.label}
              style={{ background: done ? 'linear-gradient(90deg, var(--gold-bright), var(--gold))' : undefined }}
              className={`flex items-center justify-center gap-1 h-7 flex-1 rounded-full transition-all duration-300 cursor-pointer border-none p-0 text-technical-sm font-technical-sm ${done ? 'text-on-primary' : current ? 'bg-primary/20 text-primary ring-1 ring-primary/60' : 'bg-surface-container-high text-surface-variant hover:bg-surface-variant/50'}`}>
              {done ? <Check size={11} /> : i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0">
          {String(stepIndex + 1).padStart(2, '0')}
        </span>
        <h2 className="text-headline-md font-headline-md text-on-background">{phase === 'review' ? 'Review & Submit' : (currentModule?.label || currentStep?.label)}</h2>
        {currentModule && <span className="chip flex-shrink-0">{currentModule.id}</span>}
      </div>
      <div className="text-body-md text-surface-variant leading-relaxed">
        {phase === 'review'
          ? 'Confirm your answers and submit to generate your performance intelligence profile.'
          : (currentStep?.instructions || `${currentItems.length} items · ~${currentModule?.timeMin} min. Answer all items to continue.`)}
      </div>
      <div className="gradient-rule mt-5" />
    </section>
  );

  if (phase === 'review') {
    return (
      <div className="page-pad max-w-[1360px] mx-auto animate-fade pb-24 md:pb-16">
        {header}
        {allComplete && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-full border-[0.5px] border-emerald-500/40 bg-emerald-500/10 text-technical-sm font-technical-sm text-emerald-400">
            <Check size={14} /> All {totalItems} items answered — ready to submit.
          </div>
        )}
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const mod = step.module ? moduleDef(step.module) : null;
            const items = mod ? deployed?.[mod.id] ?? [] : [];
            const answered = moduleAnsweredCount(items, answers);
            const done = mod ? moduleComplete(mod, items, answers) : true;
            return (
              <button key={step.id}
                onClick={() => { setPhase('running'); setStepIndex(i); }}
                className="card card-hover flex items-center justify-between gap-4 p-4 md:p-5 cursor-pointer bg-transparent touch-target text-left">
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-technical-sm font-technical-sm flex-shrink-0 ${done ? 'bg-primary text-on-primary' : 'border-[0.5px] border-outline-variant text-surface-variant'}`}>
                    {done ? <Check size={13} /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="text-label-md font-label-md text-on-background">{mod?.label || step.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant">{answered}/{items.length} answered</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`chip ${done ? '' : ''}`} style={done ? { background: 'var(--status-ok-tint)', color: 'var(--status-ok-soft)', borderColor: 'var(--status-ok-line)' } : undefined}>
                    {done ? 'COMPLETE' : 'IN PROGRESS'}
                  </span>
                  <ArrowRight size={14} className="text-surface-variant flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col md:flex-row md:items-center gap-4">
          <button onClick={goBack} className="btn-outline w-full md:w-auto">
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={submit} disabled={!allComplete} className="btn-primary glow w-full md:w-auto">
            GENERATE PROFILE <Check size={14} />
          </button>
          {!allComplete && <span className="text-technical-sm font-technical-sm text-amber-400/90">Answer all items to submit.</span>}
        </div>
      </div>
    );
  }

  // running
  return (
    <div className="page-pad max-w-[1360px] mx-auto animate-fade pb-24 md:pb-16">
      {header}
      <RunnerItems module={currentModule} items={currentItems} answers={answers} onChange={onChange} />
      <div className="mt-10 flex items-center justify-between">
        <button onClick={goBack} disabled={stepIndex === 0} className="btn-outline w-full sm:w-auto">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-technical-sm font-technical-sm text-surface-variant hidden sm:block">
          Section {String(stepIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </div>
        <button onClick={goNext} className={`w-full sm:w-auto ${stepComplete ? 'btn-primary glow' : 'btn-outline'}`}>
          {stepIndex === steps.length - 1 ? 'Review answers' : 'Next section'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
