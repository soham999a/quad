import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import QidsMark from '../components/QidsMark';
import { BackgroundGrid } from '../components/frame';

const DIMENSIONS = [
  {
    num: 'DIMENSION 01', title: 'Cognitive Depth', desc: 'The architecture of logic and abstract reasoning. Evaluating the speed, accuracy, and structural integrity of complex problem solving.'
  },
  {
    num: 'DIMENSION 02', title: 'Emotional Resonance', desc: 'Internal regulation and situational empathy. Measuring the capacity to navigate high-stakes stress while maintaining relational clarity.'
  },
  {
    num: 'DIMENSION 03', title: 'Social Synthesis', desc: 'Collaborative intelligence. Assessing the ability to integrate diverse viewpoints into a singular, actionable strategic outcome.'
  },
  {
    num: 'DIMENSION 04', title: 'Adaptive Fluidity', desc: 'Learning agility in volatile environments. Quantifying the speed at which one unlearns obsolete data to adopt new frameworks.'
  },
];

const PHASES = [
  {
    num: 'PHASE 01', title: 'Atmospheric Baseline',
    desc: 'We begin by establishing a neural baseline through a series of micro-decisions. This is not a test of knowledge, but a study of reaction. We measure latency, ocular focus, and the weight of your initial choices.',
    meta: 'Duration: 12m | Complexity: Low'
  },
  {
    num: 'PHASE 02', title: 'Stress Simulation',
    desc: 'Cognitive dimensions are pushed to their limits through recursive logic puzzles that introduce noise and contradictory data. Here, we measure your ability to filter signal from chaos.',
    meta: 'Duration: 24m | Complexity: Extreme'
  },
  {
    num: 'PHASE 03', title: 'The Synthesis Phase',
    desc: 'Final integration where all four dimensions are engaged simultaneously. You will navigate a simulated institutional crisis, requiring emotional maturity and social intelligence to resolve effectively.',
    meta: 'Duration: 15m | Complexity: High'
  },
];

const AUDIENCES = [
  {
    label: 'INDIVIDUALS', title: 'Personal Mastery',
    desc: 'Understand the specific mechanics of your cognitive advantage. Receive a detailed manuscript outlining your unique "Intelligence Blueprint" and strategies for lifelong evolution.',
    cta: 'EXPLORE SELF-MAP'
  },
  {
    label: 'INSTITUTIONS', title: 'Systemic Optimization',
    desc: 'Assemble teams based on dimensional harmony. Reduce cognitive friction by ensuring every node in your organization operates at peak collaborative resonance.',
    cta: 'REQUEST BRIEFING'
  },
  {
    label: 'RESEARCHERS', title: 'Cognitive Frontiers',
    desc: 'Access the QIDS anonymized data-lake to study the evolving nature of human intelligence in the 21st century. Contributing to the global record of potential.',
    cta: 'ACCESS ARCHIVE'
  },
];

