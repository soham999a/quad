import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveEvaluation, getEvaluation } from '../../services/firestoreService';
import { useToast } from '../../components/Toast';
import { PILLARS, EQ_QUESTIONS, SQ_QUESTIONS, AQ_QUESTIONS } from '../../data/qidsData';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Brain, Heart, Users as UsersIcon, Shield } from 'lucide-react';

const PILLAR_ICONS = { IQ: Brain, EQ: Heart, SQ: UsersIcon, AQ: Shield };
const PILLARS_WITH_RUBRICS = ['EQ', 'SQ', 'AQ'];

function RubricScorer({ criterion, marks, desc, value, onChange, color }) {
  return (
    <div className="mb-2.5 bg-white/[.02] border border-outline-variant rounded-[10px] p-3">
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex-1">
          <div className="text-technical-sm font-semibold">{criterion}</div>
          <div className="text-technical-sm text-surface-variant mt-0.5 leading-[1.4]">{desc}</div>
        </div>
        <div className="text-technical-sm text-surface-variant ml-2.5 shrink-0">Max: {marks}</div>
      </div>
      <div className="flex gap-[5px]">
        {Array.from({ length: marks + 1 }, (_, i) => (
          <button key={i} onClick={() => onChange(i)}
            className="w-8 h-8 rounded-md cursor-pointer text-technical-sm font-bold transition-all duration-150"
            style={{
              border: `2px solid ${value === i ? color : 'var(--border-light)'}`,
              background: value === i ? `${color}20` : 'transparent',
              color: value === i ? color : 'var(--text-muted)',
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

  const handleEqScore = (actId, criterion, val) => {
    onScoreChange(pillar, 'EQ', actId, criterion, val);
  };

  const handleSqScore = (section, exId, criterion, val) => {
    onScoreChange(pillar, 'SQ', exId, criterion, val);
  };

  const handleAqScore = (comp, criterion, val) => {
    onScoreChange(pillar, 'AQ', comp, criterion, val);
  };

  let content;
  if (pillar === 'EQ') content = getEqContent();
  else if (pillar === 'SQ') content = getSqContent();
  else if (pillar === 'AQ') content = getAqContent();

  return (
    <div className={`mb-5 rounded-[14px] overflow-hidden${completed ? ' opacity-75' : ''}`}
      style={{
        border: `1px solid ${completed ? `${pillarColor}40` : `${pillarColor}20`}`,
      }}
    >
      <div className="px-4 py-3 border-b border-outline-variant flex items-center gap-2.5"
        style={{ background: `${pillarColor}08` }}
      >
        <Icon size={16} color={pillarColor} />
        <span className="text-label-md font-bold flex-1" style={{ color: pillarColor }}>
          {PILLARS[pillar]?.label || pillar} — Part B Rubric
        </span>
        {completed && (
          <span className="text-technical-sm py-[3px] px-2 rounded-md bg-emerald-500/[.15] text-emerald-400 flex items-center gap-1">
            <CheckCircle size={11} /> Completed
          </span>
        )}
      </div>
      <div className="p-4">
        {!content || content.length === 0 ? (
          <div className="text-technical-sm text-surface-variant p-3 text-center">
            No rubric activities found for {pillar}.
          </div>
        ) : (
          content.map((item, i) => {
            if (!item) return null;
            if (item.type === 'eq') {
              return (
                <div key={item.activity.id} className="mb-4 bg-white/[.02] rounded-[10px] border border-outline-variant overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-outline-variant flex justify-between items-center"
                    style={{ background: `${pillarColor}06` }}
                  >
                    <div>
                      <div className="text-label-md font-bold">{item.activity.id}: {item.activity.label}</div>
                      <div className="text-technical-sm text-surface-variant">{item.activity.component} | Max: {item.activity.maxScore} marks</div>
                    </div>
                    <div className="text-lg font-extrabold font-['Space_Grotesk']" style={{ color: pillarColor }}>{item.total}/{item.activity.maxScore}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-technical-sm text-on-surface-variant leading-[1.5] mb-2.5">{item.activity.desc}</div>
                    {item.activity.rubric.map(r => (
                      <RubricScorer
                        key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.actScores[r.criterion] ?? undefined}
                        onChange={v => handleEqScore(item.activity.id, r.criterion, v)}
                        color={pillarColor}
                      />
                    ))}
                  </div>
                </div>
              );
            } else if (item.type === 'sq_ace') {
              return (
                <div key={item.exercise.id} className="mb-4 bg-white/[.02] rounded-[10px] border border-outline-variant overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-outline-variant flex justify-between items-center"
                    style={{ background: `${pillarColor}06` }}
                  >
                    <div>
                      <div className="text-label-md font-bold">{item.exercise.label}</div>
                      <div className="text-technical-sm text-surface-variant">{item.exercise.subParam} | Max: {item.exercise.marks} marks</div>
                    </div>
                    <div className="text-lg font-extrabold font-['Space_Grotesk']" style={{ color: pillarColor }}>{item.total}/{item.exercise.marks}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-technical-sm text-on-surface-variant leading-[1.5] mb-2.5">{item.exercise.desc}</div>
                    {item.exercise.rubric.map(r => (
                      <RubricScorer
                        key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.exScores[r.criterion] ?? undefined}
                        onChange={v => handleSqScore('sq_ace', item.exercise.id, r.criterion, v)}
                        color={pillarColor}
                      />
                    ))}
                  </div>
                </div>
              );
            } else if (item.type === 'sq_pba') {
              return (
                <div key={item.act.id} className="mb-4">
                  {item.act && (
                    <div className="bg-white/[.02] rounded-[10px] border border-outline-variant overflow-hidden">
                      <div className="px-3.5 py-2.5 border-b border-outline-variant flex justify-between items-center"
                        style={{ background: `${pillarColor}06` }}
                      >
                        <div>
                          <div className="text-label-md font-bold">{item.act.label}</div>
                          <div className="text-technical-sm text-surface-variant">Max: {item.act.marks} marks</div>
                        </div>
                        <div className="text-lg font-extrabold font-['Space_Grotesk']" style={{ color: pillarColor }}>{item.total}/{item.act.marks}</div>
                      </div>
                      <div className="p-3">
                        {item.act.rubric.map(r => (
                          <RubricScorer
                            key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                            value={item.pbaScores[r.criterion] ?? undefined}
                            onChange={v => handleSqScore('sq_pba', item.act.id, r.criterion, v)}
                            color={pillarColor}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            } else if (item.type === 'aq') {
              return (
                <div key={item.comp} className="mb-4 bg-white/[.02] rounded-[10px] border border-outline-variant overflow-hidden">
                  <div className="px-3.5 py-2.5 border-b border-outline-variant flex justify-between items-center"
                    style={{ background: `${pillarColor}06` }}
                  >
                    <div>
                      <div className="text-label-md font-bold">{item.activity.label}</div>
                      <div className="text-technical-sm text-surface-variant">{AQ_QUESTIONS?.components?.[item.comp]?.label || item.comp} | Max: {item.activity.maxScore} marks</div>
                    </div>
                    <div className="text-lg font-extrabold font-['Space_Grotesk']" style={{ color: pillarColor }}>{item.total}/{item.activity.maxScore}</div>
                  </div>
                  <div className="p-3">
                    <div className="text-technical-sm text-on-surface-variant leading-[1.5] mb-2.5">{item.activity.desc11_18 || item.activity.desc19_32 || ''}</div>
                    {item.activity.rubric.map(r => (
                      <RubricScorer
                        key={r.criterion} criterion={r.criterion} marks={r.marks} desc={r.desc}
                        value={item.actScores[r.criterion] ?? undefined}
                        onChange={v => handleAqScore(item.comp, r.criterion, v)}
                        color={pillarColor}
                      />
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
            if (ev.scores) {
              setScores(prev => ({ ...prev, [p]: ev.scores }));
            }
          }
        } catch (e) {
          console.warn('Failed to load evaluation for', p, e);
        }
      }
    })();
  }, [assessmentId]);

  if (!assessment || !student) {
    return (
      <div className="page-pad animate-fade max-w-[800px] mx-auto pt-[60px] text-center">
        <AlertCircle size={32} color="var(--text-muted)" className="mb-3" />
        <div className="text-label-md text-surface-variant mb-2">Assessment data not available</div>
        <button onClick={() => navigate('/app/evaluator')} className="btn btn-primary btn-sm">Back to Dashboard</button>
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
      <button onClick={() => navigate('/app/evaluator')} className="btn btn-ghost btn-sm mb-4 inline-flex items-center gap-1.5">
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-headline-md font-extrabold mb-1">Scoring: {studentName}</h1>
        <p className="text-label-md text-surface-variant">
          Fill in the rubric scores for Part B activities. These are observer-rated assessments.
        </p>
      </div>

      {/* Pillar tabs */}
      <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-xl w-fit">
        {PILLARS_WITH_RUBRICS.map(p => {
          const Icon = PILLAR_ICONS[p] || Brain;
          const color = PILLARS[p]?.color || '#6366f1';
          const isDone = existingEvals[p];
          return (
            <button key={p} onClick={() => setActivePillar(p)}
              className="px-4 py-2 rounded-lg cursor-pointer text-label-md font-medium border-none transition-all duration-150 flex items-center gap-1.5"
              style={{
                background: activePillar === p ? color : 'transparent',
                color: activePillar === p ? 'white' : 'var(--text-secondary)',
              }}
            >
              <Icon size={13} />
              {p}
              {isDone && <CheckCircle size={11} color={activePillar === p ? 'white' : '#34d399'} />}
            </button>
          );
        })}
      </div>

      {/* Scoring section */}
      <PillarScoringSection
        pillar={activePillar}
        scores={scores}
        onScoreChange={handleScoreChange}
        completed={existingEvals[activePillar]}
      />

      {/* Save button */}
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => handleSave(activePillar)}
          disabled={saving}
          className="btn btn-primary flex items-center gap-1.5"
        >
          <Save size={14} />
          {saving ? 'Saving...' : existingEvals[activePillar] ? 'Update Scores' : 'Save Scores'}
        </button>
      </div>
    </div>
  );
}
