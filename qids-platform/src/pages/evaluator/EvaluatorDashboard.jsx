import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorAssignments, getUserAssessments, getAllEvaluations } from '../../services/firestoreService';
import { PILLARS } from '../../data/qidsData';
import { Users, ClipboardList, CheckCircle, Clock, ChevronRight, RefreshCw } from 'lucide-react';

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

  const getPillarStatus = (assessmentId, pillar) => {
    const pillarEvals = evaluations[assessmentId] || {};
    return pillarEvals[pillar] || null;
  };

  if (loading) {
    return (
      <div className="page-pad max-w-[1200px] mx-auto animate-fade text-center pt-20">
        <div className="text-technical-sm font-technical-sm text-surface-variant">Loading your dashboard...</div>
      </div>
    );
  }

  const role = userProfile?.role || 'individual';
  if (role !== 'evaluator' && role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
        <ClipboardList size={40} className="text-primary/40" />
        <div className="text-body-md font-label-md text-on-background">Evaluator access required</div>
        <div className="text-technical-sm font-technical-sm text-on-surface-variant">You don't have permission to view this page.</div>
      </div>
    );
  }

  return (
    <div className="page-pad max-w-[1200px] mx-auto animate-fade">
      {/* Header */}
      <section className="flex justify-between items-start mb-10 md:mb-16">
        <div>
          <div className="text-technical-sm font-technical-sm text-primary mb-2 uppercase tracking-[0.2em]">Evaluation</div>
          <h1 className="text-headline-md font-headline-md text-on-background page-headline">Evaluator Dashboard</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            {assignments.length > 0
              ? `${assignments.length} assigned student${assignments.length > 1 ? 's' : ''}`
              : 'No students assigned to you yet'}
          </p>
        </div>
        <button onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-technical-sm font-technical-sm border-[0.5px] border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent uppercase tracking-widest flex-shrink-0"
          style={{ borderRadius: '8px' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </section>

      {assignments.length === 0 ? (
        <div className="py-10 md:py-16 text-center border-[0.5px] border-outline-variant">
          <Users size={28} className="text-outline mx-auto mb-4 opacity-40" />
          <div className="text-label-md font-label-md text-on-background mb-1">No students assigned</div>
          <div className="text-technical-sm font-technical-sm text-surface-variant">
            Contact an admin to get assigned students to evaluate.
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {assignments.map(assignment => {
            const student = students[assignment.studentUid];
            const studentAssessments = assessments[assignment.studentUid] || [];
            const preCount = studentAssessments.filter(a => a.phase === 'pre').length;
            const postCount = studentAssessments.filter(a => a.phase === 'post').length;

            return (
              <div key={assignment.id} className="border-b-[0.5px] border-outline-variant group hover:bg-surface-container-low transition-colors">
                {/* Student header — not clickable, just info display */}
                <div className="h-14 md:h-16 flex items-center justify-between px-2">
                  <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                    <div className="size-8 flex items-center justify-center shrink-0 border-[0.5px] border-outline-variant text-technical-sm font-technical-sm text-primary bg-surface-container-low"
                      style={{ borderRadius: '8px' }}>
                      {(student?.name || student?.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-label-md font-label-md text-on-background truncate">{student?.name || 'Unnamed Student'}</div>
                      <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                        {student?.email || '—'}
                        {student?.context && <span> | {student.context}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                    <span className={`text-technical-sm font-technical-sm ${preCount > 0 ? 'text-primary' : 'text-outline'}`}>{preCount} Pre</span>
                    <span className={`text-technical-sm font-technical-sm ${postCount > 0 ? 'text-primary' : 'text-outline'}`}>{postCount} Post</span>
                  </div>
                </div>

                {/* Assessment list */}
                {studentAssessments.length > 0 && (
                  <div className="pb-2">
                    {studentAssessments.slice(0, 3).map(asm => (
                      <div
                        key={asm.id}
                        onClick={() => navigate(`/app/evaluator/assess/${asm.id}`, { state: { student, assessment: asm } })}
                        className="h-12 md:h-14 flex items-center justify-between border-b-[0.5px] border-outline-variant/50 hover:bg-surface-container-low transition-colors px-2 md:px-8 cursor-pointer touch-target"
                      >
                        <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                          <ClipboardList size={13} className="text-surface-variant flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-label-md font-label-md text-on-background truncate capitalize">
                              {asm.phase === 'pre' ? 'Pre-Intervention' : 'Post-Intervention'} Assessment
                            </div>
                            <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                              {asm.createdAt?.toDate?.()?.toLocaleDateString() || asm.timestamp ? new Date(asm.timestamp).toLocaleDateString() : 'No date'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                          <div className="flex gap-1">
                            {['EQ', 'SQ', 'AQ'].map(pillar => {
                              const ev = getPillarStatus(asm.id, pillar);
                              return (
                                <div key={pillar} className="size-[22px] flex items-center justify-center border-[0.5px]"
                                  style={{
                                    borderRadius: '6px',
                                    borderColor: ev ? '#ebc073' : '#4e4638',
                                    background: ev ? 'rgba(235,192,115,0.08)' : 'transparent'
                                  }}
                                  title={`${pillar}: ${ev ? 'Scored' : 'Pending'}`}>
                                  {ev
                                    ? <CheckCircle size={9} className="text-primary" />
                                    : <Clock size={9} className="text-outline" />
                                  }
                                </div>
                              );
                            })}
                          </div>
                          <ChevronRight size={14} className="text-surface-variant flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {studentAssessments.length === 0 && (
                  <div className="pb-2 px-2 md:px-8">
                    <div className="h-12 flex items-center text-technical-sm font-technical-sm text-surface-variant">
                      No assessments yet
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
