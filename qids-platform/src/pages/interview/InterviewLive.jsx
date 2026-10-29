import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInterviewSession, updateInterviewSession, subscribeSession } from '../../services/interviewService';
import { notifyInterviewResult } from '../../services/notificationService';
import { computeInterviewResult } from '../../core/engine/interviewScoring';
import { LIVE_QUESTIONS, RUBRIC_MAP } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { Play, Pause, ChevronRight, ChevronLeft, CheckCircle, Clock } from 'lucide-react';
import useInterviewCall from '../../lib/useInterviewCall';
import VideoCallDock from '../../components/VideoCallDock';
export default function InterviewLive() {
  const {
    t
  } = useTranslation();
  usePageTitle('Live interview');
  const {
    sessionId
  } = useParams();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidateLive, setCandidateLive] = useState(null);
  // Video & audio (WebRTC) — the Meet-style call that rides alongside the
  // question flow. The evaluator is the caller: their offer goes out on join.
  const call = useInterviewCall({ sessionId, isEvaluator: true });
  // Set instead of navigating straight to the report. Finishing an interview
  // deserves a visible ending: the evaluator sees what they just produced and
  // chooses when to move on, rather than the page vanishing behind a toast.
  const [finished, setFinished] = useState(null);
  // Ending the interview ends the call — no dangling media stream after the
  // closing screen, and no mic left hot on the evaluator's machine.
  useEffect(() => {
    if (session?.status === 'completed') call.stop();
  }, [session?.status, call]);
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getInterviewSession(sessionId).then(s => {
      setSession(s);
      setQuestionIdx(s?.liveQuestionIndex || 0);
      // Full resume: saved progress carries the scores, notes and the wall
      // clock. Without this the evaluator would come back to blank state and
      // re-score blindly while the timer restarts from zero.
      const restored = { scores: {}, notes: {} };
      for (const r of s?.liveResponses || []) {
        if (r?.questionId) {
          if (r.score != null) restored.scores[r.questionId] = r.score;
          if (r.response) restored.notes[r.questionId] = r.response;
        }
      }
      setScores(restored.scores);
      setNotes(restored.notes);
      setElapsed(Number.isFinite(s?.elapsedSeconds) ? s.elapsedSeconds : 0);
    }).catch(() => toast('Failed to load session', 'error')).finally(() => setLoading(false));
  }, [sessionId]);

  // Timer — only while the interview is genuinely running (candidate ready or
  // already in progress). Waiting states must not burn the wall clock.
  useEffect(() => {
    if (!session || paused) return;
    if (!['accepted', 'in_progress'].includes(session.status)) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.id, session?.status, paused]);

  // Candidate live-sync: when the session has a platform-user candidate,
  // mirror their ready-up state, typed answers and question position in real
  // time — the two-screen experience over one Firestore doc.
  useEffect(() => {
    if (!session?.candidateUid || session.status === 'completed') return undefined;
    return subscribeSession(session.id, s => {
      if (!s) return;
      setCandidateLive({
        responses: s.candidateResponses || {},
        status: s.status,
      });
    });
  }, [session?.id, session?.candidateUid, session?.status]);
  // Question bank: session-specific AI questions when present, else the
  // standard bank (now the spec's Page-7 interview guide bank). Rubric map
  // still drives dimension labels/descriptors.
  const questionBank = (session?.liveQuestions?.length >= 4 ? session.liveQuestions : LIVE_QUESTIONS);
  const currentQuestion = questionBank[questionIdx];
  const currentDim = currentQuestion ? RUBRIC_MAP[currentQuestion.dimension] : null;
  const totalQuestions = questionBank.length;
  const answeredCount = Object.keys(scores).length;
  const isComplete = answeredCount === totalQuestions && Object.values(scores).every(s => s > 0);
  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const handleScore = (qId, score) => {
    setScores(prev => ({
      ...prev,
      [qId]: score
    }));
  };
  const handleNotes = (qId, text) => {
    setNotes(prev => ({
      ...prev,
      [qId]: text
    }));
  };
  const handleSaveProgress = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await updateInterviewSession(session.id, {
        liveQuestionIndex: questionIdx,
        elapsedSeconds: elapsed,
        liveResponses: questionBank.map(q => ({
          questionId: q.id,
          questionText: q.text,
          dimension: q.dimension,
          response: notes[q.id] || '',
          score: scores[q.id] || null
        }))
      });
      toast('Progress saved', 'success');
    } catch (e) {
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleComplete = async () => {
    if (!session || !isComplete) return;
    setSaving(true);
    try {
      // Build evaluator assessment from live scores — aggregated over the
      // ACTUAL question bank (AI-generated when present), not the static
      // bank. The old loop over LIVE_QUESTIONS silently dropped every answer
      // outside the static ids and bucketed reused ids under the static
      // bank's dimension, so AI sessions completed wrong or half-empty.
      const dimScores = {};
      const dimNotes = {};
      questionBank.forEach(q => {
        const score = scores[q.id];
        if (score != null) {
          if (!dimScores[q.dimension]) { dimScores[q.dimension] = []; dimNotes[q.dimension] = []; }
          dimScores[q.dimension].push(score);
          if (notes[q.id]) dimNotes[q.dimension].push(notes[q.id]);
        }
      });
      const evaluatorAssessment = Object.entries(dimScores).map(([dimId, dimScoreList]) => ({
        dimensionId: dimId,
        score: Math.round(dimScoreList.reduce((a, b) => a + b, 0) / dimScoreList.length),
        notes: dimNotes[dimId].filter(Boolean).join(' · ')
      }));
      const result = computeInterviewResult({
        selfAssessment: undefined,
        evaluatorAssessment,
        mode: 'live'
      });
      await updateInterviewSession(session.id, {
        evaluatorAssessment,
        liveQuestionIndex: questionIdx,
        elapsedSeconds: elapsed,
        liveResponses: questionBank.map(q => ({
          questionId: q.id,
          questionText: q.text,
          dimension: q.dimension,
          response: notes[q.id] || '',
          score: scores[q.id] || null
        })),
        mergedScores: result.mergedScores,
        pillarScores: result.pillarScores,
        unifiedScore: result.unifiedScore,
        grade: result.grade,
        skillShape: result.skillShape,
        careerProfile: result.careerProfile,
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      toast('Interview completed!', 'success');
      setFinished({
        unifiedScore: result.unifiedScore,
        grade: result.grade,
        scored: evaluatorAssessment.length,
        total: questionBank.length,
        minutes: Math.round(elapsed / 60),
      });
      // Bell the named parties. Usually just the evaluator themselves since
      // candidates are external (name/email on the session doc). Fire-and-
      // forget: a failed notification must never block the report.
      notifyInterviewResult({
        candidateUid: session.candidateUid || null,
        evaluatorUid: session.evaluatorUid,
        candidateName: session.candidateName,
        evaluatorName: session.evaluatorName,
        sessionId: session.id,
        mode: session.mode || 'live',
      });
      // The ending screen below owns the next step — no silent redirect.
    } catch (e) {
      console.error('Complete failed:', e);
      toast('Failed to complete', 'error');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>;
  }
  if (!session) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <div className="text-body-md font-body-md text-surface-variant">{t("InterviewLive.session_not_found")}</div>
        <button onClick={() => navigate('/app/interview')} className="btn-primary mt-6">{t("InterviewLive.back_to_dashboard")}</button>
      </div>;
  }

  // ── The ending moment ────────────────────────────────────────────────────
  // Saved, scored, notified — now close the loop in front of the evaluator
  // instead of teleporting them to a report they didn't ask to open yet.
  if (finished) {
    return <div className="page-pad max-w-[720px] mx-auto py-16 text-center animate-fade">
        <CheckCircle size={36} className="text-primary mx-auto mb-4" />
        <div className="kicker mb-2">Interview ended</div>
        <h1 className="text-headline-md font-headline-md text-on-background mb-4">Session complete</h1>
        <p className="text-body-md text-on-surface-variant mb-8 max-w-[520px] mx-auto leading-relaxed">
          {session.candidateName || 'Your candidate'}'s live interview is scored and closed.
          Their report is ready and they've been notified.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-[480px] mx-auto mb-8">
          {[
            { label: 'SCORE', value: finished.unifiedScore != null ? Math.round(finished.unifiedScore) : '—' },
            { label: 'GRADE', value: finished.grade?.grade || '—' },
            { label: 'SCORED', value: `${finished.scored}/${finished.total}` },
          ].map(s => (
            <div key={s.label} className="card px-3 py-4">
              <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1.5">{s.label}</div>
              <div className="text-headline-sm font-headline-sm text-on-background mono-numbers">{s.value}</div>
            </div>
          ))}
        </div>

        {finished.minutes > 0 && (
          <p className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-8 flex items-center justify-center gap-1.5">
            <Clock size={11} /> {finished.minutes} minute session
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate(`/app/interview/report/${session.id}`)} className="btn-primary glow inline-flex items-center gap-2 cursor-pointer">
            Open the report <ChevronRight size={14} />
          </button>
          <button onClick={() => navigate('/app/interview')} className="btn-outline cursor-pointer">
            {t("InterviewLive.back_to_dashboard")}
          </button>
        </div>
      </div>;
  }

  // ── Ready-up gate (candidate participated flow) ────────────────────────────
  // While the candidate hasn't accepted, the session is parked. The rules
  // prevent the evaluator from jumping to in_progress before their
  // candidateAcceptedAt exists — so this state is honest, not cosmetic.
  const effectiveStatus = candidateLive?.status || session.status;

  // Every question move is written to the session doc so the candidate's
  // screen advances with the evaluator in real time — the live mirror. This
  // used to live only in local state, which meant the candidate saw question 1
  // forever until the evaluator happened to press Save. Best-effort: a failed
  // position sync must never block the interview itself.
  const persistPosition = idx => {
    if (!session?.id) return;
    updateInterviewSession(session.id, { liveQuestionIndex: idx }).catch(() => { /* offline — local state still moves */ });
  };
  const goTo = idx => {
    const next = Math.max(0, Math.min(totalQuestions - 1, idx));
    setQuestionIdx(next);
    persistPosition(next);
  };
  const beginInterview = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateInterviewSession(session.id, { status: 'in_progress', liveQuestionIndex: questionIdx });
      toast('Interview started — the candidate\'s screen is now mirroring yours', 'success');
    } catch {
      toast('Could not start the interview — check your connection', 'error');
    } finally {
      setSaving(false);
    }
  };
  if (session.candidateUid && effectiveStatus === 'invited') {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8 md:p-10 text-center">
          <div className="kicker mb-3 text-gold">Interview invited</div>
          <h1 className="text-headline-md font-headline-md text-on-background mb-2">Waiting for {session.candidateName || 'your candidate'} to confirm</h1>
          <p className="text-body-md text-on-surface-variant max-w-[480px] mx-auto">
            {session.candidateName || 'They'} has been notified — their dashboard shows a confirmation now. This screen unlocks the moment they're ready.
          </p>
          <button onClick={() => navigate('/app/interview')} className="btn-outline mt-8">{t("InterviewLive.back_to_dashboard")}</button>
        </div>
      </div>;
  }

  // Confirmed by the candidate but not started: give the evaluator an explicit
  // start. This is the write that flips the candidate's waiting screen into
  // the live mirror, so it belongs to a human decision, not to page load.
  if (session.candidateUid && session.mode === 'live' && effectiveStatus === 'accepted') {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8 md:p-10 text-center">
          <div className="kicker mb-3 text-primary">Candidate confirmed</div>
          <h1 className="text-headline-md font-headline-md text-on-background mb-3">
            {session.candidateName || 'Your candidate'} is ready
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-[520px] mx-auto">
            Their screen is live and waiting. When you begin, every question you move to appears on their screen instantly, and the notes they type come back to you here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button onClick={beginInterview} disabled={saving} className="btn-primary glow inline-flex items-center gap-2 cursor-pointer disabled:opacity-60">
              {saving ? 'Starting…' : 'Begin interview'} <ChevronRight size={14} />
            </button>
            <button onClick={() => navigate('/app/interview')} className="btn-outline cursor-pointer">{t("InterviewLive.back_to_dashboard")}</button>
          </div>
        </div>
      </div>;
  }

  const candidateConfirmed = !!session.candidateUid && effectiveStatus === 'in_progress';
  const candidateAnswer = candidateLive?.responses?.[currentQuestion?.id]?.response || '';

  // The live runner itself — also the view the evaluator returns to mid-flight.
  // Two lanes: the question flow on the left, the video/audio dock pinned to
  // the right — the Meet-style conference view lives with the scoring, not in
  // a separate tab.
  const renderRunner = () => <div className="page-pad max-w-[1240px] mx-auto animate-fade">
      <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
      {/* Candidate confirmed banner — the two-screen moment of truth */}
      {candidateConfirmed && <div className="flex items-center justify-between px-4 py-3 mb-8 border-[0.5px] border-primary/30 bg-primary/5" style={{
        borderRadius: '6px'
      }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle size={14} className="text-primary flex-shrink-0" />
            <span className="text-body-sm font-body-sm text-on-surface-variant min-w-0">
              <strong className="text-on-background">{session.candidateName || 'Your candidate'}</strong> is confirmed — start when you're ready. Their screen mirrors yours live.
            </span>
          </div>
          <span className="text-technical-sm font-technical-sm uppercase tracking-widest text-primary flex-shrink-0">live sync active</span>
        </div>}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="kicker mb-2">{t("InterviewLive.live_interview")}</div>
          <h1 className="text-headline-sm font-headline-sm text-on-background">
            {session.candidateName || 'Candidate'}
          </h1>
          {session.role && <div className="text-body-sm font-body-sm text-surface-variant">{session.role}</div>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border-[0.5px] border-outline-variant">
            <Clock size={14} className="text-primary" />
            <span className="text-technical-sm font-technical-sm text-on-surface tabular-nums">{formatTime(elapsed)}</span>
          </div>
          <div className="text-technical-sm font-technical-sm text-surface-variant">
            {answeredCount}/{totalQuestions}
          </div>
          <button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume timer' : 'Pause timer'} title={paused ? 'Resume' : 'Pause'} className="flex items-center gap-2 px-3 py-2 bg-surface-container-high border-[0.5px] border-outline-variant text-body-sm font-body-sm text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="h-1 bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{
          width: `${questionIdx / totalQuestions * 100}%`
        }} />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && <div className="card p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="chip text-[10px]" style={{
          background: 'var(--gold-tint)',
          color: 'var(--color-primary)',
          borderColor: 'var(--gold-line)'
        }}>
              Q{questionIdx + 1}/{totalQuestions}
            </span>
            {currentDim && <span className="text-technical-sm font-technical-sm text-primary">{currentDim.label}</span>}
          </div>

          <div className="text-body-lg font-body-lg text-on-background mb-4 leading-relaxed">
            {currentQuestion.text}
          </div>

          {currentQuestion.context && <div className="text-body-sm font-body-sm text-surface-variant italic mb-6">
              {currentQuestion.context}
            </div>}

          {/* Score Buttons */}
          <div className="mb-6">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("InterviewLive.rating")}</div>
            <div className="grid grid-cols-5 gap-2 max-w-[400px]">
              {[1, 2, 3, 4, 5].map(score => <button key={score} onClick={() => handleScore(currentQuestion.id, score)} className={`p-3 text-center border-[0.5px] transition-all cursor-pointer ${scores[currentQuestion.id] === score ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/20'}`}>
                  <div className="text-[20px] font-technical-sm">{score}</div>
                  <div className="text-technical-sm font-technical-sm mt-1">
                    {['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][score]}
                  </div>
                </button>)}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-2 block">{t("InterviewLive.notes_optional")}</label>
            <textarea value={notes[currentQuestion.id] || ''} onChange={e => handleNotes(currentQuestion.id, e.target.value)} placeholder={t("InterviewLive.observations_about_the_candidate")} rows={2} className="input-field w-full resize-none" />
          </div>

          {/* Live candidate answer — typed by the candidate on their own screen */}
          {session.candidateUid && (
            <div className="mb-6">
              <div className="text-technical-sm font-technical-sm text-gold uppercase tracking-widest mb-2">Candidate's live notes</div>
              {candidateAnswer
                ? <div className="bg-surface-container-low p-3 border-[0.5px] border-gold/30 text-body-sm font-body-sm text-on-surface leading-relaxed whitespace-pre-wrap" style={{ borderRadius: '6px' }}>{candidateAnswer}</div>
                : <div className="text-technical-sm font-technical-sm text-surface-variant italic">{candidateConfirmed || effectiveStatus === 'in_progress' ? 'Nothing typed yet for this question — they answer out loud, so watch for their notes.' : 'The candidate hasn\'t confirmed yet.'}</div>}
            </div>
          )}

          {/* Probe bank — follow-up probe + strong/weak anchors, PIP page 7 */}
          {(currentQuestion.followUp || currentQuestion.strong || currentQuestion.weak) && (
            <div className="mt-4 bg-surface-container-low border-[0.5px] border-outline-variant p-4" style={{ borderRadius: '6px' }}>
              <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-2">Interview guide</div>
              {currentQuestion.followUp && <div className="text-body-sm font-body-sm text-on-surface-variant mb-3 leading-relaxed">
                <span className="text-primary uppercase tracking-widest text-technical-sm font-technical-sm mr-2">Probe →</span>{currentQuestion.followUp}
              </div>}
              {(currentQuestion.strong || currentQuestion.weak) && <div className="grid sm:grid-cols-2 gap-3">
                  {currentQuestion.strong && <div className="p-3 border-[0.5px]" style={{ borderColor: 'color-mix(in srgb, var(--color-success) 35%, transparent)', background: 'color-mix(in srgb, var(--color-success) 7%, transparent)', borderRadius: '6px' }}>
                    <div className="text-technical-sm font-technical-sm uppercase tracking-widest mb-1" style={{ color: 'var(--color-success)' }}>Strong answer</div>
                    <div className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">{currentQuestion.strong}</div>
                  </div>}
                  {currentQuestion.weak && <div className="p-3 border-[0.5px]" style={{ borderColor: 'color-mix(in srgb, var(--color-error, #e5484d) 35%, transparent)', background: 'color-mix(in srgb, var(--color-error, #e5484d) 7%, transparent)', borderRadius: '6px' }}>
                    <div className="text-technical-sm font-technical-sm uppercase tracking-widest mb-1" style={{ color: 'var(--color-error, #e5484d)' }}>Weak answer</div>
                    <div className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">{currentQuestion.weak}</div>
                  </div>}
                </div>}
            </div>
          )}
        </div>}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => goTo(questionIdx - 1)} disabled={questionIdx === 0} className="btn-outline flex items-center gap-2 disabled:opacity-30">
          <ChevronLeft size={14} />{t("InterviewLive.previous")}</button>
        <div className="flex gap-3">
          <button onClick={handleSaveProgress} disabled={saving} className="btn-outline">{t("InterviewLive.save")}</button>
          {isComplete && <button onClick={handleComplete} disabled={saving} className="btn-primary glow flex items-center gap-2">
              <CheckCircle size={14} />{t("InterviewLive.complete")}</button>}
        </div>
        <button onClick={() => goTo(questionIdx + 1)} disabled={questionIdx === totalQuestions - 1} className="btn-outline flex items-center gap-2 disabled:opacity-30">{t("InterviewLive.next")}<ChevronRight size={14} />
        </button>
      </div>
      </div>{/* left lane */}

      {/* Right lane — the call, pinned while the scoring flows on the left */}
      <div className="lg:w-[340px] flex-shrink-0">
        <div className="lg:sticky lg:top-6">
          <VideoCallDock call={call} role="evaluator" />
        </div>
      </div>
      </div>{/* two-lane wrapper */}
    </div>;
  return renderRunner();
}