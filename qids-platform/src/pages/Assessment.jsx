import { useTranslation } from 'react-i18next';
import usePageTitle from '../lib/usePageTitle';
import React, { useState, useEffect, useRef, useId } from 'react';
import { PILLARS, EQ_QUESTIONS, SQ_QUESTIONS, IQ_QUESTIONS, AQ_QUESTIONS, mapAQLikert } from '../data/qidsData';
import { useBankText } from '../data/banks';
import { evaluateQidsAssessment, getGrade } from '../core/engine/qids';
import { getRandomDiagramQuestions } from '../data/diagramQuestions';
import { generateIQQuestions, generateEQQuestions, generateAQQuestions, generateSQQuestions } from '../services/groqService';
import DiagramQuestion from '../components/DiagramQuestion';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveAssessment, getStudentEvaluator, listPublicEvaluators, assignEvaluator, removeAssignment } from '../services/firestoreService';
import { newSubmissionId, submitAssessmentForVerification } from '../services/scoringService';
import ReviewStep from '../components/assessment/ReviewStep';
import { deriveRawScores } from '../../shared/scoring/answers.js';
import { recordSchoolAttempt, getSchoolAssessment } from '../services/schoolService';
import { notifyAttemptRecorded, notifyEvaluatorLinked, notifyEvaluatorAssigned, notifyEvaluatorStudentActivity } from '../services/notificationService';
import { logEvent, queueEvent, flushQueuedEvents, ASSESSMENT_STEPS } from '../lib/analytics';
import { Save, ChevronRight, ChevronLeft, Check, CheckCircle, AlertCircle, ClipboardList, Brain, Heart, Users, Shield, ArrowRight } from 'lucide-react';
import { useToast } from '../components/Toast';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint, loadRemoteCheckpoint, saveRemoteCheckpoint } from '../lib/checkpoint';
import { useKeyboardAnswering, KeyboardHint, kbFocusStyle } from '../lib/keyboardAnswering';
const STEPS = ['Intake & Consent', 'IQ Assessment', 'EQ Assessment', 'SQ Assessment', 'AQ Assessment', 'Review & Submit'];
const PILLAR_ICONS = {
  IQ: Brain,
  EQ: Heart,
  SQ: Users,
  AQ: Shield
};
const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  color
}) {
  return <div className="flex items-center gap-3 p-4 mb-5 border-l-2 border-primary bg-surface-container-low hairline-b hairline-t hairline-r">
      <div>
        <div className="text-label-md font-label-md" style={{
        color: color || 'var(--gold)'
      }}>{title}</div>
        {subtitle && <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{subtitle}</div>}
      </div>
    </div>;
}
function MCQQuestion({
  q,
  index,
  selected,
  onSelect,
  color
}) {
  const tq = useBankText();
  const gid = useId();
  const labelId = `${gid}-label`;
  return <div className="mb-4 p-3 md:p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div id={labelId} className="text-technical-sm font-technical-sm text-on-surface mb-3 leading-relaxed">
        <span className="text-surface-variant mr-2">Q{index + 1}.</span>{tq(q.q)}
      </div>
      {/* Every option is a toggle button: aria-pressed is what makes the
          current selection audible, since colour alone conveys it otherwise. */}
      <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
        const isSelected = selected === i;
        return <button key={i} type="button" aria-pressed={isSelected} onClick={() => onSelect(i)} className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-3 text-left text-technical-sm font-technical-sm transition-all cursor-pointer border-[0.5px] touch-target ${isSelected ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary"></div>}
              </div>
              <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {tq(opt)}
            </button>;
      })}
      </div>
    </div>;
}
function OpenQuestion({
  q,
  index,
  value,
  onChange
}) {
  const {
    t
  } = useTranslation();
  const tq = useBankText();
  return <div className="mb-4 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-3 leading-relaxed">
        <span className="text-surface-variant mr-2">Q{index + 1}.</span>{tq(q.q)}
      </div>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={t("Assessment.write_your_answer_here")} rows={3} className="w-full p-3 bg-background border-[0.5px] border-outline-variant text-on-surface text-technical-sm font-technical-sm outline-none focus:border-primary resize-y" />
    </div>;
}
function LikertQuestion({
  q,
  index,
  value,
  onChange,
  color
}) {
  const tq = useBankText();
  const gid = useId();
  const labelId = `${gid}-label`;
  const labels = [
    tq('Never'),
    tq('Rarely'),
    tq('Sometimes'),
    tq('Often'),
    tq('Always')
  ];
  return <div className="mb-4 p-3 md:p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div id={labelId} className="text-technical-sm font-technical-sm text-on-surface mb-4 leading-relaxed">
        <span className="text-surface-variant mr-2">{index + 1}.</span>{tq(q)}
      </div>
      <div role="group" aria-labelledby={labelId} className="flex gap-1.5 md:gap-2 items-stretch">
        {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" aria-pressed={value === n} aria-label={`${labels[n - 1]} (${n} of 5)`} onClick={() => onChange(n)} className={`flex-1 px-1 md:px-2 py-3 md:py-4 cursor-pointer transition-all border-[0.5px] flex flex-col items-center gap-1 touch-target ${value === n ? 'border-primary bg-primary/15 text-primary' : 'border-outline-variant bg-transparent text-surface-variant hover:border-primary hover:text-primary'}`}>
            <span className="text-sm md:text-base font-bold">{n}</span>
            <span className="text-[8px] md:text-[9px] font-normal text-center leading-tight">{labels[n - 1]}</span>
          </button>)}
      </div>
    </div>;
}
function RubricScorer({
  criterion,
  marks,
  desc,
  value,
  onChange,
  color
}) {
  const { t } = useTranslation();
  const gid = useId();
  const labelId = `${gid}-label`;
  return <div className="mb-3 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div id={labelId} className="text-technical-sm font-technical-sm text-on-surface">{criterion}</div>
          <div className="text-[11px] text-surface-variant leading-relaxed mt-1">{desc}</div>
        </div>
        <div className="text-[11px] text-surface-variant flex-shrink-0 ml-3">{t("inter.max_n", { n: marks })}</div>
      </div>
      <div role="group" aria-labelledby={labelId} className="flex gap-1.5">
        {Array.from({
        length: marks + 1
      }, (_, i) => <button key={i} type="button" aria-pressed={value === i} aria-label={`${i} / ${marks}`} onClick={() => onChange(i)} className={`w-9 h-9 cursor-pointer transition-all border-[0.5px] text-sm font-bold ${value === i ? 'border-primary bg-primary/20 text-primary' : 'border-outline-variant bg-transparent text-surface-variant hover:border-primary hover:text-primary'}`}>{i}</button>)}
      </div>
    </div>;
}

