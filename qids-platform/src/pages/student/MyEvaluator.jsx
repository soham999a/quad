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
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-sm text-surface-variant">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto px-5 py-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold mb-1.5">My Evaluator</h1>
        <p className="text-sm text-surface-variant">Select an evaluator to assess your Part B activities</p>
      </div>

      {/* Current evaluator */}
      {currentEvaluator ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-7">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                <span className="text-lg font-extrabold text-white">
                  {(currentEvaluator.name || 'E')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-base font-semibold">{currentEvaluator.name || 'Evaluator'}</div>
                <div className="text-xs text-surface-variant flex items-center gap-1">
                  <Mail size={11} className="text-surface-variant" /> {currentEvaluator.email || ''}
                </div>
              </div>
            </div>
            <button onClick={handleRemove} disabled={assigning} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg cursor-pointer text-xs font-medium" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <UserX size={13} /> Remove
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg border" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)' }}>
            <UserCheck size={13} color="#34d399" />
            <span className="text-xs" style={{ color: '#6ee7b7' }}>You are assigned to this evaluator</span>
          </div>

          {/* Evaluator Scores */}
          {evalAssessments.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-bold mb-2.5">Evaluator Scores</div>
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
                  <div key={a.id} className="px-3 py-3 mb-2 rounded-lg cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }} onClick={() => navigate('/app/report')}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs font-semibold">
                          {a.intake?.name || 'Assessment'} — {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : ''}
                        </div>
                        <div className="text-xs text-surface-variant flex gap-1.5 mt-1 flex-wrap">
                          {scoredPillars.map(p => (
                            <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: `${PILLARS[p]?.color}15`, color: PILLARS[p]?.color }}>{p} ✓</span>
                          ))}
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded-md text-sm font-bold" style={{ background: grade.bg, border: `1px solid ${grade.color}40`, color: grade.color }}>
                        {grade.grade}
                      </div>
                    </div>
                  </div>
                );
              })}
              {evalAssessments.every(a => (a.evaluations || []).filter(e => e.status === 'completed').length === 0) && (
                <div className="text-xs text-surface-variant p-2 flex items-center gap-1.5">
                  <Clock size={12} /> Awaiting evaluator scores
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-7">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-surface-variant" />
            <span className="text-sm font-semibold">No evaluator assigned</span>
          </div>
          <p className="text-sm text-surface-variant">Choose an evaluator below to get started. They will review and score your Part B activities.</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="text-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input type="text" placeholder="Search evaluators by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full py-2.5 pl-9 pr-3.5 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface text-sm outline-none"
        />
      </div>

      {/* Evaluator list */}
      {filtered.length === 0 ? (
        <div className="text-center px-5 py-10 text-surface-variant text-sm">
          {search ? 'No evaluators match your search.' : 'No evaluators available.'}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(ev => (
            <div key={ev.uid} className={`flex items-center justify-between px-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl transition-all ${currentEvaluator?.uid === ev.uid ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                  <span className="text-sm font-extrabold text-white">{(ev.name || 'E')[0].toUpperCase()}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{ev.name || 'Unnamed'}</div>
                  <div className="text-xs text-surface-variant">{ev.email || ''}</div>
                </div>
              </div>
              {currentEvaluator?.uid === ev.uid ? (
                <div className="text-xs flex items-center gap-1" style={{ color: '#34d399' }}>
                  <UserCheck size={13} /> Assigned
                </div>
              ) : (
                <button onClick={() => handleAssign(ev.uid)} disabled={assigning || !!currentEvaluator} className="px-3.5 py-1.5 rounded-lg text-xs font-medium" style={{
                  background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                  color: assigning ? 'var(--text-muted)' : '#a5b4fc',
                  cursor: assigning || currentEvaluator ? 'not-allowed' : 'pointer',
                  opacity: currentEvaluator ? 0.4 : 1,
                }}>
                  {assigning ? '...' : 'Select'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-5">
        <button onClick={loadData} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface cursor-pointer transition-all">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </div>
  );
}
