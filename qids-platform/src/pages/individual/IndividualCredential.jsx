import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Printer, Download, Shield } from 'lucide-react';
import { getAssessment } from '../../services/firestoreService';
import { computeQidsPillarScores, getGrade, computeWeightedScore, getSkillShape } from '../../core/engine/qids';

const PILLAR_SHORT = { IQ: 'IQ', EQ: 'EQ', SQ: 'SQ', AQ: 'AQ' };

function MiniRadar({ pillarScores }) {
  const data = Object.entries(pillarScores).map(([k, v]) => ({ subject: PILLAR_SHORT[k] || k, A: v, fullMark: 100 }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReRadar data={data} outerRadius="72%">
        <PolarGrid stroke="rgba(235,192,115,0.15)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#d1c5b3', fontSize: 11, fontWeight: 600 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="A" stroke="#ebc073" fill="#ebc073" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#ebc073', r: 2 }} />
      </ReRadar>
    </ResponsiveContainer>
  );
}

export default function IndividualCredential() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getAssessment(id).then(setAssessment).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-pad max-w-[800px] mx-auto animate-fade pb-24 md:pb-16">
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="page-pad max-w-[800px] mx-auto animate-fade pb-24 md:pb-16 text-center py-20">
        <div className="text-body-md text-surface-variant mb-4">Assessment not found.</div>
        <button onClick={() => navigate('/app/dashboard')} className="btn-primary glow">BACK TO DASHBOARD</button>
      </div>
    );
  }

  const pillarScores = assessment.pillarScores || computeQidsPillarScores(assessment.rawScores || {});
  const unified = assessment.result?.unifiedScore ?? computeWeightedScore(pillarScores) ?? 0;
  const grade = assessment.result?.grade ?? getGrade(unified);
  const skillShape = getSkillShape(pillarScores);
  const name = assessment.intake?.name || 'Candidate';
  const date = assessment.createdAt?.toDate
    ? assessment.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="page-pad max-w-[800px] mx-auto animate-fade pb-24 md:pb-16 print:p-0 print:max-w-none">
      <section className="mb-6 fade-up no-print">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
          <ArrowLeft size={14} /> Back
        </button>
      </section>

      <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant p-8 md:p-12 print:p-12 print:border-none print:bg-white" id="credential">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b-[0.5px] border-outline-variant">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <span className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest">QIDS Verified Profile</span>
          </div>
          <h1 className="text-headline-lg font-headline-md text-on-background">{name}</h1>
          <p className="text-body-md text-surface-variant mt-2">{date}</p>
        </div>

        {/* Score + Shape */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-8 pb-8 border-b-[0.5px] border-outline-variant">
          <div className="text-center">
            <div className="text-[64px] leading-none font-headline-md text-gradient mb-2">{Math.round(unified)}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant mb-3">Unified Score / 100</div>
            {grade && (
              <span className="chip text-lg px-4 py-1.5" style={{ background: `${grade.color}20`, color: grade.color, border: `1px solid ${grade.color}40` }}>
                Grade {grade.grade} — {grade.label}
              </span>
            )}
          </div>
          <MiniRadar pillarScores={pillarScores} />
        </div>

        {/* Dimensions */}
        <div className="mb-8 pb-8 border-b-[0.5px] border-outline-variant">
          <div className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest mb-4">Dimensional Scores</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(pillarScores).map(([id, score]) => (
              <div key={id} className="text-center">
                <div className="text-headline-md font-headline-md text-on-background">{Math.round(score)}</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant">{PILLAR_SHORT[id]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-technical-sm font-technical-sm text-surface-variant">Skill Shape</div>
            <div className="text-label-md font-label-md text-on-background">{skillShape}-Shaped Profile</div>
          </div>
          <div className="text-right">
            <div className="text-technical-sm font-technical-sm text-surface-variant">Assessment</div>
            <div className="text-label-md font-label-md text-on-background">QIDS Intelligence Blueprint</div>
          </div>
        </div>
      </div>

      {/* Print Actions */}
      <div className="mt-6 no-print flex gap-4">
        <button onClick={() => window.print()} className="btn-primary glow flex-1">
          <Printer size={14} /> PRINT / SAVE PDF
        </button>
        <button onClick={() => navigate(-1)} className="btn-outline flex-1">
          BACK
        </button>
      </div>
    </div>
  );
}
