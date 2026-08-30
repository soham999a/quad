import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Sparkles, GraduationCap, Briefcase, Users, Target, Building2, Microscope } from 'lucide-react';
import { Wordmark } from '../../components/PublicShell';
import { useAuth } from '../../context/AuthContext';
import { getOnboarding, saveOnboarding, completeOnboarding, ONBOARDING_DEFAULT } from '../../services/onboardingService';
import { postOnboardingDestination } from '../../lib/flow';
import { getPlan, can } from '../../core/plans';

// ─── Wizard option catalogues ────────────────────────────────────────────────

const CONTEXTS = [
  { id: 'individual', label: 'Individual', icon: Sparkles, desc: 'Personal growth and a longitudinal capability baseline.' },
  { id: 'school', label: 'School / College', icon: GraduationCap, desc: 'Classrooms, cohorts, and age-banded development.' },
  { id: 'corporate', label: 'Corporate', icon: Building2, desc: 'Teams, leaders, and evidence-based hiring.' },
  { id: 'interview', label: 'Interview', icon: Microscope, desc: 'Structured, evidence-based interview intelligence.' },
];

const PERSONAS = {
  individual: [
    { id: 'individual', label: 'Individual', icon: Sparkles, desc: 'Personal development journey' },
    { id: 'student', label: 'Student', icon: GraduationCap, desc: 'School or college learner' },
  ],
  school: [
    { id: 'teacher', label: 'Teacher', icon: Users, desc: 'Manage classes and assessments' },
    { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Join a class and develop' },
    { id: 'evaluator', label: 'Evaluator', icon: Microscope, desc: 'Assess and guide others' },
  ],
  corporate: [
    { id: 'employer', label: 'Employer', icon: Building2, desc: 'Hiring and talent intelligence' },
    { id: 'individual', label: 'Individual', icon: Sparkles, desc: 'Personal development journey' },
  ],
  interview: [
    { id: 'evaluator', label: 'Interviewer', icon: Microscope, desc: 'Run structured interviews' },
    { id: 'individual', label: 'Candidate', icon: Target, desc: 'Prepare evidence of readiness' },
  ],
};

const GOALS = {
  default: [
    { id: 'career', label: 'Career clarity', icon: Briefcase, desc: 'Which roles and paths match my profile.' },
    { id: 'growth', label: 'Personal growth', icon: Sparkles, desc: 'Understand strengths and development areas.' },
    { id: 'academic', label: 'Academic guidance', icon: GraduationCap, desc: 'Learning styles and academic potential.' },
    { id: 'general', label: 'General exploration', icon: Target, desc: 'A complete intelligence blueprint.' },
  ],
  teacher: [
    { id: 'cohort', label: 'Run a cohort', icon: Users, desc: 'Establish baselines and track growth.' },
    { id: 'monitor', label: 'Monitor progress', icon: Microscope, desc: 'Watch class-level analytics over time.' },
  ],
  employer: [
    { id: 'deploy', label: 'Deploy a battery', icon: Building2, desc: 'Assess candidates against a tier + role.' },
    { id: 'benchmark', label: 'Benchmark talent', icon: Target, desc: 'Compare candidates and cohort insight.' },
  ],
  evaluator: [
    { id: 'scoring', label: 'Score assessments', icon: Check, desc: 'Rubric and evaluator scoring.' },
    { id: 'interviews', label: 'Run interviews', icon: Microscope, desc: 'Structured interview studio.' },
  ],
};

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', tag: 'current', audience: 'individual',
    features: ['One assessment cycle', 'Individual context', 'IQP summary report'],
    blurb: 'A complete baseline. The best place to begin.' },
  { id: 'pro', name: 'Pro', price: 'TBA', tag: 'proposed', audience: 'individual',
    features: ['Unlimited cycles', 'All contexts', 'Evidence portfolio', 'Credential export', 'Intervention plans'],
    blurb: 'The full development loop, longitudinal evidence, and a shareable credential.' },
  { id: 'school', name: 'School', price: 'TBA', tag: 'proposed', audience: 'institution',
    features: ['Cohorts & classes', 'Evaluator console', 'School analytics'],
    blurb: 'Run cohorts and watch class-level growth.' },
  { id: 'talent', name: 'Talent', price: 'Per assessment', tag: 'proposed', audience: 'employer',
    features: ['QGRA/QPIA/QLIA batteries', 'Role Fit + PIP', 'Cohort benchmark'],
    blurb: 'Evidence-based hiring with role fit and PIP.' },
];