// ─── INTAKE STEP ──────────────────────────────────────────────────────────────
function IntakeStep({
  data,
  onChange,
  evaluators,
  currentEv,
  onAssign,
  onRemove,
  loadingEv
}) {
  const {
    t
  } = useTranslation();
  const inputClass = "w-full h-12 px-4 bg-background border-[0.5px] border-outline-variant text-on-surface placeholder:text-surface-variant font-technical-sm outline-none focus:border-primary";
  const labelClass = "text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest";
  return <div>
      <div className="text-technical-sm font-technical-sm text-primary mb-6">{t("Assessment.i_intake_consent")}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[{
        key: 'name',
        label: t("IntakeStep.full_name"),
        placeholder: t("IntakeStep.enter_full_name")
      }, {
        key: 'age',
        label: t("IntakeStep.age"),
        placeholder: t("IntakeStep.enter_age"),
        type: 'number'
      }, {
        key: 'institution',
        label: t("IntakeStep.institution_organization"),
        placeholder: t("IntakeStep.enter_institution_name")
      }].map(({
        key,
        label,
        placeholder,
        type
      }) => <div key={key} className="flex flex-col gap-2">
            <span className={labelClass}>{label}</span>
            <input className={inputClass} type={type || 'text'} placeholder={placeholder} value={data[key] || ''} onChange={e => onChange(key, e.target.value)} />
          </div>)}
        <div className="flex flex-col gap-2">
          <span className={labelClass}>{t("Assessment.evaluator")}</span>
          {currentEv ? <div className="flex items-center gap-2 px-4 py-3 border-[0.5px] border-primary/50 bg-primary/5 h-12 text-technical-sm font-technical-sm text-primary">
              <span className="flex-1">{currentEv.name || currentEv.email || t("IntakeStep.assigned_evaluator")}</span>
              <button onClick={onRemove} disabled={loadingEv} className="px-3 py-1 border-[0.5px] border-error/50 text-error text-technical-sm font-technical-sm hover:bg-error/10 cursor-pointer bg-transparent">{t("Assessment.remove")}</button>
            </div> : <select className={inputClass} value="" onChange={e => onAssign(e.target.value)} disabled={loadingEv}>
              <option value="">{loadingEv ? t("IntakeStep.loading") : evaluators.length === 0 ? t("IntakeStep.no_evaluators_available") : t("IntakeStep.select_an_evaluator")}</option>
              {evaluators.map(ev => <option key={ev.uid} value={ev.uid}>{ev.name || ev.email}</option>)}
            </select>}
        </div>
      </div>

      <div className="mb-6">
        <span className={`${labelClass} block mb-2`}>{t("Assessment.age_group")}</span>
        <div className="flex gap-3">
          {[{
          id: '11-18',
          label: t("IntakeStep.age_11_18"),
          desc: t("IntakeStep.age_11_18_desc")
        }, {
          id: '19-32',
          label: t("IntakeStep.age_19_32"),
          desc: t("IntakeStep.age_19_32_desc")
        }].map(ag => <button key={ag.id} type="button" aria-pressed={data.ageGroup === ag.id} onClick={() => onChange('ageGroup', ag.id)} className={`flex-1 py-4 px-4 border-[0.5px] text-left cursor-pointer transition-all bg-transparent ${data.ageGroup === ag.id ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>
              <div className="text-label-md font-label-md">{ag.label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{ag.desc}</div>
            </button>)}
        </div>
      </div>

      <div className="mb-6">
        <span className={`${labelClass} block mb-2`}>{t("Assessment.assessment_purpose")}</span>
        <textarea rows={3} placeholder={t("Assessment.describe_the_purpose_of")} value={data.purpose || ''} onChange={e => onChange('purpose', e.target.value)} className="w-full p-4 bg-background border-[0.5px] border-outline-variant text-on-surface placeholder:text-surface-variant font-technical-sm outline-none focus:border-primary resize-y" />
      </div>

      <div className="p-4 border-[0.5px] border-primary/30 bg-primary/5 flex items-start gap-4">
        <input type="checkbox" id="consent" checked={data.consent || false} onChange={e => onChange('consent', e.target.checked)} className="w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer accent-primary" />
        <label htmlFor="consent" className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed cursor-pointer">{t("Assessment.i_confirm_that_the")}</label>
      </div>
    </div>;
}

// ─── IQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function IQStep({
  scores,
  onChange,
  ageGroup,
  context
}) {
  const {
    t
  } = useTranslation();
  const pillar = PILLARS.IQ;
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
        if (aiData?.answers && aiData?.questions) {
          // Open answers are scored on merit (0–2 marks each via Groq rubric),
          // never auto-credited just for responding.
          const scored = aiData.openScores || {};
          Object.entries(aiData.answers).forEach(([idx, val]) => {
            if (val === undefined || val === '') return;
            total += 2;
            correct += scored[idx]?.marks ?? 0;
          });
        }
      });
      return total > 0 ? correct : 0;
    }
    const s = scores[sectionId] || {};
    return Object.values(s).filter(v => v !== undefined && v !== '').length;
  };
  return <div>
      <SectionHeader title={t("Assessment.intelligence_quotient_iq")} subtitle="Four-Parameter Cognitive Model — 100 marks total (25 per section)" color={pillar.color} />

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
            <strong className="text-(--cyan-mid)">{t("Assessment.visual_diagram_questions")}</strong>{t("Assessment.9_questions_randomly_selected")}</div>
          {diagramQs.map((q, i) => <DiagramQuestion key={q.id} question={q} index={i} selected={diagramAnswers[q.id]} onSelect={v => handleDiagramAnswer(q.id, v)} color="var(--cyan-mid)" />)}
          <div className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant flex justify-between items-center mt-2">
            <span className="text-technical-sm font-technical-sm text-on-surface-variant">{t("Assessment.visual_bonus_score")}</span>
            <span className="text-label-md font-label-md text-(--cyan-mid)">{diagramQs.filter(q => diagramAnswers[q.id] === q.answer).length} / 9</span>
          </div>
        </div>}

      {/* AI-generated questions */}
      {activeSection === 'ai' && <div>
          <div className="p-3 border-[0.5px] border-(--status-ok)/30 bg-(--status-ok)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong className="text-(--status-ok)">{t("Assessment.ai_generated_questions")}</strong>{t("Assessment.fresh_questions_generated_by")}</div>
          {['verbal', 'quantitative', 'psychometric', 'performance'].map(sec => <AIQuestionGenerator key={sec} pillar="IQ" component={sec} ageGroup={ageGroup} context={context} questionType={sec === 'verbal' || sec === 'performance' ? 'open' : 'mcq'} color="var(--status-ok)" label={`${sec.charAt(0).toUpperCase() + sec.slice(1)} IQ`} generateFn={params => generateIQQuestions({
        ...params,
        section: sec
      })} onAnswersChange={(ans, qs, openScores) => onChange('ai_' + sec, 0, {
        answers: ans,
        questions: qs,
        openScores
      })} />)}
        </div>}
    </div>;
}

// ─── EQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function EQStep({
  scores,
  onChange,
  ageGroup
}) {
  const {
    t
  } = useTranslation();
  const pillar = PILLARS.EQ;
  const [activeTab, setActiveTab] = useState('partA');
  const [activeComponent, setActiveComponent] = useState('SA');
  // Keyboard-first answering for the Likert lists (1–5, auto-advance).
  // Declared after activeComponent — the callbacks below read it.
  const kbCursor = useKeyboardAnswering({
    count: 5,
    mode: 'rating',
    getOptionCount: () => 5,
    onAnswer: (i, rating) => onChange('partA', activeComponent, i, rating),
    deps: [activeComponent]
  });
  const age = ageGroup || '11-18';
  const components = ['SA', 'ER', 'SM', 'E', 'IS'];
  const compData = EQ_QUESTIONS.partA;
  const getPartAScore = comp => {
    const s = scores.partA?.[comp] || {};
    return Object.values(s).filter(v => v > 0).length;
  };
  const getPartBScore = actId => scores.partB?.[actId] !== undefined;
  return <div>
      <SectionHeader title={t("Assessment.emotional_quotient_eq_dec")} subtitle={`Age Group: ${age === '11-18' ? '11–18 Years' : '19–32 Years'} | Part A: Self-Report (25 marks) + Part B: Activity Assessment (25 marks)`} color={pillar.color} />

      {/* Part tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low border-[0.5px] border-outline-variant mb-5">
        {[{
        id: 'partA',
        label: 'Part A — Self-Report Questionnaire'
      }, {
        id: 'partB',
        label: 'Part B — Activity Assessment'
      }].map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none ${activeTab === t.id ? 'text-on-primary' : 'text-surface-variant hover:text-on-surface-variant'}`} style={{
        backgroundColor: activeTab === t.id ? pillar.color : 'transparent'
      }}>
            {t.label}
          </button>)}
      </div>

      {activeTab === 'partA' && <div>
          <div className="p-3 border-[0.5px] border-(--status-ok)/30 bg-(--status-ok)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">{t("Assessment.rate_each_statement_from")}</div>

          {/* Component tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-surface-container-low border-[0.5px] border-outline-variant">
            {components.map(c => {
          const answered = getPartAScore(c);
          const isActive = activeComponent === c;
          return <button key={c} onClick={() => setActiveComponent(c)} className={`px-3 py-1.5 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex items-center gap-1.5 ${isActive ? 'text-on-surface' : 'text-surface-variant hover:text-on-surface-variant'}`} style={{
            backgroundColor: isActive ? pillar.color + '20' : 'transparent',
            color: isActive ? pillar.color : undefined
          }}>
                  {c}
                  <span className="text-[10px] px-1 py-0.5 opacity-60">{answered}/5</span>
                </button>;
        })}
          </div>

          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <div className="text-label-md font-label-md" style={{
            color: pillar.color
          }}>{compData[activeComponent].label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{compData[activeComponent].subParams}</div>
            </div>
            <KeyboardHint />
          </div>
          <div className="mt-4">
            {compData[activeComponent].questions[age].map((q, i) => <div key={i} data-kb-focus={kbCursor === i || undefined} style={kbFocusStyle(kbCursor === i)}>
                <LikertQuestion q={q} index={i} value={scores.partA?.[activeComponent]?.[i] || 0} onChange={v => onChange('partA', activeComponent, i, v)} color={pillar.color} />
              </div>)}
          </div>
          <AIQuestionGenerator pillar="EQ" component={activeComponent} ageGroup={age} questionType="likert" color={pillar.color} label={`${compData[activeComponent].label} statements`} generateFn={generateEQQuestions} onAnswersChange={ans => onChange('partA_ai', activeComponent, 'ai', ans)} />
        </div>}

      {activeTab === 'partB' && <div>
          <div className="flex gap-2 p-3 border-[0.5px] border-amber-500/30 bg-amber-500/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-500">{t("Assessment.assessor_scored_section")}</strong>{t("Assessment.the_evaluator_observes_each")}</div>
          </div>

          {EQ_QUESTIONS.partB.map(activity => {
        
        const actScores = scores.partB?.[activity.id] || {};
        const total = activity.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
        return <div key={activity.id} className="mb-5 border-[0.5px] overflow-hidden" style={{
          borderColor: pillar.color + '30'
        }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{
            backgroundColor: pillar.color + '08'
          }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{activity.id}: {activity.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{activity.component} | Max: {activity.maxScore} marks</div>
                  </div>
                  <div className="text-[20px] font-label-md" style={{
              color: pillar.color
            }}>{total}/{activity.maxScore}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-3">{activity.desc}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mb-1 italic">
                    {activity.ageNote?.[age]}
                  </div>
                  <div className="mt-4">
                    <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("Assessment.assessor_rubric")}</div>
                    {activity.rubric.map(r => <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc} value={actScores[r.criterion] ?? undefined} onChange={v => onChange('partB', activity.id, r.criterion, v)} color={pillar.color} />)}
                  </div>
                </div>
              </div>;
      })}
        </div>}
    </div>;
}

// ─── SQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function SQStep({
  scores,
  onChange
}) {
  const {
    t
  } = useTranslation();
  const pillar = PILLARS.SQ;
  const [activeComponent, setActiveComponent] = useState('ACE');
  const [selectedPBAs, setSelectedPBAs] = useState(scores.selectedPBAs || []);
  const togglePBA = id => {
    const next = selectedPBAs.includes(id) ? selectedPBAs.filter(x => x !== id) : selectedPBAs.length < 2 ? [...selectedPBAs, id] : selectedPBAs;
    setSelectedPBAs(next);
    onChange('selectedPBAs', next);
  };
  const aceTotal = SQ_QUESTIONS.component1_ACE.exercises.reduce((sum, ex) => {
    const exScores = scores.ACE?.[ex.id] || {};
    return sum + ex.rubric.reduce((s, r) => s + (exScores[r.criterion] || 0), 0);
  }, 0);
  const csiTotal = SQ_QUESTIONS.component2_CSI.questions.reduce((sum, q) => {
    const sel = scores.CSI?.[q.id];
    if (sel === undefined) return sum;
    return sum + (q.options[sel]?.marks || 0);
  }, 0);
  const pbaTotal = selectedPBAs.reduce((sum, pbaId) => {
    const act = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === pbaId);
    if (!act) return sum;
    const pbaScores = scores.PBA?.[pbaId] || {};
    return sum + act.rubric.reduce((s, r) => s + (pbaScores[r.criterion] || 0), 0);
  }, 0);
  const tabs = [{
    id: 'ACE',
    label: 'Component 1 — ACE',
    score: `${aceTotal}/20`
  }, {
    id: 'CSI',
    label: 'Component 2 — CSI',
    score: `${csiTotal}/10`
  }, {
    id: 'PBA',
    label: 'Component 3 — PBA',
    score: `${pbaTotal}/20`
  }];
  return <div>
      <SectionHeader title={t("Assessment.social_quotient_sq_social")} subtitle="3 Components | Raw /50 > ×2 = 100 pts | Assessor-scored" color={pillar.color} />

      {/* Component tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low border-[0.5px] border-outline-variant mb-5">
        {tabs.map(t => <button key={t.id} onClick={() => setActiveComponent(t.id)} className={`flex-1 px-3 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex flex-col items-center gap-0.5 ${activeComponent === t.id ? 'text-on-primary' : 'text-surface-variant hover:text-on-surface-variant'}`} style={{
        backgroundColor: activeComponent === t.id ? pillar.color : 'transparent'
      }}>
            <span>{t.label}</span>
            <span className="text-[11px] opacity-80">{t.score}</span>
          </button>)}
      </div>

      {/* ACE */}
      {activeComponent === 'ACE' && <div>
          <div className="p-3 border-[0.5px] border-(--phase-int)/30 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{
          color: pillar.color
        }}>{t("Assessment.assessment_centre_exercise")}</strong> {SQ_QUESTIONS.component1_ACE.instructions}
          </div>
          {SQ_QUESTIONS.component1_ACE.exercises.map(ex => {
        
        const exScores = scores.ACE?.[ex.id] || {};
        const total = ex.rubric.reduce((s, r) => s + (exScores[r.criterion] || 0), 0);
        return <div key={ex.id} className="mb-5 border-[0.5px] overflow-hidden" style={{
          borderColor: pillar.color + '30'
        }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{
            backgroundColor: pillar.color + '08'
          }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{ex.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">Sub-parameter: {ex.subParam} | Max: {ex.marks} marks</div>
                  </div>
                  <div className="text-[20px] font-label-md" style={{
              color: pillar.color
            }}>{total}/{ex.marks}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">{ex.desc}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("Assessment.assessor_rubric")}</div>
                  {ex.rubric.map(r => <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc} value={exScores[r.criterion] ?? undefined} onChange={v => onChange('ACE', ex.id, r.criterion, v)} color={pillar.color} />)}
                </div>
              </div>;
      })}
        </div>}

      {/* CSI */}
      {activeComponent === 'CSI' && <div>
          <div className="p-3 border-[0.5px] border-(--phase-int)/30 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{
          color: pillar.color
        }}>{t("Assessment.cognitive_social_intelligence_test")}</strong> {tq(SQ_QUESTIONS.component2_CSI.instructions)}
          </div>
          {SQ_QUESTIONS.component2_CSI.questions.map((q, qi) => {
        
        const selected = scores.CSI?.[q.id];
        return <div key={q.id} className="mb-5 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
                <div className="text-technical-sm font-technical-sm mb-2 uppercase tracking-widest" style={{
            color: pillar.color
          }}>Q{qi + 1} — {q.subParam}</div>
                <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-3 p-3 bg-surface-container-low border-l-2 border-(--phase-int)/40">
                  <strong>{t("Assessment.scenario")}</strong> {tq(q.scenario)}
                </div>
                <div className="text-technical-sm font-technical-sm text-on-surface mb-3">{tq(q.question)}</div>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
              const isSelected = selected === oi;
              const markColor = opt.marks === 2 ? 'var(--status-ok)' : opt.marks === 1 ? 'var(--status-warn)' : 'var(--status-err)';
              return <button key={oi} onClick={() => onChange('CSI', q.id, oi)} className={`flex items-center gap-3 px-3 py-2.5 text-left text-technical-sm font-technical-sm transition-all cursor-pointer border-[0.5px] ${isSelected ? 'border-(--phase-int) bg-(--phase-int)/10' : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-(--phase-int)'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-(--phase-int) bg-(--phase-int)' : 'border-outline-variant'}`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary" />}
                        </div>
                        <span className="flex-1"><strong>{String.fromCharCode(65 + oi)}.</strong> {tq(opt.text)}</span>
                        {isSelected && <span className="text-[11px] px-2 py-0.5 font-bold flex-shrink-0" style={{
                  backgroundColor: alpha(markColor, 20),
                  color: markColor
                }}>
                            {opt.marks} mark{opt.marks !== 1 ? 's' : ''}
                          </span>}
                      </button>;
            })}
                </div>
                {selected !== undefined && <div className="mt-3 p-3 border-[0.5px] border-(--phase-int)/20 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-surface-variant italic">
                    <strong className="text-(--phase-int)">{t("Assessment.assessor_note")}</strong> {tq(q.assessorNote)}
                  </div>}
              </div>;
      })}
          <AIQuestionGenerator pillar="SQ" component="CSI" ageGroup="19-32" questionType="mcq" color={pillar.color} label="Social Intelligence scenarios" generateFn={generateSQQuestions} onAnswersChange={ans => onChange('CSI', 'ai', 'ai', ans)} />
        </div>}

      {/* PBA */}
      {activeComponent === 'PBA' && <div>
          <div className="p-3 border-[0.5px] border-(--phase-int)/30 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{
          color: pillar.color
        }}>{t("Assessment.performance_based_activities")}</strong> {SQ_QUESTIONS.component3_PBA.instructions}
          </div>

          <div className="mb-5">
            <div className="text-technical-sm font-technical-sm text-on-surface mb-3">{t("inter.select_two", { n: selectedPBAs.length })}</div>
            <div className="grid grid-cols-2 gap-2">
              {SQ_QUESTIONS.component3_PBA.activities.map(act => {
            const isSelected = selectedPBAs.includes(act.id);
            const isDisabled = !isSelected && selectedPBAs.length >= 2;
            return <button key={act.id} onClick={() => !isDisabled && togglePBA(act.id)} className={`px-3 py-2.5 text-left border-[0.5px] transition-all cursor-pointer ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${isSelected ? 'border-(--phase-int) bg-(--phase-int)/10' : 'border-outline-variant bg-surface-container-low hover:border-(--phase-int)'}`}>
                    <div className="text-technical-sm font-technical-sm" style={{
                color: isSelected ? pillar.color : undefined
              }}>{act.id}: {act.label}</div>
                    <div className="text-[10px] text-surface-variant mt-0.5">{act.time} | {act.bestFor}</div>
                  </button>;
          })}
            </div>
          </div>

          {selectedPBAs.map(pbaId => {
        
        const act = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === pbaId);
        if (!act) return null;
        const pbaScores = scores.PBA?.[pbaId] || {};
        const total = act.rubric.reduce((s, r) => s + (pbaScores[r.criterion] || 0), 0);
        return <div key={pbaId} className="mb-5 border-[0.5px] overflow-hidden" style={{
          borderColor: pillar.color + '30'
        }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{
            backgroundColor: pillar.color + '08'
          }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{act.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{act.bestFor} | {act.time}</div>
                  </div>
                  <div className="text-[20px] font-label-md" style={{
              color: pillar.color
            }}>{total}/{act.marks}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">{act.desc}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("Assessment.assessor_rubric")}</div>
                  {act.rubric.map(r => <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc} value={pbaScores[r.criterion] ?? undefined} onChange={v => onChange('PBA', pbaId, r.criterion, v)} color={pillar.color} />)}
                </div>
              </div>;
      })}
        </div>}
    </div>;
}

