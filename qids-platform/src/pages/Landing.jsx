import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PublicShell, PublicFooter } from '../components/PublicShell';
import OpenFieldDiagram from '../components/OpenFieldDiagram';
import QidsMark from '../components/QidsMark';

const QUOTIENTS = [
  ['01', 'IQ', 'Cognitive intelligence', 'Reasoning, analysis, structured problem-solving, and synthesis.', 'var(--iq)'],
  ['02', 'EQ', 'Emotional intelligence', 'Self-awareness, empathy, regulation, and relational depth.', 'var(--eq)'],
  ['03', 'SQ', 'Social intelligence', 'Collaboration, citizenship, communication, and contextual judgment.', 'var(--sq)'],
  ['04', 'AQ', 'Adaptive intelligence', 'Resilience, learning agility, and response to ambiguity and change.', 'var(--aq)'],
];

const WINGS = [
  {
    index: '01',
    name: 'Individual',
    to: '/app/dashboard',
    description: 'Personal human development and longitudinal capability growth.',
    detail: 'Profile · evidence · practice · roadmap',
  },
  {
    index: '02',
    name: 'School',
    to: '/app/school',
    description: 'Cohorts, classes, and facilitation organized for age-banded learning journeys.',
    detail: 'Cohorts · curriculum · facilitation',
  },
  {
    index: '03',
    name: 'Interview',
    to: '/app/interview',
    description: 'Professional readiness and evidence-based interview intelligence.',
    detail: 'Context · behaviour · capability',
  },
];

const EXTENSIONS = [
  {
    eyebrow: 'ENTERPRISE · QGRA+',
    title: 'Teams, leaders, and organizational intelligence.',
    desc: 'Apply the four-quotient architecture across teams and leadership with tiered enterprise assessment.',
    cta: 'Open console',
    to: '/app/enterprise',
  },
  {
    eyebrow: 'TALENT CONSOLE · EVIDENCE-BASED HIRING',
    title: 'Capability, made legible.',
    desc: 'Read candidates as architectures — role fit and cohort insight beyond a single score.',
    cta: 'View console',
    to: '/app/talent',
  },
];

const CONTEXTS = [
  ['Individual', 'Personal development and self-directed growth.', 'CURRENT', '/app/dashboard'],
  ['School', 'Student, cohort, and facilitator context.', 'CURRENT', '/app/school'],
  ['Interview', 'Evidence-based professional readiness.', 'CURRENT', '/app/interview'],
  ['Enterprise', 'Teams, leaders, and L&D contexts.', 'CURRENT', '/app/enterprise'],
  ['College', 'Higher-education capability development.', 'IN DEVELOPMENT', null],
  ['Custom', 'A parameterized institutional configuration.', 'IN DEVELOPMENT', null],
];

const LOOP = ['Assessment', 'Evidence', 'Intervention', 'Practice', 'Reflection', 'Reassessment', 'Growth'];

const PIPELINE = [
  'Human', 'Assessment', 'Capability mapping', 'Evidence', 'AI analysis',
  'Development plan', 'Growth missions', 'Portfolio', 'Reassessment', 'Impact',
];

const DIFFERENTIATORS = [
  ['One architecture', 'Parameterized across contexts, instead of unrelated products.'],
  ['Evidence triangulation', 'Development is anchored in more than a single assessment moment.'],
  ['Bounded intelligence', 'AI supports synthesis while human judgement remains responsible for meaning.'],
  ['Status discipline', 'Established architecture stays distinct from proposed concepts and future research.'],
];

const FAQS = [
  ['How long does the assessment take?',
    'The core cycle takes about 20 minutes; the complete battery runs 40–60. Progress is checkpointed at every step — pause and resume exactly where you left off, on any device.'],
  ['Is this a clinical diagnosis?',
    'No. QiDS is a developmental instrument. It measures four capability quotients to inform learning and growth decisions — it is not a medical or psychological diagnostic device.'],
  ['Who can see my results?',
    'You do. A designated evaluator sees only what they need to score — nothing else. Publishing a public credential is opt-in, and even then it exposes only the profile you choose to seal.'],
  ['What are the four quotients?',
    'IQ (cognitive), EQ (emotional), SQ (social) and AQ (adaptive). They are read together as a shape rather than a single number — and that shape drives your development plan.'],
  ['What age range is supported?',
    'Instruments are age-banded from 8 to 60 — child through professional — so the same architecture serves classrooms and hiring panels alike.'],
  ['How much does it cost?',
    'The core assessment is free. Pro and Institution tiers — unlimited cycles, evidence portfolios, cohort analytics — are in active development.'],
];