const STEPS = ['Context', 'Role', 'Goal', 'Profile', 'Plan', 'Launch'];

function goalsFor(persona) {
  return GOALS[persona] || GOALS.default;
}

function personasFor(contextId) {
  return PERSONAS[contextId] || PERSONAS.individual;
}

function plansFor(persona, contextId) {
  if (persona === 'employer' || contextId === 'corporate') return PLANS.filter(p => p.id === 'talent');
  if (persona === 'teacher' || persona === 'evaluator') return PLANS.filter(p => p.id === 'school');
  return PLANS.filter(p => p.id === 'free' || p.id === 'pro');
}

// ─── Tiny shared UI atoms (design-system aligned) ────────────────────────────

function ChoiceGrid({ options, selected, onSelect }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = selected === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => onSelect(opt.id)}
            className={`relative text-left p-5 card card-hover cursor-pointer transition-all duration-200 ${active ? 'card-gold' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              {Icon && (
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-gold-soft' : 'bg-surface-container-high'}`}>
                  <Icon size={16} className={active ? 'text-gold' : 'text-muted-foreground'} />
                </span>
              )}
              <span className={`ml-auto h-[18px] w-[18px] shrink-0 rounded-sm border flex items-center justify-center ${active ? 'border-gold bg-gold' : 'border-border-strong'}`}>
                {active && <Check size={11} className="text-[var(--navy)]" />}
              </span>
            </div>
            <div className="mt-4 font-display text-[18px] text-on-surface">{opt.label}</div>
            <div className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ current }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo';
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className={`h-5 w-5 rounded-sm border flex items-center justify-center font-mono text-[10px] ${
                state === 'done' ? 'border-gold bg-gold text-[var(--navy)]'
                : state === 'active' ? 'border-gold text-gold'
                : 'border-border-strong text-muted-foreground'
              }`}>
                {state === 'done' ? <Check size={11} /> : String(i + 1).padStart(2, '0')}
              </span>
              <span className={`text-[11px] font-mono uppercase tracking-[0.12em] whitespace-nowrap ${state === 'active' ? 'text-on-surface' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border-strong" />}
          </div>
        );
      })}
    </div>
  );
}

function FieldHeading({ step, title }) {
  return (
    <div className="mb-6">
      <div className="label-eyebrow-gold mb-3">STEP {String(step + 1).padStart(2, '0')} — {STEPS[step].toUpperCase()}</div>
      <h1 className="font-display text-[30px] leading-tight md:text-[38px]">{title}</h1>
    </div>
  );
}

// ─── Wizard body (per step) ───────────────────────────────────────────────────

const STEP_VIEWS = {
  context: (s, set) => (
    <>
      <FieldHeading step={0} title={<>Where should development <span className="text-muted-foreground">begin?</span></>} />
      <p className="mb-8 max-w-xl text-[14px] leading-[1.75] text-muted-foreground">
        The context adjusts language, defaults, and modules. The underlying architecture — IQ, EQ, SQ, AQ — stays coherent.
      </p>
      <ChoiceGrid options={CONTEXTS} selected={s.contextId} onSelect={id => set({ ...s, contextId: id, persona: '', goalId: '' })} />
    </>
  ),
  role: (s, set) => (
    <>
      <FieldHeading step={1} title={<>Who are <span className="text-muted-foreground">you?</span></>} />
      <p className="mb-8 max-w-xl text-[14px] leading-[1.75] text-muted-foreground">
        Your role decides which console you land in and which tools are available.
      </p>
      <ChoiceGrid options={personasFor(s.contextId)} selected={s.persona} onSelect={id => set({ ...s, persona: id, goalId: '' })} />
    </>
  ),
  goal: (s, set) => (
    <>
      <FieldHeading step={2} title={<>What brings <span className="text-muted-foreground">you here?</span></>} />
      <p className="mb-8 max-w-xl text-[14px] leading-[1.75] text-muted-foreground">
        We'll tailor your first steps and defaults around your goal.
      </p>
      <ChoiceGrid options={goalsFor(s.persona)} selected={s.goalId} onSelect={id => set({ ...s, goalId: id })} />
    </>
  ),
  profile: (s, set) => (
    <>
      <FieldHeading step={3} title={<>Fine-tune your <span className="text-muted-foreground">baseline.</span></>} />
      <p className="mb-8 max-w-xl text-[14px] leading-[1.75] text-muted-foreground">
        A couple of quick details so the instrument is age-appropriate and purpose-driven.
      </p>
      {s.persona === 'individual' || s.persona === 'student' ? (
        <div className="space-y-8">
          <div>
            <div className="kicker mb-4">Age group</div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { id: '11-18', label: '11–18', desc: 'School / College student', icon: GraduationCap },
                { id: '19-32', label: '19–32', desc: 'Young professional', icon: Briefcase },
              ].map(ag => (
                <button key={ag.id} type="button" onClick={() => set({ ...s, ageGroup: ag.id })}
                  className={`text-left p-5 card card-hover cursor-pointer transition-all ${s.ageGroup === ag.id ? 'card-gold' : ''}`}>
                  <div className="font-display text-[18px]">{ag.label}</div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{ag.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="kicker mb-4">Assessment purpose</div>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { id: 'career', label: 'Career clarity', icon: Briefcase },
                { id: 'growth', label: 'Personal growth', icon: Sparkles },
                { id: 'academic', label: 'Academic guidance', icon: GraduationCap },
                { id: 'general', label: 'General exploration', icon: Target },
              ].map(p => (
                <button key={p.id} type="button" onClick={() => set({ ...s, purpose: p.id })}
                  className={`text-left p-5 card card-hover cursor-pointer transition-all ${s.purpose === p.id ? 'card-gold' : ''}`}>
                  <div className="font-display text-[18px]">{p.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground max-w-md leading-relaxed">
          Your context doesn't require an age-group baseline. We'll continue to the plan and launch.
        </p>
      )}
    </>
  ),
  plan: (s, set) => {
    const plans = plansFor(s.persona, s.contextId);
    return (
      <>
        <FieldHeading step={4} title={<>Choose a <span className="text-muted-foreground">starting plan.</span></>} />
        <p className="mb-8 max-w-xl text-[14px] leading-[1.75] text-muted-foreground">
          The core assessment is free. Upgrade unlocks the full development loop and shareable evidence.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {plans.map(plan => {
            const active = s.plan === plan.id;
            const planDef = getPlan(plan.id);
            return (
              <button key={plan.id} type="button" onClick={() => set({ ...s, plan: plan.id })}
                className={`text-left p-6 card card-hover cursor-pointer transition-all flex flex-col ${active ? 'card-gold' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[20px]">{planDef.name}</span>
                  <span className={`h-[18px] w-[18px] rounded-sm border flex items-center justify-center ${active ? 'border-gold bg-gold' : 'border-border-strong'}`}>
                    {active && <Check size={11} className="text-[var(--navy)]" />}
                  </span>
                </div>
                <div className="num text-[26px] mt-2">{planDef.priceLabel}</div>
                <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{plan.blurb}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {planDef.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <span className="text-gold mt-0.5">·</span>{f}
                    </li>
                  ))}
                </ul>
                {planDef.status === 'proposed' && (
                  <span className="status-proposed border border-border px-2 py-1 mt-4 self-start text-[10px]">IN DEVELOPMENT</span>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  },
  launch: (s) => {
    const slot = STEPS[5];
    const dest = postOnboardingDestination(s.persona, s.contextId);
    const planDef = getPlan(s.plan);
    return (
      <>
        <FieldHeading step={5} title={<>You're <span className="text-muted-foreground">set.</span></>} />
        <p className="mb-8 max-w-xl text-[14px] leading-[1.75] text-muted-foreground">
          Here's what happens next. You can change any of this later from Settings.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            ['Context', CONTEXTS.find(c => c.id === s.contextId)?.label || '—'],
            ['Role', s.persona || '—'],
            ['Goal', s.goalId || '—'],
            ['Age group', s.ageGroup || '—'],
            ['Plan', planDef.name],
            ['Destination', dest],
          ].filter(([, v]) => v && v !== '—').map(([k, v]) => (
            <div key={k} className="card p-5">
              <div className="kicker mb-2">{k}</div>
              <div className="font-display text-[18px] capitalize">{v}</div>
            </div>
          ))}
        </div>
      </>
    );
  },
};

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user, userProfile, refreshProfile, updateUserFields } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState(ONBOARDING_DEFAULT);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load persisted onboarding (resume) once.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getOnboarding(user.uid).then(saved => {
      if (cancelled) return;
      if (saved && !saved.completed) {
        setState(prev => ({ ...prev, ...saved }));
        const keys = ['contextId', 'persona', 'goalId', 'ageGroup', 'purpose', 'plan'];
        const firstEmpty = keys.findIndex(k => !saved[k]);
        if (saved.ageGroup && !saved.purpose) setStep(3);
        else setStep(firstEmpty === -1 ? 5 : firstEmpty);
      }
      setReady(true);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!user) { return null; } // ProtectedRoute handles redirect; brief guard
  if (!ready) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Loading</span>
      </div>
    );
  }

  const update = (next) => {
    setState(next);
    if (user) saveOnboarding(user.uid, next);
  };

  const canProceed = (() => {
    switch (step) {
      case 0: return !!state.contextId;
      case 1: return !!state.persona;
      case 2: return !!state.goalId;
      case 3: {
        if (state.persona !== 'individual' && state.persona !== 'student') return true;
        return !!state.ageGroup && !!state.purpose;
      }
      case 4: return !!state.plan;
      default: return true;
    }
  })();

  const handleNext = async () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    // Final step: commit role/context/plan to the user profile, mark complete, launch.
    setSaving(true); setError('');
    try {
      await updateProfileIfNeeded(state);
      await completeOnboarding(user.uid, state);
      await refreshProfile();
      navigate(postOnboardingDestination(state.persona, state.contextId), { replace: true });
    } catch (e) {
      setError(e.message || 'Could not finish onboarding.');
    } finally {
      setSaving(false);
    }
  };

  // Commit persona + context + plan + ageGroup onto the auth profile.
  const updateProfileIfNeeded = async (s) => {
    const current = userProfile || {};
    const patch = {};
    if (s.persona && current.role !== s.persona) patch.role = s.persona;
    if (s.contextId && current.context !== s.contextId) patch.context = s.contextId;
    if (s.plan && current.plan !== s.plan) patch.plan = s.plan;
    if (s.ageGroup && current.ageGroup !== s.ageGroup) patch.ageGroup = s.ageGroup;
    if (Object.keys(patch).length) await updateUserFields(user.uid, patch);
  };

  const skip = async () => {
    // Preserve any values already chosen; fill sensible defaults from the
    // auth profile so onboarding is never a trap.
    const next = {
      ...state,
      contextId: state.contextId || userProfile?.context || 'individual',
      persona: state.persona || userProfile?.role || 'individual',
      plan: state.plan || userProfile?.plan || 'free',
      completed: true,
    };
    setSaving(true);
    try {
      await updateProfileIfNeeded(next);
      await completeOnboarding(user.uid, next);
      await refreshProfile();
      navigate('/app/dashboard', { replace: true });
    } catch (e) {
      setError(e.message || 'Could not skip onboarding.');
    } finally {
      setSaving(false);
    }
  };

  const render = STEP_VIEWS[STEPS[step].toLowerCase()] || STEP_VIEWS.context;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="flex min-h-20 items-center justify-between border-b border-border px-6 lg:px-12">
        <Wordmark to="/mode" />
        <button type="button" onClick={skip} disabled={saving}
          className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-on-surface no-underline transition-colors cursor-pointer bg-transparent border-none">
          Skip for now
        </button>
      </header>
      <main className="mx-auto max-w-[980px] px-6 py-10 lg:px-12 lg:py-14">
        <Stepper current={step} />
        <div className="mt-10 animate-fade-up" key={step}>
          {render(state, update)}
        </div>
        {error && <p className="mt-6 text-[12px] font-mono text-error">{error}</p>}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <button type="button" onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className={`inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.14em] ${step === 0 ? 'text-muted-foreground/40' : 'text-muted-foreground hover:text-on-surface'} cursor-pointer bg-transparent border-none disabled:cursor-not-allowed`}>
            <ArrowLeft size={14} /> Back
          </button>
          <button type="button" onClick={handleNext} disabled={!canProceed || saving}
            className={`btn-primary no-underline ${(!canProceed || saving) ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {saving ? 'Finishing…' : step === STEPS.length - 1 ? 'Launch' : 'Continue'} <ArrowRight size={15} />
          </button>
        </div>
      </main>
    </div>
  );
}
