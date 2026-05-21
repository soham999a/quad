import React, { useState } from 'react';
import { PILLARS, DEMO_SCORES, computePillarScore, computeWeightedScore, getGrade, EQ_QUESTIONS, SQ_QUESTIONS, IQ_QUESTIONS, AQ_QUESTIONS, mapAQLikert } from '../data/qidsData';
import { getRandomDiagramQuestions } from '../data/diagramQuestions';
import { generateIQQuestions, generateEQQuestions, generateAQQuestions, generateSQQuestions } from '../services/groqService';
import DiagramQuestion from '../components/DiagramQuestion';
import AIQuestionGenerator from '../components/AIQuestionGenerator';
import { useApp } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { saveAssessment } from '../services/firestoreService';
import { Save, RotateCcw, ChevronRight, ChevronLeft, CheckCircle, Info, AlertCircle, ClipboardList, Brain, Heart, Users, Shield } from 'lucide-react';
import { useToast } from '../components/Toast';

const STEPS = ['Intake & Consent', 'IQ Assessment', 'EQ Assessment', 'SQ Assessment', 'AQ Assessment', 'Review & Submit'];

const PILLAR_ICONS = { IQ: Brain, EQ: Heart, SQ: Users, AQ: Shield };

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, color }) {
  return (
    <div style={{ padding: '12px 16px', marginBottom: 20, background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function MCQQuestion({ q, index, selected, onSelect, color }) {
  return (
    <div style={{ marginBottom: 16, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Q{index + 1}.</span>{q.q}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button key={i} onClick={() => onSelect(i)} style={{
              padding: '9px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
              fontSize: 13, border: `1px solid ${isSelected ? color : 'var(--border-light)'}`,
              background: isSelected ? `${color}18` : 'rgba(255,255,255,0.02)',
              color: isSelected ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isSelected ? color : 'var(--border-light)'}`,
                background: isSelected ? color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
              </div>
              <span style={{ fontWeight: 500 }}>{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenQuestion({ q, index, value, onChange }) {
  return (
    <div style={{ marginBottom: 14, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>Q{index + 1}.</span>{q.q}
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your answer here..."
        rows={3}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, resize: 'vertical',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
          color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', lineHeight: 1.5,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function LikertQuestion({ q, index, value, onChange, color }) {
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  return (
    <div style={{ marginBottom: 14, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{index + 1}.</span>{q}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${value === n ? color : 'var(--border-light)'}`,
            background: value === n ? `${color}20` : 'transparent',
            color: value === n ? color : 'var(--text-muted)',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <span>{n}</span>
            <span style={{ fontSize: 9, fontWeight: 400, textAlign: 'center', lineHeight: 1.2 }}>{labels[n - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RubricScorer({ criterion, marks, desc, value, onChange, color }) {
  return (
    <div style={{ marginBottom: 12, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{criterion}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 12, flexShrink: 0 }}>Max: {marks}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: marks + 1 }, (_, i) => (
          <button key={i} onClick={() => onChange(i)} style={{
            width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${value === i ? color : 'var(--border-light)'}`,
            background: value === i ? `${color}25` : 'transparent',
            color: value === i ? color : 'var(--text-muted)',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
          }}>{i}</button>
        ))}
      </div>
    </div>
  );
}

// ─── INTAKE STEP ──────────────────────────────────────────────────────────────
function IntakeStep({ data, onChange }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[
          { key: 'name',        label: 'Full Name',                  placeholder: 'Enter full name' },
          { key: 'age',         label: 'Age',                        placeholder: 'Enter age', type: 'number' },
          { key: 'institution', label: 'Institution / Organization', placeholder: 'Enter institution name' },
          { key: 'evaluator',   label: 'Evaluator Name',             placeholder: 'Enter evaluator name' },
        ].map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label>{label}</label>
            <input type={type || 'text'} placeholder={placeholder} value={data[key] || ''} onChange={e => onChange(key, e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Age Group</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ id: '11-18', label: '11–18 Years', desc: 'School / Youth' }, { id: '19-32', label: '19–32 Years', desc: 'College / Professional' }].map(ag => (
            <button key={ag.id} type="button" onClick={() => onChange('ageGroup', ag.id)} style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: data.ageGroup === ag.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${data.ageGroup === ag.id ? 'var(--indigo)' : 'var(--border-light)'}`,
              color: data.ageGroup === ag.id ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{ag.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ag.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Assessment Purpose</label>
        <textarea rows={3} placeholder="Describe the purpose of this assessment..." value={data.purpose || ''} onChange={e => onChange('purpose', e.target.value)} />
      </div>

      <div style={{ padding: 16, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <input
          type="checkbox"
          id="consent"
          checked={data.consent || false}
          onChange={e => onChange('consent', e.target.checked)}
          style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--indigo)' }}
        />
        <label htmlFor="consent" style={{ display: 'inline', textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.6, marginBottom: 0, fontWeight: 400 }}>
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

  const handleDiagramAnswer = (qId, val) => {
    const next = { ...diagramAnswers, [qId]: val };
    setDiagramAnswers(next);
    onChange('_diagramAnswers', 0, next); // store in iqScores._diagramAnswers
  };

  const sections = [
    { id: 'verbal',       label: 'Verbal',       color: '#6366f1' },
    { id: 'quantitative', label: 'Quantitative', color: '#8b5cf6' },
    { id: 'psychometric', label: 'Psychometric', color: '#a855f7' },
    { id: 'performance',  label: 'Performance',  color: '#c084fc' },
    { id: 'diagrams',     label: '🖼 Visual',     color: '#06b6d4' },
    { id: 'ai',           label: '✨ AI',          color: '#10b981' },
  ];

  const sectionData = ['verbal', 'quantitative', 'psychometric', 'performance'].includes(activeSection)
    ? IQ_QUESTIONS[activeSection]
    : null;

  const handleAnswer = (sectionId, qIndex, value) => {
    onChange(sectionId, qIndex, value);
  };

  const getScore = (sectionId) => {
    if (sectionId === 'diagrams') return Object.keys(diagramAnswers).length;
    if (sectionId === 'ai') {
      let count = 0;
      ['verbal', 'quantitative', 'psychometric', 'performance'].forEach(sec => {
        const aiData = scores['ai_' + sec];
        if (aiData?.answers) count += Object.values(aiData.answers).filter(v => v !== undefined && v !== '').length;
      });
      return count;
    }
    const s = scores[sectionId] || {};
    return Object.values(s).filter(v => v !== undefined && v !== '').length;
  };

  return (
    <div>
      <SectionHeader title="Intelligence Quotient (IQ)" subtitle="Four-Parameter Cognitive Model — 100 marks total (25 per section)" color={pillar.color} />

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {sections.map(s => {
          const answered = getScore(s.id);
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              background: activeSection === s.id ? s.color : 'var(--navy-4)',
              color: activeSection === s.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeSection === s.id ? s.color : 'var(--border-light)'}`,
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {s.label}
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.15)' }}>{answered} ans</span>
            </button>
          );
        })}
      </div>

      {/* Standard questions for verbal/quantitative/psychometric/performance */}
      {['verbal', 'quantitative', 'psychometric', 'performance'].includes(activeSection) && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: sections.find(s => s.id === activeSection)?.color }}>{sectionData.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Max: {sectionData.maxScore} marks</div>
          {sectionData.sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4, padding: '6px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 6, display: 'inline-block' }}>{sec.title}</div>
              {sec.instruction && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>{sec.instruction}</div>}
              <div style={{ marginTop: 10 }}>
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

      {/* Diagram / Visual questions */}
      {activeSection === 'diagrams' && (
        <div>
          <div style={{ padding: '10px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#06b6d4' }}>Visual & Diagram Questions.</strong> 9 questions randomly selected from a pool of 20. Each correct answer = 1 mark. Max: 9 bonus marks.
          </div>
          {diagramQs.map((q, i) => (
            <DiagramQuestion
              key={q.id} question={q} index={i}
              selected={diagramAnswers[q.id]}
              onSelect={v => handleDiagramAnswer(q.id, v)}
              color="#06b6d4"
            />
          ))}
          <div style={{ padding: '10px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Visual Bonus Score</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#06b6d4', fontFamily: 'Space Grotesk' }}>{Object.keys(diagramAnswers).length} / 9</span>
          </div>
        </div>
      )}

      {/* AI-generated questions */}
      {activeSection === 'ai' && (
        <div>
          <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#10b981' }}>AI-Generated Questions.</strong> Fresh questions generated by Groq (llama-3.3-70b) based on the QIDS knowledge base. Each assessment gets a unique set.
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
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[{ id: 'partA', label: 'Part A — Self-Report Questionnaire' }, { id: 'partB', label: 'Part B — Activity Assessment' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === t.id ? pillar.color : 'transparent',
            color: activeTab === t.id ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'partA' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, padding: '8px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
            Rate each statement from 1 (Never) to 5 (Always). There are no right or wrong answers — be honest.
          </div>

          {/* Component tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {components.map(c => {
              const answered = getPartAScore(c);
              return (
                <button key={c} onClick={() => setActiveComponent(c)} style={{
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  background: activeComponent === c ? pillar.color : 'var(--navy-4)',
                  color: activeComponent === c ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${activeComponent === c ? pillar.color : 'var(--border-light)'}`,
                  fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {c}
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, background: 'rgba(255,255,255,0.15)' }}>{answered}/5</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: pillar.color }}>{compData[activeComponent].label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{compData[activeComponent].subParams}</div>
          </div>
          <div style={{ marginTop: 14 }}>
            {compData[activeComponent].questions[age].map((q, i) => (
              <LikertQuestion
                key={i} q={q} index={i}
                value={scores.partA?.[activeComponent]?.[i] || 0}
                onChange={v => onChange('partA', activeComponent, i, v)}
                color={pillar.color}
              />
            ))}
          </div>
          {/* AI-generated additional EQ questions */}
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
          <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: 20, display: 'flex', gap: 8 }}>
            <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: '#f59e0b' }}>Assessor-Scored Section.</strong> The evaluator observes each activity and enters rubric scores below. Each activity is worth 5 marks.
            </div>
          </div>

          {EQ_QUESTIONS.partB.map(activity => {
            const actScores = scores.partB?.[activity.id] || {};
            const total = activity.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
            return (
              <div key={activity.id} style={{ marginBottom: 20, background: 'var(--navy-4)', border: `1px solid ${pillar.color}20`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: `${pillar.color}08`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{activity.id}: {activity.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{activity.component} | Max: {activity.maxScore} marks</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>{total}/{activity.maxScore}</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{activity.desc}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontStyle: 'italic' }}>
                    {activity.ageNote?.[age]}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Assessor Rubric</div>
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

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveComponent(t.id)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: activeComponent === t.id ? pillar.color : 'transparent',
            color: activeComponent === t.id ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span>{t.label}</span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{t.score}</span>
          </button>
        ))}
      </div>

      {/* ACE */}
      {activeComponent === 'ACE' && (
        <div>
          <div style={{ padding: '10px 14px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: pillar.color }}>Assessment Centre Exercise.</strong> {SQ_QUESTIONS.component1_ACE.instructions}
          </div>
          {SQ_QUESTIONS.component1_ACE.exercises.map(ex => {
            const exScores = scores.ACE?.[ex.id] || {};
            const total = ex.rubric.reduce((s, r) => s + (exScores[r.criterion] || 0), 0);
            return (
              <div key={ex.id} style={{ marginBottom: 20, background: 'var(--navy-4)', border: `1px solid ${pillar.color}20`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: `${pillar.color}08`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{ex.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Sub-parameter: {ex.subParam} | Max: {ex.marks} marks</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>{total}/{ex.marks}</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{ex.desc}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Assessor Rubric</div>
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
          <div style={{ padding: '10px 14px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: pillar.color }}>Cognitive Social Intelligence Test.</strong> {SQ_QUESTIONS.component2_CSI.instructions}
          </div>
          {SQ_QUESTIONS.component2_CSI.questions.map((q, qi) => {
            const selected = scores.CSI?.[q.id];
            return (
              <div key={q.id} style={{ marginBottom: 20, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Q{qi + 1} — {q.subParam}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: `3px solid ${pillar.color}40` }}>
                  <strong>Scenario:</strong> {q.scenario}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{q.question}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi;
                    const markColor = opt.marks === 2 ? '#10b981' : opt.marks === 1 ? '#f59e0b' : '#ef4444';
                    return (
                      <button key={oi} onClick={() => onChange('CSI', q.id, oi)} style={{
                        padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                        fontSize: 13, border: `1px solid ${isSelected ? pillar.color : 'var(--border-light)'}`,
                        background: isSelected ? `${pillar.color}18` : 'rgba(255,255,255,0.02)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isSelected ? pillar.color : 'var(--border-light)'}`, background: isSelected ? pillar.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                        </div>
                        <span style={{ flex: 1 }}><strong>{String.fromCharCode(65 + oi)}.</strong> {opt.text}</span>
                        {isSelected && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${markColor}20`, color: markColor, fontWeight: 700, flexShrink: 0 }}>{opt.marks} mark{opt.marks !== 1 ? 's' : ''}</span>}
                      </button>
                    );
                  })}
                </div>
                {selected !== undefined && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    <strong style={{ color: '#818cf8' }}>Assessor Note:</strong> {q.assessorNote}
                  </div>
                )}
              </div>
            );
          })}
          {/* AI-generated additional SQ scenarios */}
          <AIQuestionGenerator
            pillar="SQ" component="CSI" ageGroup="19-32"
            questionType="mcq" color={pillar.color}
            label="Social Intelligence scenarios"
            generateFn={generateSQQuestions}
            onAnswersChange={(ans) => onChange('CSI', 'ai', 'ai', ans)}
          />
        </div>
      )}
      {activeComponent === 'PBA' && (
        <div>
          <div style={{ padding: '10px 14px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: pillar.color }}>Performance-Based Activities.</strong> {SQ_QUESTIONS.component3_PBA.instructions}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Select 2 Activities ({selectedPBAs.length}/2 selected):</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SQ_QUESTIONS.component3_PBA.activities.map(act => {
                const isSelected = selectedPBAs.includes(act.id);
                const isDisabled = !isSelected && selectedPBAs.length >= 2;
                return (
                  <button key={act.id} onClick={() => !isDisabled && togglePBA(act.id)} style={{
                    padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: isDisabled ? 'not-allowed' : 'pointer',
                    background: isSelected ? `${pillar.color}18` : 'var(--navy-4)',
                    border: `1px solid ${isSelected ? pillar.color : 'var(--border-light)'}`,
                    opacity: isDisabled ? 0.4 : 1, transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? pillar.color : 'var(--text-primary)' }}>{act.id}: {act.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{act.time} · {act.bestFor}</div>
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
              <div key={pbaId} style={{ marginBottom: 20, background: 'var(--navy-4)', border: `1px solid ${pillar.color}20`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: `${pillar.color}08`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{act.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{act.bestFor} | {act.time}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>{total}/{act.marks}</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{act.desc}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Assessor Rubric</div>
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

  // Compute live RD score preview
  const rdScore = components.reduce((sum, comp) => {
    const w = compData[comp].weight;
    const raw = Math.min(getPartAMarks(comp) + getPartBMarks(comp), 19);
    return sum + raw * w;
  }, 0);
  const converted = Math.round((rdScore / 144) * 100);

  return (
    <div>
      <SectionHeader
        title="Adversity Quotient (AQ) — Resilience Dynamics Framework"
        subtitle={`Age Group: ${age === '11-18' ? '11–18 Years' : '19–32 Years'} | 4 Components × 19 marks | Weighted formula → /100`}
        color={pillar.color}
      />

      {/* Live RD Score preview */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Live RD Score Preview</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Formula: (SA×1.5) + (PM×1.0) + (RR×1.0) + (RC×1.5) ÷ 144 × 100</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{converted}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>RD: {Math.round(rdScore)}/144</div>
        </div>
      </div>

      {/* Component tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {components.map(comp => {
          const cd = compData[comp];
          const answered = getPartAAnswered(comp);
          const partBTotal = getPartBMarks(comp);
          return (
            <button key={comp} onClick={() => { setActiveComp(comp); setActiveTab('partA'); }} style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              background: activeComp === comp ? pillar.color : 'var(--navy-4)',
              color: activeComp === comp ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeComp === comp ? pillar.color : 'var(--border-light)'}`,
              fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <span style={{ fontWeight: 700 }}>{comp}</span>
              <span style={{ fontSize: 10, opacity: 0.8 }}>{answered}/4 · B:{partBTotal}/7</span>
            </button>
          );
        })}
      </div>

      {/* Part tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[{ id: 'partA', label: 'Part A — Scenario Questions (12 marks)' }, { id: 'partB', label: 'Part B — Activity Assessment (7 marks)' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: activeTab === t.id ? pillar.color : 'transparent',
            color: activeTab === t.id ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Component header */}
      <div style={{ marginBottom: 16, padding: '12px 16px', background: `${pillar.color}08`, border: `1px solid ${pillar.color}20`, borderRadius: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: pillar.color }}>{compData[activeComp].label} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>× weight {compData[activeComp].weight}</span></div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{compData[activeComp].subParams}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{compData[activeComp].desc}</div>
      </div>

      {/* Part A — Likert questions */}
      {activeTab === 'partA' && (
        <div>
          <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Rate each scenario 1 (Not at all) to 5 (Completely). Scoring: 1–2 = 0 pts · 3 = 1 pt · 4 = 2 pts · 5 = 3 pts → Max 12 marks
          </div>
          {compData[activeComp].questions[age].map((q, i) => {
            const val = scores[activeComp]?.partA?.[i] || 0;
            const marks = mapAQLikert(val);
            return (
              <div key={i} style={{ marginBottom: 16, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: pillar.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{q.subParam}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{i + 1}.</span>{q.q}
                    </div>
                  </div>
                  {val > 0 && (
                    <div style={{ marginLeft: 12, flexShrink: 0, padding: '3px 8px', borderRadius: 6, background: `${pillar.color}20`, color: pillar.color, fontSize: 11, fontWeight: 700 }}>
                      {marks} pt{marks !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => {
                    const isSelected = val === n;
                    const pts = mapAQLikert(n);
                    return (
                      <button key={n} onClick={() => onChange(activeComp, 'partA', i, n)} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${isSelected ? pillar.color : 'var(--border-light)'}`,
                        background: isSelected ? `${pillar.color}20` : 'transparent',
                        color: isSelected ? pillar.color : 'var(--text-muted)',
                        fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}>
                        <span>{n}</span>
                        <span style={{ fontSize: 8, fontWeight: 400 }}>{['Not at all', 'Rarely', 'Sometimes', 'Often', 'Completely'][n - 1]}</span>
                        <span style={{ fontSize: 9, color: pts > 0 ? '#10b981' : 'var(--text-muted)' }}>{pts}pt</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ padding: '10px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Part A Sub-total ({activeComp})</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>{getPartAMarks(activeComp)} / 12</span>
          </div>
          {/* AI-generated additional AQ scenarios */}
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
          <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: pillar.color }}>Assessor-Scored Activity.</strong> Observe the participant and enter rubric scores below.
          </div>

          {(() => {
            const act = compData[activeComp].activity;
            const actScores = scores[activeComp]?.partB || {};
            const total = act.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
            return (
              <div style={{ background: 'var(--navy-4)', border: `1px solid ${pillar.color}20`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', background: `${pillar.color}08`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{act.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{act.method}</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>{total}/{act.maxScore}</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                    {age === '11-18' ? act.desc11_18 : act.desc19_32}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Assessor Rubric</div>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {Object.entries(intake).filter(([k]) => !['consent', 'purpose'].includes(k)).map(([k, v]) => (
          <div key={k} style={{ padding: '10px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{k.replace(/([A-Z])/g, ' $1').trim()}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{String(v) || '—'}</div>
          </div>
        ))}
      </div>

      {/* Pillar scores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const score = pillarScores[id];
          const isIQ = id === 'IQ';
          const displayMax = isIQ ? 125 : 100;
          const pct = Math.min(Math.round((score / displayMax) * 100), 100);
          const g = getGrade(isIQ ? Math.round((score / 125) * 100) : score);
          return (
            <div key={id} style={{ padding: 16, background: 'var(--navy-4)', border: `1px solid ${pillar.color}30`, borderRadius: 12, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: pillar.gradient }} />
              <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 4 }}>{pillar.short}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: g.color, fontFamily: 'Space Grotesk' }}>{score}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>/ {displayMax} · Grade {g.grade}</div>
              {isIQ && <div style={{ fontSize: 9, color: '#06b6d4', marginBottom: 4 }}>incl. AI + Visual bonus</div>}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pillar.gradient, borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified score */}
      <div style={{ padding: 20, background: grade.bg, border: `1px solid ${grade.color}40`, borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Unified QIDS Score</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: grade.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{unified}</div>
        <div style={{ fontSize: 14, color: grade.color, marginTop: 4 }}>Grade {grade.grade}: {grade.label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          IQ(÷125×100)×1.0 + EQ×2.0 + SQ×2.0 + AQ×1.28 ÷ 6.28
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
  const [iqScores, setIqScores] = useState({});       // { verbal: {0: val, 1: val...}, quantitative: {...}, ... }
  const [eqScores, setEqScores] = useState({});       // { partA: { SA: {0: val...}, ... }, partB: { B1: { criterion: val }, ... } }
  const [sqScores, setSqScores] = useState({});       // { ACE: { ACE1: { criterion: val }, ... }, CSI: { CSI1: optIdx }, PBA: {...}, selectedPBAs: [] }
  const [aqScores, setAqScores] = useState({});       // { situational_agility: val, ... }
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateIntake = (k, v) => setIntake(prev => ({ ...prev, [k]: v }));

  // IQ score updater
  const updateIQ = (section, qIndex, value) => {
    setIqScores(prev => ({ ...prev, [section]: { ...(prev[section] || {}), [qIndex]: value } }));
  };

  // EQ score updater — partA: (partA, component, qIndex, value) | partB: (partB, actId, criterion, value)
  const updateEQ = (part, keyA, keyB, value) => {
    if (part === 'partA') {
      setEqScores(prev => ({
        ...prev,
        partA: { ...(prev.partA || {}), [keyA]: { ...(prev.partA?.[keyA] || {}), [keyB]: value } },
      }));
    } else {
      setEqScores(prev => ({
        ...prev,
        partB: { ...(prev.partB || {}), [keyA]: { ...(prev.partB?.[keyA] || {}), [keyB]: value } },
      }));
    }
  };

  // SQ score updater
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

  // AQ score updater — same pattern as EQ: (comp, part, key, value)
  const updateAQ = (comp, part, key, value) => {
    if (part === 'partA') {
      setAqScores(prev => ({
        ...prev,
        [comp]: { ...(prev[comp] || {}), partA: { ...(prev[comp]?.partA || {}), [key]: value } },
      }));
    } else {
      setAqScores(prev => ({
        ...prev,
        [comp]: { ...(prev[comp] || {}), partB: { ...(prev[comp]?.partB || {}), [key]: value } },
      }));
    }
  };

  // Compute raw scores for storage
  const buildRawScores = () => {
    // IQ: sum MCQ correct + open answered per sub-section → map to /25 each
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
          else if (qType === 'open' && val && val.trim()) total += 1;
        });
      });
      iqRaw[sec] = Math.min(total, 25);
    });

    // IQ AI bonus: 4 sections × 2 questions × 2 marks = max 16
    // AI answers stored as iqScores['ai_verbal'], etc. — count answered × 2
    let aiBonus = 0;
    ['verbal', 'quantitative', 'psychometric', 'performance'].forEach(sec => {
      const aiData = iqScores['ai_' + sec];
      if (aiData?.answers) {
        const answered = Object.values(aiData.answers).filter(v => v !== undefined && v !== '').length;
        aiBonus += Math.min(answered * 2, 4); // max 2 questions × 2 marks = 4 per section
      }
    });
    iqRaw._aiBonus = Math.min(aiBonus, 16);

    // IQ Visual bonus: diagram questions × 1 mark each, max 9
    const diagramAnswers = iqScores._diagramAnswers || {};
    iqRaw._visualBonus = Math.min(Object.keys(diagramAnswers).length, 9);

    // EQ: Part A Likert sum per component (max 5 each), Part B rubric sum per activity (max 5 each)
    const eqRaw = {};
    ['SA', 'ER', 'SM', 'E', 'IS'].forEach(comp => {
      const partAScores = eqScores.partA?.[comp] || {};
      const partATotal = Object.values(partAScores).reduce((s, v) => s + (v || 0), 0);
      const actId = `B${['SA', 'ER', 'SM', 'E', 'IS'].indexOf(comp) + 1}`;
      const partBScores = eqScores.partB?.[actId] || {};
      const partBTotal = Object.values(partBScores).reduce((s, v) => s + (v || 0), 0);
      eqRaw[comp] = Math.min(partATotal + partBTotal, 10);
    });

    // SQ: ACE rubric totals, CSI marks, PBA rubric totals
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

    // AQ: Part A Likert (mapped marks) + Part B rubric per component
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
    const data = { intake, rawScores, pillarScores, ageGroup: intake.ageGroup, timestamp: new Date().toISOString() };
    setAssessmentData(data);
    setSaving(true);
    try {
      if (user) await saveAssessment(user.uid, data);
      toast('Assessment saved successfully!', 'success');
    } catch (e) {
      console.error('Save failed:', e);
      toast('Saved locally — sync failed. Check connection.', 'error');
    }
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page-pad animate-fade" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}>
          <CheckCircle size={32} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Assessment Complete</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.7 }}>
          Baseline data for <strong style={{ color: 'var(--text-primary)' }}>{intake.name || 'the individual'}</strong> has been recorded. Proceed to Pre-Intervention analysis to view scores, grades, and intervention mapping.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/pre-intervention')} className="btn btn-primary btn-lg">View Pre-Intervention Analysis</button>
          <button onClick={() => { setSubmitted(false); setStep(0); setIntake({ name: '', age: '', ageGroup: '11-18', institution: '', evaluator: '', purpose: '', consent: false }); setIqScores({}); setEqScores({}); setSqScores({}); setAqScores({}); }} className="btn btn-secondary">New Assessment</button>
        </div>
      </div>
    );
  }

  const stepIcons = [ClipboardList, Brain, Heart, Users, Shield, CheckCircle];

  return (
    <div className="page-pad animate-fade" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Assessment Engine</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Multi-step baseline assessment — IQ, EQ (DEC), SQ (SIAC), AQ (RDF)</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 12px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
          Step {step + 1} of {STEPS.length}
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {STEPS.map((s, i) => {
          const Icon = stepIcons[i];
          const pillarColors = { 1: '#6366f1', 2: '#10b981', 3: '#a855f7', 4: '#f59e0b' };
          const activeColor = pillarColors[i] || 'var(--indigo)';
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div onClick={() => i < step && setStep(i)} style={{
                display: 'flex', alignItems: 'center', gap: 6, cursor: i < step ? 'pointer' : 'default',
                padding: '6px 10px', borderRadius: 8, whiteSpace: 'nowrap',
                background: i === step ? `${activeColor}18` : 'transparent',
                border: `1px solid ${i === step ? activeColor : 'transparent'}`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: i < step ? '#10b981' : i === step ? activeColor : 'var(--navy-5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white',
                }}>
                  {i < step ? '✓' : <Icon size={12} />}
                </div>
                <span style={{ fontSize: 12, color: i === step ? 'white' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? '#10b981' : 'var(--border-light)', minWidth: 12 }} />}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="card" style={{ marginBottom: 20 }}>
        {step === 0 && <IntakeStep data={intake} onChange={updateIntake} />}
        {step === 1 && <IQStep scores={iqScores} onChange={updateIQ} ageGroup={intake.ageGroup} context={context} />}
        {step === 2 && <EQStep scores={eqScores} onChange={updateEQ} ageGroup={intake.ageGroup} />}
        {step === 3 && <SQStep scores={sqScores} onChange={updateSQ} />}
        {step === 4 && <AQStep scores={aqScores} onChange={updateAQ} ageGroup={intake.ageGroup} />}
        {step === 5 && <ReviewStep intake={intake} rawScores={buildRawScores()} />}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', bottom: 0, background: 'var(--navy)', borderTop: '1px solid var(--border-light)', padding: '14px 0', marginTop: 8, zIndex: 10 }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ opacity: step === 0 ? 0.4 : 1 }}>
          <ChevronLeft size={14} /> Previous
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {saving ? 'Saving...' : <><Save size={14} /> Submit Assessment</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