// ─── AQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function AQStep({
  scores,
  onChange,
  ageGroup
}) {
  const {
    t
  } = useTranslation();
  const pillar = PILLARS.AQ;
  const age = ageGroup || '11-18';
  const components = ['SA', 'PM', 'RR', 'RC'];
  const [activeComp, setActiveComp] = useState('SA');
  const [activeTab, setActiveTab] = useState('partA');
  const compData = AQ_QUESTIONS.components;
  const getPartAAnswered = comp => {
    const s = scores[comp]?.partA || {};
    return Object.values(s).filter(v => v > 0).length;
  };
  const getPartAMarks = comp => {
    const s = scores[comp]?.partA || {};
    return Object.values(s).reduce((sum, v) => sum + mapAQLikert(v || 0), 0);
  };
  const getPartBMarks = comp => {
    const act = compData[comp].activity;
    const s = scores[comp]?.partB || {};
    return act.rubric.reduce((sum, r) => sum + (s[r.criterion] || 0), 0);
  };
  const rdScore = components.reduce((sum, comp) => {
    const w = compData[comp].weight;
    const raw = Math.min(getPartAMarks(comp) + getPartBMarks(comp), 19);
    return sum + raw * w;
  }, 0);
  const converted = Math.round(rdScore / 95 * 100);
  return <div>
      <SectionHeader title={t("Assessment.adversity_quotient_aq_resilience")} subtitle={`Age Group: ${age === '11-18' ? '11–18 Years' : '19–32 Years'} | 4 Components × 19 marks | Weighted formula > /100`} color={pillar.color} />

      {/* Live RD Score preview */}
      <div className="flex items-center gap-3 p-4 border-[0.5px] border-amber-500/30 bg-amber-500/5 mb-5">
        <div className="flex-1">
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-1">{t("Assessment.live_rd_score_preview")}</div>
          <div className="text-technical-sm font-technical-sm text-on-surface-variant">Formula: (SA×1.5) + (PM×1.0) + (RR×1.0) + (RC×1.5) {'>'} max 95 {'>'} RD÷95×100</div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-label-md leading-none" style={{
          color: pillar.color
        }}>{converted}</div>
          <div className="text-[10px] text-surface-variant">RD: {Math.round(rdScore)}/95</div>
        </div>
      </div>

      {/* Component tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-surface-container-low border-[0.5px] border-outline-variant">
        {components.map(comp => {
        const cd = compData[comp];
        const answered = getPartAAnswered(comp);
        const partBTotal = getPartBMarks(comp);
        const isActive = activeComp === comp;
        return <button key={comp} onClick={() => {
          setActiveComp(comp);
          setActiveTab('partA');
        }} className={`px-3 py-1.5 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex flex-col items-center gap-0.5 ${isActive ? 'text-on-surface' : 'text-surface-variant hover:text-on-surface-variant'}`} style={{
          backgroundColor: isActive ? pillar.color + '20' : 'transparent',
          color: isActive ? pillar.color : undefined
        }}>
              <span className="font-bold">{comp}</span>
              <span className="text-[10px] opacity-80">{answered}/4 | B:{partBTotal}/7</span>
            </button>;
      })}
      </div>

      {/* Part tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low border-[0.5px] border-outline-variant mb-5">
        {[{
        id: 'partA',
        label: 'Part A — Scenario Questions (12 marks)'
      }, {
        id: 'partB',
        label: 'Part B — Activity Assessment (7 marks)'
      }].map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none ${activeTab === t.id ? 'text-on-primary' : 'text-surface-variant hover:text-on-surface-variant'}`} style={{
        backgroundColor: activeTab === t.id ? pillar.color : 'transparent'
      }}>
            {t.label}
          </button>)}
      </div>

      {/* Component header */}
      <div className="p-4 border-[0.5px] mb-4" style={{
      borderColor: pillar.color + '30',
      backgroundColor: pillar.color + '08'
    }}>
        <div className="text-label-md font-label-md" style={{
        color: pillar.color
      }}>{compData[activeComp].label} <span className="text-technical-sm font-technical-sm text-surface-variant font-normal">× weight {compData[activeComp].weight}</span></div>
        <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{compData[activeComp].subParams}</div>
        <div className="text-technical-sm font-technical-sm text-on-surface-variant mt-1 leading-relaxed">{compData[activeComp].desc}</div>
      </div>

      {/* Part A — Likert */}
      {activeTab === 'partA' && <div>
          <div className="p-3 border-[0.5px] border-amber-500/30 bg-amber-500/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
            Rate each scenario 1 (Not at all) to 5 (Completely). Scoring: 1–2 = 0 pts | 3 = 1 pt | 4 = 2 pts | 5 = 3 pts {'>'} Max 12 marks
          </div>
          {compData[activeComp].questions[age].map((q, i) => {
        const val = scores[activeComp]?.partA?.[i] || 0;
        const marks = mapAQLikert(val);
        return <div key={i} className="mb-4 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-technical-sm font-technical-sm uppercase tracking-widest mb-1" style={{
                color: pillar.color
              }}>{q.subParam}</div>
                    <div className="text-technical-sm font-technical-sm leading-relaxed">
                      <span className="text-surface-variant mr-1.5">{i + 1}.</span>{q.q}
                    </div>
                  </div>
                  {val > 0 && <div className="ml-3 flex-shrink-0 px-2 py-0.5 text-[11px] font-bold" style={{
              backgroundColor: pillar.color + '20',
              color: pillar.color
            }}>
                      {marks} pt{marks !== 1 ? 's' : ''}
                    </div>}
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => {
              const isSelected = val === n;
              const pts = mapAQLikert(n);
              return <button key={n} onClick={() => onChange(activeComp, 'partA', i, n)} className={`flex-1 py-2 px-1 cursor-pointer transition-all border-[0.5px] flex flex-col items-center gap-0.5 ${isSelected ? 'border-amber-500 bg-amber-500/15' : 'border-outline-variant bg-transparent text-surface-variant hover:border-amber-500'}`} style={{
                color: isSelected ? pillar.color : undefined
              }}>
                        <span className="text-sm font-bold">{n}</span>
                        <span className="text-[8px] font-normal">{['Not at all', 'Rarely', 'Sometimes', 'Often', 'Completely'][n - 1]}</span>
                        <span className="text-[9px]" style={{
                  color: pts > 0 ? 'var(--status-ok)' : undefined
                }}>{pts}pt</span>
                      </button>;
            })}
                </div>
              </div>;
      })}
          <div className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant flex justify-between items-center">
            <span className="text-technical-sm font-technical-sm text-on-surface-variant">{t("inter.subtotal", { x: activeComp })}</span>
            <span className="text-label-md font-label-md" style={{
          color: pillar.color
        }}>{getPartAMarks(activeComp)} / 12</span>
          </div>
          <AIQuestionGenerator pillar="AQ" component={activeComp} ageGroup={age} questionType="likert" color={pillar.color} label={`${compData[activeComp].label} scenarios`} generateFn={generateAQQuestions} onAnswersChange={ans => onChange(activeComp, 'partA_ai', 'ai', ans)} />
        </div>}

      {/* Part B — Activity rubric */}
      {activeTab === 'partB' && <div>
          <div className="flex gap-2 p-3 border-[0.5px] border-amber-500/30 bg-amber-500/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div><strong className="text-amber-500">{t("Assessment.assessor_scored_activity")}</strong>{t("Assessment.observe_the_participant_and")}</div>
          </div>

          {(() => {
        
        const act = compData[activeComp].activity;
        const actScores = scores[activeComp]?.partB || {};
        const total = act.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
        return <div className="border-[0.5px] overflow-hidden" style={{
          borderColor: pillar.color + '30'
        }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{
            backgroundColor: pillar.color + '08'
          }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{act.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{act.method}</div>
                  </div>
                  <div className="text-[22px] font-label-md" style={{
              color: pillar.color
            }}>{total}/{act.maxScore}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
                    {age === '11-18' ? act.desc11_18 : act.desc19_32}
                  </div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("Assessment.assessor_rubric")}</div>
                  {act.rubric.map(r => <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc} value={actScores[r.criterion] ?? undefined} onChange={v => onChange(activeComp, 'partB', r.criterion, v)} color={pillar.color} />)}
                </div>
              </div>;
      })()}
        </div>}
    </div>;
}

