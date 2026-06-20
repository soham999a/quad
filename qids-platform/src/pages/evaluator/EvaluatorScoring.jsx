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
    <div style={{ marginBottom: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{criterion}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10, flexShrink: 0 }}>Max: {marks}</div>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: marks + 1 }, (_, i) => (
          <button key={i} onClick={() => onChange(i)} style={{
            width: 32, height: 32, borderRadius: 6, cursor: 'pointer',
            border: `2px solid ${value === i ? color : 'var(--border-light)'}`,
            background: value === i ? `${color}20` : 'transparent',
            color: value === i ? color : 'var(--text-muted)',
            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          }}>{i}</button>
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
    <div style={{
      marginBottom: 20, borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${completed ? `${pillarColor}40` : `${pillarColor}20`}`,
      opacity: completed ? 0.75 : 1,
    }}>
      <div style={{
        padding: '12px 16px', background: `${pillarColor}08`,
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Icon size={16} color={pillarColor} />
        <span style={{ fontSize: 14, fontWeight: 700, color: pillarColor, flex: 1 }}>
          {PILLARS[pillar]?.label || pillar} — Part B Rubric
        </span>
        {completed && (
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={11} /> Completed
          </span>
        )}
      </div>
      <div style={{ padding: 16 }}>
        {!content || content.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 12, textAlign: 'center' }}>
            No rubric activities found for {pillar}.
          </div>
        ) : (
          content.map((item, i) => {
            if (!item) return null;
            if (item.type === 'eq') {
              return (
                <div key={item.activity.id} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: `${pillarColor}06`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.activity.id}: {item.activity.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.activity.component} | Max: {item.activity.maxScore} marks</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: pillarColor, fontFamily: 'Space Grotesk' }}>{item.total}/{item.activity.maxScore}</div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{item.activity.desc}</div>
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
                <div key={item.exercise.id} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: `${pillarColor}06`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.exercise.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.exercise.subParam} | Max: {item.exercise.marks} marks</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: pillarColor, fontFamily: 'Space Grotesk' }}>{item.total}/{item.exercise.marks}</div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{item.exercise.desc}</div>
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
                <div key={item.act.id} style={{ marginBottom: 16, ...(item.act.id ? {} : {}) }}>
                  {item.act && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                      <div style={{ padding: '10px 14px', background: `${pillarColor}06`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{item.act.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Max: {item.act.marks} marks</div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: pillarColor, fontFamily: 'Space Grotesk' }}>{item.total}/{item.act.marks}</div>
                      </div>
                      <div style={{ padding: 12 }}>
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
                <div key={item.comp} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: `${pillarColor}06`, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.activity.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{AQ_QUESTIONS?.components?.[item.comp]?.label || item.comp} | Max: {item.activity.maxScore} marks</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: pillarColor, fontFamily: 'Space Grotesk' }}>{item.total}/{item.activity.maxScore}</div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>{item.activity.desc11_18 || item.activity.desc19_32 || ''}</div>
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
      <div className="page-pad animate-fade" style={{ maxWidth: 800, margin: '0 auto', paddingTop: 60, textAlign: 'center' }}>
        <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Assessment data not available</div>
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
    <div className="page-pad animate-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate('/app/evaluator')} className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Scoring: {studentName}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Fill in the rubric scores for Part B activities. These are observer-rated assessments.
        </p>
      </div>

      {/* Pillar tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {PILLARS_WITH_RUBRICS.map(p => {
          const Icon = PILLAR_ICONS[p] || Brain;
          const color = PILLARS[p]?.color || '#6366f1';
          const isDone = existingEvals[p];
          return (
            <button key={p} onClick={() => setActivePillar(p)} style={{
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: activePillar === p ? color : 'transparent',
              color: activePillar === p ? 'white' : 'var(--text-secondary)',
              border: 'none', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => handleSave(activePillar)}
          disabled={saving}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : existingEvals[activePillar] ? 'Update Scores' : 'Save Scores'}
        </button>
      </div>
    </div>
  );
}
