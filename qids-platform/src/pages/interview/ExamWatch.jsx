import usePageTitle from '../../lib/usePageTitle';
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MonitorPlay, Eye, Clock, CheckCircle2, ArrowRight, AlertCircle,
  FileCheck, Users,
} from 'lucide-react';
import { subscribeSession } from '../../services/interviewService';
import { useAuth } from '../../context/AuthContext';
import { deployTier } from '../../core/runner/deploy';
import { modulesForTier } from '../../core/modes';
import { isItemAnswered } from '../../core/runner/validate';
import useInterviewCall from '../../lib/useInterviewCall';
import VideoCallDock from '../../components/VideoCallDock';

const TIER_LABELS = { QGRA: 'Fresh Grade', QPIA: 'Lateral', QLIA: 'Leadership' };

// Evaluator's live exam watch room — the assigned-exam counterpart of the
// live-interview room. One Firestore session doc powers both screens: the
// candidate's ExamSession streams progress + selections into examProgress /
// examResponses, this page mirrors them in real time, and the WebRTC call
// dock shows their camera alongside.
export default function ExamWatch() {
  usePageTitle('Exam watch');
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const call = useInterviewCall({ sessionId, isEvaluator: true });
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    return subscribeSession(sessionId, s => {
      setSession(s);
      setLoading(false);
    }, () => setLoading(false));
  }, [sessionId]);

  const tier = session?.examTier || 'QGRA';
  // Same seeded deployment the candidate is answering — so the watch view can
  // name the exact item/section they're on. Missing seed → the same seed-0
  // fallback the candidate side uses, so both screens show the same paper.
  const seed = typeof session?.examSeed === 'number' ? session.examSeed : 0;
  const steps = useMemo(() => {
    if (!session) return [];
    const d = deployTier(tier, seed);
    return modulesForTier(tier)
      .filter(m => d[m.id]?.length)
      .map(m => ({ id: m.id, def: m, items: d[m.id] }));
  }, [session?.examTier, seed]);
  const currentIdx = Math.max(0, steps.findIndex(s => s.id === session?.examProgress?.module));
  const currentStep = steps[currentIdx];

  const status = session?.status;
  const started = !!session?.examStartedAt;
  const waiting = status === 'invited' && !started;
  const running = started && status !== 'completed';
  const completed = status === 'completed';
  const prog = session?.examProgress || {};
  const answered = prog.answered ?? 0;
  const total = prog.total || steps.reduce((s, x) => s + x.items.length, 0) || 0;
  const pct = total ? Math.round((answered / total) * 100) : 0;

  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
      <div className="card p-8"><div className="skeleton h-6 w-48 mb-4" /><div className="skeleton h-48 w-full" /></div>
    </div>;
  }
  if (!session) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
      <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
      <div className="text-body-md font-body-md text-surface-variant mb-6">Exam session not found.</div>
      <button onClick={() => navigate('/app/interview')} className="btn-primary">Back to the studio</button>
    </div>;
  }
  if (session.mode !== 'exam') {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
      <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
      <div className="text-label-md font-label-md text-on-surface mb-2">This session is not an assigned exam.</div>
      <button onClick={() => navigate(status === 'completed' ? `/app/interview/report/${sessionId}` : `/app/interview/live/${sessionId}`)} className="btn-primary">Open the interview surface instead</button>
    </div>;
  }

  return <div className="page-pad max-w-[1120px] mx-auto animate-fade pb-24">
    <section className="mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="kicker mb-2 flex items-center gap-2">
          <MonitorPlay size={13} /> Assigned exam · {tier} · {TIER_LABELS[tier] || tier}
        </div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">
          {session.candidateName || 'Candidate'}
          {session.role && <span className="text-surface-variant font-body-md"> — {session.role}</span>}
        </h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-1">
          Proctored live view — their camera, their section, every selection as it lands.
        </p>
      </div>
      {completed && <button onClick={() => navigate(`/app/interview/report/${sessionId}`)} className="btn-primary glow flex items-center gap-2 flex-shrink-0">
          <FileCheck size={14} /> Open the report <ArrowRight size={14} />
        </button>}
    </section>

    <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
      {/* Call + watch status rail */}
      <div className="lg:sticky lg:top-6 space-y-5">
        <VideoCallDock call={call} role="evaluator" />
        <div className="card p-5">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-3 flex items-center gap-2">
            <Eye size={11} /> Exam state
          </div>
          {waiting && <span className="chip text-[11px]" style={{ background: 'var(--gold-tint)', color: 'var(--color-primary)', borderColor: 'var(--gold-line)' }}>WAITING TO CONFIRM</span>}
          {running && <span className="chip text-[11px]" style={{ background: 'color-mix(in srgb, var(--color-info) 12%, transparent)', color: 'var(--color-info)', borderColor: 'color-mix(in srgb, var(--color-info) 35%, transparent)' }}>IN PROGRESS</span>}
          {completed && <span className="chip text-[11px]" style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)', borderColor: 'color-mix(in srgb, var(--color-success) 35%, transparent)' }}>SUBMITTED</span>}
          <p className="text-body-sm font-body-sm text-on-surface-variant mt-3 leading-relaxed">
            {waiting
              ? `${session.candidateName || 'They'} got the invitation. The exam opens here the moment they confirm.`
              : running
                ? 'Everything they select streams in as they work.'
                : 'Exam complete — the full result is on the report.'}
          </p>
        </div>
      </div>

      {/* Live mirror panel */}
      <div className="space-y-5">
        {/* Progress */}
        <div className="card p-6">
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant">Battery progress</div>
            <div className="text-headline-sm font-headline-sm text-on-background mono-numbers">{answered}<span className="text-surface-variant">/{total || '—'}</span></div>
          </div>
          <div className="h-3 bg-surface-container-high overflow-hidden mb-2">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-technical-sm font-technical-sm text-surface-variant">{pct}% complete</div>
        </div>

        {/* Where they are right now */}
        <div className="card p-6">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-4 flex items-center gap-2">
            <Users size={11} /> Live activity
          </div>
          {running && currentStep ? <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0">
                  {currentIdx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-label-md font-label-md text-on-background">{currentStep.def.label}</div>
                  {prog.lastItemText
                    ? <div className="text-body-md font-body-md text-on-background mt-1">“{prog.lastItemText}”</div>
                    : <div className="text-body-md font-body-md text-on-surface-variant mt-1">Reading / choosing…</div>}
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-2 flex items-center gap-3 flex-wrap">
                    <span>Section item {Math.min((prog.itemIndex ?? 0) + 1, prog.itemTotal ?? currentStep.items.length)}/{prog.itemTotal ?? currentStep.items.length}</span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={10} />
                      {prog.lastAt ? `last activity ${new Date(prog.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'no activity logged yet'}
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-technical-sm font-technical-sm text-primary flex-shrink-0">
                  <span className="size-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)' }} /> LIVE
                </span>
              </div>
            : completed ? <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-success" />
                <div>
                  {session.unifiedScore != null
                    ? <div className="text-label-md font-label-md text-on-background">Scored {Math.round(session.unifiedScore)} · grade {session.grade?.grade || '—'}</div>
                    : <div className="text-label-md font-label-md text-on-background">Submitted</div>}
                  <div className="text-technical-sm font-technical-sm text-surface-variant">Open the report for the full write-up and the PDF download.</div>
                </div>
              </div>
            : <div className="text-body-md font-body-md text-on-surface-variant">
                Waiting for {session.candidateName || 'the candidate'} to confirm the exam on their dashboard.
              </div>}
        </div>

        {/* Section ticks */}
        {steps.length > 0 && <div className="card p-6">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-4">Sections</div>
            <div className="space-y-2.5">
              {steps.map((st, i) => {
                const doneCount = running || completed
                  ? (st.id === prog.module ? prog.answered ?? 0 : prog.answered ?? 0) // coarse per-section signal
                  : 0;
                void doneCount;
                const moduleAnswered = Math.max(0, Math.min(
                  st.items.length,
                  completed ? st.items.length : (st.id === prog.module ? prog.itemIndex ?? 0 : 0)));
                const isCurrent = running && st.id === prog.module;
                return <div key={st.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 border-[0.5px] ${isCurrent ? 'border-primary/40 bg-primary/5' : 'border-outline-variant/50'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-surface-container-high text-surface-variant text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className={`text-label-sm font-label-sm truncate ${isCurrent ? 'text-primary' : 'text-on-background'}`}>{st.def.label}</span>
                    </div>
                    <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">
                      {completed ? 'done' : isCurrent ? `${Math.min(moduleAnswered + 1, st.items.length)}/${st.items.length} on screen` : moduleAnswered === st.items.length ? 'done' : '—'}
                    </span>
                  </div>;
              })}
            </div>
          </div>}
      </div>
    </div>
  </div>;
}
