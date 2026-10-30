import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { removeAssignment, subscribeEvaluatorAssignments, subscribeEvaluationsByEvaluator, subscribeUserAssessments } from '../../services/firestoreService';
import { subscribeSessionsForEvaluator } from '../../services/interviewService';
import { Users, ClipboardList, CheckCircle, Clock, ChevronRight, UserCheck, Mic, UserX } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
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
  const toast = useToast();
  const [assignments, setAssignments] = useState([]);
  // Tracks an in-flight unlink so a double click can't fire two writes.
  const [removingUid, setRemovingUid] = useState(null);
  // Everything below arrives through live snapshots — no fetch-on-load.
  const [assessments, setAssessments] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [interviews, setInterviews] = useState({});
  const [loading, setLoading] = useState(true);

  // Unlink a person from this evaluator. Soft delete (`active: false`) on
  // purpose: the assignment doc carries the historical name/id the rest of the
  // console reads, and re-linking later must not have to recreate it. Rules
  // scope this write to evaluators/admins, so it can only ever be the
  // evaluator's own list. The service returns a boolean rather than throwing,
  // so it MUST be checked — callers elsewhere used to optimistically clear
  // local state and toast success on a denied write.
  const handleRemove = async (assignment) => {
    if (!user || removingUid) return;
    const name = assignment.studentName || 'this person';
    if (!window.confirm(`Remove ${name} from your list? Their assessments and scores stay intact — you just stop seeing them here.`)) return;
    setRemovingUid(assignment.studentUid);
    const ok = await removeAssignment(user.uid, assignment.studentUid);
    if (ok) {
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      toast(`${name} removed from your list`, 'success');
    } else {
      toast('Could not remove them — check your connection and try again', 'error');
    }
    setRemovingUid(null);
  };

  // The whole console is live: four snapshot listeners cover everything —
  // assignments, this evaluator's interview sessions, every rubric they
  // recorded, plus one assessments listener per assigned student. A student
  // submitting a battery, confirming an interview, or advancing a live
  // question lands on this page the instant it happens — on any device,
  // with no refresh. Manual refetching died with the old loadData().
  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    const assignCache = { v: [] };
    const sessCache = { v: [] };
    const assessCache = {};
    const evalCache = {};
    let unsubStudents = [];

    const push = () => {
      // Newest session per candidate wins (Firestore Timestamps compare by
      // toMillis, not by string, so sort first and keep the first hit).
      const timeValue = s => s?.updatedAt?.toMillis?.() || s?.createdAt?.toMillis?.() || 0;
      const sorted = [...sessCache.v].sort((a, b) => timeValue(b) - timeValue(a));
      const interviewMap = {};
      for (const s of sorted) {
        if (!s.candidateUid) continue;
        if (!interviewMap[s.candidateUid]) interviewMap[s.candidateUid] = s;
      }
      setInterviews(interviewMap);
      setAssessments({ ...assessCache });
      setEvaluations({ ...evalCache });
      setAssignments(assignCache.v);
      setLoading(false);
    };

    // One assessments listener per assigned student; rewired whenever the
    // assignment list changes (a new link adds a name, an unlink drops one).
    const wireStudents = () => {
      unsubStudents.forEach(u => u());
      unsubStudents = assignCache.v.map(a =>
        subscribeUserAssessments(a.studentUid, v => {
          assessCache[a.studentUid] = v;
          push();
        }));
    };

    const unsubs = [
      subscribeEvaluatorAssignments(user.uid, v => {
        assignCache.v = v;
        wireStudents();
        push();
      }),
      subscribeSessionsForEvaluator(user.uid, v => {
        sessCache.v = v;
        push();
      }),
      // Scoped to this evaluator by design: the evaluations rules only let the
      // recorder read their own scores, so a single `evaluatorUid ==` query is
      // one listener covering every rubric tick across every student.
      subscribeEvaluationsByEvaluator(user.uid, list => {
        for (const k of Object.keys(evalCache)) delete evalCache[k];
        for (const e of list) {
          (evalCache[e.assessmentId] ||= {})[e.pillar] = e;
        }
        push();
      }),
    ];

    return () => {
      unsubs.forEach(u => u());
      unsubStudents.forEach(u => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
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
    if (s.mode === 'exam') {
      const labels = {
        invited: { label: 'EXAM — AWAITING CONFIRM', cls: 'text-gold' },
        accepted: { label: 'EXAM CONFIRMED', cls: 'text-primary' },
        in_progress: { label: `EXAM LIVE · ${(s.examProgress?.answered ?? 0)}/${s.examProgress?.total ?? '?'}`, cls: 'text-primary' },
        completed: { label: 'EXAM DONE', cls: 'text-primary' },
      };
      const info = labels[s.status] || { label: (s.status || 'UNKNOWN').toUpperCase(), cls: 'text-outline' };
      return { id: s.id, status: s.status, mode: s.mode, ...info };
    }
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
  // /users is owner-or-admin read only, so the assignment row itself carries
  // the display name — derived straight from the live assignments instead of
  // the doomed per-student user-doc fetch the old version ran.
  const students = {};
  for (const a of assignments) {
    if (!students[a.studentUid]) {
      students[a.studentUid] = { name: a.studentName || '', email: a.studentEmail || '' };
    }
  }

  // Work-queue ordering, recomputed on every live update: people who are
  // waiting on this evaluator float to the top — unpaid rubrics first, then
  // interviews waiting on a go/no-go, everything else stays in link order.
  const workScore = studentUid => {
    const list = assessments[studentUid] || [];
    const latest = list[0] || null;
    const pending = latest
      ? ['EQ', 'SQ', 'AQ'].filter(p => !(evaluations[latest.id] || {})[p]).length
      : 0;
    const session = interviews[studentUid];
    const waiting = session && ['invited', 'accepted', 'in_progress'].includes(session.status) ? 2 : 0;
    const scheduled = session && session.status === 'scheduled' ? 1 : 0;
    return (pending > 0 ? 4 : 0) + waiting + scheduled;
  };
  const rankedAssignments = [...assignments].sort((a, b) => workScore(b.studentUid) - workScore(a.studentUid));

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
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-technical-sm font-technical-sm border-[0.5px] border-outline-variant text-on-surface-variant uppercase tracking-widest flex-shrink-0" style={{
          borderRadius: '8px'
        }} title="This console updates in real time — no refresh needed">
            <span className="size-1.5 rounded-full" style={{ background: 'var(--color-success)' }} />LIVE
          </span>
        </div>
      </section>

      {assignments.length === 0 ? <EmptyState icon={Users} title={t("EvaluatorDashboard.no_students_assigned")} description="Contact an admin to get assigned students to evaluate." /> : <div className="flex flex-col">
          {rankedAssignments.map(assignment => {
        
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
                          navigate(st.mode === 'exam' ? `/app/interview/exam-watch/${st.id}`
                            : st.mode === 'live' ? `/app/interview/live/${st.id}` : `/app/interview/scoring/${st.id}`);
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
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRemove(assignment); }}
                      disabled={removingUid === assignment.studentUid}
                      aria-label={`Remove ${studentName || 'this person'} from your list`}
                      title="Remove from your list — their data stays intact"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-technical-sm font-technical-sm border-[0.5px] border-outline-variant text-surface-variant hover:text-error hover:border-error/50 transition-all cursor-pointer bg-transparent uppercase tracking-widest flex-shrink-0 disabled:opacity-50 disabled:cursor-wait"
                      style={{
                      borderRadius: '6px'
                    }}
                    >
                      <UserX size={11} />{removingUid === assignment.studentUid ? 'Removing' : 'Remove'}
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