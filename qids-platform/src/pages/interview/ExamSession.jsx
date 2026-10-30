import usePageTitle from '../../lib/usePageTitle';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, CheckCircle, Clock, MonitorPlay,
  AlertCircle, Eye, ArrowRight, FileCheck, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { subscribeSession, updateInterviewSession } from '../../services/interviewService';
import { notifyInterviewResult } from '../../services/notificationService';
import { saveEnterpriseResult } from '../../services/firestoreService';
import { deployTier, deployedCount } from '../../core/runner/deploy';
import { modulesForTier } from '../../core/modes';
import { moduleComplete, isItemAnswered } from '../../core/runner/validate';
import {
  evaluateEnterpriseAssessment,
  scoreModule,
  sjtGroupPct,
  computeWorkStyleProfile,
} from '../../core/engine/moduleScoring';
import { computeInterviewResult } from '../../core/engine/interviewScoring';
import RunnerItems from '../enterprise/RunnerItems';
import useInterviewCall from '../../lib/useInterviewCall';
import VideoCallDock from '../../components/VideoCallDock';

// Assigned-battery exam (candidate side). The evaluator picks the tier
// (QGRA / QPIA / QLIA) in the interview setup; the candidate confirms on their
// dashboard and takes the full battery here from the QIDS item banks while the
// evaluator watches live. Same engines as the Talent runner — deployTier,
// module validation and evaluateEnterpriseAssessment — so scoring is identical
// and reproducible from the session's seed.
export default function ExamSession() {
  usePageTitle('Assigned exam');
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Proctored exam — same WebRTC plumbing as the live room, candidate side:
  // they answer the evaluator's offer as soon as it exists.
  const call = useInterviewCall({ sessionId, isEvaluator: false });
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    return subscribeSession(sessionId, s => {
      setSession(s);
      if (s?.examStartedAt) setStarted(true);
      if (s?.examResponses) setAnswers(prev => Object.keys(prev).length ? prev : s.examResponses);
      setLoading(false);
    }, () => setLoading(false));
  }, [sessionId]);

  const tier = session?.examTier || 'QGRA';
  // The seeded deployment reconstructs the exact paper from the banks; the
  // evaluator's watch view deploys the same seed so it mirrors screen-for-screen.
  // Sessions created before the seed field went live (or any doc without one)
  // fall back to the deterministic seed-0 paper — both sides fall back the same
  // way, so the mirror stays exact.
  const seed = typeof session?.examSeed === 'number' ? session.examSeed : 0;
  const deployed = useMemo(() => {
    if (!session) return null;
    return deployTier(tier, seed);
  }, [session?.examTier, seed]);
  const steps = useMemo(() => (deployed
    ? modulesForTier(tier)
      .filter(m => deployed[m.id]?.length)
      .map(m => ({ id: m.id, def: m, items: deployed[m.id] }))
    : []), [deployed, tier]);
  const current = steps.length ? steps[Math.min(stepIndex, steps.length - 1)] : null;
  const total = steps.reduce((s, x) => s + x.items.length, 0);
  const answered = steps.reduce((s, x) =>
    s + x.items.filter(it => isItemAnswered(it, answers[it.id])).length, 0);
  const allDone = total > 0 && answered >= total;

  const isCandidate = !!(session && user && session.candidateUid === user.uid);
  // The ready-up gate accepts BOTH pre-run states: an untouched invitation
  // ('invited') and one the candidate already confirmed from their dashboard
  // popup ('accepted'). Falling through to the runner view in the accepted-but-
  // unstarted case left candidates parked on a dead "Preparing…" screen.
  const canConfirm = isCandidate && ['invited', 'accepted'].includes(session?.status) && !session?.examStartedAt;
  const running = started && session?.status !== 'completed' && !!current;

  // ── Live mirror — progress + latest selection streamed to the evaluator's
  // watch view over the same session doc the live interview uses. Debounced;
  // every write is a candidate-surface field (rules-scoped).
  const lastWrite = useRef(0);
  const mirror = (nextAnswers, modIdx) => {
    if (!sessionId || !steps.length) return;
    const now = Date.now();
    if (now - lastWrite.current < 600) return;
    lastWrite.current = now;
    const step = steps[Math.min(modIdx, steps.length - 1)];
    const nextItem = step.items.find(it => !isItemAnswered(it, nextAnswers[it.id]));
    let lastText = '';
    if (nextItem) {
      const v = nextAnswers[nextItem.id];
      if (typeof v === 'number') lastText = nextItem.options[v] || '';
      else if (Array.isArray(v)) lastText = 'most/least marked';
    }
    updateInterviewSession(sessionId, {
      examResponses: nextAnswers,
      examProgress: {
        module: step.id,
        moduleLabel: step.def.label,
        itemIndex: nextItem ? step.items.indexOf(nextItem) : step.items.length,
        itemTotal: step.items.length,
        answered: steps.reduce((s, x) =>
          s + x.items.filter(it => isItemAnswered(it, nextAnswers[it.id])).length, 0),
        total,
        lastItemText: String(lastText).slice(0, 160),
        lastAt: Date.now(),
      },
    }).catch(e => console.warn('[exam-mirror] write failed:', e?.code || e?.message));
  };
  const onAnswer = (itemId, value) => {
    const next = { ...answers, [itemId]: value };
    setAnswers(next);
    mirror(next, stepIndex);
  };

  // Begin: accepted + started marker in one write (ready-up gate then run).
  const handleStart = async () => {
    setStarted(true);
    try {
      await updateInterviewSession(sessionId, {
        candidateAcceptedAt: new Date().toISOString(),
        examStartedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('[exam] ready-up write failed:', e?.code || e);
      toast('Could not confirm the start — check rules/connection and try again.', 'error');
    }
  };

  // Submit: engine-scored result → standard interview-report fields (so the
  // shared report page + PDF render the exam in the same design) + examSummary
  // (the exam-native scores) → enterprise result saved to the candidate →
  // notification. The session flips to completed and freezes.
  const handleSubmit = async () => {
    if (!allDone || submitting || !steps.length) return;
    setSubmitting(true);
    try {
      const intake = {
        name: session.candidateName || user?.displayName || '',
        email: session.candidateEmail || '',
        org: '',
      };
      const result = evaluateEnterpriseAssessment('enterprise', tier, deployed, answers, intake);
      // Deterministic module → rubric-dimension projection (1–5) so the shared
      // interview report renders the exam in its exact design language.
      const raws = {};
      for (const [m, items] of Object.entries(deployed)) {
        if (m === 'WS') continue;
        raws[m] = scoreModule(m, items, answers);
      }
      const sj = sjtGroupPct(deployed, answers);
      const wsMap = computeWorkStyleProfile(deployed.WS || [], answers);
      const pctOf = m => {
        const r = raws[m];
        return r && r.max > 0 ? r.raw / r.max : 0.5;
      };
      const clamp01 = x => Math.max(0, Math.min(1, x));
      const d5 = mix => Math.round((1 + 4 * clamp01(mix)) * 10) / 10;
      const wsVal = k => clamp01((wsMap?.[k] ?? 5) / 10);
      const merged = {
        Communication: d5(0.55 * wsVal('Communication') + 0.45 * sj.EQ / 100),
        ProblemSolving: d5(0.7 * pctOf('CR') + 0.3 * pctOf('ST')),
        Leadership: d5(raws.LR ? pctOf('LR') : 0.5 * sj.SQ / 100 + 0.5 * pctOf('DQ')),
        EmotionalIntelligence: d5(0.6 * pctOf('EI') + 0.4 * sj.EQ / 100),
        Adaptability: d5(pctOf('AQ')),
        Teamwork: d5(0.55 * wsVal('Ownership') + 0.45 * sj.SQ / 100),
        Integrity: d5(0.7 * pctOf('INT') + 0.3 * sj.Int / 100),
        CriticalThinking: d5(pctOf('CT')),
        Resilience: d5(0.6 * pctOf('AQ') + 0.4 * wsVal('Execution')),
      };
      const evaluatorAssessment = Object.entries(merged).map(([dimensionId, score]) => ({ dimensionId, score }));
      const interviewResult = computeInterviewResult({
        selfAssessment: undefined,
        evaluatorAssessment,
        mode: 'post',
      });
      await updateInterviewSession(sessionId, {
        evaluatorAssessment,
        mergedScores: interviewResult.mergedScores,
        pillarScores: interviewResult.pillarScores,
        unifiedScore: interviewResult.unifiedScore,
        grade: interviewResult.grade,
        skillShape: interviewResult.skillShape,
        careerProfile: interviewResult.careerProfile,
        examResponses: answers,
        examCompletedAt: new Date().toISOString(),
        examSummary: {
          tier,
          pii: result.pii ? {
            score: result.pii.score,
            rawComposite: result.pii.rawComposite,
            band: result.pii.band,
            label: result.pii.label,
          } : null,
          moduleScores: result.moduleScores || null,
          workStyle: result.workStyle || null,
          integrity: result.integrity || null,
          learningAgility: result.learningAgility || null,
          completedAt: new Date().toISOString(),
        },
        status: 'completed',
      }).catch(e => { throw e; });
      // Candidate's own assessment history gets the exam result too.
      try {
        const deployedIds = Object.fromEntries(
          Object.entries(deployed).map(([m, items]) => [m, items.map(i => i.id)]));
        await saveEnterpriseResult(user.uid, {
          mode: 'exam',
          tier,
          seed,
          deployedIds,
          answers,
          intake,
          assignedBy: session.evaluatorUid || null,
          examSessionId: sessionId,
          result,
        });
      } catch (e) {
        console.warn('[exam] enterprise-result save failed:', e?.code || e);
      }
      notifyInterviewResult({
        candidateUid: session.candidateUid || null,
        evaluatorUid: session.evaluatorUid,
        candidateName: session.candidateName,
        evaluatorName: session.evaluatorName,
        sessionId,
        mode: 'exam',
        examTier: tier,
      });
      toast('Exam submitted — result ready', 'success');
      call.stop();
    } catch (e) {
      console.error('[exam] submit failed:', e);
      toast(e?.code === 'permission-denied'
        ? 'Submit blocked by Firestore rules — update the interviewSessions rules block, then submit again.'
        : 'Submit failed — your answers are saved; try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
      <div className="card p-8"><div className="skeleton h-6 w-48 mb-4" /><div className="skeleton h-48 w-full" /></div>
    </div>;
  }
  if (!session) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
      <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
      <div className="text-body-md font-body-md text-surface-variant mb-6">Session not found.</div>
      <button onClick={() => navigate('/app/interviews')} className="btn-primary">Back to my interviews</button>
    </div>;
  }
  if (!isCandidate) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
      <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
      <div className="text-label-md font-label-md text-on-surface mb-2">Not your exam</div>
      <div className="text-technical-sm font-technical-sm text-surface-variant">Sign in as the assigned candidate to take it.</div>
    </div>;
  }
  if (session.mode !== 'exam') {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
      <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
      <div className="text-label-md font-label-md text-on-surface mb-2">This session is not an assigned exam.</div>
      <button onClick={() => navigate(`/app/interview/candidate/${sessionId}`)} className="btn-primary">Open the interview room instead</button>
    </div>;
  }

  // Completed: result moment (score + straight to the report).
  if (session.status === 'completed') {
    return <div className="page-pad max-w-[720px] mx-auto animate-fade py-16 text-center">
      <FileCheck size={32} className="text-primary mx-auto mb-4" />
      <div className="kicker mb-2">Assigned exam · {tier}</div>
      <h1 className="text-headline-md font-headline-md text-on-background mb-3">Exam submitted</h1>
      <p className="text-body-md text-on-surface-variant mb-6">
        Scored and delivered — your full report is ready.
      </p>
      {session.unifiedScore != null && <div className="grid grid-cols-2 gap-3 max-w-[320px] mx-auto mb-8">
        <div className="card px-3 py-4">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1">Score</div>
          <div className="text-headline-sm font-headline-sm text-on-background">{Math.round(session.unifiedScore)}</div>
        </div>
        <div className="card px-3 py-4">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1">Grade</div>
          <div className="text-headline-sm font-headline-sm text-on-background">{session.grade?.grade || '—'}</div>
        </div>
      </div>}
      <button onClick={() => navigate(`/app/interview/report/${sessionId}`)} className="btn-primary glow">
        Open the full report <ArrowRight size={14} className="ml-1 inline" />
      </button>
    </div>;
  }

  // ── Confirmation gate — same ready-up popup pattern as the live interview.
  if (canConfirm) {
    const tierMeta = { QGRA: 'Fresh Grade', QPIA: 'Lateral', QLIA: 'Leadership' }[tier] || tier;
    const mins = steps.reduce((s, x) => s + x.def.timeMin, 0);
    return <div className="page-pad max-w-[720px] mx-auto animate-fade py-16">
      <div className="card-gold p-8 md:p-12 text-center">
        <MonitorPlay size={30} className="text-primary mx-auto mb-4" />
        <div className="kicker mb-3">Assigned exam · {tier}</div>
        <h1 className="text-headline-lg font-headline-lg text-on-background mb-3">{tier} battery — {tierMeta}</h1>
        <p className="text-body-md font-body-md text-surface-variant mb-2 leading-relaxed max-w-[520px] mx-auto">
          <strong className="text-on-surface">{session.evaluatorName}</strong> assigned you this exam. It runs proctored — they can watch your video and your screen live while you take it.
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-[480px] mx-auto my-8">
          <div className="card px-3 py-4">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1.5">Questions</div>
            <div className="text-headline-sm font-headline-sm text-on-background">{total || '—'}</div>
          </div>
          <div className="card px-3 py-4">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1.5">Sections</div>
            <div className="text-headline-sm font-headline-sm text-on-background">{steps.length || '—'}</div>
          </div>
          <div className="card px-3 py-4">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1.5">Duration</div>
            <div className="text-headline-sm font-headline-sm text-on-background">~{mins || 35} min</div>
          </div>
        </div>
        <button onClick={handleStart} className="btn-primary glow w-full sm:w-auto">
          I'm ready — begin <ArrowRight size={14} className="ml-1 inline" />
        </button>
      </div>
    </div>;
  }

  // Auto-confirmed resumption (page reload mid-exam) — go straight to running.
  if (!running) {
    return <div className="page-pad max-w-[720px] mx-auto animate-fade py-16 text-center">
      <Clock size={28} className="text-surface-variant mx-auto mb-3" />
      <div className="text-label-md font-label-md text-on-surface mb-1">Preparing your exam…</div>
      <div className="text-technical-sm font-technical-sm text-surface-variant mb-6">
        The battery is loading. If this takes more than a few seconds, refresh the page.
      </div>
    </div>;
  }

  const modAnswered = current.items.filter(it => isItemAnswered(it, answers[it.id])).length;
  const modComplete = moduleComplete(current.def, current.items, answers);
  const lastStep = stepIndex === steps.length - 1;
  return <div className="page-pad max-w-[960px] mx-auto animate-fade pb-24">
    {/* Proctored video call — docked like the live room. */}
    <VideoCallDock call={call} role="candidate" />

    <section className="mb-6 flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div className="kicker mb-2 flex items-center gap-2">
          <MonitorPlay size={13} /> Assigned exam · {tier} · {session.evaluatorName}
        </div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{current.def.label}</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">{current.def.instructions}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Overall progress</div>
        <div className="text-headline-sm font-headline-sm text-on-background mono-numbers">{answered}<span className="text-surface-variant">/{total}</span></div>
        <div className="flex items-center gap-1.5 justify-end mt-1 text-technical-sm font-technical-sm text-surface-variant">
          <Eye size={11} /> evaluator watching live
        </div>
      </div>
    </section>

    {/* Step rail */}
    <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
      {steps.map((st, i) => {
        const done = moduleComplete(st.def, st.items, answers);
        const active = i === stepIndex;
        return <button key={st.id} onClick={() => setStepIndex(i)}
          className={`flex items-center gap-2 px-3 py-2 border-[0.5px] text-technical-sm font-technical-sm flex-shrink-0 cursor-pointer transition-all ${active ? 'border-primary/50 bg-primary/10 text-primary' : done ? 'border-outline-variant bg-surface-container-low text-surface-variant' : 'border-outline-variant text-surface-variant hover:border-primary/20'}`}
          title={st.def.label}>
          {done ? <CheckCircle size={11} className="text-primary" /> : <span className="w-1.5 h-1.5 rounded-full bg-surface-variant" />}
          {st.def.label}
        </button>;
      })}
    </div>

    <div className="card p-4 mb-6 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-2">{modAnswered} of {current.items.length} answered in this section</div>
        <div className="h-2 bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(modAnswered / current.items.length) * 100}%` }} />
        </div>
      </div>
      <span className="text-technical-sm font-technical-sm text-surface-variant flex items-center gap-1.5">
        <ShieldCheck size={12} /> answers save + stream as you go
      </span>
    </div>

    <RunnerItems module={current.def} items={current.items} answers={answers} onChange={onAnswer} />

    <div className="flex items-center justify-between gap-3 flex-wrap mt-10">
      <button onClick={() => setStepIndex(i => Math.max(0, i - 1))} disabled={stepIndex === 0} className="btn-outline flex items-center gap-2 disabled:opacity-40 cursor-pointer">
        <ChevronLeft size={14} /> Previous
      </button>
      {lastStep ? (
        <button onClick={handleSubmit} disabled={!allDone || submitting} className="btn-primary glow flex items-center gap-2 disabled:opacity-40 cursor-pointer">
          {submitting ? 'Scoring…' : allDone ? 'Submit exam' : `${total - answered} left to answer`} <CheckCircle size={14} />
        </button>
      ) : (
        <button onClick={() => setStepIndex(i => Math.min(steps.length - 1, i + 1))} className="btn-primary flex items-center gap-2 cursor-pointer">
          Next section <ChevronRight size={14} />
        </button>
      )}
    </div>
  </div>;
}
