import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorAssignments, getUserAssessments, getAllEvaluations } from '../../services/firestoreService';
import { PILLARS } from '../../data/qidsData';
import { Users, ClipboardList, CheckCircle, Clock, ChevronRight, RefreshCw, Mail } from 'lucide-react';

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
      <div className="page-pad animate-fade max-w-[1000px] mx-auto text-center pt-20">
        <div className="text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>Loading your dashboard...</div>
      </div>
    );
  }

  const role = userProfile?.role || 'individual';
  if (role !== 'evaluator' && role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
        <ClipboardList size={40} className="text-[#ebc073]/40" />
        <div className="text-base font-semibold text-[#e5e2e1]">Evaluator access required</div>
        <div className="text-sm text-[#d1c5b3]">You don't have permission to view this page.</div>
      </div>
    );
  }

  return (
    <div className="page-pad animate-fade max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="text-technical-sm font-technical-sm text-[#ebc073] mb-2 uppercase tracking-[0.2em]">Evaluation</div>
          <h1 className="text-[28px] font-medium m-0" style={{ fontFamily: "'Avenir Next', sans-serif", letterSpacing: '-0.01em', color: '#e5e2e1' }}>Evaluator Dashboard</h1>
          <p className="text-[14px] mt-1.5 m-0" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>
            {assignments.length > 0
              ? `${assignments.length} assigned student${assignments.length > 1 ? 's' : ''}`
              : 'No students assigned to you yet'}
          </p>
        </div>
        <button onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] border-[0.5px] border-[#4e4638] text-[#d1c5b3] hover:text-[#ebc073] hover:border-[#ebc073] transition-all cursor-pointer bg-transparent uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '8px' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="border-[0.5px] border-[#4e4638] p-12 text-center">
          <Users size={28} className="text-[#9a8f7f] mb-3 mx-auto" />
          <div className="text-[13px] mb-1" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>No students assigned</div>
          <div className="text-[11px]" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>
            Contact an admin to get assigned students to evaluate.
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {assignments.map(assignment => {
            const student = students[assignment.studentUid];
            const studentAssessments = assessments[assignment.studentUid] || [];
            const preCount = studentAssessments.filter(a => a.phase === 'pre').length;
            const postCount = studentAssessments.filter(a => a.phase === 'post').length;

            return (
              <div key={assignment.id} className="border-[0.5px] border-[#4e4638]">
                {/* Student header */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b-[0.5px] border-[#4e4638]">
                  <div className="size-9 flex items-center justify-center shrink-0 border-[0.5px] border-[#4e4638] text-[12px] font-medium"
                    style={{ borderRadius: '8px', background: '#1c1b1b', color: '#ebc073', fontFamily: "'JetBrains Mono', monospace" }}>
                    {(student?.name || student?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{student?.name || 'Unnamed Student'}</div>
                    <div className="text-[11px] flex items-center gap-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>
                      <Mail size={9} /> {student?.email || '—'}
                      {student?.context && <span>| {student.context}</span>}
                    </div>
                  </div>
                  <div className="flex gap-3 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace', monospace" }}>
                    <span className={preCount > 0 ? 'text-[#ebc073]' : 'text-[#9a8f7f]'}>{preCount} Pre</span>
                    <span className={postCount > 0 ? 'text-[#ebc073]' : 'text-[#9a8f7f]'}>{postCount} Post</span>
                  </div>
                </div>

                {/* Assessment list */}
                <div className="p-3">
                  {studentAssessments.length === 0 ? (
                    <div className="p-6 text-center text-[11px]" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>
                      No assessments yet
                    </div>
                  ) : (
                    studentAssessments.slice(0, 3).map(asm => (
                      <div
                        key={asm.id}
                        onClick={() => navigate(`/app/evaluator/assess/${asm.id}`, { state: { student, assessment: asm } })}
                        className="flex items-center gap-2.5 px-3 py-2.5 mb-1.5 cursor-pointer border-[0.5px] border-transparent hover:border-[#4e4638] hover:bg-[#1c1b1b] transition-all"
                        style={{ borderRadius: '8px' }}
                      >
                        <div className="size-8 flex items-center justify-center shrink-0 border-[0.5px] border-[#4e4638]"
                          style={{ borderRadius: '8px' }}>
                          <ClipboardList size={13} className="text-[#9a8f7f]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium capitalize" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>
                            {asm.phase === 'pre' ? 'Pre-Intervention' : 'Post-Intervention'} Assessment
                          </div>
                          <div className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>
                            {asm.createdAt?.toDate?.()?.toLocaleDateString() || asm.timestamp ? new Date(asm.timestamp).toLocaleDateString() : 'No date'}
                          </div>
                        </div>

                        {/* Pillar status indicators */}
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
                                  ? <CheckCircle size={9} className="text-[#ebc073]" />
                                  : <Clock size={9} className="text-[#9a8f7f]" />
                                }
                              </div>
                            );
                          })}
                        </div>

                        <ChevronRight size={13} className="text-[#9a8f7f]" />
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
