import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, ArrowLeft, TrendingUp, TrendingDown, Target, Brain, Award, FileText, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAssessment } from '../../services/firestoreService';
import { computeQidsPillarScores, getGrade, computeWeightedScore, getSkillShape, getCareerProfile } from '../../core/engine/qids';

const PILLAR_META = {
  IQ: { label: 'Intelligence Quotient', color: '#6366f1', desc: 'Verbal, quantitative, psychometric and performance reasoning.' },
  EQ: { label: 'Emotional Quotient', color: '#10b981', desc: 'Self-awareness, emotional regulation, empathy, and social skills.' },
  SQ: { label: 'Social Quotient', color: '#f59e0b', desc: 'Active listening, collaboration, communication, and leadership.' },
  AQ: { label: 'Adaptability Quotient', color: '#ef4444', desc: 'Resilience, situational agility, proactive momentum, and recovery.' },
};

const SKILL_SHAPE_DESC = {
  T: { label: 'T-Shaped Generalist', desc: 'Broad foundational intelligence with deep expertise in one area.', color: '#6366f1' },
  I: { label: 'I-Shaped Specialist', desc: 'Deep expertise in one dimension with room to broaden.', color: '#10b981' },
  X: { label: 'X-Shaped Cross-Functional', desc: 'Balanced capabilities across all dimensions with strong averages.', color: '#f59e0b' },
  M: { label: 'M-Shaped Multidisciplinary', desc: 'Exceptional performance across three or more dimensions.', color: '#ef4444' },
};

function ScoreGauge({ score, grade }) {
  const pct = Math.min(score / 100, 1) * 100;
  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#B8924A" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 264} 264`} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] leading-none font-headline-md text-gradient">{score}</span>
        <span className="text-technical-sm font-technical-sm text-surface-variant mt-1">/ 100</span>
        {grade && (
          <span className="mt-2 chip" style={{ background: `${grade.color}20`, color: grade.color, border: `1px solid ${grade.color}40` }}>
            {grade.grade} · {grade.label}
          </span>
        )}
      </div>
    </div>
  );
}

function PillarRadar({ pillarScores }) {
  const data = Object.entries(pillarScores).map(([k, v]) => ({
    subject: PILLAR_META[k]?.label?.split(' ')[0] || k, A: v, fullMark: 100,
  }));
  return (
    <div className="card p-5 md:p-6">
      <ResponsiveContainer width="100%" height={300}>
        <ReRadar data={data} outerRadius="68%">
          <PolarGrid stroke="rgba(235,192,115,0.15)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4A4A4A', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="A" stroke="#B8924A" fill="#B8924A" fillOpacity={0.22} strokeWidth={2} dot={{ fill: '#B8924A', r: 3 }} />
          <Tooltip contentStyle={{ background: '#131313', border: '1px solid rgba(235,192,115,0.25)', borderRadius: 8, color: '#e5e2e1', fontSize: 12 }} />
        </ReRadar>
      </ResponsiveContainer>
    </div>
  );
}

