import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveEvaluation, getEvaluation } from '../../services/firestoreService';
import { useToast } from '../../components/Toast';
import { PILLARS, EQ_QUESTIONS, SQ_QUESTIONS, AQ_QUESTIONS } from '../../data/qidsData';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Brain, Heart, Users, Shield } from 'lucide-react';

const PILLAR_ICONS = { IQ: Brain, EQ: Heart, SQ: Users, AQ: Shield };
const PILLARS_WITH_RUBRICS = ['EQ', 'SQ', 'AQ'];

function RubricScorer({ criterion, marks, desc, value, onChange, color }) {
  return (
    <div className="mb-2.5 border-[0.5px] border-[#4e4638] p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="text-[12px] font-medium" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{criterion}</div>
          <div className="text-[11px] mt-0.5 leading-[1.5]" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>{desc}</div>
        </div>
        <div className="text-[10px] ml-2.5 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>Max: {marks}</div>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: marks + 1 }, (_, i) => (
          <button key={i} onClick={() => onChange(i)}
            className="size-7 cursor-pointer text-[11px] font-bold transition-all duration-150 border-[0.5px]"
            style={{
              borderRadius: '8px',
              borderColor: value === i ? color : '#4e4638',
              background: value === i ? `${color}20` : 'transparent',
              color: value === i ? color : '#9a8f7f',
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >{i}</button>
        ))}
      </div>
    </div>
  );
}

