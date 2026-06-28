import React, { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, BookOpen, Download, ExternalLink } from 'lucide-react';
import { PILLARS, EQ_QUESTIONS, SQ_QUESTIONS, IQ_QUESTIONS, AQ_QUESTIONS, mapAQLikert } from '../data/qidsData';


// ─── EQ Questionnaire View ────────────────────────────────────────────────────
function ScaleInput() {
  const [val, setVal] = useState(null);
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  return (
    <div className="flex gap-1.5 mt-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => setVal(n)} className="flex-1 px-1 py-1.5 rounded-lg cursor-pointer flex flex-col items-center gap-0.5 text-xs font-bold"
          style={{
            border: `2px solid ${val === n ? '#10b981' : 'var(--border-outline-variant)'}`,
            background: val === n ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: val === n ? '#10b981' : 'var(--text-surface-variant)',
            transition: 'all 0.15s',
          }}>
          <span>{n}</span>
          <span className="text-[9px] font-normal">{labels[n - 1]}</span>
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
      <div className="flex gap-2 mb-5">
        {[{ id: '11-18', label: '11–18 Years' }, { id: '19-32', label: '19–32 Years' }].map(ag => (
          <button key={ag.id} onClick={() => setAgeGroup(ag.id)} className="px-4 py-[7px] rounded-lg cursor-pointer text-[13px] font-medium"
            style={{
              background: ageGroup === ag.id ? color : 'var(--surface-container-low)',
              color: ageGroup === ag.id ? 'white' : 'var(--text-on-surface-variant)',
              border: `1px solid ${ageGroup === ag.id ? color : 'var(--border-outline-variant)'}`,
              transition: 'all 0.15s',
            }}>{ag.label}</button>
        ))}
      </div>

      <div className="px-3 py-2 rounded-lg mb-4 text-xs text-on-surface-variant"
        style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
        <strong style={{ color }}>Part A — Self-Report Questionnaire (25 marks)</strong> · Rate each statement 1 (Never) to 5 (Always)
      </div>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {components.map(c => (
          <button key={c} onClick={() => setActiveComp(c)} className="px-3.5 py-1.5 rounded-lg cursor-pointer text-xs font-medium"
            style={{
              background: activeComp === c ? color : 'var(--surface-container-low)',
              color: activeComp === c ? 'white' : 'var(--text-on-surface-variant)',
              border: `1px solid ${activeComp === c ? color : 'var(--border-outline-variant)'}`,
              transition: 'all 0.15s',
            }}>{c} — {compData[c].label}</button>
        ))}
      </div>

      <div className="mb-2">
        <div className="text-sm font-bold" style={{ color }}>{compData[activeComp].label}</div>
        <div className="text-[11px] text-surface-variant mt-0.5">{compData[activeComp].subParams}</div>
      </div>
      <div className="mt-3.5">
        {compData[activeComp].questions[ageGroup].map((q, i) => (
          <div key={i} className="mb-3 px-3.5 py-3 rounded-xl border border-outline-variant" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-[13px] mb-2.5 leading-normal">
              <span className="text-surface-variant mr-1.5">{i + 1}.</span>{q}
            </div>
            <ScaleInput />
          </div>
        ))}
      </div>

      <div className="mt-6 px-3.5 py-2.5 rounded-lg text-xs text-on-surface-variant"
        style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
        <strong style={{ color }}>Part B — Activity-Based Assessment (25 marks)</strong> · Assessor-scored. See Assessment Engine for full rubrics.
      </div>
      {EQ_QUESTIONS.partB.map(act => (
        <div key={act.id} className="mt-3 px-3.5 py-3 border border-outline-variant rounded-xl bg-surface-container-low">
          <div className="text-[13px] font-semibold" style={{ color }}>{act.id}: {act.label} <span className="text-[11px] text-surface-variant font-normal">({act.component} | {act.maxScore} marks)</span></div>
          <div className="text-xs text-on-surface-variant mt-1 leading-relaxed">{act.desc}</div>
          <div className="text-[11px] text-surface-variant mt-1 italic">{act.ageNote?.[ageGroup]}</div>
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
      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-xl w-fit">
        {[
          { id: 'ACE', label: 'Component 1 — ACE (20 marks)' },
          { id: 'CSI', label: 'Component 2 — CSI (10 marks)' },
          { id: 'PBA', label: 'Component 3 — PBA (20 marks)' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveComp(t.id)} className="px-3.5 py-[7px] rounded-lg cursor-pointer text-xs font-medium border-none"
            style={{
              background: activeComp === t.id ? color : 'transparent',
              color: activeComp === t.id ? 'white' : 'var(--text-on-surface-variant)',
              transition: 'all 0.15s',
            }}>{t.label}</button>
        ))}
      </div>

      {activeComp === 'ACE' && (
        <div>
          <div className="text-xs text-on-surface-variant mb-4 leading-relaxed">{SQ_QUESTIONS.component1_ACE.instructions}</div>
          {SQ_QUESTIONS.component1_ACE.exercises.map(ex => (
            <div key={ex.id} className="mb-4 bg-surface-container-low rounded-xl p-4" style={{ border: `1px solid ${color}20` }}>
              <div className="text-sm font-bold mb-1" style={{ color }}>{ex.label} <span className="text-[11px] text-surface-variant font-normal">({ex.subParam} | {ex.marks} marks)</span></div>
              <div className="text-xs text-on-surface-variant leading-relaxed mb-2.5">{ex.desc}</div>
              <div className="text-[11px] font-semibold text-surface-variant uppercase tracking-[0.5px] mb-2">Rubric</div>
              {ex.rubric.map(r => (
                <div key={r.criterion} className="px-2.5 py-2 mb-1 rounded-md border border-outline-variant text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="font-semibold" style={{ color }}>{r.criterion}</span> <span className="text-surface-variant">({r.marks} marks)</span> — {r.desc}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeComp === 'CSI' && (
        <div>
          <div className="text-xs text-on-surface-variant mb-4">{SQ_QUESTIONS.component2_CSI.instructions}</div>
          {SQ_QUESTIONS.component2_CSI.questions.map((q, qi) => (
            <div key={q.id} className="mb-4 bg-surface-container-low border border-outline-variant rounded-xl p-4">
              <div className="text-[11px] font-semibold mb-1.5 uppercase tracking-[0.5px]" style={{ color }}>Q{qi + 1} — {q.subParam}</div>
              <div className="text-xs text-on-surface-variant leading-relaxed mb-2 px-2.5 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${color}40` }}><strong>Scenario:</strong> {q.scenario}</div>
              <div className="text-[13px] font-semibold mb-2">{q.question}</div>
              {q.options.map((opt, oi) => {
                const markColor = opt.marks === 2 ? '#10b981' : opt.marks === 1 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={oi} className="px-3 py-[7px] mb-1 rounded-lg border border-outline-variant text-xs flex justify-between items-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span><strong>{String.fromCharCode(65 + oi)}.</strong> {opt.text}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-xl font-bold shrink-0 ml-2" style={{ background: `${markColor}15`, color: markColor }}>{opt.marks}M</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeComp === 'PBA' && (
        <div>
          <div className="text-xs text-on-surface-variant mb-4">{SQ_QUESTIONS.component3_PBA.instructions}</div>
          {SQ_QUESTIONS.component3_PBA.activities.map(act => (
            <div key={act.id} className="mb-3.5 bg-surface-container-low rounded-xl p-4" style={{ border: `1px solid ${color}20` }}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="text-sm font-bold" style={{ color }}>{act.id}: {act.label}</div>
                <div className="text-[11px] text-surface-variant shrink-0 ml-2">{act.time}</div>
              </div>
              <div className="text-[11px] text-surface-variant mb-2">{act.bestFor}</div>
              <div className="text-xs text-on-surface-variant leading-relaxed">{act.desc}</div>
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
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} className="px-3.5 py-[7px] rounded-lg cursor-pointer text-[13px] font-medium"
            style={{
              background: activeSection === s.id ? color : 'var(--surface-container-low)',
              color: activeSection === s.id ? 'white' : 'var(--text-on-surface-variant)',
              border: `1px solid ${activeSection === s.id ? color : 'var(--border-outline-variant)'}`,
              transition: 'all 0.15s',
            }}>{s.label}</button>
        ))}
      </div>
      <div className="text-sm font-bold mb-1" style={{ color }}>{sectionData.label}</div>
      <div className="text-xs text-surface-variant mb-4">Max: {sectionData.maxScore} marks</div>
      {sectionData.sections.map((sec, si) => (
        <div key={si} className="mb-5">
          <div className="text-[13px] font-bold px-3 py-1.5 rounded-md inline-block mb-2.5" style={{ background: `${color}10`, color }}>{sec.title}</div>
          {sec.instruction && <div className="text-xs text-surface-variant mb-2.5 italic">{sec.instruction}</div>}
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
    <div className="mb-3.5 px-3.5 py-3 rounded-xl border border-outline-variant" style={{ background: 'rgba(255,255,255,0.02)' }}>
      {question && <div className="text-[13px] font-medium mb-2 leading-normal"><span className="text-surface-variant mr-1.5">{(index ?? 0) + 1}.</span>{question}</div>}
      <div className="flex flex-col gap-1">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = selected !== null && i === answer;
          const isWrong = isSelected && i !== answer;
          return (
            <button key={i} onClick={() => setSelected(i)} className="px-3 py-[7px] rounded-lg text-left cursor-pointer text-xs"
              style={{
                border: `1px solid ${isCorrect ? '#10b981' : isWrong ? '#ef4444' : isSelected ? '#6366f1' : 'var(--border-outline-variant)'}`,
                background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.08)' : isSelected ? 'rgba(99,102,241,0.1)' : 'transparent',
                color: isCorrect ? '#10b981' : isWrong ? '#ef4444' : 'var(--text-on-surface-variant)',
                transition: 'all 0.15s',
              }}>
              <span className="font-semibold mr-1.5">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenInput({ question, index }) {
  return (
    <div className="mb-3 px-3.5 py-3 rounded-xl border border-outline-variant" style={{ background: 'rgba(255,255,255,0.02)' }}>
      {question && <div className="text-[13px] font-medium mb-2 leading-normal"><span className="text-surface-variant mr-1.5">{(index ?? 0) + 1}.</span>{question}</div>}
      <textarea placeholder="Write your answer here..." className="w-full px-2.5 py-2 rounded-lg text-xs text-on-surface leading-normal resize-y min-h-[56px] box-border"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-outline-variant)', fontFamily: 'Inter' }} />
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
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {[{ id: '11-18', label: '11–18 Years' }, { id: '19-32', label: '19–32 Years' }].map(ag => (
          <button key={ag.id} onClick={() => setAgeGroup(ag.id)} className="px-4 py-[7px] rounded-lg cursor-pointer text-[13px] font-medium"
            style={{
              background: ageGroup === ag.id ? color : 'var(--surface-container-low)',
              color: ageGroup === ag.id ? 'white' : 'var(--text-on-surface-variant)',
              border: `1px solid ${ageGroup === ag.id ? color : 'var(--border-outline-variant)'}`,
              transition: 'all 0.15s',
            }}>{ag.label}</button>
        ))}
        <div className="ml-auto px-3 py-1.5 rounded-lg text-[11px]"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
          Scoring: 1–2 = 0pt · 3 = 1pt · 4 = 2pts · 5 = 3pts
        </div>
      </div>

      {/* Component tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {components.map(c => (
          <button key={c} onClick={() => setActiveComp(c)} className="px-3.5 py-[7px] rounded-lg cursor-pointer text-xs font-medium"
            style={{
              background: activeComp === c ? color : 'var(--surface-container-low)',
              color: activeComp === c ? 'white' : 'var(--text-on-surface-variant)',
              border: `1px solid ${activeComp === c ? color : 'var(--border-outline-variant)'}`,
              transition: 'all 0.15s',
            }}>{c} — {compData[c].label} <span className="opacity-70">×{compData[c].weight}</span></button>
        ))}
      </div>

      {/* Component info */}
      <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
        <div className="text-sm font-bold" style={{ color }}>{compData[activeComp].label}</div>
        <div className="text-[11px] text-surface-variant mt-0.5">{compData[activeComp].subParams}</div>
        <div className="text-xs text-on-surface-variant mt-1">{compData[activeComp].desc}</div>
      </div>

      {/* Part A questions */}
      <div className="mb-5">
        <div className="text-[13px] font-bold mb-2.5" style={{ color }}>Part A — Scenario Questions (12 marks)</div>
        {compData[activeComp].questions[ageGroup].map((q, i) => (
          <div key={i} className="mb-3 px-3.5 py-3 rounded-xl border border-outline-variant" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color }}>{q.subParam}</div>
            <div className="text-[13px] mb-2.5 leading-relaxed">
              <span className="text-surface-variant mr-1.5">{i + 1}.</span>{q.q}
            </div>
            <ScaleInput />
          </div>
        ))}
      </div>

      {/* Part B activity */}
      <div>
        <div className="text-[13px] font-bold mb-2.5" style={{ color }}>Part B — {compData[activeComp].activity.label} (7 marks)</div>
        <div className="px-3.5 py-3 bg-surface-container-low rounded-xl" style={{ border: `1px solid ${color}20` }}>
          <div className="text-[11px] text-surface-variant mb-2">{compData[activeComp].activity.method}</div>
          <div className="text-xs text-on-surface-variant leading-relaxed mb-3.5">
            {ageGroup === '11-18' ? compData[activeComp].activity.desc11_18 : compData[activeComp].activity.desc19_32}
          </div>
          <div className="text-[11px] font-semibold text-surface-variant uppercase tracking-[0.5px] mb-2">Rubric</div>
          {compData[activeComp].activity.rubric.map(r => (
            <div key={r.criterion} className="px-2.5 py-2 mb-1 rounded-md border border-outline-variant text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="font-semibold" style={{ color }}>{r.criterion}</span> <span className="text-surface-variant">({r.marks} marks)</span> — {r.desc}
            </div>
          ))}
        </div>
      </div>

      {/* Scoring summary */}
      <div className="mt-5 px-4 py-[14px] rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>RDF Weighted Scoring Formula</div>
        <div className="text-xs text-on-surface-variant leading-[1.8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          RD Score = (SA×1.5) + (PM×1.0) + (RR×1.0) + (RC×1.5)<br />
          Max = 95 | Converted = RD Score ÷ 95 × 100
        </div>
        <div className="mt-2.5 flex gap-2 flex-wrap">
          {AQ_QUESTIONS.levels.map(l => (
            <div key={l.label} className="px-2.5 py-1 rounded-md text-[11px]" style={{ background: `${l.color}15`, border: `1px solid ${l.color}30`, color: l.color }}>
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
    <div className="flex h-[calc(100vh-56px)] animate-fade">
      {/* Sidebar - hidden on mobile */}
      <div className="w-[230px] border-r border-outline-variant bg-surface-container-lowest p-5 overflow-y-auto shrink-0 hide-mobile">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={16} color="#6366f1" />
          <span className="text-sm font-bold">Questionnaires</span>
        </div>
        <p className="text-xs text-surface-variant leading-normal mb-4">
          Official QIDS assessment instruments from PDF specifications.
        </p>
        <div className="divider" />
        <div className="text-[11px] text-surface-variant uppercase tracking-[0.5px] mb-2.5">Select Pillar</div>
        {Object.entries(PILLARS).map(([id, p]) => (
          <button key={id} onClick={() => setActivePillar(id)} className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg mb-1 cursor-pointer text-left text-[13px]"
            style={{
              background: activePillar === id ? `${p.color}18` : 'transparent',
              border: `1px solid ${activePillar === id ? p.color + '50' : 'transparent'}`,
              color: activePillar === id ? p.color : 'var(--text-on-surface-variant)',
              fontWeight: activePillar === id ? 600 : 400,
              transition: 'all 0.15s',
            }}>
            <span className="text-base">{p.emoji}</span>
            <div>
              <div className="text-xs font-bold">{id}</div>
              <div className="text-[10px] text-surface-variant font-normal">{p.label}</div>
            </div>
          </button>
        ))}
        <div className="divider" />
        {pdfLinks[activePillar] && (
          <a href={pdfLinks[activePillar]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium no-underline mb-2.5"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
            <Download size={12} /> Download PDF
          </a>
        )}
        {activePillar === 'AQ' && (
          <div className="p-2.5 rounded-lg text-[11px]" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
            AQ PDF questionnaire coming soon.
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Mobile pillar selector */}
        <div className="hide-desktop mb-4">
          <select value={activePillar} onChange={e => setActivePillar(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant text-on-surface font-technical-sm outline-none focus:border-primary"
            style={{ fontSize: 16 }}>
            {Object.entries(PILLARS).map(([id, p]) => (
              <option key={id} value={id}>{id} — {p.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="size-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${pillar.color}20`, border: `1px solid ${pillar.color}40` }}>
            {pillar.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold m-0">{activePillar} — {pillar.label}</h2>
            <p className="text-xs text-surface-variant m-0">Official QIDS assessment instrument</p>
          </div>
          {pdfLinks[activePillar] && (
            <a href={pdfLinks[activePillar]} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium no-underline"
              style={{ background: `${pillar.color}15`, border: `1px solid ${pillar.color}30`, color: pillar.color }}>
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
