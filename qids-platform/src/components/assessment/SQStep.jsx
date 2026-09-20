// ─── SQ Assessment step ───────────────────────────────────────────────────────
// Extracted from Assessment.jsx (P2 decomposition).

import React, { useState } from 'react';
import { PILLARS, SQ_QUESTIONS } from '../../data/qidsData';
import { generateSQQuestions } from '../../services/groqService';
import AIQuestionGenerator from '../AIQuestionGenerator';
import { SectionHeader, RubricScorer } from './shared';

const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function SQStep({ scores, onChange }) {
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
        subtitle="3 Components | Raw /50 > ×2 = 100 pts | Assessor-scored"
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
          <div className="p-3 border-[0.5px] border-(--phase-int)/30 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
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
          <div className="p-3 border-[0.5px] border-(--phase-int)/30 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
            <strong style={{ color: pillar.color }}>Cognitive Social Intelligence Test.</strong> {SQ_QUESTIONS.component2_CSI.instructions}
          </div>
          {SQ_QUESTIONS.component2_CSI.questions.map((q, qi) => {
            const selected = scores.CSI?.[q.id];
            return (
              <div key={q.id} className="mb-5 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
                <div className="text-technical-sm font-technical-sm mb-2 uppercase tracking-widest" style={{ color: pillar.color }}>Q{qi + 1} — {q.subParam}</div>
                <div className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-3 p-3 bg-surface-container-low border-l-2 border-(--phase-int)/40">
                  <strong>Scenario:</strong> {q.scenario}
                </div>
                <div className="text-technical-sm font-technical-sm text-on-surface mb-3">{q.question}</div>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi;
                    const markColor = opt.marks === 2 ? 'var(--status-ok)' : opt.marks === 1 ? 'var(--status-warn)' : 'var(--status-err)';
                    return (
                      <button key={oi} onClick={() => onChange('CSI', q.id, oi)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-left text-technical-sm font-technical-sm transition-all cursor-pointer border-[0.5px] ${isSelected ? 'border-(--phase-int) bg-(--phase-int)/10' : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-(--phase-int)'
                          }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-(--phase-int) bg-(--phase-int)' : 'border-outline-variant'
                          }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary" />}
                        </div>
                        <span className="flex-1"><strong>{String.fromCharCode(65 + oi)}.</strong> {opt.text}</span>
                        {isSelected && (
                          <span className="text-[11px] px-2 py-0.5 font-bold flex-shrink-0"
                            style={{ backgroundColor: alpha(markColor, 20), color: markColor }}>
                            {opt.marks} mark{opt.marks !== 1 ? 's' : ''}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selected !== undefined && (
                  <div className="mt-3 p-3 border-[0.5px] border-(--phase-int)/20 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-surface-variant italic">
                    <strong className="text-(--phase-int)">Assessor Note:</strong> {q.assessorNote}
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
          <div className="p-3 border-[0.5px] border-(--phase-int)/30 bg-(--phase-int)/5 text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed mb-5">
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
                    className={`px-3 py-2.5 text-left border-[0.5px] transition-all cursor-pointer ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} ${isSelected ? 'border-(--phase-int) bg-(--phase-int)/10' : 'border-outline-variant bg-surface-container-low hover:border-(--phase-int)'
                      }`}>
                    <div className="text-technical-sm font-technical-sm" style={{ color: isSelected ? pillar.color : undefined }}>{act.id}: {act.label}</div>
                    <div className="text-[10px] text-surface-variant mt-0.5">{act.time} | {act.bestFor}</div>
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