/**
 * SampleRadar — hand-rolled SVG (no chart dependency in the eager bundle)
 * showing what a four-quotient profile looks like.
 */
function SampleRadar() {
  const C = 150, R = 100;
  const axes = [
    { key: 'IQ', v: 78, color: 'var(--iq)', lx: C, ly: C - R - 26, anchor: 'middle' },
    { key: 'EQ', v: 64, color: 'var(--eq)', lx: C + R + 24, ly: C + 4, anchor: 'start' },
    { key: 'SQ', v: 71, color: 'var(--sq)', lx: C, ly: C + R + 30, anchor: 'middle' },
    { key: 'AQ', v: 58, color: 'var(--aq)', lx: C - R - 24, ly: C + 4, anchor: 'end' },
  ];
  const pt = (i, val) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    const r = (val / 100) * R;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  const ring = (val) => axes.map((_, i) => pt(i, val).join(',')).join(' ');
  const poly = axes.map((ax, i) => pt(i, ax.v).join(',')).join(' ');
  return (
    <svg viewBox="0 0 300 300" width="100%" role="img" aria-label="Sample four-quotient radar profile: IQ 78, EQ 64, SQ 71, AQ 58">
      {[25, 50, 75, 100].map(v => (
        <polygon key={v} points={ring(v)} fill="none" stroke="var(--border)" strokeWidth="0.5" />
      ))}
      {axes.map((ax, i) => {
        const [x, y] = pt(i, 100);
        return <line key={ax.key} x1={C} y1={C} x2={x} y2={y} stroke="var(--border)" strokeWidth="0.5" />;
      })}
      <polygon points={poly} fill="var(--gold)" fillOpacity="0.16" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" />
      {axes.map((ax, i) => {
        const [x, y] = pt(i, ax.v);
        return <circle key={ax.key} cx={x} cy={y} r="3" fill="var(--gold)" />;
      })}
      {axes.map(ax => (
        <text key={ax.key} x={ax.lx} y={ax.ly} textAnchor={ax.anchor} fill={ax.color}
          style={{ font: '600 13px "Space Grotesk", sans-serif', letterSpacing: '0.06em' }}>
          {ax.key}
          <tspan fill="var(--muted-foreground, gray)" style={{ font: '500 10px "JetBrains Mono", monospace' }}> {ax.v}</tspan>
        </text>
      ))}
    </svg>
  );
}

