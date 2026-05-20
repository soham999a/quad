import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Likert scale for AI-generated EQ/AQ questions ───────────────────────────
function LikertInput({ value, onChange, color }) {
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer',
          border: `2px solid ${value === n ? color : 'var(--border-light)'}`,
          background: value === n ? `${color}20` : 'transparent',
          color: value === n ? color : 'var(--text-muted)',
          fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span>{n}</span>
          <span style={{ fontSize: 8, fontWeight: 400 }}>{labels[n - 1]}</span>
        </button>
      ))}
    </div>
  );
}

// ─── MCQ for AI-generated IQ/SQ questions ────────────────────────────────────
function MCQInput({ options, selected, onSelect, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {options.map((opt, i) => {
        const isSelected = selected === i;
        const optText = typeof opt === 'string' ? opt : opt.text;
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
            <span style={{ fontWeight: 500 }}>{String.fromCharCode(65 + i)}.</span> {optText}
          </button>
        );
      })}
    </div>
  );
}

// ─── Open text for AI-generated open questions ────────────────────────────────
function OpenInput({ value, onChange }) {
  return (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Write your answer here..."
      rows={3}
      style={{
        width: '100%', marginTop: 8, padding: '10px 12px', borderRadius: 8, resize: 'vertical',
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
        color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Inter', lineHeight: 1.5,
        boxSizing: 'border-box',
      }}
    />
  );
}

// ─── Single AI Question Card ──────────────────────────────────────────────────
function AIQuestionCard({ question, index, answers, onAnswer, color, questionType }) {
  const val = answers[index];

  return (
    <div style={{ marginBottom: 14, background: 'var(--navy-4)', border: `1px solid ${color}20`, borderRadius: 12, padding: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{ padding: '2px 8px', borderRadius: 6, background: `${color}15`, border: `1px solid ${color}30`, fontSize: 10, fontWeight: 700, color, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          AI · {question.subParam || question.subparam || 'Generated'}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, color: 'var(--text-muted)' }}>
          Q{index + 1}
        </div>
      </div>

      {question.scenario && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, borderLeft: `3px solid ${color}40` }}>
          {question.scenario}
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.6, marginBottom: 4 }}>
        {question.q || question.statement || question.question}
      </div>

      {/* Render appropriate input based on question type */}
      {questionType === 'likert' && (
        <LikertInput value={val} onChange={v => onAnswer(index, v)} color={color} />
      )}
      {questionType === 'mcq' && question.options && (
        <MCQInput options={question.options} selected={val} onSelect={v => onAnswer(index, v)} color={color} />
      )}
      {questionType === 'open' && (
        <OpenInput value={val} onChange={v => onAnswer(index, v)} />
      )}
    </div>
  );
}

// ─── Main AI Question Generator ───────────────────────────────────────────────
export default function AIQuestionGenerator({
  pillar,        // 'IQ' | 'EQ' | 'AQ' | 'SQ'
  component,     // e.g. 'SA', 'verbal', 'PM', etc.
  ageGroup,      // '11-18' | '19-32'
  context,       // 'school' | 'corporate' etc.
  questionType,  // 'likert' | 'mcq' | 'open'
  color,
  onAnswersChange,
  generateFn,    // async function that returns questions array
  label,
}) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = await generateFn({ ageGroup, component, context, count: 3 });
      setQuestions(qs);
      setAnswers({});
      setGenerated(true);
      setExpanded(true);
    } catch (e) {
      setError(e.message || 'Failed to generate questions. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx, val) => {
    const next = { ...answers, [idx]: val };
    setAnswers(next);
    onAnswersChange?.(next, questions);
  };

  return (
    <div style={{ marginTop: 16, border: `1px solid ${color}25`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', background: `${color}08`,
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: generated && expanded ? '1px solid var(--border-light)' : 'none',
      }}>
        <Sparkles size={14} color={color} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color }}>AI-Generated Questions</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
            {generated ? `${questions.length} questions generated by Groq (llama-3.3-70b)` : `Click to generate ${label || component} questions dynamically`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {generated && (
            <button onClick={handleGenerate} disabled={loading} style={{
              padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 500,
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Regenerate
            </button>
          )}
          <button onClick={handleGenerate} disabled={loading} style={{
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: loading ? 'rgba(255,255,255,0.05)' : `${color}20`,
            border: `1px solid ${color}40`, color,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {loading ? (
              <><RefreshCw size={12} className="animate-spin" /> Generating...</>
            ) : (
              <><Sparkles size={12} /> {generated ? 'New Set' : 'Generate'}</>
            )}
          </button>
          {generated && (
            <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 16px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <AlertCircle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: '#fca5a5' }}>{error}</span>
        </div>
      )}

      {/* Questions */}
      {generated && expanded && questions.length > 0 && (
        <div style={{ padding: 16 }}>
          {questions.map((q, i) => (
            <AIQuestionCard
              key={i} question={q} index={i}
              answers={answers} onAnswer={handleAnswer}
              color={color} questionType={questionType}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!generated && !loading && (
        <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
          Questions are generated fresh each time using the QIDS knowledge base and Groq AI.
          Each assessment gets a unique set.
        </div>
      )}
    </div>
  );
}
