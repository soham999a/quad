import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { Wordmark } from '../components/PublicShell';
import { useAuth } from '../context/AuthContext';

const MODES = [
  {
    id: 'individual',
    name: 'Individual',
    desc: 'Personal development and self-directed growth across all four quotients.',
    meta: 'Self-directed · active',
    status: 'CURRENT',
    to: '/app/dashboard',
  },
  {
    id: 'school',
    name: 'School',
    desc: 'Student development with age-banded learning, cohort view, and facilitator support.',
    meta: 'Ages 8–18 · active',
    status: 'CURRENT',
    to: '/app/school',
  },
  {
    id: 'interview',
    name: 'Interview',
    desc: 'Professional readiness through structured context, behavioural evidence, and capability mapping.',
    meta: 'Readiness · active',
    status: 'CURRENT',
    to: '/app/interview',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    desc: 'Enterprise assessment for teams, leaders, and learning & development programs.',
    meta: 'QGRA+ · active',
    status: 'CURRENT',
    to: '/app/enterprise',
  },
  {
    id: 'college',
    name: 'College',
    desc: 'A higher-education context for undergraduate and graduate capability development.',
    meta: 'Context in development',
    status: 'IN DEVELOPMENT',
    to: null,
  },
  {
    id: 'custom',
    name: 'Custom',
    desc: 'A future parameterized institutional configuration for distinct contexts and research.',
    meta: 'Context in development',
    status: 'IN DEVELOPMENT',
    to: null,
  },
];

export default function Mode() {
  const [selected, setSelected] = useState('individual');
  const navigate = useNavigate();
  const { user } = useAuth();
  const current = MODES.find((mode) => mode.id === selected) ?? MODES[0];
  const isAvailable = current.status === 'CURRENT';
  const handleContinue = () => {
    if (!current.to) return;
    navigate(user ? current.to : `/signup?context=${current.id}`);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="flex min-h-20 items-center justify-between border-b border-border px-6 lg:px-12">
        <Wordmark />
        <Link to="/"
          className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-on-surface no-underline transition-colors">
          ← Back to QiDS
        </Link>
      </header>
      <main className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-24">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4">
            <div className="label-eyebrow-gold mb-6">STEP 01 — SYSTEM CONTEXT</div>
            <h1 className="max-w-md font-display text-[42px] leading-[1.02] tracking-[-0.03em] lg:text-[58px]">
              Where should development begin?
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-[1.75] text-muted-foreground">
              The context adjusts language, defaults, and modules. The underlying architecture — IQ,
              EQ, SQ, AQ — stays coherent.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <div className="border-y border-border py-5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                <span>Choose one context</span>
                <span>01 / 03</span>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
                {MODES.map((mode) => {
                  const active = selected === mode.id;
                  const available = mode.status === 'CURRENT';
                  return (
                    <button key={mode.id} type="button" onClick={() => setSelected(mode.id)}
                      className={`relative bg-background p-6 text-left cursor-pointer transition-colors ${active ? 'ring-1 ring-inset ring-gold' : 'hover:bg-surface'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <span className={available ? 'status-current text-gold' : 'status-future'}>
                          {mode.status}
                        </span>
                        {available ? (
                          <span className={`flex h-4 w-4 items-center justify-center border ${active ? 'border-gold bg-gold' : 'border-border-strong'}`}>
                            {active && <Check className="h-3 w-3 text-[var(--navy)]" />}
                          </span>
                        ) : (
                          <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-10 font-display text-[23px]">{mode.name}</div>
                      <div className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">{mode.desc}</div>
                      <div className="mt-7 text-[10px] font-mono uppercase tracking-[0.13em] text-muted-foreground">
                        {mode.meta}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border py-8">
              <div>
                <div className="label-eyebrow mb-3">SELECTED CONTEXT</div>
                <div className="font-display text-[24px]">{current.name}</div>
                <div className="mt-2 text-[12px] text-muted-foreground">
                  {isAvailable
                    ? 'Ready to open the next development step.'
                    : 'This context is being designed and is not launchable yet.'}
                </div>
              </div>
              {isAvailable ? (
                <button onClick={handleContinue} className="btn-primary">
                  {user ? 'Continue' : 'Create account & continue'} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <span className="status-future border border-border px-4 py-3">Coming soon</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-24 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
          <div className="bg-background p-6">
            <div className="section-index">01</div>
            <div className="mt-8 font-display text-[19px]">One architecture</div>
            <p className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">
              Context changes the application, not the underlying development logic.
            </p>
          </div>
          <div className="bg-background p-6">
            <div className="section-index">02</div>
            <div className="mt-8 font-display text-[19px]">Evidence over time</div>
            <p className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">
              The assessment is the first signal in a longer cycle of practice and reflection.
            </p>
          </div>
          <div className="bg-background p-6">
            <div className="section-index">03</div>
            <div className="mt-8 font-display text-[19px]">Human judgement</div>
            <p className="mt-3 text-[12px] leading-[1.7] text-muted-foreground">
              The system supports interpretation; it does not pretend a future workflow is already
              complete.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
