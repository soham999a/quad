import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorAssignments, getUserAssessments, getAllEvaluations } from '../../services/firestoreService';
import { PILLARS } from '../../data/qidsData';
import { Users, ClipboardList, CheckCircle, Clock, ChevronRight, RefreshCw, Mail, Brain, Heart, Users as UsersIcon, Shield } from 'lucide-react';

const PILLAR_ICONS = { IQ: Brain, EQ: Heart, SQ: UsersIcon, AQ: Shield };

export default function EvaluatorDashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState({});
  const [assessments, setAssessments] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const assigns = await getEvaluatorAssignments(user.uid);
    setAssignments(assigns);

    const studentMap = {};
    const assessmentMap = {};
    const evalMap = {};

    for (const a of assigns) {
      try {
        const snap = await getDoc(doc(db, 'users', a.studentUid));
        if (snap.exists()) studentMap[a.studentUid] = snap.data();
      } catch (e) { console.warn('Failed to load user doc', e); }

      const userAssessments = await getUserAssessments(a.studentUid);
      assessmentMap[a.studentUid] = userAssessments;

      for (const asm of userAssessments) {
        const evals = await getAllEvaluations(asm.id);
        evalMap[asm.id] = evals.reduce((acc, e) => ({ ...acc, [e.pillar]: e }), {});
      }
    }

    setStudents(studentMap);
    setAssessments(assessmentMap);
    setEvaluations(evalMap);
    setLoading(false);
  };

  const getPillarEvalStatus = (assessmentId, pillar) => {
    const pillarEvals = evaluations[assessmentId] || {};
    return pillarEvals[pillar] || null;
  };

  if (loading) {
    return (
      <div className="page-pad animate-fade" style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading your dashboard...</div>
      </div>
    );
  }

  const role = userProfile?.role || 'individual';
  if (role !== 'evaluator' && role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <ClipboardList size={40} color="var(--text-muted)" opacity={0.4} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Evaluator access required</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You don't have permission to view this page.</div>
      </div>
    );
  }

  return (
    <div className="page-pad animate-fade" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Evaluator Dashboard</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {assignments.length > 0
              ? `You have ${assignments.length} assigned student${assignments.length > 1 ? 's' : ''} to evaluate`
              : 'No students assigned to you yet'}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Users size={32} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>No students assigned</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Contact an admin to get assigned students to evaluate.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {assignments.map(assignment => {
            const student = students[assignment.studentUid];
            const studentAssessments = assessments[assignment.studentUid] || [];
            const preAssessments = studentAssessments.filter(a => a.phase === 'pre');
            const postAssessments = studentAssessments.filter(a => a.phase === 'post');

            return (
              <div key={assignment.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Student Header */}
                <div style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--border-light)',
                  background: 'rgba(99,102,241,0.04)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>
                      {(student?.name || student?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{student?.name || 'Unnamed Student'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={10} /> {student?.email || '—'}
                      {student?.context && <span>· {student.context}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: preAssessments.length > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {preAssessments.length} Pre
                    </div>
                    <div style={{ fontWeight: 600, color: postAssessments.length > 0 ? '#34d399' : 'var(--text-muted)' }}>
                      {postAssessments.length} Post
                    </div>
                  </div>
                </div>

                {/* Assessment List */}
                <div style={{ padding: 12 }}>
                  {studentAssessments.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No assessments yet
                    </div>
                  ) : (
                    studentAssessments.slice(0, 3).map(asm => (
                      <div
                        key={asm.id}
                        onClick={() => navigate(`/app/evaluator/assess/${asm.id}`, { state: { student, assessment: asm } })}
                        style={{
                          padding: '10px 12px', marginBottom: 6, borderRadius: 10, cursor: 'pointer',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)',
                          display: 'flex', alignItems: 'center', gap: 10,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: asm.phase === 'pre' ? 'rgba(99,102,241,0.15)' : 'rgba(20,184,166,0.15)',
                          border: `1px solid ${asm.phase === 'pre' ? 'rgba(99,102,241,0.3)' : 'rgba(20,184,166,0.3)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <ClipboardList size={14} color={asm.phase === 'pre' ? '#818cf8' : '#14b8a6'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                            {asm.phase === 'pre' ? 'Pre-Intervention' : 'Post-Intervention'} Assessment
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {asm.createdAt?.toDate?.()?.toLocaleDateString() || asm.timestamp ? new Date(asm.timestamp).toLocaleDateString() : 'No date'}
                          </div>
                        </div>

                        {/* Pillar evaluation status */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {['EQ', 'SQ', 'AQ'].map(pillar => {
                            const ev = getPillarEvalStatus(asm.id, pillar);
                            const pillarColor = PILLARS[pillar]?.color || '#6366f1';
                            return (
                              <div key={pillar} style={{
                                width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: ev ? `${pillarColor}18` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${ev ? pillarColor : 'var(--border-light)'}`,
                              }} title={`${pillar}: ${ev ? 'Scored' : 'Pending'}`}>
                                {ev
                                  ? <CheckCircle size={10} color={pillarColor} />
                                  : <Clock size={10} color="var(--text-muted)" />
                                }
                              </div>
                            );
                          })}
                        </div>

                        <ChevronRight size={14} color="var(--text-muted)" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