function PillarScoringSection({ pillar, scores, onScoreChange, completed }) {
  const pillarColor = PILLARS[pillar]?.color || '#6366f1';
  const Icon = PILLAR_ICONS[pillar] || Brain;

  const getEqContent = () => {
    if (!EQ_QUESTIONS?.partB) return null;
    return EQ_QUESTIONS.partB.map(activity => {
      const actScores = scores[pillar]?.EQ?.[activity.id] || {};
      const total = activity.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
      return { type: 'eq', activity, actScores, total };
    });
  };

  const getSqContent = () => {
    if (!SQ_QUESTIONS) return null;
    const ace = SQ_QUESTIONS.component1_ACE?.exercises.map(ex => {
      const exScores = scores[pillar]?.SQ?.[ex.id] || {};
      const total = ex.rubric.reduce((s, r) => s + (exScores[r.criterion] || 0), 0);
      return { type: 'sq_ace', exercise: ex, exScores, total };
    }) || [];
    const pba = SQ_QUESTIONS.component3_PBA?.activities.map(act => {
      const pbaScores = scores[pillar]?.SQ?.[act.id] || {};
      const total = act.rubric.reduce((s, r) => s + (pbaScores[r.criterion] || 0), 0);
      return { type: 'sq_pba', act, pbaScores, total };
    }) || [];
    return [...ace, ...pba];
  };

  const getAqContent = () => {
    if (!AQ_QUESTIONS?.components) return null;
    return Object.entries(AQ_QUESTIONS.components).map(([comp, data]) => {
      const act = data.activity;
      if (!act) return null;
      const actScores = scores[pillar]?.AQ?.[comp] || {};
      const total = act.rubric.reduce((s, r) => s + (actScores[r.criterion] || 0), 0);
      return { type: 'aq', comp, activity: act, actScores, total };
    }).filter(Boolean);
  };

  const handleEqScore = (actId, criterion, val) => onScoreChange(pillar, 'EQ', actId, criterion, val);
  const handleSqScore = (section, exId, criterion, val) => onScoreChange(pillar, 'SQ', exId, criterion, val);
  const handleAqScore = (comp, criterion, val) => onScoreChange(pillar, 'AQ', comp, criterion, val);

  let content;
  if (pillar === 'EQ') content = getEqContent();
  else if (pillar === 'SQ') content = getSqContent();
  else if (pillar === 'AQ') content = getAqContent();

  const sectionBorder = completed ? `0.5px solid ${pillarColor}40` : '0.5px solid #4e4638';

  return (
    <div className={`mb-5 overflow-hidden`} style={{ border: sectionBorder }}>
      <div className="px-4 py-3 border-b-[0.5px] border-[#4e4638] flex items-center gap-2.5">
        <Icon size={14} color={pillarColor} />
        <span className="text-[12px] font-medium flex-1 uppercase tracking-wider" style={{ fontFamily: "'Sora', sans-serif", color: pillarColor }}>
          {PILLARS[pillar]?.label || pillar} — Part B Rubric
        </span>
        {completed && (
          <span className="text-[10px] py-[2px] px-2 border-[0.5px] border-[#ebc073]/40 flex items-center gap-1"
            style={{ borderRadius: '8px', color: '#ebc073', fontFamily: "'Sora', sans-serif" }}>
            <CheckCircle size={10} /> Completed
          </span>
        )}
      </div>
      <div className="p-4">
        {!content || content.length === 0 ? (
          <div className="text-[12px] text-center p-3" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>
            No rubric activities found for {pillar}.
          </div>
        ) : (
          content.map((item, i) => {
            if (!item) return null;
            if (item.type === 'eq') {
              return (
                <div key={item.activity.id} className="mb-4 border-[0.5px] border-[#4e4638] overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b-[0.5px] border-[#4e4638] flex justify-between items-center">
                    <div>
                      <div className="text-[12px] font-medium" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{item.activity.id}: {item.activity.label}</div>
                      <div className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>{item.activity.component} | Max: {item.activity.maxScore} marks</div>
                    </div>
                    <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: pillarColor }}>{item.total}/{item.activity.maxScore}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] leading-[1.5] mb-2.5" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>{item.activity.desc}</div>
                    {item.activity.rubric.map(r => (
                      <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.actScores[r.criterion] ?? undefined}
                        onChange={v => handleEqScore(item.activity.id, r.criterion, v)} color={pillarColor} />
                    ))}
                  </div>
                </div>
              );
            } else if (item.type === 'sq_ace') {
              return (
                <div key={item.exercise.id} className="mb-4 border-[0.5px] border-[#4e4638] overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b-[0.5px] border-[#4e4638] flex justify-between items-center">
                    <div>
                      <div className="text-[12px] font-medium" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{item.exercise.label}</div>
                      <div className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>{item.exercise.subParam} | Max: {item.exercise.marks} marks</div>
                    </div>
                    <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: pillarColor }}>{item.total}/{item.exercise.marks}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] leading-[1.5] mb-2.5" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>{item.exercise.desc}</div>
                    {item.exercise.rubric.map(r => (
                      <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.exScores[r.criterion] ?? undefined}
                        onChange={v => handleSqScore('sq_ace', item.exercise.id, r.criterion, v)} color={pillarColor} />
                    ))}
                  </div>
                </div>
              );
            } else if (item.type === 'sq_pba') {
              return (
                <div key={item.act.id} className="mb-4 border-[0.5px] border-[#4e4638] overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b-[0.5px] border-[#4e4638] flex justify-between items-center">
                    <div>
                      <div className="text-[12px] font-medium" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{item.act.label}</div>
                      <div className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>Max: {item.act.marks} marks</div>
                    </div>
                    <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: pillarColor }}>{item.total}/{item.act.marks}</div>
                  </div>
                  <div className="p-3">
                    {item.act.rubric.map(r => (
                      <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.pbaScores[r.criterion] ?? undefined}
                        onChange={v => handleSqScore('sq_pba', item.act.id, r.criterion, v)} color={pillarColor} />
                    ))}
                  </div>
                </div>
              );
            } else if (item.type === 'aq') {
              return (
                <div key={item.comp} className="mb-4 border-[0.5px] border-[#4e4638] overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b-[0.5px] border-[#4e4638] flex justify-between items-center">
                    <div>
                      <div className="text-[12px] font-medium" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{item.activity.label}</div>
                      <div className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>{AQ_QUESTIONS?.components?.[item.comp]?.label || item.comp} | Max: {item.activity.maxScore} marks</div>
                    </div>
                    <div className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: pillarColor }}>{item.total}/{item.activity.maxScore}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-[11px] leading-[1.5] mb-2.5" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>{item.activity.desc11_18 || item.activity.desc19_32 || ''}</div>
                    {item.activity.rubric.map(r => (
                      <RubricScorer key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.actScores[r.criterion] ?? undefined}
                        onChange={v => handleAqScore(item.comp, r.criterion, v)} color={pillarColor} />
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}

export default function EvaluatorScoring() {
  const { assessmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const student = location.state?.student;
  const assessment = location.state?.assessment;
  const [scores, setScores] = useState({});
  const [existingEvals, setExistingEvals] = useState({});
  const [saving, setSaving] = useState(false);
  const [activePillar, setActivePillar] = useState('EQ');

  useEffect(() => {
    if (!assessmentId) return;
    (async () => {
      for (const p of PILLARS_WITH_RUBRICS) {
        try {
          const ev = await getEvaluation(assessmentId, p);
          if (ev) {
            setExistingEvals(prev => ({ ...prev, [p]: true }));
            if (ev.scores) setScores(prev => ({ ...prev, [p]: ev.scores }));
          }
        } catch (e) { console.warn('Failed to load evaluation for', p, e); }
      }
    })();
  }, [assessmentId]);

  if (!assessment || !student) {
    return (
      <div className="page-pad animate-fade max-w-[800px] mx-auto pt-[60px] text-center">
        <AlertCircle size={32} className="text-[#9a8f7f] mb-3" />
        <div className="text-[13px] mb-4" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>Assessment data not available</div>
        <button onClick={() => navigate('/app/evaluator')}
          className="px-4 py-2 border-[0.5px] border-[#ebc073] text-[#ebc073] text-[11px] uppercase tracking-wider cursor-pointer bg-transparent hover:bg-[#ebc073]/10 transition-all"
          style={{ borderRadius: '8px', fontFamily: "'Sora', sans-serif" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleScoreChange = (pillar, section, activityId, key, val) => {
    setScores(prev => ({
      ...prev,
      [pillar]: {
        ...(prev[pillar] || {}),
        [section]: {
          ...(prev[pillar]?.[section] || {}),
          [activityId]: {
            ...(prev[pillar]?.[section]?.[activityId] || {}),
            [key]: val,
          },
        },
      },
    }));
    setExistingEvals(prev => ({ ...prev, [pillar]: false }));
  };

  const handleSave = async (pillar) => {
    setSaving(true);
    const pillarScores = scores[pillar] || {};
    const ok = await saveEvaluation(assessmentId, user.uid, student.uid, pillar, pillarScores);
    if (ok) {
      setExistingEvals(prev => ({ ...prev, [pillar]: true }));
      toast(`${PILLARS[pillar]?.label || pillar} rubric saved!`, 'success');
    } else {
      toast('Failed to save evaluation', 'error');
    }
    setSaving(false);
  };

  const studentName = student?.name || student?.email || 'this student';

  return (
    <div className="page-pad animate-fade max-w-[900px] mx-auto">
      <button onClick={() => navigate('/app/evaluator')}
        className="inline-flex items-center gap-1.5 mb-6 px-3 py-1.5 border-[0.5px] border-[#4e4638] text-[#d1c5b3] hover:text-[#ebc073] hover:border-[#ebc073] text-[11px] uppercase tracking-wider cursor-pointer bg-transparent transition-all"
        style={{ borderRadius: '8px', fontFamily: "'Sora', sans-serif" }}>
        <ArrowLeft size={13} /> Back to Dashboard
      </button>

      <div className="mb-8">
        <div className="text-technical-sm font-technical-sm text-[#ebc073] mb-2 uppercase tracking-[0.2em]">Scoring</div>
        <h1 className="text-[24px] font-medium m-0" style={{ fontFamily: "'Avenir Next', sans-serif", letterSpacing: '-0.01em', color: '#e5e2e1' }}>
          {studentName}
        </h1>
        <p className="text-[13px] mt-1.5 m-0" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>
          Fill in the rubric scores for Part B activities. These are observer-rated assessments.
        </p>
      </div>

      {/* Pillar tabs — clean underline style */}
      <div className="flex gap-0 mb-6 border-b-[0.5px] border-[#4e4638]">
        {PILLARS_WITH_RUBRICS.map(p => {
          const Icon = PILLAR_ICONS[p] || Brain;
          const color = PILLARS[p]?.color || '#6366f1';
          const isDone = existingEvals[p];
          const isActive = activePillar === p;
          return (
            <button key={p} onClick={() => setActivePillar(p)}
              className="px-4 py-2.5 cursor-pointer border-none bg-transparent flex items-center gap-1.5 transition-all duration-150"
              style={{
                borderBottom: isActive ? `1.5px solid ${color}` : '1.5px solid transparent',
                marginBottom: '-0.5px'
              }}>
              <Icon size={12} color={isActive ? color : '#9a8f7f'} />
              <span className="text-[12px] font-medium uppercase tracking-wider" style={{
                fontFamily: "'Sora', sans-serif",
                color: isActive ? color : '#9a8f7f'
              }}>{p}</span>
              {isDone && <CheckCircle size={10} color={color} />}
            </button>
          );
        })}
      </div>

      <PillarScoringSection
        pillar={activePillar}
        scores={scores}
        onScoreChange={handleScoreChange}
        completed={existingEvals[activePillar]}
      />

      <div className="flex justify-end gap-2 mt-2 mb-8">
        <button
          onClick={() => handleSave(activePillar)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 border-[0.5px] border-[#ebc073] text-[#ebc073] text-[11px] uppercase tracking-widest cursor-pointer bg-transparent hover:bg-[#ebc073]/10 transition-all disabled:opacity-40"
          style={{ borderRadius: '8px', fontFamily: "'Sora', sans-serif" }}>
          <Save size={13} />
          {saving ? 'Saving...' : existingEvals[activePillar] ? 'Update Scores' : 'Save Scores'}
        </button>
      </div>
    </div>
  );
}