function PillarBars({ pillarScores }) {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(pillarScores).map(([id, score]) => {
        const meta = PILLAR_META[id];
        if (!meta) return null;
        return (
          <div key={id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-label-md font-label-md text-on-background">{meta.label}</span>
              </div>
              <span className="text-label-md font-label-md text-on-background">{Math.round(score)}</span>
            </div>
            <div className="h-[6px] rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(score, 2)}%`, background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})` }} />
            </div>
            <p className="text-technical-sm font-technical-sm text-surface-variant mt-1.5">{meta.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function IndividualResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getAssessment(id)
      .then(setAssessment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-pad max-w-[1100px] mx-auto animate-fade pb-24 md:pb-16">
        <div className="space-y-6">
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="card p-8"><div className="skeleton h-48 w-48 mx-auto rounded-full" /></div>
          <div className="card p-6"><div className="skeleton h-64" /></div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="page-pad max-w-[960px] mx-auto animate-fade pb-24 md:pb-16 text-center py-20">
        <Sparkles size={24} className="text-surface-variant mx-auto mb-4 opacity-40" />
        <div className="text-body-md text-surface-variant mb-4">Assessment not found.</div>
        <button onClick={() => navigate('/app/individual')} className="btn-primary glow">BACK TO ASSESSMENT</button>
      </div>
    );
  }

  const pillarScores = assessment.pillarScores || computeQidsPillarScores(assessment.rawScores || {});
  const unified = assessment.result?.unifiedScore ?? computeWeightedScore(pillarScores) ?? 0;
  const grade = assessment.result?.grade ?? getGrade(unified);
  const skillShape = getSkillShape(pillarScores);
  const careerProfile = getCareerProfile(pillarScores);
  const shape = SKILL_SHAPE_DESC[skillShape];

  const sorted = Object.entries(pillarScores).sort((a, b) => b[1] - a[1]);
  const strengths = sorted.slice(0, 2);
  const development = sorted.slice(-2).reverse();

  return (
    <div className="page-pad max-w-[1100px] mx-auto animate-fade pb-24 md:pb-16">
      <section className="mb-8 md:mb-10 fade-up">
        <button onClick={() => navigate('/app/dashboard')}
          className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none mb-6">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
        <div className="kicker mb-3">Your Results</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">
          Intelligence Blueprint
        </h1>
        <p className="text-body-md text-surface-variant max-w-2xl mt-3 leading-relaxed">
          {assessment.intake?.name ? `${assessment.intake.name}'s` : 'Your'} personalized assessment results across four dimensions of intelligence.
        </p>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Score Hero */}
      <section className="card p-8 md:p-10 mb-8 fade-up" style={{ animationDelay: '60ms' }}>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <ScoreGauge score={Math.round(unified)} grade={grade} />
          <div>
            <div className="mb-6">
              <div className="kicker mb-2">Skill Shape</div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-headline-md font-headline-md" style={{ color: shape.color }}>{skillShape}</span>
                <span className="text-label-md font-label-md text-on-background">{shape.label}</span>
              </div>
              <p className="text-body-md text-surface-variant leading-relaxed">{shape.desc}</p>
            </div>
            <div>
              <div className="kicker mb-2">Career Alignment</div>
              <div className="text-label-md font-label-md text-on-background mb-1">{careerProfile.label}</div>
              <p className="text-technical-sm font-technical-sm text-surface-variant">{careerProfile.condition}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {careerProfile.roles.map(r => (
                  <span key={r} className="chip">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Radar + Pillars */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
        <section className="fade-up" style={{ animationDelay: '120ms' }}>
          <div className="kicker mb-4">Dimensional Overview</div>
          <PillarRadar pillarScores={pillarScores} />
        </section>
        <section className="fade-up" style={{ animationDelay: '180ms' }}>
          <div className="kicker mb-4">Pillar Scores</div>
          <div className="card p-5 md:p-6">
            <PillarBars pillarScores={pillarScores} />
          </div>
        </section>
      </div>

      {/* Insights */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8">
        <section className="card p-5 md:p-6 fade-up" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="kicker">Top Strengths</span>
          </div>
          <div className="gradient-rule mb-4" />
          {strengths.map(([id, score]) => (
            <div key={id} className="flex items-start gap-3 py-3 border-b-[0.5px] border-outline-variant last:border-b-0">
              <CheckCircle2 size={14} className="mt-1 flex-shrink-0 text-emerald-400" />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-label-md font-label-md text-on-background">{PILLAR_META[id]?.label || id}</span>
                  <span className="text-technical-sm font-technical-sm text-emerald-400">{Math.round(score)}/100</span>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">{PILLAR_META[id]?.desc}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="card p-5 md:p-6 fade-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="kicker">Development Areas</span>
          </div>
          <div className="gradient-rule mb-4" />
          {development.map(([id, score]) => (
            <div key={id} className="flex items-start gap-3 py-3 border-b-[0.5px] border-outline-variant last:border-b-0">
              <Target size={14} className="mt-1 flex-shrink-0 text-amber-400" />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-label-md font-label-md text-on-background">{PILLAR_META[id]?.label || id}</span>
                  <span className="text-technical-sm font-technical-sm text-amber-400">{Math.round(score)}/100</span>
                </div>
                <p className="text-body-md text-on-surface-variant leading-relaxed mt-1">Focus area for growth and targeted development.</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Actions */}
      <section className="fade-up flex flex-col md:flex-row gap-4" style={{ animationDelay: '360ms' }}>
        <button onClick={() => navigate(`/app/individual/credential/${id}`)} className="btn-primary glow flex-1">
          <Download size={14} /> DOWNLOAD CREDENTIAL
        </button>
        <button onClick={() => navigate('/app/individual')} className="btn-outline flex-1">
          NEW ASSESSMENT
        </button>
      </section>
    </div>
  );
}
