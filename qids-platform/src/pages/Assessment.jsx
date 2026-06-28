import React, { useState, useEffect } from 'react';
import { PILLARS, computePillarScore, computeWeightedScore, getGrade, EQ_QUESTIONS, SQ_QUESTIONS, IQ_QUESTIONS, AQ_QUESTIONS, mapAQLikert } from '../data/qidsData';
import { getRandomDiagramQuestions } from '../data/diagramQuestions';
import { generateIQQuestions, generateEQQuestions, generateAQQuestions, generateSQQuestions } from '../services/groqService';
import DiagramQuestion from '../components/DiagramQuestion';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { useApp } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { saveAssessment, getStudentEvaluator, getAllUsers, assignEvaluator, removeAssignment } from '../services/firestoreService';
import { Save, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, ClipboardList, Brain, Heart, Users, Shield } from 'lucide-react';
import { useToast } from '../components/Toast';

const STEPS = ['Intake & Consent', 'IQ Assessment', 'EQ Assessment', 'SQ Assessment', 'AQ Assessment', 'Review & Submit'];

const PILLAR_ICONS = { IQ: Brain, EQ: Heart, SQ: Users, AQ: Shield };

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, color }) {
  return (
    <div className="flex items-center gap-3 p-4 mb-5 border-l-2 border-primary bg-surface-container-low hairline-b hairline-t hairline-r">
      <div>
        <div className="text-label-md font-label-md" style={{ color: color || '#ebc073' }}>{title}</div>
        {subtitle && <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

function MCQQuestion({ q, index, selected, onSelect, color }) {
  return (
    <div className="mb-4 p-3 md:p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-3 leading-relaxed">
        <span className="text-surface-variant mr-2">Q{index + 1}.</span>{q.q}
      </div>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button key={i} onClick={() => onSelect(i)}
              className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-3 text-left text-technical-sm font-technical-sm transition-all cursor-pointer border-[0.5px] touch-target ${isSelected ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary'
                }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary"></div>}
              </div>
              <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenQuestion({ q, index, value, onChange }) {
  return (
    <div className="mb-4 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-3 leading-relaxed">
        <span className="text-surface-variant mr-2">Q{index + 1}.</span>{q.q}
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your answer here..."
        rows={3}
        className="w-full p-3 bg-background border-[0.5px] border-outline-variant text-on-surface text-technical-sm font-technical-sm outline-none focus:border-primary resize-y"
      />
    </div>
  );
}

function LikertQuestion({ q, index, value, onChange, color }) {
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  return (
    <div className="mb-4 p-3 md:p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-4 leading-relaxed">
        <span className="text-surface-variant mr-2">{index + 1}.</span>{q}
      </div>
      <div className="flex gap-1.5 md:gap-2 items-stretch">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`flex-1 px-1 md:px-2 py-3 md:py-4 cursor-pointer transition-all border-[0.5px] flex flex-col items-center gap-1 touch-target ${value === n ? 'border-primary bg-primary/15 text-primary' : 'border-outline-variant bg-transparent text-surface-variant hover:border-primary hover:text-primary'
              }`}>
            <span className="text-sm md:text-base font-bold">{n}</span>
            <span className="text-[8px] md:text-[9px] font-normal text-center leading-tight">{labels[n - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RubricScorer({ criterion, marks, desc, value, onChange, color }) {
  return (
    <div className="mb-3 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="text-technical-sm font-technical-sm text-on-surface">{criterion}</div>
          <div className="text-[11px] text-surface-variant leading-relaxed mt-1">{desc}</div>
        </div>
        <div className="text-[11px] text-surface-variant flex-shrink-0 ml-3">Max: {marks}</div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: marks + 1 }, (_, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={`w-9 h-9 cursor-pointer transition-all border-[0.5px] text-sm font-bold ${value === i ? 'border-primary bg-primary/20 text-primary' : 'border-outline-variant bg-transparent text-surface-variant hover:border-primary hover:text-primary'
              }`}>{i}</button>
        ))}
      </div>
    </div>
  );
}

// ─── INTAKE STEP ──────────────────────────────────────────────────────────────
function IntakeStep({ data, onChange, evaluators, currentEv, onAssign, onRemove, loadingEv }) {
  const inputClass = "w-full h-12 px-4 bg-background border-[0.5px] border-outline-variant text-on-surface placeholder:text-surface-variant font-technical-sm outline-none focus:border-primary";
  const labelClass = "text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest";
  return (
    <div>
      <div className="text-technical-sm font-technical-sm text-primary mb-6">§ I · INTAKE & CONSENT</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          { key: 'name', label: 'Full Name', placeholder: 'Enter full name' },
          { key: 'age', label: 'Age', placeholder: 'Enter age', type: 'number' },
          { key: 'institution', label: 'Institution / Organization', placeholder: 'Enter institution name' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key} className="flex flex-col gap-2">
            <span className={labelClass}>{label}</span>
            <input className={inputClass} type={type || 'text'} placeholder={placeholder} value={data[key] || ''} onChange={e => onChange(key, e.target.value)} />
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Evaluator</span>
          {currentEv ? (
            <div className="flex items-center gap-2 px-4 py-3 border-[0.5px] border-primary/50 bg-primary/5 h-12 text-technical-sm font-technical-sm text-primary">
              <span className="flex-1">{currentEv.name || currentEv.email || 'Assigned Evaluator'}</span>
              <button onClick={onRemove} disabled={loadingEv} className="px-3 py-1 border-[0.5px] border-error/50 text-error text-technical-sm font-technical-sm hover:bg-error/10 cursor-pointer bg-transparent">Remove</button>
            </div>
          ) : (
            <select className={inputClass} value="" onChange={e => onAssign(e.target.value)} disabled={loadingEv}>
              <option value="">{loadingEv ? 'Loading...' : (evaluators.length === 0 ? 'No evaluators available' : 'Select an evaluator...')}</option>
              {evaluators.map(ev => (
                <option key={ev.uid} value={ev.uid}>{ev.name || ev.email}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mb-6">
        <span className={`${labelClass} block mb-2`}>Age Group</span>
        <div className="flex gap-3">
          {[{ id: '11-18', label: '11–18 Years', desc: 'School / Youth' }, { id: '19-32', label: '19–32 Years', desc: 'College / Professional' }].map(ag => (
            <button key={ag.id} type="button" onClick={() => onChange('ageGroup', ag.id)}
              className={`flex-1 py-4 px-4 border-[0.5px] text-left cursor-pointer transition-all bg-transparent ${data.ageGroup === ag.id ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant text-on-surface-variant hover:border-primary'
                }`}>
              <div className="text-label-md font-label-md">{ag.label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{ag.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <span className={`${labelClass} block mb-2`}>Assessment Purpose</span>
        <textarea rows={3} placeholder="Describe the purpose of this assessment..." value={data.purpose || ''} onChange={e => onChange('purpose', e.target.value)}
          className="w-full p-4 bg-background border-[0.5px] border-outline-variant text-on-surface placeholder:text-surface-variant font-technical-sm outline-none focus:border-primary resize-y" />
      </div>

      <div className="p-4 border-[0.5px] border-primary/30 bg-primary/5 flex items-start gap-4">
        <input type="checkbox" id="consent" checked={data.consent || false} onChange={e => onChange('consent', e.target.checked)}
          className="w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer accent-primary" />
        <label htmlFor="consent" className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed cursor-pointer">
          I confirm that the individual has provided informed consent for this assessment and understands the purpose, process, and use of results within the QIDS framework.
        </label>
      </div>
    </div>
  );
}

// ─── IQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function IQStep({ scores, onChange, ageGroup, context }) {
  const pillar = PILLARS.IQ;
  const [activeSection, setActiveSection] = useState('verbal');
  const [diagramQs] = useState(() => getRandomDiagramQuestions(9));
  const [diagramAnswers, setDiagramAnswers] = useState(scores._diagramAnswers || {});

  useEffect(() => {
    onChange('_diagramQuestions', 0, diagramQs);
  }, []);

  const handleDiagramAnswer = (qId, val) => {
    const next = { ...diagramAnswers, [qId]: val };
    setDiagramAnswers(next);
    onChange('_diagramAnswers', 0, next);
  };

  const sections = [
    { id: 'verbal',       label: 'Verbal',       color: '#6366f1' },
    { id: 'quantitative', label: 'Quantitative', color: '#8b5cf6' },
    { id: 'psychometric', label: 'Psychometric', color: '#a855f7' },
    { id: 'performance',  label: 'Performance',  color: '#c084fc' },
    { id: 'diagrams',     label: 'Visual',       color: '#06b6d4' },
    { id: 'ai',           label: 'AI',           color: '#10b981' },
  ];

  const sectionData = ['verbal', 'quantitative', 'psychometric', 'performance'].includes(activeSection)
    ? IQ_QUESTIONS[activeSection]
    : null;

  const handleAnswer = (sectionId, qIndex, value) => {
    onChange(sectionId, qIndex, value);
  };

  const getScore = (sectionId) => {
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

  return (
    <div>
      <SectionHeader title="Intelligence Quotient (IQ)" subtitle="Four-Parameter Cognitive Model — 100 marks total (25 per section)" color={pillar.color} />

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-surface-container-low border-[0.5px] border-outline-variant">
        {sections.map(s => {
          const answered = getScore(s.id);
          const isActive = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex items-center gap-1.5 ${isActive ? 'text-on-surface' : 'text-surface-variant hover:text-on-surface-variant'
                }`}
              style={{ backgroundColor: isActive ? s.color + '20' : 'transparent', color: isActive ? s.color : undefined }}>
              {s.label}
              <span className="text-[10px] px-1.5 py-0.5 opacity-60">{answered} ans</span>
            </button>
          );
        })}
      </div>

      {/* Standard questions */}
      {['verbal', 'quantitative', 'psychometric', 'performance'].includes(activeSection) && (
        <>
          <div className="text-label-md font-label-md mb-1" style={{ color: sections.find(s => s.id === activeSection)?.color }}>{sectionData.label}</div>
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-4">Max: {sectionData.maxScore} marks</div>
          {sectionData.sections.map((sec, si) => (
            <div key={si} className="mb-6">
              <div className="text-technical-sm font-technical-sm text-on-surface-variant mb-1 px-3 py-1.5 bg-primary/5 border-[0.5px] border-primary/20 inline-block">{sec.title}</div>
              {sec.instruction && <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 italic">{sec.instruction}</div>}
              <div className="mt-2">
                {sec.questions.map((q, qi) => {
                  const globalIdx = si * 5 + qi;
                  const qType = sec.type === 'mixed' ? (q.type || 'open') : sec.type;
                  const val = scores[activeSection]?.[globalIdx];
                  if (qType === 'mcq') {
                    return <MCQQuestion key={qi} q={q} index={qi} selected={val} onSelect={v => handleAnswer(activeSection, globalIdx, v)} color={sections.find(s => s.id === activeSection)?.color || '#6366f1'} />;
                  }
                  return <OpenQuestion key={qi} q={q} index={qi} value={val} onChange={v => handleAnswer(activeSection, globalIdx, v)} />;
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Diagrams */}
      {activeSection === 'diagrams' && (
        <div>
          <div className="p-3 border-[0.5px] border-[#06b6d4]/30 bg-[#06b6d4]/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong className="text-[#06b6d4]">Visual & Diagram Questions.</strong> 9 questions randomly selected from a pool of 20. Each correct answer = 1 mark. Max: 9 bonus marks.
          </div>
          {diagramQs.map((q, i) => (
            <DiagramQuestion
              key={q.id} question={q} index={i}
              selected={diagramAnswers[q.id]}
              onSelect={v => handleDiagramAnswer(q.id, v)}
              color="#06b6d4"
            />
          ))}
          <div className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant flex justify-between items-center mt-2">
            <span className="text-technical-sm font-technical-sm text-on-surface-variant">Visual Bonus Score</span>
            <span className="text-label-md font-label-md text-[#06b6d4]">{diagramQs.filter(q => diagramAnswers[q.id] === q.answer).length} / 9</span>
          </div>
        </div>
      )}

      {/* AI-generated questions */}
      {activeSection === 'ai' && (
        <div>
          <div className="p-3 border-[0.5px] border-[#10b981]/30 bg-[#10b981]/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong className="text-[#10b981]">AI-Generated Questions.</strong> Fresh questions generated by Groq (llama-3.3-70b) based on the QIDS knowledge base. Each assessment gets a unique set.
          </div>
          {['verbal', 'quantitative', 'psychometric', 'performance'].map(sec => (
            <AIQuestionGenerator
              key={sec}
              pillar="IQ" component={sec} ageGroup={ageGroup} context={context}
              questionType={sec === 'verbal' || sec === 'performance' ? 'open' : 'mcq'}
              color="#10b981"
              label={`${sec.charAt(0).toUpperCase() + sec.slice(1)} IQ`}
              generateFn={(params) => generateIQQuestions({ ...params, section: sec })}
              onAnswersChange={(ans, qs) => onChange('ai_' + sec, 0, { answers: ans, questions: qs })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function EQStep({ scores, onChange, ageGroup }) {
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
          <div className="p-3 border-[0.5px] border-[#10b981]/30 bg-[#10b981]/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
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

// ─── SQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function SQStep({ scores, onChange }) {
  const pillar = PILLARS.SQ;
  const [activeComponent, setActiveComponent] = useState('ACE');
  const [selectedPBAs, setSelectedPBAs] = useState(scores.selectedPBAs || []);

  const togglePBA = (id) => {
    const next = selectedPBAs.includes(id)
      ? selectedPBAs.filter(x => x !== id)
      : selectedPBAs.length < 2 ? [...selectedPBAs, id] : selectedPBAs;
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

  const tabs = [
    { id: 'ACE', label: 'Component 1 — ACE', score: `${aceTotal}/20` },
    { id: 'CSI', label: 'Component 2 — CSI', score: `${csiTotal}/10` },
    { id: 'PBA', label: 'Component 3 — PBA', score: `${pbaTotal}/20` },
  ];

  return (
    <div>
      <SectionHeader
        title="Social Quotient (SQ) — Social Intelligence Assessment Center"
        subtitle="3 Components | Raw /50 → ×2 = 100 pts | Assessor-scored"
        color={pillar.color}
      />

      {/* Component tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low border-[0.5px] border-outline-variant mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveComponent(t.id)}
            className={`flex-1 px-3 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex flex-col items-center gap-0.5 ${activeComponent === t.id ? 'text-on-primary' : 'text-surface-variant hover:text-on-surface-variant'
              }`}
            style={{ backgroundColor: activeComponent === t.id ? pillar.color : 'transparent' }}>
            <span>{t.label}</span>
            <span className="text-[11px] opacity-80">{t.score}</span>
          </button>
        ))}
      </div>

      {/* ACE */}
      {activeComponent === 'ACE' && (
        <div>
          <div className="p-3 border-[0.5px] border-[#a855f7]/30 bg-[#a855f7]/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{ color: pillar.color }}>Assessment Centre Exercise.</strong> {SQ_QUESTIONS.component1_ACE.instructions}
          </div>
          {SQ_QUESTIONS.component1_ACE.exercises.map(ex => {
            const exScores = scores.ACE?.[ex.id] || {};
            const total = ex.rubric.reduce((s, r) => s + (exScores[r.criterion] || 0), 0);
            return (
              <div key={ex.id} className="mb-5 border-[0.5px] overflow-hidden" style={{ borderColor: pillar.color + '30' }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{ backgroundColor: pillar.color + '08' }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{ex.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">Sub-parameter: {ex.subParam} | Max: {ex.marks} marks</div>
                  </div>
                  <div className="text-[20px] font-label-md" style={{ color: pillar.color }}>{total}/{ex.marks}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">{ex.desc}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">Assessor Rubric</div>
                  {ex.rubric.map(r => (
                    <RubricScorer
                      key={r.criterion}
                      criterion={r.criterion} marks={r.marks} desc={r.desc}
                      value={exScores[r.criterion] ?? undefined}
                      onChange={v => onChange('ACE', ex.id, r.criterion, v)}
                      color={pillar.color}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSI */}
      {activeComponent === 'CSI' && (
        <div>
          <div className="p-3 border-[0.5px] border-[#a855f7]/30 bg-[#a855f7]/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{ color: pillar.color }}>Cognitive Social Intelligence Test.</strong> {SQ_QUESTIONS.component2_CSI.instructions}
          </div>
          {SQ_QUESTIONS.component2_CSI.questions.map((q, qi) => {
            const selected = scores.CSI?.[q.id];
            return (
              <div key={q.id} className="mb-5 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
                <div className="text-technical-sm font-technical-sm mb-2 uppercase tracking-widest" style={{ color: pillar.color }}>Q{qi + 1} — {q.subParam}</div>
                <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-3 p-3 bg-surface-container-low border-l-2 border-[#a855f7]/40">
                  <strong>Scenario:</strong> {q.scenario}
                </div>
                <div className="text-technical-sm font-technical-sm text-on-surface mb-3">{q.question}</div>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi;
                    const markColor = opt.marks === 2 ? '#10b981' : opt.marks === 1 ? '#f59e0b' : '#ef4444';
                    return (
                      <button key={oi} onClick={() => onChange('CSI', q.id, oi)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-left text-technical-sm font-technical-sm transition-all cursor-pointer border-[0.5px] ${isSelected ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-[#a855f7]'
                          }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#a855f7] bg-[#a855f7]' : 'border-outline-variant'
                          }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="flex-1"><strong>{String.fromCharCode(65 + oi)}.</strong> {opt.text}</span>
                        {isSelected && (
                          <span className="text-[11px] px-2 py-0.5 font-bold flex-shrink-0"
                            style={{ backgroundColor: markColor + '20', color: markColor }}>
                            {opt.marks} mark{opt.marks !== 1 ? 's' : ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selected !== undefined && (
                  <div className="mt-3 p-3 border-[0.5px] border-[#a855f7]/20 bg-[#a855f7]/5 text-technical-sm font-technical-sm text-surface-variant italic">
                    <strong className="text-[#a855f7]">Assessor Note:</strong> {q.assessorNote}
                  </div>
                )}
              </div>
            );
          })}
          <AIQuestionGenerator
            pillar="SQ" component="CSI" ageGroup="19-32"
            questionType="mcq" color={pillar.color}
            label="Social Intelligence scenarios"
            generateFn={generateSQQuestions}
            onAnswersChange={(ans) => onChange('CSI', 'ai', 'ai', ans)}
          />
        </div>
      )}

      {/* PBA */}
      {activeComponent === 'PBA' && (
        <div>
          <div className="p-3 border-[0.5px] border-[#a855f7]/30 bg-[#a855f7]/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{ color: pillar.color }}>Performance-Based Activities.</strong> {SQ_QUESTIONS.component3_PBA.instructions}
          </div>

          <div className="mb-5">
            <div className="text-technical-sm font-technical-sm text-on-surface mb-3">Select 2 Activities ({selectedPBAs.length}/2 selected):</div>
            <div className="grid grid-cols-2 gap-2">
              {SQ_QUESTIONS.component3_PBA.activities.map(act => {
                const isSelected = selectedPBAs.includes(act.id);
                const isDisabled = !isSelected && selectedPBAs.length >= 2;
                return (
                  <button key={act.id} onClick={() => !isDisabled && togglePBA(act.id)}
                    className={`px-3 py-2.5 text-left border-[0.5px] transition-all cursor-pointer ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${isSelected ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-outline-variant bg-surface-container-low hover:border-[#a855f7]'
                      }`}>
                    <div className="text-technical-sm font-technical-sm" style={{ color: isSelected ? pillar.color : undefined }}>{act.id}: {act.label}</div>
                    <div className="text-[10px] text-surface-variant mt-0.5">{act.time} · {act.bestFor}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPBAs.map(pbaId => {
            const act = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === pbaId);
            if (!act) return null;
            const pbaScores = scores.PBA?.[pbaId] || {};
            const total = act.rubric.reduce((s, r) => s + (pbaScores[r.criterion] || 0), 0);
            return (
              <div key={pbaId} className="mb-5 border-[0.5px] overflow-hidden" style={{ borderColor: pillar.color + '30' }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{ backgroundColor: pillar.color + '08' }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{act.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{act.bestFor} | {act.time}</div>
                  </div>
                  <div className="text-[20px] font-label-md" style={{ color: pillar.color }}>{total}/{act.marks}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">{act.desc}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">Assessor Rubric</div>
                  {act.rubric.map(r => (
                    <RubricScorer
                      key={r.criterion}
                      criterion={r.criterion} marks={r.marks} desc={r.desc}
                      value={pbaScores[r.criterion] ?? undefined}
                      onChange={v => onChange('PBA', pbaId, r.criterion, v)}
                      color={pillar.color}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AQ ASSESSMENT STEP ───────────────────────────────────────────────────────
function AQStep({ scores, onChange, ageGroup }) {
  const pillar = PILLARS.AQ;
  const age = ageGroup || '11-18';
  const components = ['SA', 'PM', 'RR', 'RC'];
  const [activeComp, setActiveComp] = useState('SA');
  const [activeTab, setActiveTab] = useState('partA');

  const compData = AQ_QUESTIONS.components;

  const getPartAAnswered = (comp) => {
    const s = scores[comp]?.partA || {};
    return Object.values(s).filter(v => v > 0).length;
  };

  const getPartAMarks = (comp) => {
    const s = scores[comp]?.partA || {};
    return Object.values(s).reduce((sum, v) => sum + mapAQLikert(v || 0), 0);
  };

  const getPartBMarks = (comp) => {
    const act = compData[comp].activity;
    const s = scores[comp]?.partB || {};
    return act.rubric.reduce((sum, r) => sum + (s[r.criterion] || 0), 0);
  };

  const rdScore = components.reduce((sum, comp) => {
    const w = compData[comp].weight;
    const raw = Math.min(getPartAMarks(comp) + getPartBMarks(comp), 19);
    return sum + raw * w;
  }, 0);
  const converted = Math.round((rdScore / 95) * 100);

  return (
    <div>
      <SectionHeader
        title="Adversity Quotient (AQ) — Resilience Dynamics Framework"
        subtitle={`Age Group: ${age === '11-18' ? '11–18 Years' : '19–32 Years'} | 4 Components × 19 marks | Weighted formula → /100`}
        color={pillar.color}
      />

      {/* Live RD Score preview */}
      <div className="flex items-center gap-3 p-4 border-[0.5px] border-amber-500/30 bg-amber-500/5 mb-5">
        <div className="flex-1">
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-1">Live RD Score Preview</div>
          <div className="text-technical-sm font-technical-sm text-on-surface-variant">Formula: (SA×1.5) + (PM×1.0) + (RR×1.0) + (RC×1.5) → max 95 → RD÷95×100</div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-label-md leading-none" style={{ color: pillar.color }}>{converted}</div>
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
          return (
            <button key={comp} onClick={() => { setActiveComp(comp); setActiveTab('partA'); }}
              className={`px-3 py-1.5 text-technical-sm font-technical-sm cursor-pointer transition-all border-none flex flex-col items-center gap-0.5 ${isActive ? 'text-on-surface' : 'text-surface-variant hover:text-on-surface-variant'
                }`}
              style={{ backgroundColor: isActive ? pillar.color + '20' : 'transparent', color: isActive ? pillar.color : undefined }}>
              <span className="font-bold">{comp}</span>
              <span className="text-[10px] opacity-80">{answered}/4 · B:{partBTotal}/7</span>
            </button>
          );
        })}
      </div>

      {/* Part tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low border-[0.5px] border-outline-variant mb-5">
        {[{ id: 'partA', label: 'Part A — Scenario Questions (12 marks)' }, { id: 'partB', label: 'Part B — Activity Assessment (7 marks)' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-technical-sm font-technical-sm cursor-pointer transition-all border-none ${activeTab === t.id ? 'text-on-primary' : 'text-surface-variant hover:text-on-surface-variant'
              }`}
            style={{ backgroundColor: activeTab === t.id ? pillar.color : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Component header */}
      <div className="p-4 border-[0.5px] mb-4" style={{ borderColor: pillar.color + '30', backgroundColor: pillar.color + '08' }}>
        <div className="text-label-md font-label-md" style={{ color: pillar.color }}>{compData[activeComp].label} <span className="text-technical-sm font-technical-sm text-surface-variant font-normal">× weight {compData[activeComp].weight}</span></div>
        <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{compData[activeComp].subParams}</div>
        <div className="text-technical-sm font-technical-sm text-on-surface-variant mt-1 leading-relaxed">{compData[activeComp].desc}</div>
      </div>

      {/* Part A — Likert */}
      {activeTab === 'partA' && (
        <div>
          <div className="p-3 border-[0.5px] border-amber-500/30 bg-amber-500/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
            Rate each scenario 1 (Not at all) to 5 (Completely). Scoring: 1–2 = 0 pts · 3 = 1 pt · 4 = 2 pts · 5 = 3 pts → Max 12 marks
          </div>
          {compData[activeComp].questions[age].map((q, i) => {
            const val = scores[activeComp]?.partA?.[i] || 0;
            const marks = mapAQLikert(val);
            return (
              <div key={i} className="mb-4 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-technical-sm font-technical-sm uppercase tracking-widest mb-1" style={{ color: pillar.color }}>{q.subParam}</div>
                    <div className="text-technical-sm font-technical-sm leading-relaxed">
                      <span className="text-surface-variant mr-1.5">{i + 1}.</span>{q.q}
                    </div>
                  </div>
                  {val > 0 && (
                    <div className="ml-3 flex-shrink-0 px-2 py-0.5 text-[11px] font-bold" style={{ backgroundColor: pillar.color + '20', color: pillar.color }}>
                      {marks} pt{marks !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => {
                    const isSelected = val === n;
                    const pts = mapAQLikert(n);
                    return (
                      <button key={n} onClick={() => onChange(activeComp, 'partA', i, n)}
                        className={`flex-1 py-2 px-1 cursor-pointer transition-all border-[0.5px] flex flex-col items-center gap-0.5 ${isSelected ? 'border-amber-500 bg-amber-500/15' : 'border-outline-variant bg-transparent text-surface-variant hover:border-amber-500'
                          }`}
                        style={{ color: isSelected ? pillar.color : undefined }}>
                        <span className="text-sm font-bold">{n}</span>
                        <span className="text-[8px] font-normal">{['Not at all', 'Rarely', 'Sometimes', 'Often', 'Completely'][n - 1]}</span>
                        <span className="text-[9px]" style={{ color: pts > 0 ? '#10b981' : undefined }}>{pts}pt</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant flex justify-between items-center">
            <span className="text-technical-sm font-technical-sm text-on-surface-variant">Part A Sub-total ({activeComp})</span>
            <span className="text-label-md font-label-md" style={{ color: pillar.color }}>{getPartAMarks(activeComp)} / 12</span>
          </div>
          <AIQuestionGenerator
            pillar="AQ" component={activeComp} ageGroup={age}
            questionType="likert" color={pillar.color}
            label={`${compData[activeComp].label} scenarios`}
            generateFn={generateAQQuestions}
            onAnswersChange={(ans) => onChange(activeComp, 'partA_ai', 'ai', ans)}
          />
        </div>
      )}

      {/* Part B — Activity rubric */}
      {activeTab === 'partB' && (
        <div>
          <div className="flex gap-2 p-3 border-[0.5px] border-amber-500/30 bg-amber-500/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div><strong className="text-amber-500">Assessor-Scored Activity.</strong> Observe the participant and enter rubric scores below.</div>
          </div>

          {(() => {
            const act = compData[activeComp].activity;
            const actScores = scores[activeComp]?.partB || {};
            const total = act.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
            return (
              <div className="border-[0.5px] overflow-hidden" style={{ borderColor: pillar.color + '30' }}>
                <div className="p-4 flex justify-between items-center border-b-[0.5px] border-outline-variant" style={{ backgroundColor: pillar.color + '08' }}>
                  <div>
                    <div className="text-label-md font-label-md text-on-surface">{act.label}</div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">{act.method}</div>
                  </div>
                  <div className="text-[22px] font-label-md" style={{ color: pillar.color }}>{total}/{act.maxScore}</div>
                </div>
                <div className="p-4">
                  <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-4">
                    {age === '11-18' ? act.desc11_18 : act.desc19_32}
                  </div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">Assessor Rubric</div>
                  {act.rubric.map(r => (
                    <RubricScorer
                      key={r.criterion}
                      criterion={r.criterion} marks={r.marks} desc={r.desc}
                      value={actScores[r.criterion] ?? undefined}
                      onChange={v => onChange(activeComp, 'partB', r.criterion, v)}
                      color={pillar.color}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── REVIEW STEP ──────────────────────────────────────────────────────────────
function ReviewStep({ intake, rawScores }) {
  const pillarScores = {};
  Object.keys(PILLARS).forEach(id => { pillarScores[id] = computePillarScore(id, rawScores[id] || {}); });
  const unified = computeWeightedScore(pillarScores);
  const grade = getGrade(unified);

  return (
    <div>
      {/* Intake summary */}
      <div className="text-technical-sm font-technical-sm text-primary mb-6">§ VI · REVIEW & SUBMIT</div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {Object.entries(intake).filter(([k]) => !['consent', 'purpose'].includes(k)).map(([k, v]) => (
          <div key={k} className="p-3 bg-surface-container-low border-[0.5px] border-outline-variant">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div className="text-label-md font-label-md text-on-surface">{String(v) || '—'}</div>
          </div>
        ))}
      </div>

      {/* Pillar scores */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const score = pillarScores[id];
          const isIQ = id === 'IQ';
          const displayMax = isIQ ? 125 : 100;
          const pct = Math.min(Math.round((score / displayMax) * 100), 100);
          const g = getGrade(isIQ ? Math.round((score / 125) * 100) : score);
          return (
            <div key={id} className="p-4 bg-surface-container-low border-[0.5px] text-center" style={{ borderColor: pillar.color + '30' }}>
              <div className="text-technical-sm font-technical-sm mb-2" style={{ color: pillar.color }}>{pillar.short}</div>
              <div className="text-[32px] font-label-md leading-none text-on-surface">{score}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">/ {displayMax} · Grade {g.grade}</div>
              {isIQ && <div className="text-[9px] font-technical-sm text-primary mt-1">incl. AI + Visual bonus</div>}
              <div className="h-1 bg-surface-variant/20 mt-3">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: g.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified score */}
      <div className="p-6 border-[0.5px] text-center" style={{ borderColor: grade.color + '40', backgroundColor: grade.color + '10' }}>
        <div className="text-technical-sm font-technical-sm text-surface-variant mb-2 uppercase tracking-widest">Unified QIDS Score</div>
        <div className="text-[56px] font-label-md leading-none" style={{ color: grade.color }}>{unified}</div>
        <div className="text-label-md font-label-md mt-2" style={{ color: grade.color }}>Grade {grade.grade}: {grade.label}</div>
        <div className="text-technical-sm font-technical-sm text-surface-variant mt-3">
          Weighted: IQ(÷125×100)×1.0 + EQ×2.0 + SQ×2.0 + AQ×1.28 ÷ 6.28
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ASSESSMENT PAGE ─────────────────────────────────────────────────────
export default function Assessment() {
  const { setAssessmentData, demoMode, context } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState({ name: '', age: '', ageGroup: '11-18', institution: '', evaluator: '', purpose: '', consent: false });
  const [iqScores, setIqScores] = useState({});
  const [eqScores, setEqScores] = useState({});
  const [sqScores, setSqScores] = useState({});
  const [aqScores, setAqScores] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluators, setEvaluators] = useState([]);
  const [currentEv, setCurrentEv] = useState(null);
  const [loadingEv, setLoadingEv] = useState(false);

  const updateIntake = (k, v) => setIntake(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingEv(true);
      try {
        const allUsers = await getAllUsers();
        setEvaluators(allUsers.filter(u => u.role === 'evaluator'));

        const assignment = await getStudentEvaluator(user.uid);
        if (assignment) {
          const evProfile = allUsers.find(u => u.uid === assignment.evaluatorUid);
          if (evProfile) {
            setCurrentEv(evProfile);
            setIntake(prev => ({ ...prev, evaluator: evProfile.name || 'Assigned Evaluator', _evUid: assignment.evaluatorUid }));
          }
        }
      } catch (e) {
        // Silently fail
      }
      setLoadingEv(false);
    })();
  }, [user]);

  const handleAssignEvaluator = async (evUid) => {
    setLoadingEv(true);
    try {
      await assignEvaluator(evUid, user.uid);
      const ev = evaluators.find(e => e.uid === evUid);
      setCurrentEv(ev || null);
      setIntake(prev => ({ ...prev, evaluator: ev?.name || 'Assigned Evaluator', _evUid: evUid }));
      toast('Evaluator assigned', 'success');
    } catch (e) {
      toast('Failed to assign evaluator', 'error');
    }
    setLoadingEv(false);
  };

  const handleRemoveEvaluator = async () => {
    if (!currentEv) return;
    setLoadingEv(true);
    try {
      await removeAssignment(currentEv.uid, user.uid);
      setCurrentEv(null);
      setIntake(prev => ({ ...prev, evaluator: '', _evUid: '' }));
    } catch (e) {
      toast('Failed to remove evaluator', 'error');
    }
    setLoadingEv(false);
  };

  const updateIQ = (section, qIndex, value) => {
    setIqScores(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [qIndex]: value } }));
  };

  const updateEQ = (part, keyA, keyB, value) => {
    if (part === 'partA') {
      setEqScores(prev => ({
        ...prev,
        partA: { ...(prev.partA || {}), [keyA]: { ...(prev.partA?.[keyA] || {}), [keyB]: value } },
      }));
    } else if (part === 'partA_ai') {
      setEqScores(prev => ({
        ...prev,
        partA_ai: { ...(prev.partA_ai || {}), [keyA]: { ...(prev.partA_ai?.[keyA] || {}), ai: value } },
      }));
    } else {
      setEqScores(prev => ({
        ...prev,
        partB: { ...(prev.partB || {}), [keyA]: { ...(prev.partB?.[keyA] || {}), [keyB]: value } },
      }));
    }
  };

  const updateSQ = (component, keyA, keyB, value) => {
    if (component === 'selectedPBAs') {
      setSqScores(prev => ({ ...prev, selectedPBAs: keyA }));
    } else if (component === 'CSI') {
      setSqScores(prev => ({ ...prev, CSI: { ...(prev.CSI || {}), [keyA]: keyB } }));
    } else {
      setSqScores(prev => ({
        ...prev,
        [component]: { ...(prev[component] || {}), [keyA]: { ...(prev[component]?.[keyA] || {}), [keyB]: value } },
      }));
    }
  };

  const updateAQ = (comp, part, key, value) => {
    if (part === 'partA') {
      setAqScores(prev => ({
        ...prev,
        [comp]: { ...(prev[comp] || {}), partA: { ...(prev[comp]?.partA || {}), [key]: value } },
      }));
    } else if (part === 'partA_ai') {
      setAqScores(prev => ({
        ...prev,
        [comp]: { ...(prev[comp] || {}), partA_ai: { ...(prev[comp]?.partA_ai || {}), [key]: value } },
      }));
    } else {
      setAqScores(prev => ({
        ...prev,
        [comp]: { ...(prev[comp] || {}), partB: { ...(prev[comp]?.partB || {}), [key]: value } },
      }));
    }
  };

  const buildRawScores = () => {
    const iqRaw = {};
    ['verbal', 'quantitative', 'psychometric', 'performance'].forEach(sec => {
      const secScores = iqScores[sec] || {};
      const secData = IQ_QUESTIONS[sec];
      let total = 0;
      secData.sections.forEach((section, si) => {
        section.questions.forEach((q, qi) => {
          const globalIdx = si * 5 + qi;
          const val = secScores[globalIdx];
          const qType = section.type === 'mixed' ? (q.type || 'open') : section.type;
          if (qType === 'mcq' && val === q.answer) total += 1;
          else if (qType === 'open' && val && val.trim()) {
            if (q.answer !== undefined) {
              if (String(val).trim().toLowerCase() === String(q.answer).toLowerCase()) total += 1;
            } else {
              total += 1;
            }
          }
        });
      });
      iqRaw[sec] = Math.min(total, 25);
    });

    let aiBonus = 0;
    const aiMcqSections = ['quantitative', 'psychometric'];
    const aiOpenSections = ['verbal', 'performance'];
    aiMcqSections.forEach(sec => {
      const aiData = iqScores['ai_' + sec];
      if (aiData?.answers && aiData?.questions) {
        const correct = Object.entries(aiData.answers).filter(([idx, val]) => {
          const q = aiData.questions[Number(idx)];
          return q?.answer !== undefined && val === q.answer;
        }).length;
        aiBonus += Math.min(correct * 2, 4);
      }
    });
    aiOpenSections.forEach(sec => {
      const aiData = iqScores['ai_' + sec];
      if (aiData?.answers) {
        const answered = Object.values(aiData.answers).filter(v => v !== undefined && v !== '').length;
        aiBonus += Math.min(answered * 2, 4);
      }
    });
    iqRaw._aiBonus = Math.min(aiBonus, 16);

    const diagramAnswers = iqScores._diagramAnswers?.[0] || {};
    const storedQs = iqScores._diagramQuestions?.[0] || [];
    const diagramQuestions = Array.isArray(storedQs) ? storedQs : Object.values(storedQs).flat().filter(Boolean);
    const correctDiagrams = Object.entries(diagramAnswers).filter(([qId, ans]) => {
      const q = diagramQuestions.find(dq => dq.id === qId);
      return q && q.answer === ans;
    }).length;
    iqRaw._visualBonus = Math.min(correctDiagrams, 9);

    const eqRaw = {};
    ['SA', 'ER', 'SM', 'E', 'IS'].forEach(comp => {
      const partAScores = eqScores.partA?.[comp] || {};
      const partARaw = Object.values(partAScores).reduce((s, v) => s + (v || 0), 0);
      const partANorm = Math.round((partARaw / 25) * 5);
      const actId = `B${['SA', 'ER', 'SM', 'E', 'IS'].indexOf(comp) + 1}`;
      const partBScores = eqScores.partB?.[actId] || {};
      const partBTotal = Object.values(partBScores).reduce((s, v) => s + (v || 0), 0);
      eqRaw[comp] = Math.min(partANorm + partBTotal, 10);
    });

    const aceTotal = SQ_QUESTIONS.component1_ACE.exercises.reduce((sum, ex) => {
      const exS = sqScores.ACE?.[ex.id] || {};
      return sum + ex.rubric.reduce((s, r) => s + (exS[r.criterion] || 0), 0);
    }, 0);
    const csiTotal = SQ_QUESTIONS.component2_CSI.questions.reduce((sum, q) => {
      const sel = sqScores.CSI?.[q.id];
      return sum + (sel !== undefined ? (q.options[sel]?.marks || 0) : 0);
    }, 0);
    const pbaTotal = (sqScores.selectedPBAs || []).reduce((sum, pbaId) => {
      const act = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === pbaId);
      if (!act) return sum;
      const pbaS = sqScores.PBA?.[pbaId] || {};
      return sum + act.rubric.reduce((s, r) => s + (pbaS[r.criterion] || 0), 0);
    }, 0);
    const sqRaw = { ACE: aceTotal, CSI: csiTotal, PBA: pbaTotal };

    const aqRaw = {};
    ['SA', 'PM', 'RR', 'RC'].forEach(comp => {
      const partAScores = aqScores[comp]?.partA || {};
      const partAMarks = Object.values(partAScores).reduce((s, v) => s + mapAQLikert(v || 0), 0);
      const partBScores = aqScores[comp]?.partB || {};
      const partBMarks = Object.values(partBScores).reduce((s, v) => s + (v || 0), 0);
      aqRaw[comp] = Math.min(partAMarks + partBMarks, 19);
    });

    return { IQ: iqRaw, EQ: eqRaw, SQ: sqRaw, AQ: aqRaw };
  };

  const handleNext = () => {
    if (step === 0) {
      if (!intake.consent) { toast('Please confirm consent before proceeding.', 'error'); return; }
      if (!intake.name.trim()) { toast('Please enter the full name.', 'error'); return; }
      if (!intake.ageGroup) { toast('Please select an age group.', 'error'); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const rawScores = buildRawScores();
    const pillarScores = {};
    Object.keys(PILLARS).forEach(id => { pillarScores[id] = computePillarScore(id, rawScores[id] || {}); });

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

    const data = { intake, rawScores, pillarScores, ageGroup: intake.ageGroup, timestamp: new Date().toISOString(), _eqPartA: eqPartA, _aqPartA: aqPartA };
    setAssessmentData(data);
    setSaving(true);
    try {
      if (user) {
        await saveAssessment(user.uid, data);
        toast('Assessment saved successfully!', 'success');
      } else {
        toast('Not logged in — data not saved.', 'error');
      }
    } catch (e) {
      console.error('Save failed:', e);
      toast('Saved locally — sync failed. Check connection.', 'error');
    }
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page-pad py-12 md:py-24 max-w-[600px] mx-auto animate-fade text-center">
        <div className="border-[0.5px] border-primary/50 bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={36} className="text-primary" />
        </div>
        <div className="text-technical-sm font-technical-sm text-primary mb-4">§ · COMPLETION CONFIRMATION</div>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-4">Assessment Complete</h2>
        <p className="text-body-md font-body-md text-on-surface-variant mb-10 leading-relaxed">
          Baseline data for <strong className="text-on-surface">{intake.name || 'the individual'}</strong> has been recorded. Proceed to Pre-Intervention analysis to view scores, grades, and intervention mapping.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate('/app/assessment')}
            className="px-8 py-4 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">
            View Analysis
          </button>
          <button onClick={() => { setSubmitted(false); setStep(0); setIntake({ name: '', age: '', ageGroup: '11-18', institution: '', evaluator: '', purpose: '', consent: false, _evUid: '' }); setCurrentEv(null); setIqScores({}); setEqScores({}); setSqScores({}); setAqScores({}); }}
            className="px-8 py-4 border-[0.5px] border-outline-variant text-on-surface-variant text-label-md font-label-md hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent uppercase tracking-widest">
            New Assessment
          </button>
        </div>
      </div>
    );
  }

  const stepIcons = [ClipboardList, Brain, Heart, Users, Shield, CheckCircle];
  const stepLabels = ['01', '02', '03', '04', '05', '06'];

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      {/* Page header */}
      <div className="mb-6 md:mb-10">
        <div className="text-technical-sm font-technical-sm text-primary mb-2">§ · ASSESSMENT PROTOCOL</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Multi-Step Baseline Assessment</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0 mb-6 md:mb-8 overflow-x-auto pb-2 border-b-[0.5px] border-outline-variant scrollbar-none">
        {STEPS.map((s, i) => {
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={s} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <button onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 whitespace-nowrap transition-all cursor-pointer bg-transparent border-none ${isActive ? 'text-primary' : isCompleted ? 'text-on-surface-variant' : 'text-surface-variant'
                  }`}>
                <div className={`border-[0.5px] w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-[10px] md:text-technical-sm font-technical-sm flex-shrink-0 ${isActive ? 'border-primary bg-primary/10 text-primary' : isCompleted ? 'border-primary/30 text-primary' : 'border-outline-variant text-surface-variant'
                  }`}>{isCompleted ? '✓' : stepLabels[i]}</div>
                <span className="text-[10px] md:text-technical-sm font-technical-sm hidden sm:block">{s}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-[0.5px] min-w-3 md:min-w-4 ${isCompleted ? 'bg-primary/30' : 'bg-outline-variant'}`} />}
            </div>
          );
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
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className={`px-6 py-3 border-[0.5px] text-label-md font-label-md transition-all cursor-pointer bg-transparent uppercase tracking-widest ${step === 0 ? 'border-outline-variant/30 text-surface-variant opacity-40 cursor-not-allowed' : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
            }`}>
          <ChevronLeft size={14} className="inline mr-2" /> Previous
        </button>
        <div className="flex gap-3 w-full sm:w-auto">
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext}
              className="flex-1 sm:flex-none justify-center px-8 py-3 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest">
              Next <ChevronRight size={14} className="inline ml-2" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 sm:flex-none justify-center px-8 py-3 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none uppercase tracking-widest disabled:opacity-50">
              {saving ? 'Saving...' : <><Save size={14} className="inline mr-2" /> Submit Assessment</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
