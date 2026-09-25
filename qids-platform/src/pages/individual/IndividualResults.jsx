import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, ArrowLeft, TrendingUp, TrendingDown, Target, Brain, Award, FileText, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAssessment, getUserAssessments } from '../../services/firestoreService';
import { computeQidsPillarScores, getGrade, computeWeightedScore, getSkillShape, getCareerProfile } from '../../core/engine/qids';
const PILLAR_META = {
  IQ: {
    label: 'Intelligence Quotient',
    color: 'var(--phase-pre)',
    desc: 'Verbal, quantitative, psychometric and performance reasoning.'
  },
  EQ: {
    label: 'Emotional Quotient',
    color: 'var(--status-ok)',
    desc: 'Self-awareness, emotional regulation, empathy, and social skills.'
  },
  SQ: {
    label: 'Social Quotient',
    color: 'var(--status-warn)',
    desc: 'Active listening, collaboration, communication, and leadership.'
  },
  AQ: {
    label: 'Adaptability Quotient',
    color: 'var(--status-err)',
    desc: 'Resilience, situational agility, proactive momentum, and recovery.'
  }
};
const SKILL_SHAPE_DESC = {
  T: {
    label: 'T-Shaped Generalist',
    desc: 'Broad foundational intelligence with deep expertise in one area.',
    color: 'var(--phase-pre)'
  },
  I: {
    label: 'I-Shaped Specialist',
    desc: 'Deep expertise in one dimension with room to broaden.',
    color: 'var(--status-ok)'
  },
  X: {
    label: 'X-Shaped Cross-Functional',
    desc: 'Balanced capabilities across all dimensions with strong averages.',
    color: 'var(--status-warn)'
  },
  M: {
    label: 'M-Shaped Multidisciplinary',
    desc: 'Exceptional performance across three or more dimensions.',
    color: 'var(--status-err)'
  }
};
function ScoreGauge({
  score,
  grade
}) {
  const pct = Math.min(score / 100, 1) * 100;
  return <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="color-mix(in srgb, var(--slate-muted) 15%, transparent)" strokeWidth="8" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct / 100 * 264} 264`} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] leading-none font-headline-md text-gradient">{score}</span>
        <span className="text-technical-sm font-technical-sm text-surface-variant mt-1">/ 100</span>
        {grade && <span className="mt-2 chip" style={{
        background: `color-mix(in srgb, ${grade.color} 20%, transparent)`,
        color: grade.color,
        border: `1px solid color-mix(in srgb, ${grade.color} 40%, transparent)`
      }}>
            {grade.grade} · {grade.label}
          </span>}
      </div>
    </div>;
}
function PillarRadar({
  pillarScores
}) {
  const {
    t
  } = useTranslation();
  const wrapRef = React.useRef(null);
  const data = Object.entries(pillarScores).map(([k, v]) => ({
    subject: PILLAR_META[k]?.label?.split(' ')[0] || k,
    A: v,
    fullMark: 100
  }));

  // PNG export: serialize the live SVG, rasterize through an <img> onto a
  // canvas with the page's own background, then download.
  const exportPng = async () => {
    const svg = wrapRef.current?.querySelector('svg');
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--background') || '#0a0e1a';
    const xml = `<svg xmlns="http://www.w3.org/2000/svg">${clone.innerHTML}</svg>`;
    const url = URL.createObjectURL(new Blob([xml], {
      type: 'image/svg+xml'
    }));
    try {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      const box = svg.getBoundingClientRect() || {
        width: 600,
        height: 300
      };
      const scale = 2; // retina-sharp
      canvas.width = box.width * scale;
      canvas.height = box.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg.trim() || '#0a0e1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `qids-pillar-radar.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  return <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <span className="label-eyebrow">{t("IndividualResults.pillar_profile")}</span>
        <button type="button" onClick={exportPng} aria-label={t("IndividualResults.download_radar_chart_as")} className="inline-flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-technical-sm font-technical-sm text-muted-foreground hover:text-primary transition-colors">
          <Download size={13} />{t("IndividualResults.png")}</button>
      </div>
      <div ref={wrapRef}>
        <ResponsiveContainer width="100%" height={300}>
        <ReRadar data={data} outerRadius="68%">
          <PolarGrid stroke="color-mix(in srgb, var(--gold) 15%, transparent)" />
          <PolarAngleAxis dataKey="subject" tick={{
            fill: 'var(--neutral-mid)',
            fontSize: 12,
            fontWeight: 600
          }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="A" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.22} strokeWidth={2} dot={{
            fill: 'var(--gold)',
            r: 3
          }} />
          <Tooltip contentStyle={{
            background: 'var(--neutral-carbon-deep)',
            border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)',
            borderRadius: 8,
            color: 'var(--neutral-warm)',
            fontSize: 12
          }} />
        </ReRadar>
      </ResponsiveContainer>
      </div>
    </div>;
}
function PillarBars({
  pillarScores
}) {
  return <div className="flex flex-col gap-4">
      {Object.entries(pillarScores).map(([id, score]) => {
      const meta = PILLAR_META[id];
      if (!meta) return null;
      return <div key={id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{
              background: meta.color
            }} />
                <span className="text-label-md font-label-md text-on-background">{meta.label}</span>
              </div>
              <span className="text-label-md font-label-md text-on-background">{Math.round(score)}</span>
            </div>
            <div className="h-[6px] rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${Math.max(score, 2)}%`,
            background: `linear-gradient(90deg, color-mix(in srgb, ${meta.color} 53%, transparent), ${meta.color})`
          }} />
            </div>
            <p className="text-technical-sm font-technical-sm text-surface-variant mt-1.5">{meta.desc}</p>
          </div>;
    })}
    </div>;
}
export default function IndividualResults() {
  const {
    t
  } = useTranslation();
  usePageTitle('My results');
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getAssessment(id).then(setAssessment).catch(() => {}).finally(() => setLoading(false));
    if (user) {
      getUserAssessments(user.uid).then(list => {
        setAllAttempts((list || []).filter(a => a.phase !== 'post').sort((a, b) => new Date(a.timestamp || a.createdAt?.toDate?.() || 0) - new Date(b.timestamp || b.createdAt?.toDate?.() || 0)));
      }).catch(() => {});
    }
  }, [id, user]);
  if (loading) {
    return <div className="page-pad max-w-[1100px] mx-auto animate-fade pb-24 md:pb-16">
        <div className="space-y-6">
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="card p-8"><div className="skeleton h-48 w-48 mx-auto rounded-full" /></div>
          <div className="card p-6"><div className="skeleton h-64" /></div>
        </div>
      </div>;
  }
  if (!assessment) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade pb-24 md:pb-16 text-center py-20">
        <Sparkles size={24} className="text-surface-variant mx-auto mb-4 opacity-40" />
        <div className="text-body-md text-surface-variant mb-4">{t("IndividualResults.assessment_not_found")}</div>
        <button onClick={() => navigate('/app/individual')} className="btn-primary glow">{t("IndividualResults.back_to_assessment")}</button>
      </div>;
  }
  const pillarScores = assessment.pillarScores || computeQidsPillarScores(assessment.rawScores || {});
  const unified = assessment.result?.unifiedScore ?? computeWeightedScore(pillarScores) ?? 0;
  const grade = assessment.result?.grade ?? getGrade(unified);
  const skillShape = getSkillShape(pillarScores);
  const careerProfile = getCareerProfile(pillarScores);
  const shape = SKILL_SHAPE_DESC[skillShape];
  // Growth trajectory: where this attempt sits in the user's history.
  const attemptIdx = allAttempts.findIndex(a => a.id === id);
  const prevAttempt = attemptIdx > 0 ? allAttempts[attemptIdx - 1] : null;
  const prevUnified = prevAttempt ? (prevAttempt.unifiedScore ?? prevAttempt.result?.unifiedScore ?? null) : null;
  const unifiedNum = Number(unified) || 0;
  const delta = prevUnified != null ? Math.round(unifiedNum - Number(prevUnified)) : null;
  const sorted = Object.entries(pillarScores).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2);
  const development = sorted.slice(-2).reverse();
  return <div className="page-pad max-w-[1100px] mx-auto animate-fade pb-24 md:pb-16">
      <section className="mb-8 md:mb-10 fade-up">
        <button onClick={() => navigate('/app/dashboard')} className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none mb-6">
          <ArrowLeft size={14} />{t("IndividualResults.back_to_dashboard")}</button>
        <div className="kicker mb-3">{t("IndividualResults.your_results")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{t("IndividualResults.intelligence_blueprint")}</h1>
        <p className="text-body-md text-surface-variant max-w-2xl mt-3 leading-relaxed">
          {assessment.intake?.name ? `${assessment.intake.name}'s` : 'Your'} personalized assessment results across four dimensions of intelligence.
        </p>
        {delta != null && <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 border-[0.5px] ${delta >= 0 ? 'border-success/40 bg-success/10 text-success' : 'border-err/40 bg-err/10 text-err'}`}>
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-label-sm font-label-sm tracking-wide">
              {delta >= 0 ? '+' : ''}{delta} {t("IndividualResults.since_last_assessment")}
            </span>
          </div>}
        <div className="gradient-rule mt-6" />
      </section>

      {/* Attempt timeline — every baseline take, this one highlighted */}
      {allAttempts.length > 1 && <section className="mb-8 fade-up" style={{ animationDelay: '30ms' }}>
          <div className="kicker mb-3">{t("IndividualResults.attempt_history")}</div>
          <div className="gradient-rule mb-4" />
          <div className="flex flex-wrap gap-2">
            {allAttempts.map((a, i) => {
              const s = a.unifiedScore ?? a.result?.unifiedScore;
              const isActive = a.id === id;
              const d = new Date(a.timestamp || a.createdAt?.toDate?.() || 0);
              return <button key={a.id} onClick={() => !isActive && navigate(`/app/individual/results/${a.id}`)} disabled={isActive}
                className={`px-4 py-2.5 border-[0.5px] text-left transition-all cursor-pointer ${isActive ? 'border-primary/60 bg-primary/10' : 'border-outline-variant hover:border-primary/30 bg-surface-container-low'}`}>
                <div className="text-technical-sm font-technical-sm text-surface-variant">#{String(i + 1).padStart(2, '0')} · {isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className={`text-label-md font-label-md ${isActive ? 'text-primary' : 'text-on-surface'}`}>{s != null ? Math.round(Number(s)) : '—'}</div>
              </button>;
            })}
          </div>
        </section>}

      {/* Score Hero */}
      <section className="card p-8 md:p-10 mb-8 fade-up" style={{
      animationDelay: '60ms'
    }}>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <ScoreGauge score={Math.round(unified)} grade={grade} />
          <div>
            <div className="mb-6">
              <div className="kicker mb-2">{t("IndividualResults.skill_shape")}</div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-headline-md font-headline-md" style={{
                color: shape.color
              }}>{skillShape}</span>
                <span className="text-label-md font-label-md text-on-background">{shape.label}</span>
              </div>
              <p className="text-body-md text-surface-variant leading-relaxed">{shape.desc}</p>
            </div>
            <div>
              <div className="kicker mb-2">{t("IndividualResults.career_alignment")}</div>
              <div className="text-label-md font-label-md text-on-background mb-1">{careerProfile.label}</div>
              <p className="text-technical-sm font-technical-sm text-surface-variant">{careerProfile.condition}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {careerProfile.roles.map(r => <span key={r} className="chip">{r}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Radar + Pillars */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
        <section className="fade-up" style={{
        animationDelay: '120ms'
      }}>
          <div className="kicker mb-4">{t("IndividualResults.dimensional_overview")}</div>
          <PillarRadar pillarScores={pillarScores} />
        </section>
        <section className="fade-up" style={{
        animationDelay: '180ms'
      }}>
          <div className="kicker mb-4">{t("IndividualResults.pillar_scores")}</div>
          <div className="card p-5 md:p-6">
            <PillarBars pillarScores={pillarScores} />
          </div>
        </section>
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
        <section className="card p-5 md:p-6 fade-up" style={{
        animationDelay: '240ms'
      }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="kicker">{t("IndividualResults.top_strengths")}</span>
          </div>
          <div className="gradient-rule mb-4" />
          {strengths.map(([id, score]) => <div key={id} className="flex items-start gap-3 py-3 border-b-[0.5px] border-outline-variant last:border-b-0">
              <CheckCircle2 size={14} className="mt-1 flex-shrink-0 text-emerald-400" />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-label-md font-label-md text-on-background">{PILLAR_META[id]?.label || id}</span>
                  <span className="text-technical-sm font-technical-sm text-emerald-400">{Math.round(score)}/100</span>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">{PILLAR_META[id]?.desc}</p>
              </div>
            </div>)}
        </section>
        <section className="card p-5 md:p-6 fade-up" style={{
        animationDelay: '300ms'
      }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="kicker">{t("IndividualResults.development_areas")}</span>
          </div>
          <div className="gradient-rule mb-4" />
          {development.map(([id, score]) => <div key={id} className="flex items-start gap-3 py-3 border-b-[0.5px] border-outline-variant last:border-b-0">
              <Target size={14} className="mt-1 flex-shrink-0 text-amber-400" />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-label-md font-label-md text-on-background">{PILLAR_META[id]?.label || id}</span>
                  <span className="text-technical-sm font-technical-sm text-amber-400">{Math.round(score)}/100</span>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">{t("IndividualResults.focus_area_for_growth")}</p>
              </div>
            </div>)}
        </section>
      </div>

      {/* Actions */}
      <section className="fade-up flex flex-col md:flex-row gap-4" style={{
      animationDelay: '360ms'
    }}>        <button onClick={() => navigate(`/app/individual/credential/${id}`)} className="btn-primary glow flex-1">
          <Download size={14} />{t("IndividualResults.download_credential")}
        </button>
        <button onClick={() => navigate('/app/individual')} className="btn-outline flex-1">{t("IndividualResults.retake_assessment")}</button>
      </section>
    </div>;
}