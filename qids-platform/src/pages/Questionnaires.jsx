import React, { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, BookOpen, Download, ExternalLink } from 'lucide-react';
import { PILLARS, EQ_QUESTIONS, SQ_QUESTIONS, IQ_QUESTIONS, AQ_QUESTIONS, mapAQLikert } from '../data/qidsData';


// ─── EQ Questionnaire View ────────────────────────────────────────────────────
function ScaleInput() {
  const [val, setVal] = useState(null);
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => setVal(n)} style={{
          flex: 1, padding: '6px 4px', borderRadius: 8, cursor: 'pointer',
          border: `2px solid ${val === n ? '#10b981' : 'var(--border-light)'}`,
          background: val === n ? 'rgba(16,185,129,0.15)' : 'transparent',
          color: val === n ? '#10b981' : 'var(--text-muted)',
          fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span>{n}</span>
          <span style={{ fontSize: 9, fontWeight: 400 }}>{labels[n - 1]}</span>
        </button>
      ))}
    </div>
  );
}

function EQQuestionnaire({ color }) {
  const [ageGroup, setAgeGroup] = useState('11-18');
  const [activeComp, setActiveComp] = useState('SA');
  const components = ['SA', 'ER', 'SM', 'E', 'IS'];
  const compData = EQ_QUESTIONS.partA;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ id: '11-18', label: '11–18 Years' }, { id: '19-32', label: '19–32 Years' }].map(ag => (
          <button key={ag.id} onClick={() => setAgeGroup(ag.id)} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            background: ageGroup === ag.id ? color : 'var(--navy-4)',
            color: ageGroup === ag.id ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${ageGroup === ag.id ? color : 'var(--border-light)'}`,
            fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>{ag.label}</button>
        ))}
      </div>

      <div style={{ padding: '8px 12px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong style={{ color }}>Part A — Self-Report Questionnaire (25 marks)</strong> · Rate each statement 1 (Never) to 5 (Always)
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {components.map(c => (
          <button key={c} onClick={() => setActiveComp(c)} style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            background: activeComp === c ? color : 'var(--navy-4)',
            color: activeComp === c ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeComp === c ? color : 'var(--border-light)'}`,
            fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
          }}>{c} — {compData[c].label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color }}>{compData[activeComp].label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{compData[activeComp].subParams}</div>
      </div>
      <div style={{ marginTop: 14 }}>
        {compData[activeComp].questions[ageGroup].map((q, i) => (
          <div key={i} style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{i + 1}.</span>{q}
            </div>
            <ScaleInput />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '10px 14px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
        <strong style={{ color }}>Part B — Activity-Based Assessment (25 marks)</strong> · Assessor-scored. See Assessment Engine for full rubrics.
      </div>
      {EQ_QUESTIONS.partB.map(act => (
        <div key={act.id} style={{ marginTop: 12, padding: '12px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color }}>{act.id}: {act.label} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({act.component} | {act.maxScore} marks)</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{act.desc}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{act.ageNote?.[ageGroup]}</div>
        </div>
      ))}
    </div>
  );
}

// ─── SQ Questionnaire View ────────────────────────────────────────────────────
function SQQuestionnaire({ color }) {
  const [activeComp, setActiveComp] = useState('ACE');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { id: 'ACE', label: 'Component 1 — ACE (20 marks)' },
          { id: 'CSI', label: 'Component 2 — CSI (10 marks)' },
          { id: 'PBA', label: 'Component 3 — PBA (20 marks)' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveComp(t.id)} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: activeComp === t.id ? color : 'transparent',
            color: activeComp === t.id ? 'white' : 'var(--text-secondary)',
            border: 'none', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {activeComp === 'ACE' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{SQ_QUESTIONS.component1_ACE.instructions}</div>
          {SQ_QUESTIONS.component1_ACE.exercises.map(ex => (
            <div key={ex.id} style={{ marginBottom: 16, background: 'var(--navy-4)', border: `1px solid ${color}20`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 4 }}>{ex.label} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({ex.subParam} | {ex.marks} marks)</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{ex.desc}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Rubric</div>
              {ex.rubric.map(r => (
                <div key={r.criterion} style={{ padding: '8px 10px', marginBottom: 4, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color }}>{r.criterion}</span> <span style={{ color: 'var(--text-muted)' }}>({r.marks} marks)</span> — {r.desc}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeComp === 'CSI' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>{SQ_QUESTIONS.component2_CSI.instructions}</div>
          {SQ_QUESTIONS.component2_CSI.questions.map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 16, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Q{qi + 1} — {q.subParam}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: `3px solid ${color}40` }}><strong>Scenario:</strong> {q.scenario}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{q.question}</div>
              {q.options.map((opt, oi) => {
                const markColor = opt.marks === 2 ? '#10b981' : opt.marks === 1 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={oi} style={{ padding: '7px 12px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><strong>{String.fromCharCode(65 + oi)}.</strong> {opt.text}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${markColor}15`, color: markColor, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{opt.marks}M</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeComp === 'PBA' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>{SQ_QUESTIONS.component3_PBA.instructions}</div>
          {SQ_QUESTIONS.component3_PBA.activities.map(act => (
            <div key={act.id} style={{ marginBottom: 14, background: 'var(--navy-4)', border: `1px solid ${color}20`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color }}>{act.id}: {act.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 8 }}>{act.time}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{act.bestFor}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{act.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── IQ Questionnaire View ────────────────────────────────────────────────────
function IQQuestionnaire({ color }) {
  const [activeSection, setActiveSection] = useState('verbal');
  const sections = [
    { id: 'verbal', label: 'Verbal' }, { id: 'quantitative', label: 'Quantitative' },
    { id: 'psychometric', label: 'Psychometric' }, { id: 'performance', label: 'Performance' },
  ];
  const sectionData = IQ_QUESTIONS[activeSection];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: activeSection === s.id ? color : 'var(--navy-4)',
            color: activeSection === s.id ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeSection === s.id ? color : 'var(--border-light)'}`,
            fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>{s.label}</button>
        ))}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 4 }}>{sectionData.label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Max: {sectionData.maxScore} marks</div>
      {sectionData.sections.map((sec, si) => (
        <div key={si} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, padding: '6px 12px', background: `${color}10`, borderRadius: 6, display: 'inline-block', marginBottom: 10, color }}>{sec.title}</div>
          {sec.instruction && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>{sec.instruction}</div>}
          {sec.questions.map((q, qi) => {
            const qType = sec.type === 'mixed' ? (q.type || 'open') : sec.type;
            if (qType === 'mcq') return <MCQInput key={qi} options={q.options} answer={q.answer} question={q.q} index={qi} />;
            return <OpenInput key={qi} question={q.q} index={qi} />;
          })}
        </div>
      ))}
    </div>
  );
}

// Updated MCQInput and OpenInput to accept question text
function MCQInput({ options, answer, question, index }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ marginBottom: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
      {question && <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}><span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{(index ?? 0) + 1}.</span>{question}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === answer;
          const isWrong = isSelected && i !== answer;
          return (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding: '7px 12px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
              fontSize: 12, border: `1px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? '#6366f1' : 'var(--border-light)'}`,
              background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.08)' : isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: isCorrect ? '#10b981' : isWrong ? '#ef4444' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontWeight: 600, marginRight: 6 }}>{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenInput({ question, index }) {
  return (
    <div style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
      {question && <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, lineHeight: 1.5 }}><span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{(index ?? 0) + 1}.</span>{question}</div>}
      <textarea placeholder="Write your answer here..." style={{
        width: '100%', padding: '8px 10px', borderRadius: 8,
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
        color: 'var(--text-primary)', fontSize: 12, resize: 'vertical', minHeight: 56,
        fontFamily: 'Inter', lineHeight: 1.5, boxSizing: 'border-box',
      }} />
    </div>
  );
}

// ─── AQ Questionnaire View ────────────────────────────────────────────────────
function AQQuestionnaire({ color }) {
  const [ageGroup, setAgeGroup] = useState('11-18');
  const [activeComp, setActiveComp] = useState('SA');
  const components = ['SA', 'PM', 'RR', 'RC'];
  const compData = AQ_QUESTIONS.components;

  return (
    <div>
      {/* Age group + scoring key */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ id: '11-18', label: '11–18 Years' }, { id: '19-32', label: '19–32 Years' }].map(ag => (
          <button key={ag.id} onClick={() => setAgeGroup(ag.id)} style={{
            padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            background: ageGroup === ag.id ? color : 'var(--navy-4)',
            color: ageGroup === ag.id ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${ageGroup === ag.id ? color : 'var(--border-light)'}`,
            fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>{ag.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '6px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 11, color: '#f59e0b' }}>
          Scoring: 1–2 = 0pt · 3 = 1pt · 4 = 2pts · 5 = 3pts
        </div>
      </div>

      {/* Component tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {components.map(c => (
          <button key={c} onClick={() => setActiveComp(c)} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
            background: activeComp === c ? color : 'var(--navy-4)',
            color: activeComp === c ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${activeComp === c ? color : 'var(--border-light)'}`,
            fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
          }}>{c} — {compData[c].label} <span style={{ opacity: 0.7 }}>×{compData[c].weight}</span></button>
        ))}
      </div>

      {/* Component info */}
      <div style={{ padding: '12px 16px', background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color }}>{compData[activeComp].label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{compData[activeComp].subParams}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{compData[activeComp].desc}</div>
      </div>

      {/* Part A questions */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>Part A — Scenario Questions (12 marks)</div>
        {compData[activeComp].questions[ageGroup].map((q, i) => (
          <div key={i} style={{ marginBottom: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{q.subParam}</div>
            <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{i + 1}.</span>{q.q}
            </div>
            <ScaleInput />
          </div>
        ))}
      </div>

      {/* Part B activity */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>Part B — {compData[activeComp].activity.label} (7 marks)</div>
        <div style={{ padding: '12px 14px', background: 'var(--navy-4)', border: `1px solid ${color}20`, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{compData[activeComp].activity.method}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            {ageGroup === '11-18' ? compData[activeComp].activity.desc11_18 : compData[activeComp].activity.desc19_32}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Rubric</div>
          {compData[activeComp].activity.rubric.map(r => (
            <div key={r.criterion} style={{ padding: '8px 10px', marginBottom: 4, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color }}>{r.criterion}</span> <span style={{ color: 'var(--text-muted)' }}>({r.marks} marks)</span> — {r.desc}
            </div>
          ))}
        </div>
      </div>

      {/* Scoring summary */}
      <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 8 }}>RDF Weighted Scoring Formula</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          RD Score = (SA×1.5) + (PM×1.0) + (RR×1.0) + (RC×1.5)<br />
          Max = 95 | Converted = RD Score ÷ 95 × 100
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AQ_QUESTIONS.levels.map(l => (
            <div key={l.label} style={{ padding: '4px 10px', borderRadius: 6, background: `${l.color}15`, border: `1px solid ${l.color}30`, fontSize: 11, color: l.color }}>
              {l.label} ({l.min}–{l.max})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Questionnaires() {
  const [activePillar, setActivePillar] = useState('IQ');
  const pillar = PILLARS[activePillar];

  const pdfLinks = {
    IQ: '/QIDS_IQ_Questionnaire_All_Ages.pdf',
    EQ: '/QIDS_EQ_Assessment_Questionnaire.pdf',
    SQ: '/QIDS_SQ_Assessment_Questionnaire.pdf',
    AQ: null,
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }} className="animate-fade">
      {/* Sidebar */}
      <div style={{ width: 230, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <ClipboardList size={16} color="#6366f1" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Questionnaires</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
          Official QIDS assessment instruments from PDF specifications.
        </p>
        <div className="divider" />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Select Pillar</div>
        {Object.entries(PILLARS).map(([id, p]) => (
          <button key={id} onClick={() => setActivePillar(id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 9, marginBottom: 4, cursor: 'pointer',
            background: activePillar === id ? `${p.color}18` : 'transparent',
            border: `1px solid ${activePillar === id ? p.color + '50' : 'transparent'}`,
            color: activePillar === id ? p.color : 'var(--text-secondary)',
            fontSize: 13, fontWeight: activePillar === id ? 600 : 400, textAlign: 'left',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{id}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>{p.label}</div>
            </div>
          </button>
        ))}
        <div className="divider" />
        {pdfLinks[activePillar] && (
          <a href={pdfLinks[activePillar]} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', fontSize: 12, fontWeight: 500, textDecoration: 'none', marginBottom: 10 }}>
            <Download size={12} /> Download PDF
          </a>
        )}
        {activePillar === 'AQ' && (
          <div style={{ padding: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 11, color: '#f59e0b' }}>
            AQ PDF questionnaire coming soon.
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pillar.color}20`, border: `1px solid ${pillar.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {pillar.emoji}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'Space Grotesk' }}>{activePillar} — {pillar.label}</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Official QIDS assessment instrument</p>
          </div>
          {pdfLinks[activePillar] && (
            <a href={pdfLinks[activePillar]} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, color: pillar.color, fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
              <ExternalLink size={12} /> View PDF
            </a>
          )}
        </div>

        {activePillar === 'IQ' && <IQQuestionnaire color={pillar.color} />}
        {activePillar === 'EQ' && <EQQuestionnaire color={pillar.color} />}
        {activePillar === 'SQ' && <SQQuestionnaire color={pillar.color} />}
        {activePillar === 'AQ' && <AQQuestionnaire color={pillar.color} />}
      </div>
    </div>
  );
}
