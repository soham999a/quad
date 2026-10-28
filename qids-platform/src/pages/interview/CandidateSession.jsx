import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeSession, updateInterviewSession } from '../../services/interviewService';
import { LIVE_QUESTIONS, RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { Mic, Clock, Send, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * CandidateSession — the candidate's side of the two-screen interview.
 *
 * Live mode real-time spine: the candidate's screen mirrors whatever the
 * evaluator is on (the session doc's liveQuestionIndex), and the candidate's
 * typed answer streams straight back to the evaluator's scoring view via
 * candidateResponses. Nothing here can touch scores — Firestore rules scope
 * candidate writes to selfAssessment/candidateResponses/ready-up only.
 *
 * Post mode: the candidate's self-assessment (1–5 + note per dimension), the
 * surface the 60/40 merge engine has been waiting for since day one.
 *
 * Completed: report handoff. Declined/cancelled: honest terminal states.
 */
export default function CandidateSession() {
  const { sessionId } = useParams();
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notOwner, setNotOwner] = useState(false);
  // Drafts are keyed by question so moving to the next question never carries
  // the previous answer's text along with it.
  const [drafts, setDrafts] = useState({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [syncedAt, setSyncedAt] = useState(null);
  const [selfScores, setSelfScores] = useState({});
  const [selfNotes, setSelfNotes] = useState({});
  const [selfIdx, setSelfIdx] = useState(0);
  const [savingSelf, setSavingSelf] = useState(false);

  const role = userProfile?.role || 'individual';
  const candidateEligible = role === 'individual' || role === 'student'
    || role === 'evaluator' || role === 'employer' || role === 'admin';

  useEffect(() => {
    if (!sessionId || !user || !candidateEligible) return () => {};
    return subscribeSession(sessionId, s => {
      setSession(s);
      // Not this candidate's session — show the honest error state.
      if (s && s.candidateUid && s.candidateUid !== user.uid) setNotOwner(true);
      if (s?.selfAssessment) {
        const map = {};
        const notes = {};
        s.selfAssessment.forEach(e => { map[e.dimensionId] = e.score; notes[e.dimensionId] = e.notes || ''; });
        setSelfScores(map);
        setSelfNotes(notes);
      }
      setLoading(false);
    }, () => { setLoading(false); toast('Failed to load session', 'error'); });
  }, [sessionId, user, candidateEligible]);

  const candidateResponses = session?.candidateResponses || {};
  const isLive = session?.mode === 'live';
  // MUST match the evaluator's expression exactly. The evaluator falls back to
  // LIVE_QUESTIONS, so when a session carries fewer than 4 AI questions the two
  // screens used to disagree: the evaluator ran off the standard bank while the
  // candidate rendered `null` and sat on the "Interview is running…" placeholder
  // with no question, no mirror and no textarea. Same bank, same truth.
  const questionBank = (session?.liveQuestions?.length >= 4 ? session.liveQuestions : LIVE_QUESTIONS);
  const currentIdx = session?.liveQuestionIndex ?? 0;
  const currentQuestion = isLive && questionBank ? questionBank[Math.min(currentIdx, questionBank.length - 1)] : null;
  const myResponsesTyped = new Set(Object.keys(candidateResponses).filter(k => candidateResponses[k]?.response));

  const saveDraft = async (qId = currentQuestion?.id, { quiet = false } = {}) => {
    if (!qId || !session) return;
    const text = drafts[qId];
    if (text == null) return;
    setSavingDraft(true);
    try {
      // Whole-map merge keeps the write a single affected field path, which
      // is exactly what the field-scoped rules allow a candidate to patch.
      const next = { ...candidateResponses };
      next[qId] = { response: text, at: new Date().toISOString() };
      await updateInterviewSession(sessionId, { candidateResponses: next });
      setSyncedAt(Date.now());
      if (!quiet) toast('Answer synced to your evaluator', 'success');
    } catch {
      if (!quiet) toast('Sync failed — check your connection', 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  // Stream the current answer to the evaluator while the interview is running.
  // Debounced so typing doesn't cost a write per keystroke; the explicit
  // "Sync to evaluator" button stays as an immediate flush.
  const currentDraft = currentQuestion ? drafts[currentQuestion.id] : undefined;
  const currentSaved = currentQuestion ? (candidateResponses[currentQuestion.id]?.response || '') : '';
  useEffect(() => {
    if (!currentQuestion || currentDraft == null || currentDraft === currentSaved) return undefined;
    const timer = setTimeout(() => { saveDraft(currentQuestion.id, { quiet: true }); }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraft, currentQuestion?.id, currentSaved]);

  const selfSubmit = async () => {
    if (!session || savingSelf) return;
    const scored = RUBRIC_DIMENSIONS.filter(d => selfScores[d.id] > 0);
    if (scored.length === 0) {
      toast('Score at least one dimension first', 'error');
      return;
    }
    setSavingSelf(true);
    try {
      const selfAssessment = RUBRIC_DIMENSIONS
        .filter(d => selfScores[d.id] > 0)
        .map(d => ({
          dimensionId: d.id,
          score: selfScores[d.id],
          notes: selfNotes[d.id] || '',
        }));
      await updateInterviewSession(sessionId, { selfAssessment });
      toast('Self-assessment submitted — your evaluator will score next', 'success');
    } catch {
      toast('Submit failed', 'error');
    } finally {
      setSavingSelf(false);
    }
  };

  const readyUp = async () => {
    if (!session) return;
    try {
      await updateInterviewSession(sessionId, {
        status: 'accepted',
        candidateAcceptedAt: new Date().toISOString(),
      });
    } catch {
      toast('Could not confirm — try again', 'error');
    }
  };

  if (!candidateEligible || !user) {
    return <div className="page-pad max-w-[720px] mx-auto py-20 text-center">
      <Mic size={32} className="text-surface-variant mx-auto mb-3" />
      <p className="text-body-md text-on-surface-variant">Interviews are available to platform users on the individual and student journeys.</p>
    </div>;
  }

  if (loading) return <div className="page-pad max-w-[720px] mx-auto py-20 text-center">
    <div className="skeleton h-40 w-full" />
  </div>;

  if (notOwner || !session) {
    return <div className="page-pad max-w-[720px] mx-auto py-20 text-center">
      <Mic size={32} className="text-surface-variant mx-auto mb-3" />
      <p className="text-label-md font-label-md text-on-background mb-2">Interview not available</p>
      <p className="text-body-sm text-surface-variant mb-6">This session doesn't exist or isn't yours.</p>
      <Link to="/app/interviews" className="btn-primary inline-flex items-center gap-2">My interviews <ArrowRight size={13} /></Link>
    </div>;
  }

  const evaluatorName = session.evaluatorName || 'Your evaluator';

  // ── Terminal states ────────────────────────────────────────────────────────
  if (session.status === 'completed') {
    return <div className="page-pad max-w-[720px] mx-auto py-16 text-center">
      <CheckCircle2 size={36} className="text-primary mx-auto mb-4" />
      <div className="kicker mb-2">Interview complete</div>
      <h1 className="text-headline-md font-headline-md text-on-background mb-4">Your result is ready</h1>
      <p className="text-body-md text-on-surface-variant mb-8">
        {evaluatorName} finished scoring your {isLive ? 'live' : ''} interview.
      </p>
      <Link to={`/app/interview/report/${sessionId}`} className="btn-primary inline-flex items-center gap-2">
        Open my report <ArrowRight size={13} />
      </Link>
    </div>;
  }

  if (session.status === 'declined' || session.status === 'cancelled') {
    return <div className="page-pad max-w-[720px] mx-auto py-16 text-center">
      <Mic size={32} className="text-surface-variant mx-auto mb-3" />
      <p className="text-label-md text-on-background mb-2">This interview {session.status === 'declined' ? 'was declined' : 'was cancelled'}.</p>
      <Link to="/app/interviews" className="btn-outline inline-flex items-center gap-2 mt-4">My interviews <ArrowRight size={13} /></Link>
    </div>;
  }

  // ── Ready-up gate (arrived via deep-link without accepting the modal) ─────
  if (session.status === 'invited') {
    return <div className="page-pad max-w-[720px] mx-auto animate-fade">
      <div className="card p-8 md:p-10 text-center">
        <div className="kicker mb-3">Interview invitation</div>
        <h1 className="text-headline-md font-headline-md text-on-background mb-4">{evaluatorName} wants to interview you</h1>
        <p className="text-body-md text-on-surface-variant mb-8 max-w-[480px] mx-auto">
          Your screen will mirror the questions in real time while you answer verbally. Nothing starts until you confirm.
        </p>
        <button onClick={readyUp} className="btn-primary inline-flex items-center gap-2">
          I'm ready <ArrowRight size={13} />
        </button>
      </div>
    </div>;
  }

  // ── Waiting for the evaluator (confirmed, not started yet) ────────────────
  if (isLive && session.status === 'accepted') {
    return <div className="page-pad max-w-[720px] mx-auto animate-fade">
      <div className="card p-8 md:p-10 text-center">
        <div className="kicker mb-3 text-gold">Confirmed</div>
        <h1 className="text-headline-md font-headline-md text-on-background mb-2">Waiting for {evaluatorName} to begin</h1>
        <p className="text-body-md text-on-surface-variant mb-8 max-w-[460px] mx-auto">
          Stay on this page — your screen will mirror the interview the moment it starts.
        </p>
        <div className="flex items-center justify-center gap-2 text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest animate-pulse">
          <Clock size={13} /> live sync active
        </div>
      </div>
    </div>;
  }

  // ── Live in-progress: mirror + typing ──────────────────────────────────────
  if (isLive && session.status === 'in_progress') {
    if (!currentQuestion) {
      return <div className="page-pad max-w-[720px] mx-auto py-20 text-center">
        <p className="text-body-md text-on-surface-variant">Interview is running…</p>
      </div>;
    }
    const dim = RUBRIC_MAP[currentQuestion.dimension];
    const myAnswer = candidateResponses[currentQuestion.id]?.response || '';
    return <div className="page-pad max-w-[720px] mx-auto animate-fade">
      <div className="mb-8">
        <div className="kicker mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" style={{ background: 'var(--gold)' }} />
          Interview in progress
        </div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{currentQuestion.text}</h1>
        {currentQuestion.context && <p className="text-body-sm text-surface-variant mt-2">{currentQuestion.context}</p>}
      </div>

      <div className="card p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant">
            {dim ? dim.label : 'Question'} · answer with your voice, take your notes here
          </div>
          <div className="text-technical-sm font-technical-sm text-surface-variant mono-numbers">
            {currentIdx + 1}/{questionBank.length}
          </div>
        </div>
        <textarea
          value={drafts[currentQuestion.id] ?? myAnswer}
          onChange={e => setDrafts(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
          placeholder="Type your key points as you speak — your evaluator sees these live…"
          rows={4}
          className="input-field w-full resize-none"
        />
        <div className="flex items-center justify-between mt-3 gap-3">
          <span className="text-technical-sm font-technical-sm text-surface-variant">
            {/* Syncing state is honest: typing streams to the evaluator after a
                short pause, the button forces it immediately. */}
            {savingDraft
              ? 'Sending your notes…'
              : syncedAt
                ? 'Synced — your evaluator can see this'
                : `Synced answers: ${myResponsesTyped.size}`}
          </span>
          <button onClick={() => saveDraft()} disabled={savingDraft} className="btn-primary inline-flex items-center gap-2 cursor-pointer disabled:opacity-60">
            <Send size={12} /> {savingDraft ? 'Syncing…' : 'Sync to evaluator'}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-3">Your interviewer is scoring</div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          Speak naturally. When the next question appears here, answer it. {evaluatorName} scores each dimension as you go.
        </p>
      </div>
    </div>;
  }

  // ── Post mode: the candidate's self-assessment ─────────────────────────────
  // Accepted belongs here too: confirming a post-mode interview means "start my
  // self-assessment", not "wait for a live room".
  const selfSubmitted = (session.selfAssessment?.length || 0) > 0;
  if (!isLive && ['scheduled', 'accepted', 'in_progress'].includes(session.status)) {
    const dim = RUBRIC_DIMENSIONS[Math.min(selfIdx, RUBRIC_DIMENSIONS.length - 1)];
    const doneCount = RUBRIC_DIMENSIONS.filter(d => selfScores[d.id] > 0).length;
    const allDone = doneCount === RUBRIC_DIMENSIONS.length;
    return <div className="page-pad max-w-[720px] mx-auto animate-fade">
      <div className="mb-8">
        <div className="kicker mb-3">Self-assessment</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">How do you see yourself?</h1>
        <p className="text-body-md text-on-surface-variant mt-2">
          Rate yourself first — {evaluatorName} scores independently afterwards and the two views are merged (60% you / 40% them).
        </p>
      </div>

      <div className="card p-6 md:p-8">
        {selfSubmitted && (
          <div className="flex items-start gap-2.5 border-[0.5px] border-primary/30 bg-primary/5 px-3.5 py-3 mb-5" style={{ borderRadius: '6px' }}>
            <CheckCircle2 size={14} className="text-primary flex-shrink-0 mt-0.5" />
            <span className="text-body-sm font-body-sm text-on-surface-variant">
              Self-assessment submitted. You can still revise it until {evaluatorName} finishes scoring.
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-primary">{doneCount}/{RUBRIC_DIMENSIONS.length} scored</div>
          <div className="text-technical-sm font-technical-sm text-surface-variant mono-numbers">{selfIdx + 1} of {RUBRIC_DIMENSIONS.length}</div>
        </div>
        <div className="text-label-md font-label-md text-on-background mb-1">{dim.label}</div>
        <div className="text-body-sm text-on-surface-variant mb-4">{dim.description}</div>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setSelfScores(prev => ({ ...prev, [dim.id]: v }))}
              aria-pressed={selfScores[dim.id] === v}
              aria-label={`${v} of 5`}
              className={`flex-1 py-2.5 border-[0.5px] text-technical-sm font-technical-sm cursor-pointer transition-all ${selfScores[dim.id] === v ? 'border-primary/60 bg-primary/10 text-primary' : 'border-outline-variant text-surface-variant hover:border-primary/30 hover:text-on-background bg-transparent'}`}
              style={{ borderRadius: '6px' }}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="text-technical-sm font-technical-sm text-surface-variant leading-relaxed mb-4 min-h-[36px]">
          {(RUBRIC_MAP[dim.id]?.descriptors || {})[selfScores[dim.id]] || `Level 1–5 · 3 means solid and honest, don't inflate`}
        </div>

        <textarea
          value={selfNotes[dim.id] || ''}
          onChange={e => setSelfNotes(prev => ({ ...prev, [dim.id]: e.target.value }))}
          placeholder="Why this level? One honest line is enough (optional)…"
          rows={2}
          className="input-field w-full resize-none mb-5"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelfIdx(i => Math.max(0, i - 1))}
            disabled={selfIdx === 0}
            className="btn-outline cursor-pointer disabled:opacity-40"
          >
            Back
          </button>
          {selfIdx < RUBRIC_DIMENSIONS.length - 1 ? (
            <button type="button" onClick={() => setSelfIdx(i => Math.min(RUBRIC_DIMENSIONS.length - 1, i + 1))} className="btn-primary inline-flex items-center gap-2 cursor-pointer">
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button type="button" onClick={selfSubmit} disabled={!allDone || savingSelf} className="btn-primary inline-flex items-center gap-2 cursor-pointer disabled:opacity-50">
              <Send size={12} /> {allDone ? (savingSelf ? 'Submitting…' : 'Submit self-assessment') : `Score all ${RUBRIC_DIMENSIONS.length} first`}
            </button>
          )}
        </div>
      </div>
    </div>;
  }

  // Unrecognised state — never lie about it.
  return <div className="page-pad max-w-[720px] mx-auto py-16 text-center">
    <p className="text-body-md text-on-surface-variant">Interview status: {session.status || 'unknown'}.</p>
    <Link to="/app/interviews" className="btn-outline inline-flex items-center gap-2 mt-4">My interviews <ArrowRight size={13} /></Link>
  </div>;
}
