import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PublicShell, PublicFooter } from '../components/PublicShell';
import HeroDiagram from '../components/HeroDiagram';
import ConstellationField from '../components/ConstellationField';
import LiveRadar from '../components/LiveRadar';
import QidsMark from '../components/QidsMark';

// ─── Content (unchanged copy) ────────────────────────────────────────────────
const QUOTIENTS = [['01', 'IQ', 'Cognitive intelligence', 'Reasoning, analysis, structured problem-solving, and synthesis.', 'var(--iq)'], ['02', 'EQ', 'Emotional intelligence', 'Self-awareness, empathy, regulation, and relational depth.', 'var(--eq)'], ['03', 'SQ', 'Social intelligence', 'Collaboration, citizenship, communication, and contextual judgment.', 'var(--sq)'], ['04', 'AQ', 'Adaptive intelligence', 'Resilience, learning agility, and response to ambiguity and change.', 'var(--aq)']];
const WINGS = [{
  index: '01',
  name: 'Individual',
  to: '/app/dashboard',
  description: 'Personal human development and longitudinal capability growth.',
  detail: 'Profile · evidence · practice · roadmap'
}, {
  index: '02',
  name: 'School',
  to: '/app/school',
  description: 'Cohorts, classes, and facilitation organized for age-banded learning journeys.',
  detail: 'Cohorts · curriculum · facilitation'
}, {
  index: '03',
  name: 'Interview',
  to: '/app/interview',
  description: 'Professional readiness and evidence-based interview intelligence.',
  detail: 'Context · behaviour · capability'
}];
const EXTENSIONS = [{
  eyebrow: 'ENTERPRISE · QGRA+',
  title: 'Teams, leaders, and organizational intelligence.',
  desc: 'Apply the four-quotient architecture across teams and leadership with tiered enterprise assessment.',
  cta: 'Open console',
  to: '/app/enterprise'
}, {
  eyebrow: 'TALENT CONSOLE · EVIDENCE-BASED HIRING',
  title: 'Capability, made legible.',
  desc: 'Read candidates as architectures — role fit and cohort insight beyond a single score.',
  cta: 'View console',
  to: '/app/talent'
}];
const CONTEXTS = [['Individual', 'Personal development and self-directed growth.', 'CURRENT', '/app/dashboard'], ['School', 'Student, cohort, and facilitator context.', 'CURRENT', '/app/school'], ['Interview', 'Evidence-based professional readiness.', 'CURRENT', '/app/interview'], ['Enterprise', 'Teams, leaders, and L&D contexts.', 'CURRENT', '/app/enterprise'], ['College', 'Higher-education capability development.', 'IN DEVELOPMENT', null], ['Custom', 'A parameterized institutional configuration.', 'IN DEVELOPMENT', null]];
const LOOP = ['Assessment', 'Evidence', 'Intervention', 'Practice', 'Reflection', 'Reassessment', 'Growth'];
const PIPELINE = ['Human', 'Assessment', 'Capability mapping', 'Evidence', 'AI analysis', 'Development plan', 'Growth missions', 'Portfolio', 'Reassessment', 'Impact'];
const DIFFERENTIATORS = [['One architecture', 'Parameterized across contexts, instead of unrelated products.'], ['Evidence triangulation', 'Development is anchored in more than a single assessment moment.'], ['Bounded intelligence', 'AI supports synthesis while human judgement remains responsible for meaning.'], ['Status discipline', 'Established architecture stays distinct from proposed concepts and future research.']];
const FAQS = [['How long does the assessment take?', 'The core cycle takes about 20 minutes; the complete battery runs 40–60. Progress is checkpointed at every step — pause and resume exactly where you left off, on any device.'], ['Is this a clinical diagnosis?', 'No. QiDS is a developmental instrument. It measures four capability quotients to inform learning and growth decisions — it is not a medical or psychological diagnostic device.'], ['Who can see my results?', 'You do. A designated evaluator sees only what they need to score — nothing else. Publishing a public credential is opt-in, and even then it exposes only the profile you choose to seal.'], ['What are the four quotients?', 'IQ (cognitive), EQ (emotional), SQ (social) and AQ (adaptive). They are read together as a shape rather than a single number — and that shape drives your development plan.'], ['What age range is supported?', 'Instruments are age-banded from 8 to 60 — child through professional — so the same architecture serves classrooms and hiring panels alike.'], ['How much does it cost?', 'The core assessment is free. Pro and Institution tiers — unlimited cycles, evidence portfolios, cohort analytics — are in active development.']];
const TICKER = ['ONE ARCHITECTURE', 'FOUR QUOTIENTS', 'IQ', 'EQ', 'SQ', 'AQ', 'EVIDENCE', 'DEVELOPMENT', 'GROWTH MISSIONS', 'REASSESSMENT', 'LONGITUDINAL SYNTHESIS', 'HUMAN JUDGEMENT', 'BOUNDED AI', 'CREDENTIAL', 'SHA-256 SEALED', '08–60 AGE-BANDED', 'INDIVIDUAL', 'SCHOOL', 'INTERVIEW', 'ENTERPRISE'];

