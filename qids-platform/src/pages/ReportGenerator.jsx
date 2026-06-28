import React, { useState } from 'react';
import { PILLARS, computePillarScore, computeWeightedScore, getGrade, getCareerProfile, getSkillShape, SKILL_SHAPES, WEIGHTS, GRADE_BANDS, CONTEXTS, IQ_MAX_SCORE, mergeEvaluationScores } from '../data/qidsData';
import { useApp } from '../App';
import QIDSRadar from '../components/RadarChart';
import { Download, Printer, AlertTriangle, UserCheck } from 'lucide-react';

export default function ReportGenerator() {
  const { assessmentData, postData, context, demoMode, evaluations, mergedPillarScores } = useApp();
  const [reportType, setReportType] = useState('full');

  const preRaw = assessmentData?.rawScores || {};
  const postRaw = postData?.rawScores || {};
  const intake = assessmentData?.intake || { name: 'Alex Johnson', age: '28', institution: 'Demo Organization', evaluator: 'Dr. Smith' };

  const hasEvalScores = mergedPillarScores !== null && evaluations?.length > 0;

  const preScores = {};
  const postScores = {};
  Object.keys(PILLARS).forEach(id => {
    preScores[id] = hasEvalScores
      ? (mergedPillarScores[id] ?? computePillarScore(id, preRaw[id] || {}))
      : computePillarScore(id, preRaw[id] || {});
    postScores[id] = computePillarScore(id, postRaw[id] || {});
  });

  const preUnified = computeWeightedScore(preScores);
  const postUnified = computeWeightedScore(postScores);
  const overallGrade = getGrade(postUnified);
  const careerProfile = getCareerProfile(postScores);
  const skillShape = getSkillShape(postScores);
  const skillShapeData = SKILL_SHAPES.find(s => s.id === skillShape);
  const ctx = CONTEXTS.find(c => c.id === context) || CONTEXTS[0];

  const handlePrint = () => window.print();

  return (
    <div className="page-pad max-w-[1000px] mx-auto animate-fade">
      {/* Page header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="text-technical-sm font-technical-sm text-primary mb-2">QIDS REPORT</div>
          <h1 className="text-headline-md font-headline-md text-on-background">Report Generator</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrint}
            className="px-5 py-2.5 border-[0.5px] border-outline-variant text-on-surface-variant text-label-md font-label-md hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent uppercase tracking-widest">
            <Printer size={13} className="inline mr-2" /> Print
          </button>
          <button onClick={handlePrint}
            className="px-5 py-2.5 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">
            <Download size={13} className="inline mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* Report type selector */}
      <div className="flex gap-2 mb-8 pb-6 border-b-[0.5px] border-outline-variant">
        {[
          { id: 'full', label: 'Full QIDS Report' },
          { id: 'profile', label: 'Individual Quotient Profile' },
          { id: 'progress', label: 'Progress & Intervention Summary' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setReportType(id)}
            className={`px-5 py-2.5 text-label-md font-label-md transition-all cursor-pointer uppercase tracking-widest ${reportType === id ? 'bg-primary text-on-primary' : 'border-[0.5px] border-outline-variant text-on-surface-variant bg-transparent hover:text-primary hover:border-primary'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Report document */}
      <div id="report-content" className="border-[0.5px] border-outline-variant">
        {/* Report header */}
        <div className="p-8 border-b-[0.5px] border-outline-variant">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="text-technical-sm font-technical-sm text-primary mb-3 uppercase tracking-widest">
                Quadrant Intelligence Development System
              </div>
              <h2 className="text-headline-md font-headline-md text-on-surface mb-1">
                {reportType === 'full' ? 'QIDS Development Report' : reportType === 'profile' ? 'Individual Quotient Profile' : 'Progress & Intervention Summary'}
              </h2>
              <p className="text-technical-sm font-technical-sm text-surface-variant">Holistic Intelligence Assessment & Development Analysis</p>
            </div>
            <div className="text-right">
              <div className="text-technical-sm font-technical-sm text-surface-variant mb-1">Context</div>
              <div className="text-label-md font-label-md text-primary">{ctx.icon} {ctx.label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-3">Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Subject info */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Name', val: intake.name || '—' },
              { label: 'Age', val: intake.age || '—' },
              { label: 'Institution', val: intake.institution || '—' },
              { label: 'Evaluator', val: intake.evaluator || '—' },
              ...(hasEvalScores ? [{ label: 'Eval Scoring', val: <span className="text-primary flex items-center gap-1"><UserCheck size={12} /> {evaluations.length} pillar{(evaluations.length > 1 ? 's' : '')} scored</span> }] : []),
            ].map(({ label, val }) => (
              <div key={label} className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant">
                <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-1">{label}</div>
                <div className="text-label-md font-label-md text-on-surface">{val}</div>
              </div>
            ))}
          </div>

          {/* Score summary */}
          <h3 className="text-label-md font-label-md text-on-surface mb-6 uppercase tracking-widest">Quotient Score Summary</h3>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const pre = preScores[id];
              const post = postScores[id];
              const isIQ = id === 'IQ';
              const displayMax = isIQ ? IQ_MAX_SCORE : 100;
              const normalizedPost = isIQ ? Math.round((post / IQ_MAX_SCORE) * 100) : post;
              const grade = getGrade(normalizedPost);
              const pct = Math.min(Math.round((post / displayMax) * 100), 100);
              return (
                <div key={id} className="p-4 bg-surface-container-low border-[0.5px] border-outline-variant relative">
                  <div className="text-technical-sm font-technical-sm mb-2" style={{ color: pillar.color }}>{pillar.short}</div>
                  <div className="text-[28px] font-technical-sm text-on-surface">{post}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">/ {displayMax} | Grade {grade.grade}</div>
                  {isIQ && <div className="text-[10px] font-technical-sm text-primary mt-1">Normalized: {normalizedPost}/100</div>}
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">Pre: {pre} | Δ {post - pre > 0 ? '+' : ''}{post - pre}</div>
                  <div className="h-[3px] bg-surface-variant/30 mt-3">
                    <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
                  </div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-2">Weight: ×{pillar.weight.toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* Unified score */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 border-[0.5px] border-primary/30 bg-primary/5">
              <div className="text-technical-sm font-technical-sm text-surface-variant mb-2 uppercase tracking-widest">Unified QIDS Score</div>
              <div className="text-[52px] font-technical-sm text-on-surface leading-none">{postUnified}</div>
              <div className="text-label-md font-label-md text-primary mt-2">Grade {overallGrade.grade}: {overallGrade.label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-3">
                Pre-Intervention: {preUnified} | Improvement: +{postUnified - preUnified} pts
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-[0.5px] border-outline-variant">
              <div className="text-technical-sm font-technical-sm text-surface-variant mb-4 uppercase tracking-widest">Weighting</div>
              {Object.entries(WEIGHTS).map(([k, w]) => (
                <div key={k} className="flex justify-between mb-2 text-technical-sm font-technical-sm">
                  <span style={{ color: PILLARS[k].color }}>{k} ({postScores[k]}) × {w.toFixed(2)}</span>
                  <span className="text-on-surface font-semibold">{Math.round(postScores[k] * w)}</span>
                </div>
              ))}
              <div className="border-t-[0.5px] border-outline-variant pt-3 mt-3 flex justify-between">
                <span className="text-label-md font-label-md text-on-surface">Unified Score</span>
                <span className="text-label-md font-label-md text-primary">{postUnified}</span>
              </div>
            </div>
          </div>

          {/* Radar + Heatmap */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-surface-container-low border-[0.5px] border-outline-variant">
              <h4 className="text-label-md font-label-md text-on-surface mb-4 uppercase tracking-widest">Quotient Radar Profile</h4>
              <QIDSRadar data={preScores} compare={postScores} size={240} />
            </div>
            <div className="p-6 bg-surface-container-low border-[0.5px] border-outline-variant">
              <h4 className="text-label-md font-label-md text-on-surface mb-4 uppercase tracking-widest">Sub-Parameter Heatmap</h4>
              <div className="flex flex-col gap-3">
                {Object.entries(PILLARS).map(([pid, pillar]) => (
                  <div key={pid}>
                    <div className="text-technical-sm font-technical-sm mb-2" style={{ color: pillar.color }}>{pillar.short}</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {pillar.subParams.map(sp => {
                        const raw = postRaw[pid]?.[sp.id] || 0;
                        const pct = Math.round((raw / sp.max) * 100);
                        const bg = pct >= 75 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-red-500';
                        const borderBg = pct >= 75 ? 'border-emerald-500/40' : pct >= 60 ? 'border-amber-500/40' : 'border-red-500/40';
                        return (
                          <div key={sp.id}
                            className={`px-2 py-1 text-[10px] font-technical-sm font-semibold border-[0.5px] ${bg} ${borderBg} ${pct >= 75 ? 'bg-emerald-500/10' : pct >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                            {pct}%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Career & Skill Shape */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-surface-container-low border-[0.5px] border-outline-variant">
              <h4 className="text-label-md font-label-md text-on-surface mb-4 uppercase tracking-widest">Career Guidance</h4>
              <div className="text-headline-md font-headline-md text-on-surface mb-2">{careerProfile.label}</div>
              <p className="text-technical-sm font-technical-sm text-surface-variant leading-relaxed mb-4">{careerProfile.desc}</p>
              <div className="flex flex-wrap gap-2">
                {careerProfile.roles.map(r => (
                  <span key={r} className="px-3 py-1 border-[0.5px] border-primary/30 bg-primary/5 text-technical-sm font-technical-sm text-primary">{r}</span>
                ))}
              </div>
            </div>
            <div className="p-6 bg-surface-container-low border-[0.5px] border-outline-variant">
              <h4 className="text-label-md font-label-md text-on-surface mb-4 uppercase tracking-widest">Skill Shape</h4>
              <div className="flex items-center gap-4">
                <div className="text-[56px] font-technical-sm text-primary">{skillShape}</div>
                <div>
                  <div className="text-label-md font-label-md text-on-surface mb-1">{skillShapeData?.label}</div>
                  <p className="text-technical-sm font-technical-sm text-surface-variant leading-relaxed">{skillShapeData?.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gap analysis */}
          <div className="p-6 bg-surface-container-low border-[0.5px] border-outline-variant mb-8">
            <h4 className="text-label-md font-label-md text-on-surface mb-4 uppercase tracking-widest">Gap Analysis & Recommendations</h4>
            <div className="flex flex-col gap-3">
              {Object.entries(PILLARS).map(([id, pillar]) => {
                const score = postScores[id];
                const isCrit = score < 60;
                return (
                  <div key={id} className="flex items-center gap-4">
                    <span className="text-label-md font-label-md min-w-[30px]" style={{ color: pillar.color }}>{id}</span>
                    <div className="flex-1 h-[5px] bg-surface-variant/30">
                      <div className="h-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: pillar.color }} />
                    </div>
                    <span className={`text-technical-sm font-technical-sm font-semibold min-w-[50px] ${isCrit ? 'text-error' : 'text-primary'}`}>{score}/100</span>
                    {isCrit && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={11} className="text-error" />
                        <span className="text-technical-sm font-technical-sm text-error">Critical</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final recommendation */}
          <div className="p-6 border-[0.5px] border-primary/30 bg-primary/5">
            <h4 className="text-label-md font-label-md text-on-surface mb-3 uppercase tracking-widest">Final Recommendation</h4>
            <p className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed">
              Based on the post-intervention QIDS assessment, {intake.name || 'the individual'} demonstrates a <strong className="text-primary">{overallGrade.label}</strong> overall profile (Grade {overallGrade.grade}, Score: {postUnified}/100).
              The profile indicates a <strong className="text-primary">{skillShapeData?.label}</strong> skill topology, best aligned with the <strong className="text-primary">{careerProfile.label}</strong>.
              Continued focus on maintenance activities and periodic reassessment is recommended to sustain and build upon the gains achieved during the intervention phase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
