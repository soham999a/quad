import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeSessionsForCandidate, updateInterviewSession } from '../services/interviewService';

/**
 * CandidateInterviewModal — the ready-up gate, mounted inside AppShell so it
 * can appear on ANY page. It listens live (Firestore onSnapshot) for sessions
 * where the signed-in user is the candidate and the evaluator closed the
 * invite: the moment the evaluator runs an interview against them, a modal
 * materialises on whatever screen they are on.
 *
 * Ready-up discipline: nothing starts until the candidate confirms. "I'M
 * READY" flips the session to 'accepted' (candidate-legal under the field-
 * scoped rules) and puts them straight into the live candidate view. "Later"
 * dismisses for the session via localStorage, so the modal never nags twice.
 */
export default function CandidateInterviewModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return new Set(JSON.parse(window.localStorage.getItem('qids-interview-dismissals') || '[]')); }
    catch { return new Set(); }
  });
  const [busy, setBusy] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeSessionsForCandidate(user.uid, list => {
      setSessions(list.filter(s => s.status === 'invited'));
    });
  }, [user]);

  // The one invited session to surface (skip the ones dismissed by hand).
  const active = sessions.find(s => !dismissed.has(s.id)) || null;

  const dismiss = () => {
    if (!active) return;
    setDismissed(prev => {
      const next = new Set([...prev, active.id]);
      try { window.localStorage.setItem('qids-interview-dismissals', JSON.stringify([...next])); } catch { /* best-effort */ }
      return next;
    });
  };

  useEffect(() => {
    if (!active) return undefined;
    const onEsc = (e) => { if (e.key === 'Escape') dismiss(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  });

  const accept = async () => {
    if (!active || busy) return;
    setBusy(true);
    try {
      await updateInterviewSession(active.id, { status: 'accepted', candidateAcceptedAt: new Date().toISOString() });
      navigate(`/app/interview/candidate/${active.id}`);
    } catch {
      // Rules deny / offline — surface via bell navigation instead of blocking.
      navigate(`/app/interview/candidate/${active.id}`);
    } finally {
      setBusy(false);
    }
  };

  if (!user || !active) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: 'color-mix(in oklab, var(--background) 72%, transparent)' }}
      onClick={dismiss}
    >
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label="Interview invitation"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[520px] border border-sidebar-border bg-surface-container-lowest p-7 animate-fade relative cursor-default"
        style={{ boxShadow: '0 24px 72px color-mix(in oklab, var(--background) 60%, transparent)' }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss invitation"
          className="absolute right-4 top-4 w-8 h-8 inline-flex items-center justify-center border border-outline-variant text-muted-foreground hover:text-on-background bg-transparent cursor-pointer transition-colors"
          style={{ borderRadius: '6px' }}
        >
          <X size={13} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <span className="w-10 h-10 flex items-center justify-center border-[0.5px] border-primary/30 bg-primary/10">
            <Mic size={16} className="text-primary" />
          </span>
          <div>
            <div className="text-technical-sm font-technical-sm uppercase tracking-[0.2em] text-gold mb-0.5">Interview invitation</div>
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant">
              {active.mode === 'live' ? 'Live interview' : 'Assessment interview'}
            </div>
          </div>
        </div>

        <p className="text-body-md font-body-md text-on-background mb-2 leading-relaxed">
          {active.evaluatorName || 'Your evaluator'} wants to run an interview with you.
        </p>
        <p className="text-body-sm font-body-sm text-on-surface-variant mb-6 leading-relaxed">
          {active.mode === 'live'
            ? 'Your screen will mirror the questions in real time while you answer verbally. Your typed notes stay visible to your evaluator.'
            : 'Complete your self-assessment first — your scores are merged with the evaluator\'s rubric when they finish.'}
          {' '}Nine rubric dimensions — Communication, Problem-Solving, EQ, Adaptability and more — will be scored.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={accept}
            disabled={busy}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {busy ? 'Entering…' : 'I\'m ready'} <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="btn-outline inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
