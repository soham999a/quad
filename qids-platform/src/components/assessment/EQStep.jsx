// ─── EQ Assessment step ───────────────────────────────────────────────────────
// Extracted from Assessment.jsx (P2 decomposition).

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { PILLARS, EQ_QUESTIONS } from '../../data/qidsData';
import { generateEQQuestions } from '../../services/groqService';
import AIQuestionGenerator from '../AIQuestionGenerator';
import { SectionHeader, LikertQuestion, RubricScorer } from './shared';

export default function EQStep({ scores, onChange, ageGroup }) {
  const pillar = PILLARS.EQ;
  const [activeTab, setActiveTab] = useState('partA');
  const [activeComponent, setActiveComponent] = useState('SA');
  const age = ageGroup || '11-18';

  const components = ['SA', 'ER', 'SM', 'E', 'IS'];
  const compData = EQ_QUESTIONS.partA;

  const getPartAScore = (comp) => {
    const s = scores.partA?.[comp] || {};
    return Object.values(s).filter(v => v > 0).length;
  };

  const getPartBScore = (actId) => scores.partB?.[actId] !== undefined;

  return (
    <div>
      <SectionHeader
        title="Emotional Quotient (EQ) — DEC Framework"
        subtitle={`Age Group: ${age === '11-18' ? '11–18 Years' : '19–32 Years'} | Part A: Self-Report (25 marks) + Part B: Activity Assessment (25 marks)`}
        color={pillar.color}
      />

      {/* Part tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low border-[0.5px] border-outline-variant mb-5">
        {[{ id: 'partA', label: 'Part A — Self-Report Questionnaire' }, { id: 'partB', label: 'Part B — Activity Assessment' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none ${activeTab === t.id ? 'text-on-primary' : 'text-surface-variant hover:text-on-surface-variant'
              }`}
            style={{ backgroundColor: activeTab === t.id ? pillar.color : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'partA' && (
        <div>
          <div className="p-3 border-[0.5px] border-(--status-ok)/30 bg-(--status-ok)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
            Rate each statement from 1 (Never) to 5 (Always). There are no right or wrong answers — be honest.
          </div>

          {/* Component tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-surface-container-low border-[0.5px] border-outline-variant">
            {components.map(c => {
              const answered = getPartAScore(c);
              const isActive = activeComponent === c;
              return (
                <button key={c} onClick={() => setActiveComponent(c)}
                  className={`px-3 py-1.5 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex items-center gap-1.5 ${isActive ? 'text-on-surface' : 'text-surface-variant hover:text-on-surface-variant'
                    }`}
                  style={{ backgroundColor: isActive ? pillar.color + '20' : 'transparent', color: isActive ? pillar.color : undefined }}>
                  {c}
                  <span className="text-[10px] px-1 py-0.5 opacity-60">{answered}/5</span>
                </button>
              );
            })}
          </div>

          <div className="mb-2">
            <div className="text-label-md font-label-md" style={{ color: pillar.color }}>{compData[activeComponent].label}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{compData[activeComponent].subParams}</div>
          </div>
          <div className="mt-4">
            {compData[activeComponent].questions[age].map((q, i) => (
              <LikertQuestion
                key={i} q={q} index={i}
                value={scores.partA?.[activeComponent]?.[i] || 0}
                onChange={v => onChange('partA', activeComponent, i, v)}
                color={pillar.color}
              />
            ))}
          </div>
          <AIQuestionGenerator
            pillar="EQ" component={activeComponent} ageGroup={age}
            questionType="likert" color={pillar.color}
            label={`${compData[activeComponent].label} statements`}
            generateFn={generateEQQuestions}
            onAnswersChange={(ans) => onChange('partA_ai', activeComponent, 'ai', ans)}
          />
        </div>
      )}

      {activeTab === 'partB' && (
        <div>
          <div className="flex gap-2 p-3 border-[0.5px] border-amber-500/30 bg-amber-500/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-500">Assessor-Scored Section.</strong> The evaluator observes each activity and enters rubric scores below. Each activity is worth 5 marks.
            </div>
          </div>

          {EQ_QUESTIONS.partB.map(activity => {
            const actScores = scores.partB?.[activity.id] || {};
            const total = activity.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
            return (
              <div key={activity.id} className="mb-5 border-[0.5px] overflow-hidden" style={{ borderColor: pillar.color + '30' }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{ backgroundColor: pillar.color + '08' }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{activity.id}: {activity.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{activity.component} | Max: {activity.maxScore} marks</div>
                  </div>
                  <div className="text-[20px] font-label-md" style={{ color: pillar.color }}>{total}/{activity.maxScore}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-3">{activity.desc}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mb-1 italic">
                    {activity.ageNote?.[age]}
                  </div>
                  <div className="mt-4">
                    <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">Assessor Rubric</div>
                    {activity.rubric.map(r => (
                      <RubricScorer
                        key={r.criterion}
                        criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={actScores[r.criterion] ?? undefined}
                        onChange={v => onChange('partB', activity.id, r.criterion, v)}
                        color={pillar.color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
