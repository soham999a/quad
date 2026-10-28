import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorAssignments, getUserAssessments, getAllEvaluations } from '../../services/firestoreService';
import { getEvaluatorSessions } from '../../services/interviewService';
import { PILLARS } from '../../data/qidsData';
import { Users, ClipboardList, CheckCircle, Clock, ChevronRight, RefreshCw, UserCheck, Mic } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
export default function EvaluatorDashboard() {
  const {
    t
  } = useTranslation();
  usePageTitle('Evaluator');
  const {
    user,
    userProfile
  } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState({});
  const [assessments, setAssessments] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [interviews, setInterviews] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  // Come back to this tab after a student submits and the console shows their
  // new numbers without a manual refresh.
  useEffect(() => {
    const onFocus = () => { if (user) loadData(); };
    const onVisible = () => { if (document.visibilityState === 'visible' && user) loadData(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const loadData = async () => {
    setLoading(true);
    const assigns = await getEvaluatorAssignments(user.uid);
    setAssignments(assigns);
    // My interviews at a glance: one fetch, then folded per student so every
    // row knows what state its interview is in (invited / in progress / done).
    let sessions = [];
    try {
      sessions = await getEvaluatorSessions(user.uid);
    } catch {
      sessions = [];
    }
    // Newest session per candidate wins (Firestore Timestamps compare by
    // toMillis, not by string, so sort first and keep the first hit).
    const timeValue = s => s?.updatedAt?.toMillis?.() || s?.createdAt?.toMillis?.() || 0;
    const sorted = [...sessions].sort((a, b) => timeValue(b) - timeValue(a));
    const interviewMap = {};
    for (const s of sorted) {
      if (!s.candidateUid) continue;
      if (!interviewMap[s.candidateUid]) interviewMap[s.candidateUid] = s;
    }
    setInterviews(interviewMap);
    const studentMap = {};
    const assessmentMap = {};
    const evalMap = {};
    for (const a of assigns) {
      try {
        const snap = await getDoc(doc(db, 'users', a.studentUid));
        if (snap.exists()) studentMap[a.studentUid] = snap.data();
      } catch (e) {
        console.warn('Failed to load user doc', e);
      }
      const userAssessments = await getUserAssessments(a.studentUid);
      assessmentMap[a.studentUid] = userAssessments;
      for (const asm of userAssessments) {
        // Scoped to this evaluator: an unscoped query can't satisfy the
        // evaluations read rule, so it used to fail silently and every rubric
        // tick read "Pending" forever.
        const evals = await getAllEvaluations(asm.id, { evaluatorUid: user.uid });
        evalMap[asm.id] = evals.reduce((acc, e) => ({
          ...acc,
          [e.pillar]: e
        }), {});
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
  // Interview status folded per student: live states first, newest session wins.
  const interviewStats = Object.values(interviews).reduce((acc, s) => {
    if (['invited', 'accepted', 'in_progress'].includes(s.status)) acc.active += 1;
    if (s.status === 'completed') acc.done += 1;
    return acc;
  }, {
    active: 0, done: 0
  });
  const interviewChip = studentUid => {
    const s = interviews[studentUid];
    if (!s) return null;
    const labels = {
      invited: { label: 'INVITED — AWAITING CONFIRM', cls: 'text-gold' },
      accepted: { label: 'CONFIRMED — READY TO BEGIN', cls: 'text-primary' },
      in_progress: { label: `LIVE · Q${(s.liveQuestionIndex ?? 0) + 1}`, cls: 'text-primary' },
      scheduled: { label: s.selfAssessment?.length ? 'SELF-ASSESSED' : 'AWAITING SELF-ASSESSMENT', cls: s.selfAssessment?.length ? 'text-primary' : 'text-outline' },
      completed: { label: 'INTERVIEW DONE', cls: 'text-primary' },
      declined: { label: 'DECLINED', cls: 'text-outline' },
      cancelled: { label: 'CANCELLED', cls: 'text-outline' },
    };
    const info = labels[s.status] || { label: (s.status || 'UNKNOWN').toUpperCase(), cls: 'text-outline' };
    return { id: s.id, status: s.status, mode: s.mode, ...info };
  };
  if (loading) {
    return <div className="page-pad max-w-[1280px] mx-auto animate-fade text-center pt-20">
        <div className="text-technical-sm font-technical-sm text-surface-variant">{t("EvaluatorDashboard.loading_your_dashboard")}</div>
      </div>;
  }
  const role = userProfile?.role || 'individual';
  if (role !== 'evaluator' && role !== 'admin') {
    return <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
        <ClipboardList size={40} className="text-primary/40" />
        <div className="text-body-md font-label-md text-on-background">{t("EvaluatorDashboard.evaluator_access_required")}</div>
        <div className="text-technical-sm font-technical-sm text-on-surface-variant">{t("EvaluatorDashboard.you_don_t_have")}</div>
      </div>;
  }
  return <div className="page-pad max-w-[1280px] mx-auto animate-fade">
      {/* Header */}
      <section className="flex justify-between items-start mb-10 md:mb-16">
        <div>
          <div className="text-technical-sm font-technical-sm text-primary mb-2 uppercase tracking-[0.2em]">{t("EvaluatorDashboard.evaluation")}</div>
          <h1 className="text-headline-md font-headline-md text-on-background page-headline">{t("EvaluatorDashboard.evaluator_dashboard")}</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            {assignments.length > 0
              ? `${assignments.length} assigned ${assignments.length > 1 ? 'people' : 'person'}${interviewStats.active > 0 ? ` · ${interviewStats.active} interview${interviewStats.active > 1 ? 's' : ''} in flight` : ''}`
              : 'No students assigned to you yet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/interview')} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-technical-sm font-technical-sm bg-primary/10 border-[0.5px] border-primary/30 text-primary hover:bg-primary/15 transition-all cursor-pointer uppercase tracking-widest flex-shrink-0" style={{
          borderRadius: '8px'
        }}>
            <UserCheck size={12} />{t("EvaluatorDashboard.interview_studio")}</button>
          <button onClick={loadData} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-technical-sm font-technical-sm border-[0.5px] border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent uppercase tracking-widest flex-shrink-0" style={{
          borderRadius: '8px'
        }}>
            <RefreshCw size={12} />{t("EvaluatorDashboard.refresh")}</button>
        </div>
      </section>

      {assignments.length === 0 ? <EmptyState icon={Users} title={t("EvaluatorDashboard.no_students_assigned")} description="Contact an admin to get assigned students to evaluate." /> : <div className="flex flex-col">
          {assignments.map(assignment => {
        
        const student = students[assignment.studentUid];
        // /users is owner-or-admin read only, so a name may not be readable
        // here; the assignment carries the student's own display name.
        const studentName = student?.name || student?.email || assignment.studentName || '';
        const studentAssessments = assessments[assignment.studentUid] || [];
        const preAssessments = studentAssessments.filter(a => a.phase === 'pre');
        const postAssessments = studentAssessments.filter(a => a.phase === 'post');
        const preCount = preAssessments.length;
        const postCount = postAssessments.length;
        const phases = [{
          id: 'pre',
          label: 'Pre-Intervention',
          list: preAssessments
        }, {
          id: 'post',
          label: 'Post-Intervention',
          list: postAssessments
        }];
        // Latest interview this evaluator has with this person (active or done).
        const interviewStatusChip = interviewChip(assignment.studentUid);
        // What this person is actually doing right now: their most recent
        // result, the numbers on it, and what you still owe them.
        const latest = studentAssessments[0] || null;
        const pendingRubrics = latest
          ? ['EQ', 'SQ', 'AQ'].filter(p => !getPillarStatus(latest.id, p)).length
          : 0;
        const latestPillars = latest?.pillarScores || {};
        const latestDate = latest?.createdAt?.toDate?.() || (latest?.timestamp ? new Date(latest.timestamp) : null);
        return <div key={assignment.id} className="border-b-[0.5px] border-outline-variant group hover:bg-surface-container-low transition-colors">
                {/* Student header — not clickable, just info display */}
                <div className="h-14 md:h-16 flex items-center justify-between px-2">
                  <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                    <div className="size-8 flex items-center justify-center shrink-0 border-[0.5px] border-outline-variant text-technical-sm font-technical-sm text-primary bg-surface-container-low" style={{
                borderRadius: '8px'
              }}>
                      {(studentName || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-label-md font-label-md text-on-background truncate">{studentName || 'Unnamed Student'}</div>
                      <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                        {student?.email || '—'}
                        {student?.context && <span> | {student.context}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                    <span className={`text-technical-sm font-technical-sm ${preCount > 0 ? 'text-primary' : 'text-outline'}`}>{preCount} Pre</span>
                    <span className={`text-technical-sm font-technical-sm ${postCount > 0 ? 'text-primary' : 'text-outline'}`}>{postCount} Post</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const st = interviewStatusChip;
                        if (st && ['invited', 'accepted', 'in_progress', 'scheduled'].includes(st.status)) {
                          navigate(st.mode === 'live' ? `/app/interview/live/${st.id}` : `/app/interview/scoring/${st.id}`);
                        } else if (st && st.status === 'completed') {
                          navigate(`/app/interview/report/${st.id}`);
                        } else {
                          navigate(`/app/interview/setup?candidateUid=${assignment.studentUid}&candidateName=${encodeURIComponent(studentName)}`);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-technical-sm font-technical-sm border-[0.5px] border-outline-variant text-on-surface-variant hover:text-gold hover:border-gold/50 transition-all cursor-pointer bg-transparent uppercase tracking-widest flex-shrink-0"
                      style={{
                        borderRadius: '6px'
                      }}
                      title="Start or resume an interview with this person"
                    >
                      <Mic size={11} />{interviewStatusChip ? 'Interview' : 'Run interview'}
                    </button>
                  </div>
                </div>
                {/* Interview status strip */}
                {interviewStatusChip && (
                  <div className="px-2 md:px-8 pb-2 pt-1 flex items-center gap-2">
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${interviewStatusChip.cls}`}>{interviewStatusChip.label}</span>
                  </div>
                )}

                {/* What this person is actually doing: latest result, its
                    numbers, and what is still waiting on this evaluator. */}
                <div className="px-2 md:px-8 pb-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  {latest ? (
                    <>
                      <span className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant">
                        <span className="uppercase tracking-[0.18em] text-primary">{latest.phase === 'post' ? 'Post' : 'Pre'}</span>
                        {latestDate ? latestDate.toLocaleDateString() : 'No date'}
                      </span>
                      {['IQ', 'EQ', 'SQ', 'AQ'].map(p => (
                        <span key={p} className="flex items-baseline gap-1 text-technical-sm font-technical-sm">
                          <span className="text-surface-variant uppercase tracking-widest">{p}</span>
                          <span className="mono-numbers text-on-background">{Math.round(latestPillars[p] ?? 0)}</span>
                        </span>
                      ))}
                      {latest.result?.grade && (
                        <span className="text-technical-sm font-technical-sm text-surface-variant">
                          Grade <strong className="text-primary">{latest.result.grade}</strong>
                        </span>
                      )}
                      {pendingRubrics > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-technical-sm font-technical-sm text-gold uppercase tracking-widest">
                          <Clock size={10} /> {pendingRubrics} rubric{pendingRubrics > 1 ? 's' : ''} pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-technical-sm font-technical-sm text-primary uppercase tracking-widest">
                          <CheckCircle size={10} /> all rubrics scored
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-technical-sm font-technical-sm text-surface-variant">
                      Nothing submitted yet — they'll appear here the moment their first assessment lands.
                    </span>
                  )}
                </div>

                {/* Assessment list, grouped by phase */}
                {preAssessments.length + postAssessments.length > 0 && <div className="pb-2">
                    {phases.map(ph => {
              if (ph.list.length === 0) return null;
              return <div key={ph.id}>
                          <div className="px-2 md:px-8 py-2 text-technical-sm font-technical-sm text-primary uppercase tracking-[0.2em]">
                            {ph.label}
                          </div>
                          {ph.list.map(asm => <div key={asm.id} onClick={() => navigate(`/app/evaluator/assess/${asm.id}`, {
                  state: {
                    student,
                    assessment: asm
                  }
                })} className="h-12 md:h-14 flex items-center justify-between border-b-[0.5px] border-outline-variant/50 hover:bg-surface-container-low transition-colors px-2 md:px-8 cursor-pointer touch-target">
                              <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                                <ClipboardList size={13} className="text-surface-variant flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-label-md font-label-md text-on-background truncate">{t("EvaluatorDashboard.assessment")}</div>
                                  <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                                    {asm.createdAt?.toDate?.()?.toLocaleDateString() || asm.timestamp ? new Date(asm.timestamp).toLocaleDateString() : 'No date'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                                <div className="flex gap-1">
                                  {['EQ', 'SQ', 'AQ'].map(pillar => {
                        const ev = getPillarStatus(asm.id, pillar);
                        return <div key={pillar} className="size-[22px] flex items-center justify-center border-[0.5px]" style={{
                          borderRadius: '6px',
                          borderColor: ev ? 'var(--gold)' : 'var(--bone-line)',
                          background: ev ? 'var(--gold-tint)' : 'transparent'
                        }} title={`${pillar}: ${ev ? 'Scored' : 'Pending'}`}>
                                        {ev ? <CheckCircle size={9} className="text-primary" /> : <Clock size={9} className="text-outline" />}
                                      </div>;
                      })}
                                </div>
                                <ChevronRight size={14} className="text-surface-variant flex-shrink-0" />
                              </div>
                            </div>)}
                        </div>;
            })}
                  </div>}

                {studentAssessments.length === 0 && <div className="pb-2 px-2 md:px-8">
                    <div className="h-12 flex items-center text-technical-sm font-technical-sm text-surface-variant">{t("EvaluatorDashboard.no_assessments_yet")}</div>
                  </div>}
              </div>;
      })}
        </div>}
    </div>;
}