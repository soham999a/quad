import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Brain, Heart, Users, Zap, ArrowRight, CheckCircle, Sparkles,
  Menu, X, Layers, Activity, TrendingUp, ClipboardList,
  LayoutDashboard, Map, UserCheck, Shield, ChevronRight
} from 'lucide-react';

const QUOTIENTS = [
  {
    id: 'iq', label: 'Intellectual Quotient', short: 'IQ',
    icon: Brain, color: '#4d8eff',
    desc: 'Verbal reasoning, quantitative analysis, abstract psychometric evaluation, and AI-generated dynamic problem-solving.',
    params: ['Verbal', 'Quantitative', 'Psychometric', 'Performance', 'AI-Generated'],
  },
  {
    id: 'eq', label: 'Emotional Quotient', short: 'EQ',
    icon: Heart, color: '#a855f7',
    desc: 'Self-awareness, emotion regulation, self-motivation, deep empathy, and interpersonal skills through the DEC Framework.',
    params: ['Self-Awareness', 'Emotion Regulation', 'Self-Motivation', 'Empathy', 'Interpersonal'],
  },
  {
    id: 'sq', label: 'Social Quotient', short: 'SQ',
    icon: Users, color: '#14b8a6',
    desc: 'Assessment centre exercises, cognitive social intelligence, and performance-based activities in diverse group dynamics.',
    params: ['Assessment Centre', 'Social Intelligence', 'Performance'],
  },
  {
    id: 'aq', label: 'Adversity Quotient', short: 'AQ',
    icon: Zap, color: '#f59e0b',
    desc: 'Situational agility, proactive momentum, relational resilience, and regenerative capacity through the RDF framework.',
    params: ['Situational Agility', 'Proactive Momentum', 'Resilience', 'Regenerative'],
  },
];

const PHASES = [
  {
    num: '01', label: 'Pre-Intervention',
    desc: 'Initial comprehensive psychometric assessment across all four quadrants to establish baseline measurements.',
    icon: ClipboardList, color: '#6366f1',
  },
  {
    num: '02', label: 'Strategic Intervention',
    desc: 'AI-curated development paths targeting specific areas revealed in phase one, with adaptive learning modules.',
    icon: Activity, color: '#a855f7',
  },
  {
    num: '03', label: 'Post-Intervention',
    desc: 'Secondary assessment to quantify growth, measure effectiveness, and generate a lifelong development roadmap.',
    icon: TrendingUp, color: '#14b8a6',
  },
];

const ECOSYSTEM = [
  {
    title: 'Individual', icon: Brain, color: '#4d8eff',
    desc: 'Personal dashboards, adaptive learning tracks, and real-time intelligence analytics for self-discovery.',
    features: ['Personal Skill Matrix', 'Growth Timeline', 'AI Recommendations'],
  },
  {
    title: 'Evaluator', icon: UserCheck, color: '#14b8a6',
    desc: 'Professional counselor panels for deep-dive diagnostics, scoring, and human-centric guidance.',
    features: ['Diagnostic Tools', 'Scoring Interface', 'Intervention Engine'],
  },
  {
    title: 'Institution', icon: Shield, color: '#a855f7',
    desc: 'Enterprise-grade talent mapping, organizational intelligence analytics, and cohort-level insights.',
    features: ['Talent Analytics', 'Cohort Reports', 'ROI Tracking'],
  },
];