/** Magnetic — CTA atoms that lean toward the pointer, then settle back. */
function Magnetic({
  children,
  strength = 0.28,
  className = ''
}) {
  const ref = useRef(null);
  const onMove = e => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  return <span ref={ref} className={className} onPointerMove={onMove} onPointerLeave={onLeave} style={{
    display: 'inline-flex',
    transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
  }}>
      {children}
    </span>;
}

/** SampleCredential — an in-brand mock of the verifiable public credential. */
function SampleCredential({
  tiltRef
}) {
  const {
    t
  } = useTranslation();
  const cardRef = useRef(null);
  const [drawn, setDrawn] = useState(false);
  // Bars draw in the first time the card enters the viewport.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true);
      return undefined;
    }
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDrawn(true);
      return undefined;
    }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        setDrawn(true);
        io.disconnect();
      }
    }, {
      threshold: 0.3
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const rows = [['IQ', 78, 'var(--iq)'], ['EQ', 64, 'var(--eq)'], ['SQ', 71, 'var(--sq)'], ['AQ', 58, 'var(--aq)']];
  return <div ref={node => {
    cardRef.current = node;
    if (tiltRef) tiltRef.current = node;
  }} className="tilt-card flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <QidsMark size={16} className="text-gold" />
          <span className="font-mono text-[10px] tracking-[0.28em] text-on-surface">{t("Landing.qids")}</span>
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-gold">{t("Landing.verified")}</span>
      </div>
      <div className="mt-7 font-display text-[20px] text-on-surface">{t("Landing.sample_profile")}</div>
      <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{t("Landing.grade_a_exceptional")}</div>
      <div className="mt-6 flex-1 space-y-3.5">
        {rows.map(([k, v, c]) => <div key={k} className="flex items-center gap-3">
            <span className="w-6 font-mono text-[10px] font-bold" style={{
        color: c
      }}>{k}</span>
            <span className="h-1.5 flex-1 overflow-hidden bg-surface-container-high">
              <span className="bar-fill block h-full" style={{
          width: drawn ? `${v}%` : '0%',
          background: c
        }} />
            </span>
            <span className="w-6 text-right font-mono text-[11px] text-on-surface">{v}</span>
          </div>)}
      </div>
      <div className="mt-7 border-t border-border pt-4 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-muted-foreground">{t("Landing.sha_256_9f2c41_8e1a")}<br />{t("Landing.qids_app_credential_8f3k2m")}</div>
    </div>;
}
export default function Landing() {
  const {
    t
  } = useTranslation();
  const heroDiagramRef = useRef(null);
  const heroCopyRef = useRef(null);
  const gridRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);

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
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    };
    const detach = () => {
      window.removeEventListener('scroll', onScroll, {
        passive: true
      });
      window.removeEventListener('resize', onScroll);
    };
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    window.addEventListener('resize', onScroll);
    check(); // reveal everything already in view at mount
    return detach;
  }, []);

  // Instrumentation layer: gold scroll-progress hairline, active section rail,
  // hero pointer parallax, cursor companion. One passive pointermove listener
  // driving transforms directly on refs (no re-renders); rAF-throttled scroll.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bar = document.getElementById('qids-progress-bar');
    const dots = Array.from(document.querySelectorAll('.rail-dot'));
    const railTargets = dots.map(d => document.getElementById(d.dataset.target));
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        if (bar) bar.style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
        let active = -1;
        railTargets.forEach((el, i) => {
          if (el && el.getBoundingClientRect().top < window.innerHeight * 0.45) active = i;
        });
        dots.forEach((d, i) => d.classList.toggle('active', i === active));
      });
    };
    const onPointer = e => {
      if (reduce || e.pointerType === 'touch') return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      if (heroDiagramRef.current) heroDiagramRef.current.style.transform = `translate(${nx * -14}px, ${ny * -10}px)`;
      if (heroCopyRef.current) heroCopyRef.current.style.transform = `translate(${nx * 8}px, ${ny * 6}px)`;
      if (gridRef.current) gridRef.current.style.transform = `translate(${nx * -5}px, ${ny * -4}px) scale(1.03)`;
    };
    // Cursor companion — a gold diamond with a trailing hairline ring that
    // widens over interactive elements. Pointer-fine + motion-safe only.
    const fine = window.matchMedia('(pointer: fine)').matches;
    let ringX = 0;
    let ringY = 0;
    let dotX = 0;
    let dotY = 0;
    let raf = 0;
    let started = false;
    const follow = () => {
      ringX += (dotX - ringX) * 0.16;
      ringY += (dotY - ringY) * 0.16;
      if (cursorDotRef.current) cursorDotRef.current.style.transform = `translate(${dotX - 3.5}px, ${dotY - 3.5}px) rotate(45deg)`;
      if (cursorRingRef.current) cursorRingRef.current.style.transform = `translate(${ringX - 15}px, ${ringY - 15}px) rotate(45deg)`;
      raf = requestAnimationFrame(follow);
    };
    const onCursorMove = e => {
      dotX = e.clientX;
      dotY = e.clientY;
      if (!started) {
        started = true;
        if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1';
        if (cursorRingRef.current) cursorRingRef.current.style.opacity = '1';
        ringX = dotX;
        ringY = dotY;
        raf = requestAnimationFrame(follow);
      }
    };
    const onOver = e => {
      const interactive = e.target.closest?.('a, button, summary, input, [role="slider"]');
      cursorRingRef.current?.classList.toggle('grow', !!interactive);
    };
    const onDocLeave = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0';
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0';
      started = false;
      cancelAnimationFrame(raf);
    };
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    window.addEventListener('pointermove', onPointer, {
      passive: true
    });
    if (fine && !reduce) {
      window.addEventListener('pointermove', onCursorMove, {
        passive: true
      });
      window.addEventListener('pointerover', onOver, {
        passive: true
      });
      document.documentElement.addEventListener('pointerleave', onDocLeave, {
        passive: true
      });
    }
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointermove', onCursorMove);
      window.removeEventListener('pointerover', onOver);
      document.documentElement.removeEventListener('pointerleave', onDocLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Section rail — smooth scroll to a section when a diamond is clicked.
  const scrollToSection = id => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  return <PublicShell>
      {/* gold scroll-progress hairline */}
      <div id="qids-progress-bar" className="scroll-progress" />
      {/* cursor companion (desktop, motion-safe only — rendered inert otherwise) */}
      <div ref={cursorDotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={cursorRingRef} className="cursor-ring" aria-hidden="true" />
      {/* section rail — diamond markers, one per major section */}
      <nav className="section-rail" aria-label="Section navigation">
        {[['hero', 'I'], ['method', 'II'], ['architecture', 'III'], ['wings', 'IV'], ['profile', 'V'], ['loop', 'VII'], ['access', 'IX'], ['faq', 'X']].map(([id, num]) => <button key={id} type="button" className="rail-dot" data-target={id} aria-label={`Section ${num}`} onClick={() => scrollToSection(id)} />)}
      </nav>
      <main>
        {/* ── I · HERO — the capability field ─────────────────────────────── */}
        <section id="hero" className="relative overflow-hidden border-b border-border bg-background">
          <div ref={gridRef} className="pointer-events-none absolute inset-0 grid-bg opacity-30" style={{
          maskImage: 'radial-gradient(ellipse 90% 75% at 62% 38%, black 25%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 75% at 62% 38%, black 25%, transparent 72%)'
        }} />
          <ConstellationField />
          <div className="pointer-events-none absolute left-6 top-6 hidden font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70 lg:block">
            Field 01 — Capability map
          </div>
          <div className="pointer-events-none absolute bottom-6 right-6 hidden font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70 lg:block">
            Grid 520·520 — IQ · EQ · SQ · AQ
          </div>
          <div className="relative mx-auto grid max-w-[1440px] grid-cols-12 gap-6 px-6 pb-28 pt-20 lg:px-12 lg:pb-40 lg:pt-32">
            <div ref={heroCopyRef} className="col-span-12 lg:col-span-6 lg:pt-6">
              <div className="label-eyebrow-gold mb-8">{t("Landing.i_01_intelligence_architecture")}</div>
              <h1 className="max-w-3xl font-display text-[52px] font-light leading-[0.96] tracking-[-0.045em] md:text-[76px] lg:text-[98px]">
                <span className="mask-line"><span style={{
                '--d': '0.05s'
              }}>{t("Landing.human_development")}</span></span>
                <span className="mask-line"><span style={{
                '--d': '0.22s'
              }} className="text-muted-foreground">{t("Landing.structured")}</span></span>
              </h1>
              <p className="mt-10 max-w-xl text-[15px] leading-[1.75] text-muted-foreground md:text-[17px]">
                {t('landing.hero_sub')}
              </p>
              <div className="mt-12 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <Link to="/mode" className="btn-primary no-underline">
                    {t('landing.cta_begin')} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <a href="#architecture" className="btn-outline no-underline">
                    {t('landing.cta_explore')} <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Magnetic>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                <span>{t("Landing.one_architecture")}</span>
                <span className="text-gold">·</span>
                <span>{t("Landing.four_quotients")}</span>
                <span className="text-gold">·</span>
                <span>{t("Landing.multiple_contexts")}</span>
              </div>
            </div>
            <div className="col-span-12 mt-6 flex items-center justify-center lg:col-span-6 lg:mt-0">
              <div ref={heroDiagramRef} className="hero-parallax w-full max-w-[460px] lg:max-w-[540px]">
                <HeroDiagram />
              </div>
            </div>
          </div>
        </section>

        {/* ── Atlas ticker — the system's vocabulary, drifting by ────────── */}
        <div className="atlas-ticker bg-background py-3" aria-hidden="true">
          <div className="atlas-ticker-track">
            {[0, 1].map(copy => <div key={copy} className="flex shrink-0">
                {TICKER.map((word, i) => <span key={i} className="flex items-center text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                    <span className="px-5">{word}</span>
                    <span className="text-gold">·</span>
                  </span>)}
              </div>)}
          </div>
        </div>

        {/* ── Stat strip ──────────────────────────────────────────────────── */}
        <section className="surface-bone border-b border-border">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-border px-6 lg:grid-cols-4 lg:px-12 reveal-group">
            {[['IV', 'Quotients measured', 'IQ · EQ · SQ · AQ'], ['03', 'Product wings', 'Individual · School · Interview'], ['∞', 'Evidence over time', 'Assessment is the entry'], ['08–60', 'Designed age range', 'Child to professional']].map(([value, label, sub], i) => <div key={label} className="group bg-background px-5 py-8 transition-colors hover:bg-surface lg:px-8 lg:py-10" style={{
            '--stagger-i': i
          }}>
                <div className="num text-[38px] text-gold transition-transform duration-300 group-hover:-translate-y-0.5">{value}</div>
                <div className="mt-3 text-[13px]">{label}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.13em] text-muted-foreground">
                  {sub}
                </div>
              </div>)}
          </div>
        </section>

        {/* ── II · METHOD — the four quotients ────────────────────────────── */}
        <section id="method" className="surface-bone relative border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="relative mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="section-index mb-5">{t("Landing.ii_method")}</div>
              <h2 className="max-w-md font-display text-[38px] leading-[1.04] tracking-[-0.03em] lg:text-[52px]">{t("Landing.four_quotients_2")}<br />{t("Landing.one_coherent_system")}</h2>
              <p className="mt-7 max-w-md text-[14px] leading-[1.75] text-muted-foreground">{t("Landing.each_quotient_is_a")}</p>
            </div>
            <div className="reveal-group col-span-12 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:col-span-8">
              {QUOTIENTS.map(([index, key, title, desc, color], i) => <div key={key} className="group relative bg-background p-7 transition-colors hover:bg-surface lg:p-9" style={{
              '--stagger-i': i
            }}>
                  <span className="absolute inset-x-0 top-0 h-[2px] scale-x-0 transition-transform duration-300 group-hover:scale-x-100" style={{
              background: color
            }} />
                  <div className="flex items-start justify-between">
                    <span className="section-index">{index}</span>
                    <span className="font-display text-[30px] transition-transform duration-300 group-hover:-translate-y-0.5" style={{
              color
            }}>{key}</span>
                  </div>
                  <div className="mt-8 text-[15px]">{title}</div>
                  <p className="mt-3 text-[13px] leading-[1.7] text-muted-foreground">{desc}</p>
                </div>)}
            </div>
          </div>
        </section>

        {/* ── III · ARCHITECTURE — the pipeline ───────────────────────────── */}
        <section id="architecture" className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="relative mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-3">
              <div className="label-eyebrow-gold mb-5">{t("Landing.iii_architecture")}</div>
              <div className="font-display text-[30px] leading-tight">{t("Landing.assessment_is_the_entry")}</div>
            </div>
            <div className="col-span-12 min-w-0 lg:col-span-9">
              <p className="max-w-3xl font-display text-[30px] leading-[1.2] text-muted-foreground lg:text-[42px]">{t("Landing.outputs_become_development_inputs")}</p>
              <div className="mt-16 overflow-x-auto border-y border-border py-7">
                <div className="flex min-w-[900px] items-center gap-0">
                  {PIPELINE.map((item, index) => <div key={item} className="flex items-center">
                      <div className="pulse-box flex h-16 min-w-[104px] items-center border border-border px-3 text-[11px] font-mono uppercase tracking-[0.08em] transition-colors hover:border-gold hover:text-gold" style={{
                  '--pulse-delay': `${index * 0.28}s`
                }}>
                        {item}
                      </div>
                      {index < PIPELINE.length - 1 && <ArrowRight className="mx-2 h-3 w-3 shrink-0 text-gold" />}
                    </div>)}
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-8 text-[13px] leading-[1.7] text-muted-foreground md:grid-cols-3">
                <div>
                  <span className="text-on-surface">{t("Landing.evidence")}</span>
                  <br />{t("Landing.observable_work_reflection_and")}
                </div>
                <div>
                  <span className="text-on-surface">{t("Landing.human_judgement")}</span>
                  <br />{t("Landing.ai_is_an_internal")}
                </div>
                <div>
                  <span className="text-on-surface">{t("Landing.longitudinal_synthesis")}</span>
                  <br />{t("Landing.progress_is_read_across")}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── IV · PRODUCT WINGS ──────────────────────────────────────────── */}
        <section id="wings" className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="relative mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="label-eyebrow-gold mb-5">{t("Landing.iv_product_wings")}</div>
                <h2 className="font-display text-[38px] leading-tight lg:text-[52px]">{t("Landing.one_architecture_2")}<br />
                  <span className="text-muted-foreground">{t("Landing.three_primary_contexts")}</span>
                </h2>
              </div>
              <a href="#architecture" className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-on-surface no-underline transition-colors">{t("Landing.read_the_atlas")}</a>
            </div>
            <div className="reveal-group grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-3">
              {WINGS.map((wing, i) => <Link key={wing.name} to={wing.to} className="group bg-background p-8 no-underline transition-colors hover:bg-surface lg:min-h-[280px] lg:p-10" style={{
              '--stagger-i': i
            }}>
                  <div className="flex items-start justify-between">
                    <span className="section-index">{wing.index}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                  </div>
                  <div className="mt-20 font-display text-[28px] text-on-surface">{wing.name}</div>
                  <p className="mt-3 max-w-xs text-[13px] leading-[1.7] text-muted-foreground">
                    {wing.description}
                  </p>
                  <div className="mt-7 text-[10px] font-mono uppercase tracking-[0.13em] text-gold">
                    {wing.detail}
                  </div>
                </Link>)}
            </div>
          </div>
        </section>

        {/* ── V · EXTENSIONS ──────────────────────────────────────────────── */}
        <section className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="section-index mb-5">{t("Landing.v_extensions")}</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">{t("Landing.development_meets_the_organization")}</h2>
              <p className="mt-6 max-w-sm text-[14px] leading-[1.7] text-muted-foreground">{t("Landing.the_same_architecture_extends")}</p>
            </div>
            <div className="reveal-group col-span-12 grid gap-px border border-border bg-border lg:col-span-8 lg:grid-cols-2">
              {EXTENSIONS.map((ext, i) => <Link key={ext.eyebrow} to={ext.to} className="group bg-background p-8 no-underline transition-colors hover:bg-surface lg:p-10" style={{
              '--stagger-i': i
            }}>
                  <div className="label-eyebrow-gold">{ext.eyebrow}</div>
                  <div className="mt-12 font-display text-[26px] text-on-surface">{ext.title}</div>
                  <p className="mt-4 text-[13px] leading-[1.7] text-muted-foreground">{ext.desc}</p>
                  <span className="mt-8 inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-on-surface transition-colors group-hover:text-gold">
                    {ext.cta} <ArrowRight className="h-3.5 w-3.5 text-gold transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </Link>)}
            </div>
          </div>
        </section>

        {/* ── THE OUTPUT — live radar + credential ────────────────────────── */}
        <section id="profile" className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="label-eyebrow-gold mb-5">{t("Landing.the_output")}</div>
                <h2 className="font-display text-[38px] leading-tight lg:text-[52px]">{t("Landing.not_a_score")}<br />
                  <span className="text-muted-foreground">{t("Landing.an_architecture_of_you")}</span>
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-[1.7] text-muted-foreground">{t("Landing.every_cycle_produces_a")}</p>
            </div>
            <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-5">
              <div className="bg-background p-8 lg:col-span-3 lg:p-14">
                <div className="label-eyebrow mb-6">{t("Landing.sample_profile_four_quotients")}</div>
                <LiveRadar />
              </div>
              <div className="bg-background p-8 lg:col-span-2 lg:p-10">
                <div className="label-eyebrow mb-6">{t("Landing.sample_credential")}</div>
                <SampleCredential tiltRef={null} />
              </div>
            </div>
          </div>
        </section>

        {/* ── VI · CONTEXTS ───────────────────────────────────────────────── */}
        <section className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="label-eyebrow-gold mb-5">{t("Landing.vi_contexts")}</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">{t("Landing.a_parameterized_system")}</h2>
              <p className="mt-6 max-w-sm text-[14px] leading-[1.7] text-muted-foreground">{t("Landing.the_architecture_stays_coherent")}</p>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="divide-y divide-border border-y border-border">
                {CONTEXTS.map(([name, desc, status, to], index) => <div key={name} className="group flex flex-col gap-2 py-5 transition-colors md:grid md:grid-cols-12 md:items-center md:gap-4">
                    <div className="section-index md:col-span-1">0{index + 1}</div>
                    <div className="font-display text-[19px] md:col-span-4">
                      {to ? <Link to={to} className="transition-colors hover:text-gold no-underline">{name}</Link> : <span>{name}</span>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground md:col-span-7">
                      <span>{desc}</span>
                      <span className={status === 'CURRENT' ? 'status-current text-gold' : 'status-proposed'}>
                        {status}
                      </span>
                    </div>
                  </div>)}
              </div>
            </div>
          </div>
        </section>

        {/* ── VII · DEVELOPMENT LOOP ──────────────────────────────────────── */}
        <section id="loop" className="surface-bone relative border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="relative mx-auto max-w-[1440px]">
            <div className="section-index mb-5">{t("Landing.vii_development_loop")}</div>
            <h2 className="max-w-4xl font-display text-[38px] leading-[1.05] lg:text-[58px]">{t("Landing.measurement_is_the_beginning")}<br />
              <span className="text-muted-foreground">{t("Landing.development_is_the_system")}</span>
            </h2>
            <div className="reveal-group mt-16 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4 lg:grid-cols-7">
              {LOOP.map((item, i) => <div key={item} className="group bg-background p-5 transition-colors hover:bg-surface" style={{
              '--stagger-i': i
            }}>
                  <div className="section-index transition-colors group-hover:text-gold">0{i + 1}</div>
                  <div className="mt-8 font-display text-[17px]">{item}</div>
                </div>)}
            </div>
          </div>
        </section>

        {/* ── VIII · DIFFERENTIATORS ──────────────────────────────────────── */}
        <section className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="label-eyebrow-gold mb-5">{t("Landing.viii_differentiators")}</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">{t("Landing.architecture_before_features")}</h2>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="grid gap-0 border-y border-border">
                {DIFFERENTIATORS.map(([title, desc], i) => <div key={title} className="group grid gap-3 border-b border-border py-6 last:border-b-0 md:grid-cols-12">
                    <div className="section-index md:col-span-1 md:pt-1">0{i + 1}</div>
                    <div className="font-display text-[18px] md:col-span-4">{title}</div>
                    <div className="text-[13px] leading-[1.7] text-muted-foreground md:col-span-7">{desc}</div>
                  </div>)}
              </div>
            </div>
          </div>
        </section>

        {/* ── IX · ACCESS — pricing ───────────────────────────────────────── */}
        <section id="access" className="surface-bone border-b border-border px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="section-index mb-5">{t("Landing.ix_access")}</div>
                <h2 className="font-display text-[38px] leading-tight lg:text-[52px]">{t("Landing.simple_entry")}<br />
                  <span className="text-muted-foreground">{t("Landing.scaled_when_you_are")}</span>
                </h2>
              </div>
              <p className="max-w-sm text-[13px] leading-[1.7] text-muted-foreground">{t("Landing.the_core_assessment_is")}</p>
            </div>
            <div className="reveal-group grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
              {[{
              name: 'Free',
              price: '$0',
              status: 'CURRENT',
              featured: true,
              features: ['One assessment cycle', 'Individual context', 'IQP summary report']
            }, {
              name: 'Pro',
              price: 'TBA',
              status: 'IN DEVELOPMENT',
              features: ['Unlimited cycles', 'All contexts', 'Evidence portfolio', 'Credential export']
            }, {
              name: 'Institution',
              price: 'TBA',
              status: 'IN DEVELOPMENT',
              features: ['Cohorts & classes', 'Evaluator console', 'School analytics', 'Priority support']
            }].map((plan, i) => <div key={plan.name} className="relative flex flex-col bg-background p-8 lg:p-10" style={{
              '--stagger-i': i
            }}>
                  {plan.featured && <span className="absolute inset-x-0 top-0 h-[2px] bg-gold" />}
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[22px]">{plan.name}</span>
                    <span className={plan.status === 'CURRENT' ? 'status-current text-gold' : 'status-proposed'}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="num mt-4 text-[40px]">{plan.price}</div>
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map(f => <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                        <span className="mt-0.5 text-gold">·</span>{f}
                      </li>)}
                  </ul>
                  {plan.status === 'CURRENT' ? <Magnetic><Link to="/mode" className="btn-primary mt-8 no-underline">{t('landing.cta_begin')}</Link></Magnetic> : <button type="button" disabled className="btn-outline mt-8 !py-3 w-full cursor-not-allowed opacity-60">{t("Landing.coming_soon")}</button>}
                </div>)}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section id="faq" className="border-b border-border bg-background px-6 py-24 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <div className="label-eyebrow-gold mb-5">{t("Landing.faq")}</div>
              <h2 className="font-display text-[38px] leading-tight lg:text-[48px]">{t("Landing.questions")}<br />
                <span className="text-muted-foreground">{t("Landing.answered_plainly")}</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <div className="divide-y divide-border border-y border-border">
                {FAQS.map(([q, a]) => <details key={q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-display text-[17px] text-on-surface transition-colors hover:text-gold [&::-webkit-details-marker]:hidden">
                      {q}
                      <span className="font-mono text-[16px] text-muted-foreground transition-transform duration-200 group-open:rotate-45">+</span>
                    </summary>
                    <div className="faq-a"><div><p className="pb-6 pr-8 text-[13px] leading-[1.75] text-muted-foreground">{a}</p></div></div>
                  </details>)}
              </div>
            </div>
          </div>
        </section>

        {/* ── X · BEGIN ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-background px-6 py-28 text-center lg:px-12 lg:py-36">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" style={{
          maskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, black 20%, transparent 70%)'
        }} />
          <div className="relative">
            <div className="label-eyebrow-gold mb-6">{t("Landing.x_begin")}</div>
            <h2 className="mx-auto max-w-4xl font-display text-[44px] font-light leading-[1.03] tracking-[-0.03em] lg:text-[72px]">{t("Landing.start_with_a_measure")}<br />
              <span className="text-muted-foreground">{t("Landing.build_toward_impact")}</span>
            </h2>
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <Link to="/mode" className="btn-primary no-underline">{t("Landing.begin_assessment")}<ArrowRight className="h-4 w-4" />
                </Link>
              </Magnetic>
              <Magnetic>
                <a href="#architecture" className="btn-outline no-underline">{t('landing.cta_explore')}</a>
              </Magnetic>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </PublicShell>;
}