/** SampleCredential — an in-brand mock of the verifiable public credential. */
function SampleCredential() {
  const rows = [['IQ', 78, 'var(--iq)'], ['EQ', 64, 'var(--eq)'], ['SQ', 71, 'var(--sq)'], ['AQ', 58, 'var(--aq)']];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <QidsMark size={16} className="text-gold" />
          <span className="font-mono text-[10px] tracking-[0.28em] text-on-surface">QiDS</span>
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-gold">● Verified</span>
      </div>
      <div className="mt-7 font-display text-[20px] text-on-surface">Sample Profile</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">Grade A · Exceptional</div>
      <div className="mt-6 flex-1 space-y-3.5">
        {rows.map(([k, v, c]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="w-6 font-mono text-[10px] font-bold" style={{ color: c }}>{k}</span>
            <span className="h-1.5 flex-1 overflow-hidden bg-surface-container-high">
              <span className="block h-full" style={{ width: `${v}%`, background: c }} />
            </span>
            <span className="w-6 text-right font-mono text-[11px] text-on-surface">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-7 border-t border-border pt-4 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-muted-foreground">
        SHA-256 · 9F2C41…8E1A<br />qids.app/credential/8F3K2M
      </div>
    </div>
  );
}

export default function Landing() {
  // Scroll reveal — sections rise into view as they enter the viewport.
  // Deliberately scroll-listener-based rather than IntersectionObserver:
  // IO callbacks can be withheld in throttled/occluded webviews, which would
  // leave sections stuck at opacity 0. A passive scroll check is deterministic
  // everywhere, and removes itself once every section is revealed.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('main > section'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach(el => el.classList.add('reveal-visible'));
      return undefined;
    }
    sections.forEach(el => el.classList.add('reveal'));

    let pending = sections.slice();
    let ticking = false;
    const check = () => {
      ticking = false;
      const vh = window.innerHeight;
      pending = pending.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          el.classList.add('reveal-visible');
          return false;
        }
        return true;
      });
      if (pending.length === 0) detach();
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(check); }
    };
    const detach = () => {
      window.removeEventListener('scroll', onScroll, { passive: true });
      window.removeEventListener('resize', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    check(); // reveal everything already in view at mount
    return detach;
  }, []);

  return (
    <PublicShell>
      <main>
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
          <div className="relative mx-auto grid max-w-[1440px] grid-cols-12 gap-6 px-6 pb-24 pt-20 lg:px-12 lg:pb-32 lg:pt-28">
            <div className="col-span-12 lg:col-span-6 lg:pt-8">
              <div className="label-eyebrow-gold mb-8">
                I · 01 — INTELLIGENCE · ARCHITECTURE · IMPACT
              </div>
              <h1 className="max-w-3xl font-display text-[52px] font-light leading-[0.98] tracking-[-0.04em] md:text-[76px] lg:text-[92px]">
                Human development,
                <br />
                <span className="text-muted-foreground">structured.</span>
              </h1>
              <p className="mt-10 max-w-xl text-[15px] leading-[1.75] text-muted-foreground md:text-[17px]">
                QiDS is infrastructure for human capability — connecting assessment, evidence,
                development, and longitudinal growth across people and institutions.
              </p>
              <div className="mt-12 flex flex-wrap items-center gap-3">
                <Link to="/mode" className="btn-primary no-underline">
                  Begin Assessment <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#architecture" className="btn-outline no-underline">
                  Explore Architecture <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-16 flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                <span>One architecture</span>
                <span>Four quotients</span>
                <span>Multiple contexts</span>
              </div>
            </div>
            <div className="col-span-12 flex items-center justify-center lg:col-span-6">
              <OpenFieldDiagram />
            </div>
          </div>
        </section>

        <section className="surface-bone border-b border-border">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-border px-6 lg:grid-cols-4 lg:px-12">
            {[
              ['IV', 'Quotients measured', 'IQ · EQ · SQ · AQ'],
              ['03', 'Product wings', 'Individual · School · Interview'],
              ['∞', 'Evidence over time', 'Assessment is the entry'],
              ['08–60', 'Designed age range', 'Child to professional'],
            ].map(([value, label, sub]) => (
              <div key={label} className="bg-background px-5 py-8 lg:px-8 lg:py-10">
                <div className="num text-[38px] text-gold">{value}</div>
                <div className="mt-3 text-[13px]">{label}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.13em] text-muted-foreground">
                  {sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="method" className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="section-index mb-5">II — METHOD</div>
              <h2 className="max-w-md font-display text-[38px] leading-[1.04] tracking-[-0.03em] lg:text-[52px]">
                Four quotients.
                <br />
                One coherent system.
              </h2>
              <p className="mt-7 max-w-md text-[14px] leading-[1.75] text-muted-foreground">
                Each quotient is a lens into capability. Together they create a structured view that
                can move from measurement into deliberate development.
              </p>
            </div>
            <div className="col-span-12 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:col-span-8">
              {QUOTIENTS.map(([index, key, title, desc, color]) => (
                <div key={key} className="bg-background p-7 lg:p-9">
                  <div className="flex items-start justify-between">
                    <span className="section-index">{index}</span>
                    <span className="font-display text-[30px]" style={{ color }}>{key}</span>
                  </div>
                  <div className="mt-8 text-[15px]">{title}</div>
                  <p className="mt-3 text-[13px] leading-[1.7] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="architecture" className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3">
              <div className="label-eyebrow-gold mb-5">III — ARCHITECTURE</div>
              <div className="font-display text-[30px] leading-tight">
                Assessment is the entry point.
              </div>
            </div>
            <div className="col-span-12 min-w-0 lg:col-span-9">
              <p className="max-w-3xl font-display text-[30px] leading-[1.2] text-muted-foreground lg:text-[42px]">
                Outputs become development inputs. Evidence accumulates. The system returns to the
                person with a clearer next action.
              </p>
              <div className="mt-16 overflow-x-auto border-y border-border py-7">
                <div className="flex min-w-[900px] items-center gap-0">
                  {PIPELINE.map((item, index) => (
                    <div key={item} className="flex items-center">
                      <div className="flex h-16 min-w-[104px] items-center border border-border px-3 text-[11px] font-mono uppercase tracking-[0.08em]">
                        {item}
                      </div>
                      {index < PIPELINE.length - 1 && (
                        <ArrowRight className="mx-2 h-3 w-3 shrink-0 text-gold" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-8 text-[13px] leading-[1.7] text-muted-foreground md:grid-cols-3">
                <div>
                  <span className="text-on-surface">Evidence</span>
                  <br />
                  Observable work, reflection, and context make capability legible over time.
                </div>
                <div>
                  <span className="text-on-surface">Human judgement</span>
                  <br />
                  AI is an internal capability bounded by human interpretation and responsibility.
                </div>
                <div>
                  <span className="text-on-surface">Longitudinal synthesis</span>
                  <br />
                  Progress is read across cycles rather than reduced to a single score.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="label-eyebrow-gold mb-5">IV — PRODUCT WINGS</div>
                <h2 className="font-display text-[38px] leading-tight lg:text-[52px]">
                  One architecture.
                  <br />
                  <span className="text-muted-foreground">Three primary contexts.</span>
                </h2>
              </div>
              <a href="#architecture"
                className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-on-surface no-underline transition-colors">
                Read the atlas →
              </a>
            </div>
            <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-3">
              {WINGS.map((wing) => (
                <Link key={wing.name} to={wing.to}
                  className="group bg-background p-8 no-underline transition-colors hover:bg-surface lg:min-h-[280px] lg:p-10">
                  <div className="flex items-start justify-between">
                    <span className="section-index">{wing.index}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  </div>
                  <div className="mt-20 font-display text-[28px] text-on-surface">{wing.name}</div>
                  <p className="mt-3 max-w-xs text-[13px] leading-[1.7] text-muted-foreground">
                    {wing.description}
                  </p>
                  <div className="mt-7 text-[10px] font-mono uppercase tracking-[0.13em] text-gold">
                    {wing.detail}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="section-index mb-5">V — EXTENSIONS</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">
                Development meets the organization.
              </h2>
              <p className="mt-6 max-w-sm text-[14px] leading-[1.7] text-muted-foreground">
                The same architecture extends into teams and hiring — where capability becomes
                organizational evidence.
              </p>
            </div>
            <div className="col-span-12 grid gap-px border border-border bg-border lg:col-span-8 lg:grid-cols-2">
              {EXTENSIONS.map((ext) => (
                <Link key={ext.eyebrow} to={ext.to} className="group bg-background p-8 no-underline lg:p-10">
                  <div className="label-eyebrow-gold">{ext.eyebrow}</div>
                  <div className="mt-12 font-display text-[26px] text-on-surface">{ext.title}</div>
                  <p className="mt-4 text-[13px] leading-[1.7] text-muted-foreground">{ext.desc}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-on-surface">
                    {ext.cta} <ArrowRight className="h-3.5 w-3.5 text-gold" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="profile" className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="label-eyebrow-gold mb-5">THE OUTPUT</div>
                <h2 className="font-display text-[38px] leading-tight lg:text-[52px]">
                  Not a score.
                  <br />
                  <span className="text-muted-foreground">An architecture of you.</span>
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-[1.7] text-muted-foreground">
                Every cycle produces a four-quotient profile, a grade, and a development plan — and a
                credential you can seal and share, verifiable by anyone with the link.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-5">
              <div className="bg-background p-8 lg:col-span-3 lg:p-14">
                <div className="label-eyebrow mb-6">SAMPLE PROFILE — FOUR QUOTIENTS</div>
                <div className="mx-auto max-w-[420px]">
                  <SampleRadar />
                </div>
              </div>
              <div className="bg-background p-8 lg:col-span-2 lg:p-10">
                <div className="label-eyebrow mb-6">SAMPLE CREDENTIAL</div>
                <SampleCredential />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="label-eyebrow-gold mb-5">VI — CONTEXTS</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">
                A parameterized system.
              </h2>
              <p className="mt-6 max-w-sm text-[14px] leading-[1.7] text-muted-foreground">
                The architecture stays coherent while language, defaults, and modules adapt to
                context.
              </p>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="divide-y divide-border border-y border-border">
                {CONTEXTS.map(([name, desc, status, to], index) => (
                  <div key={name} className="flex flex-col gap-2 py-5 md:grid md:grid-cols-12 md:items-center md:gap-4">
                    <div className="section-index md:col-span-1">0{index + 1}</div>
                    <div className="font-display text-[19px] md:col-span-4">
                      {to ? (
                        <Link to={to} className="hover:text-gold no-underline transition-colors">{name}</Link>
                      ) : (
                        <span>{name}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground md:col-span-7">
                      <span>{desc}</span>
                      <span className={status === 'CURRENT' ? 'status-current text-gold' : 'status-proposed'}>
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="section-index mb-5">VII — DEVELOPMENT LOOP</div>
            <h2 className="max-w-4xl font-display text-[38px] leading-[1.05] lg:text-[58px]">
              Measurement is the beginning.
              <br />
              <span className="text-muted-foreground">Development is the system.</span>
            </h2>
            <div className="mt-16 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4 lg:grid-cols-7">
              {LOOP.map((item, i) => (
                <div key={item} className="bg-background p-5">
                  <div className="section-index">0{i + 1}</div>
                  <div className="mt-8 font-display text-[17px]">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="label-eyebrow-gold mb-5">VIII — DIFFERENTIATORS</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">
                Architecture before features.
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="grid gap-0 border-y border-border">
                {DIFFERENTIATORS.map(([title, desc]) => (
                  <div key={title} className="grid gap-3 border-b border-border py-6 last:border-b-0 md:grid-cols-3">
                    <div className="font-display text-[18px]">{title}</div>
                    <div className="text-[13px] leading-[1.7] text-muted-foreground md:col-span-2">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="section-index mb-5">IX — ACCESS</div>
                <h2 className="font-display text-[38px] leading-tight lg:text-[52px]">
                  Simple entry.
                  <br />
                  <span className="text-muted-foreground">Scaled when you are.</span>
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-[1.7] text-muted-foreground">
                The core assessment is free. Paid tiers for power users and institutions are in
                development.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
              {[
                {
                  name: 'Free', price: '$0', status: 'CURRENT',
                  features: ['One assessment cycle', 'Individual context', 'IQP summary report'],
                },
                {
                  name: 'Pro', price: 'TBA', status: 'IN DEVELOPMENT',
                  features: ['Unlimited cycles', 'All contexts', 'Evidence portfolio', 'Credential export'],
                },
                {
                  name: 'Institution', price: 'TBA', status: 'IN DEVELOPMENT',
                  features: ['Cohorts & classes', 'Evaluator console', 'School analytics', 'Priority support'],
                },
              ].map((plan) => (
                <div key={plan.name} className="bg-background p-8 lg:p-10 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[22px]">{plan.name}</span>
                    <span className={plan.status === 'CURRENT' ? 'status-current text-gold' : 'status-proposed'}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="num text-[40px] mt-4">{plan.price}</div>
                  <ul className="mt-6 space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="text-[13px] text-muted-foreground flex items-start gap-2">
                        <span className="text-gold mt-0.5">·</span>{f}
                      </li>
                    ))}
                  </ul>
                  {plan.status === 'CURRENT' ? (
                    <Link to="/mode" className="btn-primary mt-8 no-underline">Begin Assessment</Link>
                  ) : (
                    <button type="button" disabled
                      className="btn-outline mt-8 !py-3 w-full cursor-not-allowed opacity-60">
                      Coming soon
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="label-eyebrow-gold mb-5">FAQ</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">
                Questions,<br />
                <span className="text-muted-foreground">answered plainly.</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="divide-y divide-border border-y border-border">
                {FAQS.map(([q, a]) => (
                  <details key={q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-[17px] text-on-surface transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
                      {q}
                      <span className="font-mono text-[16px] text-muted-foreground transition-transform duration-200 group-open:rotate-45">+</span>
                    </summary>
                    <p className="pb-6 pr-8 text-[13px] leading-[1.75] text-muted-foreground">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background px-6 py-28 text-center lg:px-12 lg:py-36">
          <div className="label-eyebrow-gold mb-6">X — BEGIN</div>
          <h2 className="mx-auto max-w-4xl font-display text-[44px] font-light leading-[1.03] tracking-[-0.03em] lg:text-[72px]">
            Start with a measure.
            <br />
            <span className="text-muted-foreground">Build toward impact.</span>
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link to="/mode" className="btn-primary no-underline">
              Begin Assessment <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#architecture" className="btn-outline no-underline">Explore Architecture</a>
          </div>
        </section>
      </main>
      <PublicFooter />
    </PublicShell>
  );
}