const ADVANTAGES = [
  { icon: Layers, title: 'Holistic', desc: 'No single score defines you. We capture the complete human spectrum across four dimensions.' },
  { icon: Sparkles, title: 'AI-Powered', desc: 'Machine learning algorithms detect patterns beyond human observation for personalized paths.' },
  { icon: Shield, title: 'Evidence-based', desc: 'Grounded in neurobiology and high-performance psychology research.' },
  { icon: Map, title: 'Personalized', desc: 'Adaptive systems that evolve as you grow and face new challenges.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const s = {
    section: { maxWidth: 1280, margin: '0 auto', padding: '0 32px' },
    sectionGap: { paddingTop: 80, paddingBottom: 80 },
  };

  return (
    <div style={{ background: '#0f131d', color: '#dfe2f1', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @keyframes mesh-animation {
          0% { transform: translate(0%, 0%) scale(1); }
          33% { transform: translate(10%, -10%) scale(1.1); }
          66% { transform: translate(-5%, 5%) scale(0.9); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card:hover {
          border-color: rgba(173, 198, 255, 0.3);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(173, 198, 255, 0.1);
        }
        @media (max-width: 768px) {
          .glass-card:hover { transform: translateY(-4px); }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15, 19, 29, 0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 72,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #4d8eff, #571bc1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(77, 142, 255, 0.3)',
            }}>
              <Brain size={18} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>QIDS</span>
          </div>

          <div style={{ display: 'none', gap: 28, alignItems: 'center' }} className="nav-links-desktop">
            {['Framework', 'Model', 'Ecosystem', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ color: '#c2c6d6', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#adc6ff'}
                onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
              >{item}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: '#dfe2f1', fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(173, 198, 255, 0.4)'; e.currentTarget.style.color = '#adc6ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#dfe2f1'; }}
              >Sign In</button>
            </Link>
            <Link to="/signup">
              <button style={{
                padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
                background: 'linear-gradient(135deg, #4d8eff, #571bc1)',
                border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 12px rgba(77, 142, 255, 0.3)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >Get Started</button>
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              display: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: 8, cursor: 'pointer', color: '#dfe2f1',
            }} className="mobile-menu-btn">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header style={{
        minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', position: 'relative',
        overflow: 'hidden', padding: '0 32px',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(circle at 20% 30%, rgba(77, 142, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(87, 27, 193, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 163, 146, 0.1) 0%, transparent 70%)
          `,
          filter: 'blur(80px)',
          animation: 'mesh-animation 15s ease-in-out infinite alternate',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 900 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(77, 142, 255, 0.1)', border: '1px solid rgba(77, 142, 255, 0.25)',
          }}>
            <Sparkles size={12} color="#adc6ff" />
            <span style={{ fontSize: 11, color: '#adc6ff', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Introducing the Future of Intelligence
            </span>
          </div>

          <h1 style={{
            fontSize: 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.04em',
            marginBottom: 24, color: '#dfe2f1',
          }}>
            Human Intelligence Has Been Measured Wrong.{' '}
            <span style={{ background: 'linear-gradient(135deg, #4d8eff, #571bc1, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Until Now.</span>
          </h1>

          <p style={{
            fontSize: 20, color: '#c2c6d6', lineHeight: 1.7, maxWidth: 640,
            margin: '0 auto 40px',
          }}>
            Moving beyond IQ to a holistic measurement of human potential across four critical quotients — powered by AI and grounded in neuroscience.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup">
              <button style={{
                padding: '16px 40px', borderRadius: 12, cursor: 'pointer',
                background: 'linear-gradient(135deg, #4d8eff, #571bc1)',
                border: 'none', color: 'white', fontSize: 18, fontWeight: 600,
                transition: 'all 0.3s', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 24px rgba(77, 142, 255, 0.35)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(77, 142, 255, 0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(77, 142, 255, 0.35)'; }}
              >
                Take the Assessment
              </button>
            </Link>
            <a href="#framework">
              <button style={{
                padding: '16px 40px', borderRadius: 12, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: '#dfe2f1', fontSize: 18, fontWeight: 600,
                transition: 'all 0.3s', fontFamily: 'Inter, sans-serif',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(77, 142, 255, 0.5)'; e.currentTarget.style.background = 'rgba(77, 142, 255, 0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'transparent'; }}
              >
                Explore the Framework
              </button>
            </a>
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          animation: 'float 3s ease-in-out infinite', color: '#8c909f',
        }}>
          <ChevronRight size={24} style={{ transform: 'rotate(90deg)' }} />
        </div>
      </header>

      {/* ─── THE PROBLEM ─── */}
      <section id="framework" style={{ ...s.section, ...s.sectionGap }}>
        <div className="reveal">
          <div style={{
            background: '#171b26', borderRadius: 32, padding: '64px 80px',
            position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 256, height: 256, background: 'rgba(77, 142, 255, 0.08)', filter: 'blur(100px)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 768 }}>
              <span style={{ fontSize: 11, color: '#ffb4ab', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>
                The Problem
              </span>
              <h2 style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 20, color: '#dfe2f1' }}>
                The world faces a human intelligence crisis.
              </h2>
              <p style={{ fontSize: 18, color: '#c2c6d6', lineHeight: 1.8 }}>
                Current systems only measure 25% of human potential, ignoring EQ, SQ, and AQ entirely.
                We are navigating a 21st-century landscape using 20th-century psychometric maps that were never designed
                for situational agility, emotional regulation, or cognitive social intelligence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOUR QUOTIENTS ─── */}
      <section id="model" style={{ ...s.section, paddingBottom: 80 }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>The Four Pillars of QIDS</h2>
          <p style={{ fontSize: 18, color: '#c2c6d6' }}>A unified framework for measuring the total spectrum of human capacity.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {QUOTIENTS.map((q, i) => (
            <div key={q.id} className="glass-card reveal" style={{ padding: 32, borderRadius: 16, animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${q.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}>
                <q.icon size={24} color={q.color} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{q.short}</h3>
              <p style={{ fontSize: 11, color: q.color, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                {q.label}
              </p>
              <p style={{ fontSize: 14, color: '#c2c6d6', lineHeight: 1.7, marginBottom: 16 }}>{q.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {q.params.map(p => (
                  <span key={p} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11,
                    background: `${q.color}15`, border: `1px solid ${q.color}25`,
                    color: q.color,
                  }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 1024px) {
            #model > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 640px) {
            #model > div:last-child { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── THREE-PHASE MODEL ─── */}
      <section style={{ background: '#0a0e18', padding: '80px 0' }}>
        <div style={{ ...s.section }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>Development Methodology</h2>
            <p style={{ fontSize: 18, color: '#c2c6d6' }}>The scientific journey from measurement to mastery.</p>
          </div>

          <div style={{ position: 'relative' }} className="reveal">
            <div style={{ position: 'absolute', top: 40, left: 0, right: 0, height: 1, background: '#424754' }} className="phase-line" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 64 }}>
              {PHASES.map((p, i) => (
                <div key={p.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: '#262a35', border: '1px solid #424754',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24, position: 'relative', zIndex: 1,
                    transition: 'all 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.boxShadow = `0 0 30px ${p.color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#424754'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#adc6ff' }}>{p.num}</span>
                  </div>
                  <p.icon size={18} color={p.color} style={{ marginBottom: 8 }} />
                  <h4 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{p.label}</h4>
                  <p style={{ fontSize: 14, color: '#c2c6d6', lineHeight: 1.7 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .phase-line { display: none !important; }
            #model + div > div > div:last-child { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>
      </section>

      {/* ─── ECOSYSTEM ─── */}
      <section id="ecosystem" style={{ ...s.section, ...s.sectionGap }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12 }}>Three Ecosystem Panels</h2>
          <p style={{ fontSize: 18, color: '#c2c6d6' }}>Tailored experiences for every stakeholder.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {ECOSYSTEM.map((e, i) => (
            <div key={e.title} className="glass-card reveal" style={{
              padding: 40, borderRadius: 24,
              borderLeft: `3px solid ${e.color}80`,
              animationDelay: `${i * 0.15}s`,
            }}>
              <e.icon size={32} color={e.color} style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>{e.title}</h3>
              <p style={{ fontSize: 14, color: '#c2c6d6', lineHeight: 1.7, marginBottom: 20 }}>{e.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {e.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#c2c6d6' }}>
                    <CheckCircle size={14} color={e.color} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            #ecosystem > div:last-child { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── ARCHITECTURE ─── */}
      <section style={{ ...s.section, paddingBottom: 80 }}>
        <div className="reveal" style={{
          background: '#262a35', borderRadius: 48, padding: '64px 80px',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 20 }}>The QIDS Architecture</h2>
              <p style={{ fontSize: 16, color: '#c2c6d6', lineHeight: 1.7, marginBottom: 32 }}>
                A technical architecture designed for the complexity of the human mind. Integrated at the core,
                branching into specialized excellence across four quotients.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(77, 142, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Layers size={18} color="#adc6ff" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Neural Foundation</h5>
                    <p style={{ fontSize: 13, color: '#c2c6d6', lineHeight: 1.6 }}>The core data layer processing psychometric and performance inputs across all quotients.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(0, 163, 146, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LayoutDashboard size={18} color="#4fdbc8" />
                  </div>
                  <div>
                    <h5 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Integration Hub</h5>
                    <p style={{ fontSize: 13, color: '#c2c6d6', lineHeight: 1.6 }}>Cross-quotient correlation engine defining dynamic interactions between pillars.</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
              <div style={{ position: 'relative', width: 300, height: 300 }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(77, 142, 255, 0.05)', borderRadius: '50%', animation: 'pulse-glow 3s ease-in-out infinite' }} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 200, height: 200, border: '1px solid rgba(77, 142, 255, 0.3)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 120, height: 120, border: '1px solid rgba(77, 142, 255, 0.5)', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4d8eff, #571bc1)',
                      boxShadow: '0 0 30px rgba(77, 142, 255, 0.4)',
                    }} />
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '10%', left: '10%', width: 12, height: 12, borderRadius: '50%', background: '#4d8eff', boxShadow: '0 0 12px rgba(77, 142, 255, 0.6)' }} />
                <div style={{ position: 'absolute', bottom: '15%', left: '15%', width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)' }} />
                <div style={{ position: 'absolute', top: '20%', right: '10%', width: 10, height: 10, borderRadius: '50%', background: '#14b8a6', boxShadow: '0 0 10px rgba(20, 184, 166, 0.6)' }} />
                <div style={{ position: 'absolute', bottom: '30%', right: '20%', width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)' }} />
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }} viewBox="0 0 300 300">
                  <line x1="30" y1="30" x2="150" y2="150" stroke="white" strokeWidth="1" />
                  <line x1="45" y1="225" x2="150" y2="150" stroke="white" strokeWidth="1" />
                  <line x1="255" y1="60" x2="150" y2="150" stroke="white" strokeWidth="1" />
                  <line x1="240" y1="210" x2="150" y2="150" stroke="white" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            #root > div > div > div > div:last-child > div > div { grid-template-columns: 1fr !important; gap: 40px !important; padding: 32px 24px !important; }
          }
        `}</style>
      </section>

      {/* ─── ADVANTAGES ─── */}
      <section style={{ ...s.section, paddingBottom: 80 }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em' }}>The QIDS Advantage</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {ADVANTAGES.map((a, i) => (
            <div key={a.title} className="reveal" style={{ animationDelay: `${i * 0.1}s` }}>
              <a.icon size={28} color="#adc6ff" style={{ marginBottom: 16 }} />
              <h4 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{a.title}</h4>
              <p style={{ fontSize: 14, color: '#c2c6d6', lineHeight: 1.7 }}>{a.desc}</p>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 1024px) {
            #root > div > div > div > div:last-child > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 640px) {
            #root > div > div > div > div:last-child > div:last-child { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{
        padding: '80px 32px', background: '#1c1f2a', position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, background: 'rgba(77, 142, 255, 0.06)', borderRadius: '50%', filter: 'blur(150px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -200, left: -200, width: 500, height: 500, background: 'rgba(168, 85, 247, 0.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <blockquote style={{
              fontSize: 40, fontWeight: 600, lineHeight: 1.3, fontStyle: 'italic',
              marginBottom: 20, letterSpacing: '-0.02em',
            }}>
              "Intelligence is not a score; it's a spectrum."
            </blockquote>
            <p style={{ fontSize: 11, color: '#adc6ff', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              — The QIDS Manifesto
            </p>
          </div>

          <div className="reveal">
            <Link to="/signup">
              <button style={{
                padding: '20px 52px', borderRadius: 16, cursor: 'pointer',
                background: 'linear-gradient(135deg, #4d8eff, #571bc1)',
                border: 'none', color: 'white', fontSize: 20, fontWeight: 600,
                transition: 'all 0.3s', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 8px 32px rgba(77, 142, 255, 0.4)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(77, 142, 255, 0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(77, 142, 255, 0.4)'; }}
              >
                Start Your Journey
              </button>
            </Link>
            <p style={{ fontSize: 14, color: '#c2c6d6', marginTop: 24 }}>
              Join 50,000+ pioneers redefining human potential.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#0a0e18', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 40 }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #4d8eff, #571bc1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Brain size={14} color="white" />
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, sans-serif' }}>QIDS</span>
            </div>
            <p style={{ fontSize: 13, color: '#c2c6d6', lineHeight: 1.7, marginBottom: 20 }}>
              Redefining human intelligence through multi-quotient integration and AI diagnostics.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['public', 'share', 'mail'].map(icon => (
                <a key={icon} href="#" style={{ color: '#c2c6d6', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#adc6ff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
                >{icon === 'public' ? '🌐' : icon === 'share' ? '🔗' : '✉️'}</a>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
            <div>
              <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: '#dfe2f1' }}>Framework</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['IQ Matrix', 'EQ Compass', 'SQ Network', 'AQ Dynamics'].map(item => (
                  <a key={item} href="#" style={{ color: '#c2c6d6', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4fdbc8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
                  >{item}</a>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: '#dfe2f1' }}>Product</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Assessment', 'Corporate', 'Pricing', 'API'].map(item => (
                  <a key={item} href="#" style={{ color: '#c2c6d6', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4fdbc8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
                  >{item}</a>
                ))}
              </div>
            </div>
            <div>
              <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: '#dfe2f1' }}>Company</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['About', 'Research', 'Contact', 'Careers'].map(item => (
                  <a key={item} href="#" style={{ color: '#c2c6d6', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4fdbc8'}
                    onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
                  >{item}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#c2c6d6' }}>© 2024 SOMNATH BANERJEE. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#c2c6d6' }}>
            <a href="#" style={{ color: '#c2c6d6', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#adc6ff'}
              onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
            >Privacy Policy</a>
            <a href="#" style={{ color: '#c2c6d6', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#adc6ff'}
              onMouseLeave={e => e.currentTarget.style.color = '#c2c6d6'}
            >Terms of Service</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          #root > div > div > header h1 { font-size: 36px !important; }
          #root > div > div > header p { font-size: 16px !important; }
          #root > div > div > header div:last-child button { font-size: 15px !important; padding: 14px 28px !important; }
        }
        @media (min-width: 769px) {
          .nav-links-desktop { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
