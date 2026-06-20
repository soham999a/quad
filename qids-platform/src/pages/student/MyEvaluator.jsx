import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, getStudentEvaluator, assignEvaluator, removeAssignment, getUserAssessments, getAllEvaluations } from '../../services/firestoreService';
import { useToast } from '../../components/Toast';
import { PILLARS, computePillarScore, computeWeightedScore, getGrade } from '../../data/qidsData';
import { UserCheck, UserX, Users, RefreshCw, Mail, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function MyEvaluator() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentEvaluator, setCurrentEvaluator] = useState(null);
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState('');
  const [evalAssessments, setEvalAssessments] = useState([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setEvaluators(allUsers.filter(u => u.role === 'evaluator'));

      const current = await getStudentEvaluator(user.uid);
      if (current) {
        const ev = allUsers.find(u => u.uid === current.evaluatorUid);
        setCurrentEvaluator(ev || null);
        // Load assessments and their evaluations
        const asms = await getUserAssessments(user.uid);
        const enriched = [];
        for (const a of asms) {
          if (a.id) {
            const evals = await getAllEvaluations(a.id).catch(() => []);
            enriched.push({ ...a, evaluations: evals });
          }
        }
        setEvalAssessments(enriched);
      } else {
        setCurrentEvaluator(null);
        setEvalAssessments([]);
      }
    } catch (e) {
      console.warn('Could not load evaluator data:', e);
    }
    setLoading(false);
  };

  const handleAssign = async (evaluatorUid) => {
    setAssigning(true);
    try {
      await assignEvaluator(evaluatorUid, user.uid);
      const ev = evaluators.find(e => e.uid === evaluatorUid);
      setCurrentEvaluator(ev || null);
      toast(`Assigned to ${ev?.name || 'evaluator'}`, 'success');
    } catch (e) {
      toast('Could not assign evaluator', 'error');
    }
    setAssigning(false);
  };

  const handleRemove = async () => {
    if (!currentEvaluator) return;
    setAssigning(true);
    try {
      await removeAssignment(currentEvaluator.uid, user.uid);
      setCurrentEvaluator(null);
      toast('Evaluator removed', 'success');
    } catch (e) {
      toast('Could not remove evaluator', 'error');
    }
    setAssigning(false);
  };

  const filtered = evaluators.filter(e =>
    !search || (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
    (e.email && e.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>My Evaluator</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select an evaluator to assess your Part B activities</p>
      </div>

      {/* Current evaluator */}
      {currentEvaluator ? (
        <div style={{ background: 'var(--navy-3)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                  {(currentEvaluator.name || 'E')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{currentEvaluator.name || 'Evaluator'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={11} /> {currentEvaluator.email || ''}
                </div>
              </div>
            </div>
            <button onClick={handleRemove} disabled={assigning} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'Inter',
            }}>
              <UserX size={13} /> Remove
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
            <UserCheck size={13} color="#34d399" />
            <span style={{ fontSize: 12, color: '#6ee7b7' }}>You are assigned to this evaluator</span>
          </div>

          {/* Evaluator Scores */}
          {evalAssessments.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Evaluator Scores</div>
              {evalAssessments.map(a => {
                const evals = a.evaluations || [];
                const scoredPillars = evals.filter(e => e.status === 'completed').map(e => e.pillar);
                if (scoredPillars.length === 0) return null;

                // Compute scores from evaluation data
                const mergedRaw = JSON.parse(JSON.stringify(a.rawScores || {}));
                evals.forEach(ev => {
                  if (ev.pillar === 'SQ' && ev.scores?.SQ) {
                    let ace = 0, pba = 0;
                    Object.entries(ev.scores.SQ).forEach(([id, c]) => {
                      const t = Object.values(c || {}).reduce((s, v) => s + (v || 0), 0);
                      if (id.startsWith('ACE')) ace += t; else if (id.startsWith('PBA')) pba += t;
                    });
                    mergedRaw.SQ = { ...mergedRaw.SQ, ACE: ace, PBA: pba };
                  }
                  if (ev.pillar === 'AQ' && ev.scores?.AQ) {
                    Object.entries(ev.scores.AQ).forEach(([comp, c]) => {
                      const pb = Object.values(c || {}).reduce((s, v) => s + (v || 0), 0);
                      const orig = a.rawScores?.AQ?.[comp] || 0;
                      mergedRaw.AQ = { ...mergedRaw.AQ, [comp]: Math.min(pb + (orig > pb ? orig - 10 : 0), 19) };
                    });
                  }
                });

                const score = scoredPillars.reduce((s, p) => {
                  const v = computePillarScore(p, mergedRaw[p] || {});
                  return s + v;
                }, 0) / scoredPillars.length;
                const grade = getGrade(Math.round(score));

                return (
                  <div key={a.id} style={{
                    padding: 12, marginBottom: 8, borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                    cursor: 'pointer',
                  }} onClick={() => navigate('/app/report')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {a.intake?.name || 'Assessment'} — {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                          {scoredPillars.map(p => (
                            <span key={p} style={{ padding: '1px 6px', borderRadius: 4, background: `${PILLARS[p]?.color}15`, color: PILLARS[p]?.color, fontSize: 10, fontWeight: 600 }}>{p} ✓</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: '3px 8px', borderRadius: 6, background: grade.bg, border: `1px solid ${grade.color}40`, fontSize: 13, fontWeight: 700, color: grade.color }}>
                        {grade.grade}
                      </div>
                    </div>
                  </div>
                );
              })}
              {evalAssessments.every(a => (a.evaluations || []).filter(e => e.status === 'completed').length === 0) && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} /> Awaiting evaluator scores
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--navy-3)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertCircle size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>No evaluator assigned</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choose an evaluator below to get started. They will review and score your Part B activities.</p>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input type="text" placeholder="Search evaluators by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '1px solid var(--border-light)', background: 'var(--navy-3)', color: 'white', fontSize: 13, fontFamily: 'Inter', outline: 'none' }}
        />
      </div>

      {/* Evaluator list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          {search ? 'No evaluators match your search.' : 'No evaluators available.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(ev => (
            <div key={ev.uid} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'var(--navy-3)', border: '1px solid var(--border-light)', borderRadius: 12,
              transition: 'all 0.15s',
              opacity: currentEvaluator?.uid === ev.uid ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{(ev.name || 'E')[0].toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.name || 'Unnamed'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.email || ''}</div>
                </div>
              </div>
              {currentEvaluator?.uid === ev.uid ? (
                <div style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <UserCheck size={13} /> Assigned
                </div>
              ) : (
                <button onClick={() => handleAssign(ev.uid)} disabled={assigning || !!currentEvaluator} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: assigning || currentEvaluator ? 'not-allowed' : 'pointer',
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  color: assigning ? 'var(--text-muted)' : '#a5b4fc', fontFamily: 'Inter',
                  opacity: currentEvaluator ? 0.4 : 1,
                }}>
                  {assigning ? '...' : 'Select'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={loadData} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>
          <RefreshCw size={12} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>
    </div>
  );
}
