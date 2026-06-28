import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const DIMENSIONS = [
  {
    num: 'DIMENSION 01', title: 'Cognitive Depth', color: 'text-primary',
    accent: 'bg-primary', desc: 'The architecture of logic and abstract reasoning. Evaluating the speed, accuracy, and structural integrity of complex problem solving.'
  },
  {
    num: 'DIMENSION 02', title: 'Emotional Resonance', color: 'text-secondary',
    accent: 'bg-secondary', desc: 'Internal regulation and situational empathy. Measuring the capacity to navigate high-stakes stress while maintaining relational clarity.'
  },
  {
    num: 'DIMENSION 03', title: 'Social Synthesis', color: 'text-surface-variant',
    accent: 'bg-surface-variant', desc: 'Collaborative intelligence. Assessing the ability to integrate diverse viewpoints into a singular, actionable strategic outcome.'
  },
  {
    num: 'DIMENSION 04', title: 'Adaptive Fluidity', color: 'text-outline',
    accent: 'bg-outline', desc: 'Learning agility in volatile environments. Quantifying the speed at which one unlearns obsolete data to adopt new frameworks.'
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

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-surface font-body-md antialiased">
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b-[0.5px] border-outline-variant h-20 flex justify-between items-center px-margin-mobile md:px-[80px]">
        <div className="flex items-center gap-12">
          <span className="text-headline-md font-headline-md font-medium text-primary tracking-tighter">QIDS</span>
          <div className="hidden md:flex gap-8">
            <a className="text-label-md font-label-md text-primary font-medium border-b border-primary pb-1" href="#problem">I | ANALYTICS</a>
            <a className="text-label-md font-label-md text-on-surface-variant font-medium hover:text-primary transition-colors" href="#dimensions">II | ARCHIVE</a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="hidden md:block text-label-md font-label-md text-on-surface-variant hover:text-on-surface transition-colors no-underline">Sign In</Link>
          <Link to="/signup">
            <button className="bg-primary text-on-primary px-6 py-3 rounded-xl text-label-md font-label-md font-semibold hover:opacity-90 transition-all active:scale-95 cursor-pointer border-none">
              BEGIN ASSESSMENT
            </button>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header className="relative min-h-screen flex flex-col justify-center items-center text-center px-margin-mobile overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <p className="text-technical-sm font-technical-sm text-primary mb-6 tracking-[0.2em] uppercase">Architecture of the Mind</p>
          <h1 className="text-display-xl font-display-xl text-on-surface mb-8 leading-[1.05]">
            Intelligence Has Been Measured Wrong.{' '}
            <span className="text-primary italic">Until Now.</span>
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Four dimensions. One score. Cognitive, Emotional, Social, Adaptive. A new blueprint for human potential.
          </p>
          <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="editorial-rule hidden md:block w-32 self-center bg-primary"></div>
            <span className="text-technical-sm font-technical-sm self-center">SCROLL TO EXPLORE 01 — 04</span>
            <div className="editorial-rule hidden md:block w-32 self-center"></div>
          </div>
        </div>
      </header>

      <main className="space-y-32 md:space-y-64 pb-64">
        {/* I | THE PROBLEM */}
        <section className="px-margin-mobile md:px-[80px] mx-auto" id="problem" style={{ maxWidth: '1440px' }}>
          <div className="flex flex-col md:flex-row gap-12 md:gap-24">
            <div className="md:w-1/3">
              <span className="text-technical-sm font-technical-sm text-primary mb-4 block">01 / 04</span>
              <h2 className="text-headline-md font-label-md uppercase tracking-widest text-on-surface">I | THE PROBLEM</h2>
            </div>
            <div className="md:w-2/3 space-y-8">
              <h3 className="text-headline-lg font-headline-lg text-on-surface leading-tight">The IQ test is a relic of the industrial age. It measures logic in a vacuum, ignoring the fluid complexities of the modern world.</h3>
              <div className="editorial-rule"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <p className="text-body-md font-body-md text-on-surface-variant">Standard assessments prioritize rote pattern recognition over real-world adaptability. They fail to capture the nuances of collaborative intelligence and the emotional resilience required for leadership.</p>
                <p className="text-body-md font-body-md text-on-surface-variant">In an era of artificial intelligence, human value lies not in calculation, but in the intersection of emotional depth and adaptive reasoning. QIDS maps this new territory.</p>
              </div>
            </div>
          </div>
        </section>

        {/* II | THE FOUR DIMENSIONS */}
        <section className="px-margin-mobile md:px-[80px] mx-auto" id="dimensions" style={{ maxWidth: '1440px' }}>
          <div className="mb-24">
            <span className="text-technical-sm font-technical-sm text-primary mb-4 block">02 / 04</span>
            <h2 className="text-headline-md font-label-md uppercase tracking-widest text-on-surface">II | THE FOUR DIMENSIONS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 border-l-[0.5px] border-r-[0.5px] border-outline-variant">
            {DIMENSIONS.map(d => (
              <div key={d.num} className={`p-12 border-b-[0.5px] border-outline-variant ${d.num === 'DIMENSION 01' || d.num === 'DIMENSION 03' ? 'md:border-r-[0.5px]' : ''} group`}>
                <div className={`h-[2px] w-12 ${d.accent} mb-8 transition-all duration-500 group-hover:w-full`}></div>
                <span className={`text-technical-sm font-technical-sm ${d.color} block mb-2`}>{d.num}</span>
                <h4 className="text-headline-md font-headline-md text-on-surface mb-6">{d.title}</h4>
                <p className="text-body-md font-body-md text-on-surface-variant max-w-md">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* III | THE METHOD */}
        <section className="px-margin-mobile md:px-[80px] mx-auto" id="method" style={{ maxWidth: '1440px' }}>
          <div className="flex flex-col md:flex-row gap-24">
            <div className="md:w-1/3">
              <span className="text-technical-sm font-technical-sm text-primary mb-4 block">03 / 04</span>
              <h2 className="text-headline-md font-label-md uppercase tracking-widest text-on-surface">III | THE METHOD</h2>
              <div className="mt-16 sticky top-32">
                <div className="bg-surface-container-low p-8 border-[0.5px] border-outline-variant">
                  <div className="w-full h-auto mb-6 bg-surface-variant/30 flex items-center justify-center aspect-[4/3]">
                    <span className="text-technical-sm font-technical-sm text-on-surface-variant">Neural Mapping Diagram</span>
                  </div>
                  <p className="text-technical-sm font-technical-sm text-on-surface-variant italic">Figure 01 | Neural Mapping Protocol | QIDS Foundation</p>
                </div>
              </div>
            </div>
            <div className="md:w-2/3">
              <ul className="divide-y-[0.5px] divide-outline-variant">
                {PHASES.map(p => (
                  <li key={p.num} className="py-12 group">
                    <span className="text-technical-sm font-technical-sm text-primary block mb-4">{p.num}</span>
                    <h3 className="text-headline-md font-headline-md text-on-surface mb-6">{p.title}</h3>
                    <p className="text-body-md font-body-md text-on-surface-variant mb-8 leading-relaxed">{p.desc}</p>
                    <div className="text-technical-sm font-technical-sm text-outline uppercase tracking-widest">{p.meta}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* IV | THREE AUDIENCES */}
        <section className="px-margin-mobile md:px-[80px] mx-auto" id="audiences" style={{ maxWidth: '1440px' }}>
          <div className="mb-24 text-center">
            <span className="text-technical-sm font-technical-sm text-primary mb-4 block">04 / 04</span>
            <h2 className="text-headline-md font-label-md uppercase tracking-widest text-on-surface">IV | THREE AUDIENCES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AUDIENCES.map(a => (
              <div key={a.label} className="border-l-4 border-surface-variant p-8 bg-surface-container-lowest h-full flex flex-col">
                <span className="text-technical-sm font-technical-sm text-primary block mb-4">{a.label}</span>
                <h4 className="text-headline-md font-headline-md text-on-surface mb-6">{a.title}</h4>
                <p className="text-body-md font-body-md text-on-surface-variant mb-auto">{a.desc}</p>
                <a className="mt-8 text-label-md font-label-md text-primary flex items-center gap-2 group no-underline" href="#">
                  {a.cta}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="px-margin-mobile md:px-[80px] py-32 bg-primary text-on-primary text-center">
          <h2 className="text-display-xl font-display-xl mb-12">Determine Your Score.</h2>
          <Link to="/signup">
            <button className="bg-on-primary text-primary px-12 py-6 rounded-xl text-label-md font-label-md font-bold tracking-widest hover:bg-on-primary/90 transition-all uppercase cursor-pointer border-none">
              START QIDS ASSESSMENT
            </button>
          </Link>
          <p className="mt-8 text-technical-sm font-technical-sm opacity-60">Estimated Time: 51 Minutes | No Interruption Required</p>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-background border-t-[0.5px] border-outline-variant pt-24 pb-12 px-margin-mobile md:px-[80px]">
        <div className="mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-24" style={{ maxWidth: '1440px' }}>
          <div>
            <h5 className="text-label-md font-label-md text-primary mb-8">PLATFORM</h5>
            <ul className="space-y-4 text-technical-sm font-technical-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors no-underline" href="#">The Assessment</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Dimensions</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Enterprise</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Academic Use</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-label-md font-label-md text-primary mb-8">RESOURCES</h5>
            <ul className="space-y-4 text-technical-sm font-technical-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Methodology Paper</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Case Studies</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">API Docs</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-label-md font-label-md text-primary mb-8">COMPANY</h5>
            <ul className="space-y-4 text-technical-sm font-technical-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Our Ethos</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Terms of Service</a></li>
              <li><a className="hover:text-primary transition-colors no-underline" href="#">Contact</a></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-label-md font-label-md text-primary mb-8">MANIFESTO</h5>
            <p className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed">
              Intelligence is not a static quantity but a dynamic architecture. QIDS exists to map the invisible structures of human excellence.
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center border-t-[0.5px] border-outline-variant pt-8 text-technical-sm font-technical-sm text-on-surface-variant opacity-50">
          <span>© 2025 QIDS INTELLECTUAL SYSTEMS</span>
          <span className="mt-4 md:mt-0 tracking-[0.3em]">BEYOND IQ | BEYOND EQ</span>
        </div>
      </footer>
    </div>
  );
}
