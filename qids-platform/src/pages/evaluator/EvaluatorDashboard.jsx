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
      <div className="px-6 py-6 animate-fade max-w-[1000px] mx-auto text-center pt-20">
        <div className="text-sm text-surface-variant">Loading your dashboard...</div>
      </div>
    );
  }

  const role = userProfile?.role || 'individual';
  if (role !== 'evaluator' && role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
        <ClipboardList size={40} className="text-surface-variant/40" />
        <div className="text-base font-semibold text-on-surface-variant">Evaluator access required</div>
        <div className="text-sm text-surface-variant">You don't have permission to view this page.</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 animate-fade max-w-[1000px] mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Evaluator Dashboard</h1>
          <p className="text-sm text-surface-variant">
            {assignments.length > 0
              ? `You have ${assignments.length} assigned student${assignments.length > 1 ? 's' : ''} to evaluate`
              : 'No students assigned to you yet'}
          </p>
        </div>
        <button onClick={loadData} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface cursor-pointer transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-10 text-center">
          <Users size={32} className="text-surface-variant mb-3 mx-auto" />
          <div className="text-sm text-surface-variant mb-1">No students assigned</div>
          <div className="text-xs text-surface-variant">
            Contact an admin to get assigned students to evaluate.
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map(assignment => {
            const student = students[assignment.studentUid];
            const studentAssessments = assessments[assignment.studentUid] || [];
            const preAssessments = studentAssessments.filter(a => a.phase === 'pre');
            const postAssessments = studentAssessments.filter(a => a.phase === 'post');

            return (
              <div key={assignment.id} className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
                {/* Student Header */}
                <div className="px-4 py-3.5 flex items-center gap-3 border-b border-outline-variant" style={{ background: 'rgba(99,102,241,0.04)' }}>
                  <div className="w-9 h-9 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                    <span className="text-sm font-extrabold text-white">
                      {(student?.name || student?.email || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">{student?.name || 'Unnamed Student'}</div>
                    <div className="text-xs text-surface-variant flex items-center gap-1.5">
                      <Mail size={10} className="text-surface-variant" /> {student?.email || '—'}
                      {student?.context && <span>· {student.context}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-surface-variant text-right">
                    <div className="font-semibold" style={{ color: preAssessments.length > 0 ? '#34d399' : '' }}>
                      {preAssessments.length} Pre
                    </div>
                    <div className="font-semibold" style={{ color: postAssessments.length > 0 ? '#34d399' : '' }}>
                      {postAssessments.length} Post
                    </div>
                  </div>
                </div>

                {/* Assessment List */}
                <div className="p-3">
                  {studentAssessments.length === 0 ? (
                    <div className="p-4 text-center text-surface-variant text-xs">
                      No assessments yet
                    </div>
                  ) : (
                    studentAssessments.slice(0, 3).map(asm => (
                      <div
                        key={asm.id}
                        onClick={() => navigate(`/app/evaluator/assess/${asm.id}`, { state: { student, assessment: asm } })}
                        className="px-3 py-2.5 mb-1.5 rounded-lg cursor-pointer flex items-center gap-2.5 transition-all"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                          background: asm.phase === 'pre' ? 'rgba(99,102,241,0.15)' : 'rgba(20,184,166,0.15)',
                          border: `1px solid ${asm.phase === 'pre' ? 'rgba(99,102,241,0.3)' : 'rgba(20,184,166,0.3)'}`,
                        }}>
                          <ClipboardList size={14} color={asm.phase === 'pre' ? '#818cf8' : '#14b8a6'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold capitalize">
                            {asm.phase === 'pre' ? 'Pre-Intervention' : 'Post-Intervention'} Assessment
                          </div>
                          <div className="text-[10px] text-surface-variant">
                            {asm.createdAt?.toDate?.()?.toLocaleDateString() || asm.timestamp ? new Date(asm.timestamp).toLocaleDateString() : 'No date'}
                          </div>
                        </div>

                        {/* Pillar evaluation status */}
                        <div className="flex gap-1">
                          {['EQ', 'SQ', 'AQ'].map(pillar => {
                            const ev = getPillarEvalStatus(asm.id, pillar);
                            const pillarColor = PILLARS[pillar]?.color || '#6366f1';
                            return (
                              <div key={pillar} className="w-[22px] h-[22px] rounded-md flex items-center justify-center" style={{
                                background: ev ? `${pillarColor}18` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${ev ? pillarColor : 'var(--border-light)'}`,
                              }} title={`${pillar}: ${ev ? 'Scored' : 'Pending'}`}>
                                {ev
                                  ? <CheckCircle size={10} color={pillarColor} />
                                  : <Clock size={10} className="text-surface-variant" />
                                }
                              </div>
                            );
                          })}
                        </div>

                        <ChevronRight size={14} className="text-surface-variant" />
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