const EASE = { transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' };

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-surface antialiased" style={{ fontFamily: 'Sora, sans-serif' }}>
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-surface/85 backdrop-blur-sm border-b border-outline-variant h-16 flex justify-between items-center px-6 md:px-10 lg:px-16">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <QidsMark size={22} className="text-[#B8924A]" />
          <span className="font-mono text-[12px] tracking-[0.28em] text-on-surface">QIDS</span>
        </Link>
        <div className="hidden md:flex gap-8">
          <a className="font-mono text-[11px] tracking-[0.18em] uppercase text-on-surface border-b border-[#B8924A] pb-0.5 no-underline" href="#problem">I · Problem</a>
          <a className="font-mono text-[11px] tracking-[0.18em] uppercase text-slate hover:text-on-surface transition-colors no-underline" href="#dimensions">II · Dimensions</a>
          <a className="font-mono text-[11px] tracking-[0.18em] uppercase text-slate hover:text-on-surface transition-colors no-underline" href="#method">III · Method</a>
          <a className="font-mono text-[11px] tracking-[0.18em] uppercase text-slate hover:text-on-surface transition-colors no-underline" href="#audiences">IV · Audiences</a>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/login" className="hidden md:block font-mono text-[11px] tracking-[0.14em] uppercase text-slate hover:text-on-surface transition-colors no-underline">Sign In</Link>
          <Link to="/signup" className="no-underline">
            <button className="bg-on-surface text-background px-5 py-2.5 rounded-sm font-mono text-[12px] tracking-[0.08em] hover:bg-[#B8924A] hover:text-ink transition-colors cursor-pointer border-none" style={EASE}>
              BEGIN
            </button>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header className="relative border-b border-outline-variant overflow-hidden">
        <BackgroundGrid />
        <div className="relative max-w-[1200px] mx-auto px-10 lg:px-16 pt-36 lg:pt-44 pb-28">
          <div className="flex items-center gap-3 mb-10">
            <span className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A]">QIDS · v1.0</span>
            <span className="h-px w-12 bg-[#B8924A]" />
            <span className="kicker !text-[11px]">Quadrant Intelligence Development System</span>
          </div>

          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 lg:col-span-8">
              <h1 className="text-5xl lg:text-7xl xl:text-[84px] font-extralight tracking-[-0.02em] leading-[0.98]">
                Intelligence Has Been
                <br />
                Measured Wrong.{' '}
                <span className="italic font-light text-[#B8924A]">Until Now.</span>
              </h1>
              <p className="mt-10 max-w-xl text-base lg:text-lg text-slate font-light leading-relaxed">
                Four dimensions. One score. Cognitive, Emotional, Social, Adaptive.
                A new blueprint for human potential — measured as an architecture,
                not a number.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/signup" className="no-underline">
                  <button className="group inline-flex items-center gap-3 bg-on-surface text-background px-5 py-3 rounded-sm text-sm tracking-wide hover:bg-[#B8924A] hover:text-ink transition-colors cursor-pointer border-none w-full sm:w-auto" style={EASE}>
                    Begin Assessment
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" style={EASE} />
                  </button>
                </Link>
                <a href="#method" className="no-underline">
                  <button className="inline-flex items-center gap-3 border border-on-surface text-on-surface px-5 py-3 rounded-sm text-sm tracking-wide hover:bg-on-surface hover:text-background transition-colors cursor-pointer bg-transparent w-full sm:w-auto" style={EASE}>
                    Explore the Method
                  </button>
                </a>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 lg:pl-8">
              <div className="border border-rule bg-surface p-6">
                <div className="kicker mb-4">Constitution · 01</div>
                <p className="text-sm leading-relaxed text-on-surface">
                  Capabilities before tests. Architecture before scores. Four dimensions
                  over one number. Evidence over intuition.
                </p>
                <div className="mt-6 pt-6 border-t border-rule flex items-center justify-between">
                  <span className="kicker">Status</span>
                  <span className="font-mono text-xs flex items-center gap-2 text-on-surface">
                    <span className="h-1.5 w-1.5 bg-[#B8924A]" />
                    4 dimensions · stable
                  </span>
                </div>
              </div>

              <div className="mt-4 border border-rule bg-surface p-6">
                <div className="kicker mb-4">Measured across</div>
                <ul className="text-sm space-y-2 text-on-surface">
                  {['Individuals — Intelligence Blueprint', 'Institutions — Team Harmony', 'Researchers — Anonymized Data-Lake'].map((p) => (
                    <li key={p} className="flex items-center justify-between gap-2 border-b border-rule last:border-0 pb-2 last:pb-0">
                      <span>{p}</span>
                      <ArrowRight size={13} className="opacity-40 -rotate-45" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto lg:px-16 px-10">
        {/* I | THE PROBLEM */}
        <section id="problem" className="grid grid-cols-12 gap-8 py-20 border-b border-outline-variant">
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] mb-3">§ 01</div>
              <h2 className="text-2xl lg:text-3xl font-light tracking-tight leading-tight">The Problem</h2>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <h3 className="text-2xl lg:text-4xl font-extralight tracking-tight leading-snug">
              The IQ test is a relic of the industrial age. It measures logic in a vacuum,
              ignoring the fluid complexities of the modern world.
            </h3>
            <div className="editorial-rule my-10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <p className="text-sm lg:text-base text-slate leading-relaxed">
                Standard assessments prioritize rote pattern recognition over real-world adaptability. They fail to capture the nuances of collaborative intelligence and the emotional resilience required for leadership.
              </p>
              <p className="text-sm lg:text-base text-slate leading-relaxed">
                In an era of artificial intelligence, human value lies not in calculation, but in the intersection of emotional depth and adaptive reasoning. QIDS maps this new territory.
              </p>
            </div>
          </div>
        </section>

        {/* II | THE FOUR DIMENSIONS */}
        <section id="dimensions" className="py-20 border-b border-outline-variant">
          <div className="mb-14">
            <div className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] mb-3">§ 02</div>
            <h2 className="text-3xl lg:text-4xl font-light tracking-tight leading-tight max-w-xl">Four dimensions. One architecture.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-outline-variant">
            {DIMENSIONS.map((d) => (
              <div key={d.num} className="border-r border-b border-outline-variant p-8 lg:p-10 group bg-surface/30 hover:bg-surface transition-colors" style={EASE}>
                <div className="h-px w-12 bg-[#B8924A] mb-7 transition-all duration-500 group-hover:w-full" style={EASE} />
                <span className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] block mb-2">{d.num}</span>
                <h4 className="text-xl lg:text-2xl font-light tracking-tight mb-4">{d.title}</h4>
                <p className="text-sm text-slate leading-relaxed max-w-md">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* III | THE METHOD */}
        <section id="method" className="grid grid-cols-12 gap-8 py-20 border-b border-outline-variant">
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] mb-3">§ 03</div>
              <h2 className="text-2xl lg:text-3xl font-light tracking-tight leading-tight">The Method</h2>
              <div className="mt-12 hidden lg:block">
                <div className="bg-surface border border-rule p-6">
                  <div className="w-full aspect-[4/3] mb-5 bg-surface-2/40 border border-rule flex items-center justify-center">
                    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-slate">Neural Mapping Diagram</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate italic">Figure 01 · Neural Mapping Protocol · QIDS Foundation</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <ul className="divide-y divide-outline-variant">
              {PHASES.map((p) => (
                <li key={p.num} className="py-12 first:pt-0 last:pb-0">
                  <span className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] block mb-4">{p.num}</span>
                  <h3 className="text-2xl lg:text-3xl font-extralight tracking-tight mb-5">{p.title}</h3>
                  <p className="text-sm lg:text-base text-slate mb-6 leading-relaxed max-w-2xl">{p.desc}</p>
                  <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-slate">{p.meta}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* IV | THREE AUDIENCES */}
        <section id="audiences" className="py-20">
          <div className="mb-14 flex items-end justify-between gap-8">
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] mb-3">§ 04</div>
              <h2 className="text-3xl lg:text-4xl font-light tracking-tight leading-tight max-w-xl">Three audiences. One system.</h2>
            </div>
            <p className="hidden lg:block max-w-sm text-sm text-slate leading-relaxed">
              The same four dimensions serve personal mastery, institutional design, and research — composed, never reinvented.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-outline-variant">
            {AUDIENCES.map((a) => (
              <div key={a.label} className="border-r border-b border-outline-variant p-8 lg:p-9 flex flex-col bg-surface/30 hover:bg-surface transition-colors" style={EASE}>
                <span className="font-mono text-[11px] tracking-[0.22em] text-[#B8924A] block mb-4">{a.label}</span>
                <h4 className="text-xl lg:text-2xl font-light tracking-tight mb-5">{a.title}</h4>
                <p className="text-sm text-slate leading-relaxed mb-auto">{a.desc}</p>
                <Link to="/signup" className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-on-surface border-b border-[#B8924A] pb-1 w-fit group no-underline hover:gap-3.5 transition-all" style={EASE}>
                  {a.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── CLOSING CTA ─── */}
      <section className="bg-ink text-bone">
        <div className="max-w-[1200px] mx-auto px-10 lg:px-16 py-28 flex flex-col items-center text-center">
          <QidsMark size={44} className="text-[#B8924A] mb-10" />
          <h2 className="text-3xl lg:text-5xl font-extralight tracking-tight max-w-2xl leading-snug">
            Determine your score. Understand your architecture.
          </h2>
          <Link to="/signup" className="mt-12 no-underline">
            <button className="bg-bone text-ink px-8 py-4 rounded-sm font-mono text-[12px] tracking-[0.14em] uppercase hover:bg-[#B8924A] hover:text-ink transition-colors cursor-pointer border-none" style={EASE}>
              Start QIDS Assessment
            </button>
          </Link>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4 font-mono text-[11px] tracking-[0.08em] text-bone/50">
            <span>Estimated time: 51 minutes · No interruption required</span>
            <span className="hidden md:inline h-1 w-1 bg-[#B8924A]" />
            <Link to="/login" className="text-[#B8924A] underline-offset-4 hover:underline no-underline">Already have an account? Sign in</Link>
          </div>
          <div className="mt-16 font-mono text-[11px] tracking-[0.32em] text-[#B8924A]">
            BEYOND IQ · BEYOND EQ
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-background border-t border-outline-variant pt-20 pb-10 px-10 lg:px-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div>
            <h5 className="kicker mb-6">Platform</h5>
            <ul className="space-y-3 font-mono text-[12px] text-slate">
              <li><a className="hover:text-on-surface transition-colors no-underline" href="#method">The Assessment</a></li>
              <li><a className="hover:text-on-surface transition-colors no-underline" href="#dimensions">Dimensions</a></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Enterprise</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Academic Use</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="kicker mb-6">Resources</h5>
            <ul className="space-y-3 font-mono text-[12px] text-slate">
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Methodology Paper</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Case Studies</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">API Docs</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Help Center</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="kicker mb-6">Company</h5>
            <ul className="space-y-3 font-mono text-[12px] text-slate">
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Our Ethos</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Privacy Policy</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Terms of Service</Link></li>
              <li><Link className="hover:text-on-surface transition-colors no-underline" to="/signup">Contact</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h5 className="kicker mb-6">Manifesto</h5>
            <p className="text-sm text-slate leading-relaxed">
              Intelligence is not a static quantity but a dynamic architecture. QIDS exists to map the invisible structures of human excellence.
            </p>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center border-t border-outline-variant pt-8 font-mono text-[11px] text-slate/70">
          <span>© 2025 QIDS INTELLECTUAL SYSTEMS</span>
          <span className="mt-4 md:mt-0 tracking-[0.3em]">BEYOND IQ · BEYOND EQ</span>
        </div>
      </footer>
    </div>
  );
}
