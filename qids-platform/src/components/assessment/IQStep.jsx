import { useTranslation } from 'react-i18next';
// ─── IQ Assessment step ───────────────────────────────────────────────────────
// Extracted from Assessment.jsx (P2 decomposition).

import React, { useState, useEffect } from 'react';
import { IQ_QUESTIONS } from '../../data/qidsData';
import { getRandomDiagramQuestions } from '../../data/diagramQuestions';
import { generateIQQuestions } from '../../services/groqService';
import DiagramQuestion from '../DiagramQuestion';
import AIQuestionGenerator from '../AIQuestionGenerator';
import { SectionHeader, MCQQuestion, OpenQuestion } from './shared';
const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
export default function IQStep({
  scores,
  onChange,
  ageGroup,
  context
}) {
  const {
    t
  } = useTranslation();
  const pillar = {
    id: 'IQ',
    color: 'var(--gold)'
  };
  const [activeSection, setActiveSection] = useState('verbal');
  const [diagramQs] = useState(() => getRandomDiagramQuestions(9));
  const [diagramAnswers, setDiagramAnswers] = useState(scores._diagramAnswers || {});
  useEffect(() => {
    onChange('_diagramQuestions', 0, diagramQs);
  }, []);
  const handleDiagramAnswer = (qId, val) => {
    const next = {
      ...diagramAnswers,
      [qId]: val
    };
    setDiagramAnswers(next);
    onChange('_diagramAnswers', 0, next);
  };
  const sections = [{
    id: 'verbal',
    label: 'Verbal',
    color: 'var(--phase-pre)'
  }, {
    id: 'quantitative',
    label: 'Quantitative',
    color: 'var(--violet-strong)'
  }, {
    id: 'psychometric',
    label: 'Psychometric',
    color: 'var(--phase-int)'
  }, {
    id: 'performance',
    label: 'Performance',
    color: 'var(--violet-soft)'
  }, {
    id: 'diagrams',
    label: 'Visual',
    color: 'var(--cyan-mid)'
  }, {
    id: 'ai',
    label: 'AI',
    color: 'var(--status-ok)'
  }];
  const sectionData = ['verbal', 'quantitative', 'psychometric', 'performance'].includes(activeSection) ? IQ_QUESTIONS[activeSection] : null;
  const handleAnswer = (sectionId, qIndex, value) => {
    onChange(sectionId, qIndex, value);
  };
  const getScore = sectionId => {
    if (sectionId === 'diagrams') return diagramQs.filter(q => diagramAnswers[q.id] === q.answer).length;
    if (sectionId === 'ai') {
      let correct = 0;
      let total = 0;
      const mcqSections = ['quantitative', 'psychometric'];
      const openSections = ['verbal', 'performance'];
      mcqSections.forEach(sec => {
        const aiData = scores['ai_' + sec];
        if (aiData?.answers && aiData?.questions) {
          Object.entries(aiData.answers).forEach(([idx, val]) => {
            total++;
            const q = aiData.questions[Number(idx)];
            if (q?.answer !== undefined && val === q.answer) correct++;
          });
        }
      });
      openSections.forEach(sec => {
        const aiData = scores['ai_' + sec];
        if (aiData?.answers) {
          const answered = Object.values(aiData.answers).filter(v => v !== undefined && v !== '').length;
          total += answered;
          correct += answered;
        }
      });
      return total > 0 ? correct : 0;
    }
    const s = scores[sectionId] || {};
    return Object.values(s).filter(v => v !== undefined && v !== '').length;
  };
  return <div>
      <SectionHeader title={t("IQStep.intelligence_quotient_iq")} subtitle="Four-Parameter Cognitive Model — 100 marks total (25 per section)" color={pillar.color} />

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-surface-container-low border-[0.5px] border-outline-variant">
        {sections.map(s => {
        const answered = getScore(s.id);
        const isActive = activeSection === s.id;
        return <button key={s.id} onClick={() => setActiveSection(s.id)} className={`px-4 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex items-center gap-1.5 ${isActive ? 'text-on-surface' : 'text-surface-variant hover:text-on-surface-variant'}`} style={{
          backgroundColor: isActive ? alpha(s.color, 20) : 'transparent',
          color: isActive ? s.color : undefined
        }}>
              {s.label}
              <span className="text-[10px] px-1.5 py-0.5 opacity-60">{answered} ans</span>
            </button>;
      })}
      </div>

      {/* Standard questions */}
      {['verbal', 'quantitative', 'psychometric', 'performance'].includes(activeSection) && <>
          <div className="text-label-md font-label-md mb-1" style={{
        color: sections.find(s => s.id === activeSection)?.color
      }}>{sectionData.label}</div>
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-4">{t("inter.max_marks", { n: sectionData.maxScore })}</div>
          {sectionData.sections.map((sec, si) => <div key={si} className="mb-6">
              <div className="text-technical-sm font-technical-sm text-on-surface-variant mb-1 px-3 py-1.5 bg-primary/5 border-[0.5px] border-primary/20 inline-block">{sec.title}</div>
              {sec.instruction && <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 italic">{sec.instruction}</div>}
              <div className="mt-2">
                {sec.questions.map((q, qi) => {
            const globalIdx = si * 5 + qi;
            const qType = sec.type === 'mixed' ? q.type || 'open' : sec.type;
            const val = scores[activeSection]?.[globalIdx];
            if (qType === 'mcq') {
              return <MCQQuestion key={qi} q={q} index={qi} selected={val} onSelect={v => handleAnswer(activeSection, globalIdx, v)} color={sections.find(s => s.id === activeSection)?.color || 'var(--phase-pre)'} />;
            }
            return <OpenQuestion key={qi} q={q} index={qi} value={val} onChange={v => handleAnswer(activeSection, globalIdx, v)} />;
          })}
              </div>
            </div>)}
        </>}

      {/* Diagrams */}
      {activeSection === 'diagrams' && <div>
          <div className="p-3 border-[0.5px] border-(--cyan-mid)/30 bg-(--cyan-mid)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong className="text-(--cyan-mid)">{t("IQStep.visual_diagram_questions")}</strong>{t("IQStep.9_questions_randomly_selected")}</div>
          {diagramQs.map((q, i) => <DiagramQuestion key={q.id} question={q} index={i} selected={diagramAnswers[q.id]} onSelect={v => handleDiagramAnswer(q.id, v)} color="var(--cyan-mid)" />)}
          <div className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant flex justify-between items-center mt-2">
            <span className="text-technical-sm font-technical-sm text-on-surface-variant">{t("IQStep.visual_bonus_score")}</span>
            <span className="text-label-md font-label-md text-(--cyan-mid)">{diagramQs.filter(q => diagramAnswers[q.id] === q.answer).length} / 9</span>
          </div>
        </div>}

      {/* AI-generated questions */}
      {activeSection === 'ai' && <div>
          <div className="p-3 border-[0.5px] border-(--status-ok)/30 bg-(--status-ok)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong className="text-(--status-ok)">{t("IQStep.ai_generated_questions")}</strong>{t("IQStep.fresh_questions_generated_by")}</div>
          {['verbal', 'quantitative', 'psychometric', 'performance'].map(sec => <AIQuestionGenerator key={sec} pillar="IQ" component={sec} ageGroup={ageGroup} context={context} questionType={sec === 'verbal' || sec === 'performance' ? 'open' : 'mcq'} color="var(--status-ok)" label={`${sec.charAt(0).toUpperCase() + sec.slice(1)} IQ`} generateFn={params => generateIQQuestions({
        ...params,
        section: sec
      })} onAnswersChange={(ans, qs) => onChange('ai_' + sec, 0, {
        answers: ans,
        questions: qs
      })} />)}
        </div>}
    </div>;
}