// ─── REVIEW STEP ──────────────────────────────────────────────────────────────
// ─── MAIN ASSESSMENT PAGE ─────────────────────────────────────────────────────
export default function Assessment() {
  const {
    t
  } = useTranslation();
  usePageTitle('Assessment');
  const {
    setAssessmentData,
    demoMode,
    context
  } = useApp();
  const {
    user,
    userProfile
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Class-assignment context handed off via localStorage by /app/my-class:
  // { teacherUid, classId, title } for the teacher-readable attempt record.
  const assignmentCtx = (() => {
    try {
      const raw = window.localStorage.getItem('qids-school-assignment');
      if (!raw) return null;
      const ctx = JSON.parse(raw);
      return ctx?.classId === classIdParam ? ctx : null;
    } catch { return null; }
  })();
  const toast = useToast();
  const mode = searchParams.get('mode') || 'qids';
  // School-mode assignment context: when a student starts a teacher-assigned
  // assessment, these identify the class + the specific assignment. Stamped
  // onto the saved assessment doc and mirrored into the schoolAttempts log.
  const classIdParam = searchParams.get('classId') || '';
  const schoolAssessmentIdParam = searchParams.get('assignmentId') || '';
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState({
    name: '',
    age: '',
    ageGroup: searchParams.get('ageGroup') || '11-18',
    institution: '',
    evaluator: '',
    purpose: searchParams.get('purpose') || '',
    consent: false
  });
  const [iqScores, setIqScores] = useState({});
  const [eqScores, setEqScores] = useState({});
  const [sqScores, setSqScores] = useState({});
  const [aqScores, setAqScores] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluators, setEvaluators] = useState([]);
  const [currentEv, setCurrentEv] = useState(null);
  const [loadingEv, setLoadingEv] = useState(false);
  const updateIntake = (k, v) => setIntake(prev => ({
    ...prev,
    [k]: v
  }));

  // ── Checkpoint/resume (blueprint P2) ─────────────────────────────────────────
  const checkpointRef = useRef(null);
  const [resumeState, setResumeState] = useState(null);

  // Server scoring: one stable id per attempt makes the write idempotent, and
  // the start time gives the integrity signal.
  const shadowRef = useRef(null);
  if (!shadowRef.current) shadowRef.current = { id: newSubmissionId(), startedAt: Date.now() };

  // ── Funnel measurement ─────────────────────────────────────────────────────
  // Where people stop is the only question this funnel has to answer, so the
  // step they reached and the time spent on it are both recorded.
  const stepStartRef = useRef(Date.now());
  const maxStepRef = useRef(0);
  useEffect(() => {
    stepStartRef.current = Date.now();
    maxStepRef.current = Math.max(maxStepRef.current, step);
  }, [step]);

  // A previous visit may have left an abandonment event it could not deliver.
  useEffect(() => { flushQueuedEvents(); }, []);

  const answeredCount = () =>
    Object.keys(iqScores || {}).length + Object.keys(eqScores || {}).length +
    Object.keys(sqScores || {}).length + Object.keys(aqScores || {}).length;

  useEffect(() => {
    if (submitted) return undefined;
    const onLeave = () => {
      // Only a real start counts as an abandonment; opening the page is not.
      if (maxStepRef.current < 1) return;
      queueEvent(user?.uid, 'assessment_abandoned', {
        step: maxStepRef.current,
        stepName: ASSESSMENT_STEPS[maxStepRef.current] || 'unknown',
        elapsedMs: Date.now() - shadowRef.current.startedAt,
        answered: answeredCount(),
      });
    };
    window.addEventListener('pagehide', onLeave);
    return () => window.removeEventListener('pagehide', onLeave);
  });

  // Focus mode: while answering (not intake/review/submitted), hide the shell
  // chrome so the assessment is the only thing on screen.
  useEffect(() => {
    const active = !submitted && step >= 1 && step <= 4;
    document.body.classList.toggle('qids-focus', active);
    return () => document.body.classList.remove('qids-focus');
  }, [step, submitted]);

  // Restore once on mount — local layer first, then the cross-device layer.
  // Only offer resume when there is real progress.
  useEffect(() => {
    let cancelled = false;
    const pick = cp => {
      const hasAnswers = [cp?.iqScores, cp?.eqScores, cp?.sqScores, cp?.aqScores].some(s => s && Object.keys(s).length > 0);
      const hasIntake = cp?.intake && (cp.intake.name?.trim() || cp.intake.consent);
      return cp && (cp.step > 0 || hasAnswers || hasIntake) ? cp : null;
    };
    const local = pick(loadCheckpoint('qids', user?.uid));
    if (local) {
      setResumeState(local);
      return;
    }
    (async () => {
      const remote = pick(await loadRemoteCheckpoint('qids', user?.uid));
      if (!cancelled && remote) setResumeState(remote);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Debounced save of all in-progress state on every change.
  // Local layer saves every 600ms; cross-device layer every ~20s (throttled).
  useEffect(() => {
    if (submitted) return;
    if (checkpointRef.current) clearTimeout(checkpointRef.current);
    checkpointRef.current = setTimeout(() => {
      const state = {
        step,
        intake,
        iqScores,
        eqScores,
        sqScores,
        aqScores
      };
      saveCheckpoint('qids', user?.uid, state);
      saveRemoteCheckpoint('qids', user?.uid, state);
    }, 600);
    return () => clearTimeout(checkpointRef.current);
  }, [step, intake, iqScores, eqScores, sqScores, aqScores, submitted, user]);
  const resumeAssessment = () => {
    if (!resumeState) return;
    logEvent(user?.uid, 'assessment_resumed', {
      step: resumeState.step ?? 0,
      savedHoursAgo: Math.round((Date.now() - (resumeState.savedAt || Date.now())) / 3_600_000),
    });
    setStep(resumeState.step ?? 0);
    setIntake(prev => ({
      ...prev,
      ...resumeState.intake
    }));
    setIqScores(resumeState.iqScores ?? {});
    setEqScores(resumeState.eqScores ?? {});
    setSqScores(resumeState.sqScores ?? {});
    setAqScores(resumeState.aqScores ?? {});
    setResumeState(null);
    toast('Resumed your saved progress.', 'success');
  };
  const discardResume = () => {
    clearCheckpoint('qids', user?.uid);
    setResumeState(null);
  };
  const handleAssignEvaluator = async evUid => {
    setLoadingEv(true);
    // Both helpers return booleans rather than throwing, so a denied write
    // looks exactly like success unless the return value is checked.
    const ok = await assignEvaluator(evUid, user.uid, userProfile?.name || user.displayName || '');
    if (!ok) {
      toast('Could not assign evaluator — try again', 'error');
      setLoadingEv(false);
      return;
    }
    try {
      const ev = evaluators.find(e => e.uid === evUid);
      setCurrentEv(ev || null);
      setIntake(prev => ({
        ...prev,
        evaluator: ev?.name || 'Assigned Evaluator',
        _evUid: evUid
      }));
      // Both parties get a bell: the evaluator gets the work, the person gets a
      // durable record of who can now read (and re-score) their results.
      notifyEvaluatorAssigned({
        evaluatorUid: evUid,
        studentName: userProfile?.name || user.displayName || 'A student',
      });
      notifyEvaluatorLinked({ studentUid: user.uid, evaluatorName: ev?.name || 'Your evaluator' });
      toast('Evaluator assigned', 'success');
    } catch (e) {
      toast('Failed to assign evaluator', 'error');
    }
    setLoadingEv(false);
  };
  const handleRemoveEvaluator = async () => {
    if (!currentEv || loadingEv) return;
    setLoadingEv(true);
    const ok = await removeAssignment(currentEv.uid, user.uid);
    if (ok) {
      setCurrentEv(null);
      setIntake(prev => ({
        ...prev,
        evaluator: '',
        _evUid: ''
      }));
      toast('Evaluator removed', 'success');
    } else {
      toast('Failed to remove evaluator — try again', 'error');
    }
    setLoadingEv(false);
  };
  const updateIQ = (section, qIndex, value) => {
    setIqScores(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [qIndex]: value
      }
    }));
  };
  const updateEQ = (part, keyA, keyB, value) => {
    if (part === 'partA') {
      setEqScores(prev => ({
        ...prev,
        partA: {
          ...(prev.partA || {}),
          [keyA]: {
            ...(prev.partA?.[keyA] || {}),
            [keyB]: value
          }
        }
      }));
    } else if (part === 'partA_ai') {
      setEqScores(prev => ({
        ...prev,
        partA_ai: {
          ...(prev.partA_ai || {}),
          [keyA]: {
            ...(prev.partA_ai?.[keyA] || {}),
            ai: value
          }
        }
      }));
    } else {
      setEqScores(prev => ({
        ...prev,
        partB: {
          ...(prev.partB || {}),
          [keyA]: {
            ...(prev.partB?.[keyA] || {}),
            [keyB]: value
          }
        }
      }));
    }
  };
  const updateSQ = (component, keyA, keyB, value) => {
    if (component === 'selectedPBAs') {
      setSqScores(prev => ({
        ...prev,
        selectedPBAs: keyA
      }));
    } else if (component === 'CSI') {
      setSqScores(prev => ({
        ...prev,
        CSI: {
          ...(prev.CSI || {}),
          [keyA]: keyB
        }
      }));
    } else {
      setSqScores(prev => ({
        ...prev,
        [component]: {
          ...(prev[component] || {}),
          [keyA]: {
            ...(prev[component]?.[keyA] || {}),
            [keyB]: value
          }
        }
      }));
    }
  };
  const updateAQ = (comp, part, key, value) => {
    if (part === 'partA') {
      setAqScores(prev => ({
        ...prev,
        [comp]: {
          ...(prev[comp] || {}),
          partA: {
            ...(prev[comp]?.partA || {}),
            [key]: value
          }
        }
      }));
    } else if (part === 'partA_ai') {
      setAqScores(prev => ({
        ...prev,
        [comp]: {
          ...(prev[comp] || {}),
          partA_ai: {
            ...(prev[comp]?.partA_ai || {}),
            [key]: value
          }
        }
      }));
    } else {
      setAqScores(prev => ({
        ...prev,
        [comp]: {
          ...(prev[comp] || {}),
          partB: {
            ...(prev[comp]?.partB || {}),
            [key]: value
          }
        }
      }));
    }
  };
  // ── Answer sheet ─────────────────────────────────────────────────────────────
  // What we submit is the item-level answer sheet, never its totals. Section
  // scores are derived from it by shared/scoring/answers.js, the same module the
  // API runs, so the server can re-derive our numbers instead of trusting them.
  const buildAnswers = () => {
    const iq = {
      verbal: iqScores.verbal || {},
      quantitative: iqScores.quantitative || {},
      psychometric: iqScores.psychometric || {},
      performance: iqScores.performance || {}
    };

    // AI-generated items are graded in the tab — their key never leaves it — so
    // only per-section counts travel; the server caps each contribution.
    const countCorrect = aiData => {
      if (!aiData?.answers || !aiData?.questions) return 0;
      return Object.entries(aiData.answers).filter(([idx, val]) => {
        const q = aiData.questions[Number(idx)];
        return q?.answer !== undefined && val === q.answer;
      }).length;
    };
    const countAnswered = aiData => {
      if (!aiData?.answers) return 0;
      return Object.values(aiData.answers).filter(v => v !== undefined && v !== '').length;
    };
    const diagramAnswers = iqScores._diagramAnswers?.[0] || {};
    const storedQs = iqScores._diagramQuestions?.[0] || [];
    const diagramQuestions = Array.isArray(storedQs) ? storedQs : Object.values(storedQs).flat().filter(Boolean);
    const visualCorrect = Object.entries(diagramAnswers).filter(([qId, ans]) => {
      const q = diagramQuestions.find(dq => dq.id === qId);
      return q && q.answer === ans;
    }).length;
    iq.agentGraded = {
      mcq: {
        quantitative: countCorrect(iqScores.ai_quantitative),
        psychometric: countCorrect(iqScores.ai_psychometric)
      },
      open: {
        verbal: countAnswered(iqScores.ai_verbal),
        performance: countAnswered(iqScores.ai_performance)
      },
      visualCorrect
    };
    return {
      IQ: iq,
      EQ: eqScores,
      SQ: sqScores,
      AQ: aqScores
    };
  };
  const buildRawScores = () => deriveRawScores(buildAnswers(), {
    ageGroup: intake.ageGroup
  }).rawScores;
  const handleNext = () => {
    if (step === 0) {
      if (!intake.consent) {
        toast('Please confirm consent before proceeding.', 'error');
        return;
      }
      if (!intake.name.trim()) {
        toast('Please enter the full name.', 'error');
        return;
      }
      if (!intake.ageGroup) {
        toast('Please select an age group.', 'error');
        return;
      }
      logEvent(user?.uid, 'intake_done', {
        ageGroup: intake.ageGroup
      });
      logEvent(user?.uid, 'assessment_started');
    }
    logEvent(user?.uid, 'assessment_step_completed', {
      step,
      stepName: ASSESSMENT_STEPS[step] || 'unknown',
      durationMs: Date.now() - stepStartRef.current,
      answered: answeredCount(),
    });
    setStep(s => s + 1);
  };
  const handleSubmit = async () => {
    const rawScores = buildRawScores();
    const {
      result,
      pillarScores
    } = evaluateQidsAssessment({
      rawScores,
      intake: {
        ...intake,
        ageGroup: intake.ageGroup
      },
      ageGroup: intake.ageGroup,
      mode: mode === 'individual' ? 'qids' : mode
    });
    const eqPartA = {};
    if (eqScores.partA) {
      ['SA', 'ER', 'SM', 'E', 'IS'].forEach(comp => {
        const vals = eqScores.partA[comp] || {};
        eqPartA[comp] = [0, 1, 2, 3, 4].map(i => vals[i] || 0);
      });
    }
    const aqPartA = {};
    ['SA', 'PM', 'RR', 'RC'].forEach(comp => {
      const vals = aqScores[comp]?.partA || {};
      aqPartA[comp] = [0, 1, 2, 3].map(i => vals[i] || 0);
    });
    const data = {
      intake,
      rawScores,
      pillarScores,
      result,
      unifiedScore: result.unifiedScore,
      grade: result.grade,
      ageGroup: intake.ageGroup,
      mode,
      timestamp: new Date().toISOString(),
      _eqPartA: eqPartA,
      _aqPartA: aqPartA
    };
    if (classIdParam && schoolAssessmentIdParam) {
      data.classId = classIdParam;
      data.schoolAssessmentId = schoolAssessmentIdParam;
    }
    setAssessmentData(data);
    setSaving(true);
    let savedId = null;
    try {
      if (user) {
        savedId = await saveAssessment(user.uid, data);
        if (savedId) {
          toast('Assessment saved successfully!', 'success');
          // School-assigned flow: log the attempt so the teacher's roster and
          // the student's assignment card can reflect completion.
          if (classIdParam && schoolAssessmentIdParam) {
            // Teacher context comes from the assignment doc (authoritative) —
            // localStorage is only a fallback, so a student who cleared storage
            // mid-assessment can never orphan the attempt's teacher link.
            let ctx = assignmentCtx;
            try {
              const asg = await getSchoolAssessment(schoolAssessmentIdParam);
              if (asg) ctx = { teacherUid: asg.teacherUid, title: asg.title };
            } catch { /* offline — fall back to the cached ctx */ }
            recordSchoolAttempt({
              schoolAssessmentId: schoolAssessmentIdParam,
              classId: classIdParam,
              teacherUid: ctx?.teacherUid || null,
              studentUid: user.uid,
              studentName: userProfile?.name || user.displayName || 'Student',
              assessmentId: savedId,
              title: ctx?.title,
            }).catch(err => console.error('schoolAttempt log failed:', err));
            notifyAttemptRecorded({ studentUid: user.uid, title: ctx?.title || 'class assessment' });
          }
          // The evaluator's half of the loop: a submitted result is now visible
          // in their console, so tell them instead of waiting for a refresh.
          try {
            const linked = await getStudentEvaluator(user.uid);
            if (linked?.evaluatorUid) {
              notifyEvaluatorStudentActivity({
                evaluatorUid: linked.evaluatorUid,
                studentName: userProfile?.name || user.displayName || 'Your student',
                detail: 'A new assessment is on their record — review it and score the pending rubrics.',
              });
            }
          } catch { /* best-effort */ }
        } else {
          console.error('Save failed: saveAssessment returned null');
          toast('Saved locally — sync failed. Check connection.', 'error');
        }
      } else {
        toast('Not logged in — data not saved.', 'error');
      }
    } catch (e) {
      console.error('Save failed:', e);
      toast('Saved locally — sync failed. Check connection.', 'error');
    }
    setSaving(false);

    // Server scoring: the endpoint derives the same numbers from the answer
    // sheet and keeps its own record, which is what a credential verifies
    // against. Fire-and-forget — a failed call costs the badge, not the result.
    if (user) {
      submitAssessmentForVerification(user, {
        submissionId: shadowRef.current.id,
        clientAssessmentId: savedId,
        answers: buildAnswers(),
        rawScores,
        intake,
        ageGroup: intake.ageGroup,
        mode: mode === 'school' ? 'school' : 'qids',
        startedAt: new Date(shadowRef.current.startedAt).toISOString(),
        durationMs: Date.now() - shadowRef.current.startedAt,
      });
    }

    if (user && !savedId) return;
    clearCheckpoint('qids', user?.uid);
    if (classIdParam && schoolAssessmentIdParam) {
      try { window.localStorage.removeItem('qids-school-assignment'); } catch { /* noop */ }
    }
    logEvent(user.uid, 'assessment_complete', {
      grade: data.grade?.grade ?? data.grade,
      mode,
      steps: maxStepRef.current + 1,
      durationMs: Date.now() - shadowRef.current.startedAt,
      answered: answeredCount(),
      attested: true,
    });
    setSubmitted(true);
  };
  if (submitted) {
    return <div className="page-pad py-12 md:py-24 max-w-[640px] mx-auto animate-fade text-center">
        <div className="border-[0.5px] border-primary/50 bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={36} className="text-primary" />
        </div>
        <div className="text-technical-sm font-technical-sm text-primary mb-4">{t("Assessment.completion_confirmation")}</div>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-4">{t("Assessment.assessment_complete")}</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mb-10 leading-relaxed">{t("Assessment.baseline_data_for")}<strong className="text-on-surface">{intake.name || 'the individual'}</strong>{t("Assessment.has_been_recorded_proceed")}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          {mode === 'individual' ? <button onClick={() => navigate('/app/individual')} className="px-8 py-4 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">{t("Assessment.view_my_results")}</button> : classIdParam && schoolAssessmentIdParam ? <button onClick={() => navigate(`/app/my-class`)} className="px-8 py-4 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">{t("Assessment.back_to_my_class")}</button> : <button onClick={() => navigate('/app/assessment')} className="px-8 py-4 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">{t("Assessment.view_analysis")}</button>}
          <button onClick={() => {
          setSubmitted(false);
          setStep(0);
          setIntake({
            name: '',
            age: '',
            ageGroup: '11-18',
            institution: '',
            evaluator: '',
            purpose: '',
            consent: false,
            _evUid: ''
          });
          setCurrentEv(null);
          setIqScores({});
          setEqScores({});
          setSqScores({});
          setAqScores({});
          shadowRef.current = { id: newSubmissionId(), startedAt: Date.now() };
        }} className="px-8 py-4 border-[0.5px] border-outline-variant text-on-surface-variant text-label-md font-label-md hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent uppercase tracking-widest">{t("Assessment.new_assessment")}</button>
        </div>
      </div>;
  }
  const stepIcons = [ClipboardList, Brain, Heart, Users, Shield, CheckCircle];
  const stepLabels = ['01', '02', '03', '04', '05', '06'];
  return <div className="page-pad max-w-[960px] mx-auto animate-fade">
      {/* Resume banner — shown when an in-progress checkpoint exists */}
      {resumeState && <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-[0.5px] border-primary/40 bg-primary/5">
          <div className="flex-1">
            <div className="text-label-md font-label-md text-on-surface">{t("Assessment.unfinished_assessment_found")}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">
              Saved {new Date(resumeState.savedAt).toLocaleString()} — step {(resumeState.step ?? 0) + 1} of 6. You can continue where you left off.
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={resumeAssessment} className="px-4 py-2 bg-primary text-on-primary text-technical-sm font-technical-sm uppercase tracking-widest cursor-pointer border-none hover:opacity-90 transition-all">{t("Assessment.resume")}</button>
            <button onClick={discardResume} className="px-4 py-2 border-[0.5px] border-outline-variant text-on-surface-variant text-technical-sm font-technical-sm uppercase tracking-widest cursor-pointer bg-transparent hover:border-primary hover:text-primary transition-all">{t("Assessment.discard")}</button>
          </div>
        </div>}

      {/* Page header */}
      <div className="mb-6 md:mb-10">
        <div className="text-technical-sm font-technical-sm text-primary mb-2">{t("Assessment.assessment_protocol")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{t("Assessment.multi_step_baseline_assessment")}</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0 mb-6 md:mb-8 overflow-x-auto pb-2 border-b-[0.5px] border-outline-variant scrollbar-none">
        {STEPS.map((s, i) => {
        const isActive = i === step;
        const isCompleted = i < step;
        return <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 whitespace-nowrap transition-all cursor-pointer bg-transparent border-none ${isActive ? 'text-primary' : isCompleted ? 'text-on-surface-variant' : 'text-surface-variant'}`}>
                <div className={`border-[0.5px] w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-[10px] md:text-technical-sm font-technical-sm flex-shrink-0 ${isActive ? 'border-primary bg-primary/10 text-primary' : isCompleted ? 'border-primary/30 text-primary' : 'border-outline-variant text-surface-variant'}`}>{isCompleted ? <Check size={10} /> : stepLabels[i]}</div>
                <span className="text-[10px] md:text-technical-sm font-technical-sm hidden sm:block">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-[0.5px] min-w-3 md:min-w-4 ${isCompleted ? 'bg-primary/30' : 'bg-outline-variant'}`} />}
            </div>;
      })}
      </div>

      {/* Step content */}
      <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant p-4 md:p-8 mb-6">
        {step === 0 && <IntakeStep data={intake} onChange={updateIntake} evaluators={evaluators} currentEv={currentEv} onAssign={handleAssignEvaluator} onRemove={handleRemoveEvaluator} loadingEv={loadingEv} />}
        {step === 1 && <IQStep scores={iqScores} onChange={updateIQ} ageGroup={intake.ageGroup} context={context} />}
        {step === 2 && <EQStep scores={eqScores} onChange={updateEQ} ageGroup={intake.ageGroup} />}
        {step === 3 && <SQStep scores={sqScores} onChange={updateSQ} />}
        {step === 4 && <AQStep scores={aqScores} onChange={updateAQ} ageGroup={intake.ageGroup} />}
        {step === 5 && <ReviewStep intake={intake} rawScores={buildRawScores()} />}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t-[0.5px] border-outline-variant pt-6">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className={`px-6 py-3 border-[0.5px] text-label-md font-label-md transition-all cursor-pointer bg-transparent uppercase tracking-widest ${step === 0 ? 'border-outline-variant/30 text-surface-variant opacity-40 cursor-not-allowed' : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'}`}>
          <ChevronLeft size={14} className="inline mr-2" />{t("Assessment.previous")}</button>
        <div className="flex gap-3 w-full sm:w-auto">
          {step < STEPS.length - 1 ? <button onClick={handleNext} className="flex-1 sm:flex-none justify-center px-8 py-3 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">{t("Assessment.next")}<ChevronRight size={14} className="inline ml-2" />
            </button> : <button onClick={handleSubmit} disabled={saving} className="flex-1 sm:flex-none justify-center px-8 py-3 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest disabled:opacity-50">
              {saving ? 'Saving...' : <><Save size={14} className="inline mr-2" />{t("Assessment.submit_assessment")}</>}
            </button>}
        </div>
      </div>
    </div>;
}