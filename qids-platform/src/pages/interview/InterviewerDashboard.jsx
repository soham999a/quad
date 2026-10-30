import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorSessions, enforceSessionRetention, deleteInterviewSession } from '../../services/interviewService';
import { calibrationNudge } from '../../core/engine/interviewCalibration';
import { ClipboardList, Users, Clock, CheckCircle, Plus, ChevronRight, ChevronLeft, RotateCcw, Play, FileText, Filter, Trash2, AlertTriangle } from 'lucide-react';
import SeedInterviewData from '../../components/SeedInterviewData';
import { reportError } from '../../lib/errorReport';
// Human labels — "ACCEPTED" meant nothing to a client scanning for what to do
// next. Match the vocabulary the candidate's screen already uses.
const STATUS_LABELS = {
  invited: 'AWAITING CONFIRM',
  accepted: 'CONFIRMED — READY',
  in_progress: 'LIVE',
  scheduled: 'SCHEDULED',
  completed: 'DONE',
  declined: 'DECLINED',
  cancelled: 'CANCELLED',
};
const STATUS_STYLES = {
  scheduled: {
    bg: 'var(--gold-tint)',
    color: 'var(--color-primary)',
    border: 'var(--gold-line)'
  },
  in_progress: {
    bg: 'color-mix(in srgb, var(--color-info) 12%, transparent)',
    color: 'var(--color-info)',
    border: 'color-mix(in srgb, var(--color-info) 35%, transparent)'
  },
  completed: {
    bg: 'color-mix(in srgb, var(--color-success) 12%, transparent)',
    color: 'var(--color-success)',
    border: 'color-mix(in srgb, var(--color-success) 35%, transparent)'
  },
  cancelled: {
    bg: 'color-mix(in srgb, var(--muted-foreground) 12%, transparent)',
    color: 'var(--muted-foreground)',
    border: 'color-mix(in srgb, var(--muted-foreground) 35%, transparent)'
  }
};
export default function InterviewerDashboard() {
  const {
    t
  } = useTranslation();
  usePageTitle('Interview studio');
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retentionNote, setRetentionNote] = useState('');
  // Appendix B calibration data: the leniency pattern over the evaluator's
  // recent completed sessions (the engine stays quiet below 3 sessions).
  const nudge = calibrationNudge(sessions);
  const nudgeDetail = [
    nudge.marksShare != null ? `${Math.round(nudge.marksShare * 100)}% of your guide marks are 'strong'` : null,
    nudge.meanRating != null ? `average live rating ${nudge.meanRating.toFixed(1)}/5` : null,
  ].filter(Boolean).join(' · ');
  const [filter, setFilter] = useState('all');
  // Sessions list pagination — 8 per page, so a growing history (the
  // re-interview flow multiplies rows) never drowns the dashboard.
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getEvaluatorSessions(user.uid).then(async list => {
      setSessions(list);
      // Retention enforcement (Appendix B — Decision Audit Trail): lapse
      // audit records past the 24-month window. Fire-and-forget: a failed
      // sweep must never block the dashboard load.
      try {
        const { deleted, failed, survivors } = await enforceSessionRetention(list);
        if (deleted > 0) {
          setSessions(survivors);
          setRetentionNote(`${deleted} audit record${deleted > 1 ? 's' : ''} past the 24-month compliance window ${(failed > 0 ? 'partially ' : '')}removed — Appendix B retention policy.`);
        }
      } catch (e) {
        console.warn('[interview-retention] sweep failed:', e?.message || e);
      }
    }).catch(() => setSessions([])).finally(() => setLoading(false));
  }, [user]);
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const counts = {
    total: sessions.length,
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    in_progress: sessions.filter(s => s.status === 'in_progress').length,
    completed: sessions.filter(s => s.status === 'completed').length
  };
  const formatDate = ts => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const handleDelete = async (e, session) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`Delete session for "${session.candidateName || 'Candidate'}"? This cannot be undone.`)) return;
    try {
      await deleteInterviewSession(session.id);
      setSessions(prev => prev.filter(s => s.id !== session.id));
    } catch {
      // silent failure on delete
    }
  };
  return <div className="page-pad max-w-[1280px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">{t("InterviewerDashboard.interview_studio")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{t("InterviewerDashboard.interviewer_dashboard")}</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-[640px]">{t("InterviewerDashboard.manage_your_interview_sessions")}</p>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Stats */}
      <section className="responsive-grid-4 gap-3 md:gap-4 w-full mb-10 md:mb-16">
        {[{
        label: 'TOTAL',
        value: counts.total,
        icon: ClipboardList
      }, {
        label: 'SCHEDULED',
        value: counts.scheduled,
        icon: Clock
      }, {
        label: 'IN PROGRESS',
        value: counts.in_progress,
        icon: Play
      }, {
        label: 'COMPLETED',
        value: counts.completed,
        icon: CheckCircle
      }].map(({
        label,
        value,
        icon: Icon
      }) => <div key={label} className="card p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon size={13} className="text-primary" />
              </span>
              <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">{label}</div>
            </div>
            <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{value}</div>
          </div>)}
      </section>

      {/* Filter + New Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-surface-variant" />
          {['all', 'scheduled', 'in_progress', 'completed'].map(f => <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={`px-3 py-1.5 text-technical-sm font-technical-sm uppercase tracking-widest border-[0.5px] transition-all cursor-pointer ${filter === f ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-transparent border-outline-variant text-surface-variant hover:border-primary/20'}`}>
              {f === 'all' ? 'All' : f === 'in_progress' ? 'Live' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>)}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/interview/compare')} className="btn-outline flex items-center gap-2" title="Side-by-side two completed candidates — Appendix B debrief">
            <Users size={14} />Compare</button>
          <button onClick={() => navigate('/app/interview/setup')} className="btn-primary glow flex items-center gap-2">
            <Plus size={14} />{t("InterviewerDashboard.new_session")}</button>
        </div>
      </div>

      {/* Calibration nudge — Appendix B: leniency bias reminder */}
      {nudge.leniency && <div className="flex items-start gap-3 px-4 py-3 mb-8 border-[0.5px]" style={{ borderColor: 'color-mix(in srgb, var(--color-warning, #e2a300) 40%, transparent)', background: 'color-mix(in srgb, var(--color-warning, #e2a300) 10%, transparent)', borderRadius: '6px' }}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning, #e2a300)' }} />
          <div className="min-w-0">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest mb-1" style={{ color: 'var(--color-warning, #e2a300)' }}>Calibration reminder</div>
            <div className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
              Your recent rating pattern looks uniformly strong{nudgeDetail ? ` (${nudgeDetail})` : ''}. The platform flags potential leniency bias (QiDS Appendix B) — on your next interview, calibrate hard: score what an average answer actually sounds like before reaching for 'Strong'.
            </div>
          </div>
        </div>}
      {retentionNote && <div className="px-4 py-2.5 mb-8 border-[0.5px] border-outline-variant bg-surface-container-low" style={{ borderRadius: '6px' }}>
          <span className="text-technical-sm font-technical-sm text-surface-variant">{retentionNote}</span>
        </div>}

      {/* Sessions List */}
      {loading ? <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 flex-shrink-0" />
                <div>
                  <div className="skeleton h-3 w-48 mb-2" />
                  <div className="skeleton h-2.5 w-32" />
                </div>
              </div>
              <div className="skeleton h-8 w-24" />
            </div>)}
        </div> : filtered.length === 0 && filter === 'all' ? <SeedInterviewData onDone={() => {
      getEvaluatorSessions(user.uid).then(setSessions).catch(e => reportError(e, { kind: 'interviewer-refresh' }));
    }} />        : <div className="flex flex-col">
          {shown.map(session => {
        
        const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.scheduled;
        const score = session.unifiedScore;
        const grade = session.grade;
        return <div key={session.id} onClick={() => {
          if (session.status === 'completed') {
            navigate(`/app/interview/report/${session.id}`);
          } else if (session.mode === 'live') {
            // Route by MODE, not status. The live room owns every live state:
            // it parks on `invited` (waiting to confirm), offers an explicit
            // Begin button on `accepted`, and runs the mirror on `in_progress`.
            // Sending an `accepted` session to post-scoring deadlocked the loop —
            // the candidate had confirmed, but nothing could ever flip the status
            // to `in_progress`, so they waited forever on "waiting to begin".
            navigate(`/app/interview/live/${session.id}`);
          } else {
            navigate(`/app/interview/scoring/${session.id}`);
          }
        }} className="card p-5 md:p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer border-b-[0.5px] border-outline-variant">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {session.mode === 'live' ? <Play size={16} className="text-primary" /> : <FileText size={16} className="text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-label-md font-label-md text-on-background truncate">
                      {session.candidateName || 'Candidate'}
                      {session.role && <span className="text-surface-variant ml-2">— {session.role}</span>}
                    </div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                      {session.mode === 'live' ? 'Live Interview' : 'Post-Interview'}
                      {(session.sessionNumber || 1) > 1 && <span style={{ color: 'var(--color-primary)' }}> · RE-INTERVIEW #{session.sessionNumber}</span>}
                      {' · '}{formatDate(session.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                  {score != null && grade && <div className="text-right">
                      <div className="text-label-md font-label-md text-on-background">{Math.round(score)}</div>
                      <div className="text-technical-sm font-technical-sm" style={{
                color: grade.color
              }}>
                        GRADE {grade.grade}
                      </div>
                    </div>}
                  {session.status === 'completed' && session.candidateUid && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/app/interview/setup?candidateUid=${session.candidateUid}&candidateName=${encodeURIComponent(session.candidateName || '')}`); }}
                      title="Run another interview for the same candidate — saved as the next attempt"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-technical-sm font-technical-sm uppercase tracking-widest border-[0.5px] border-outline-variant text-surface-variant hover:border-primary/30 hover:text-primary transition-colors cursor-pointer bg-transparent"
                      style={{ borderRadius: '6px' }}
                    >
                      <RotateCcw size={11} /> Re-interview
                    </button>
                  )}
                  <span className="chip text-[10px]" style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              borderColor: statusStyle.border
            }}>
                    {STATUS_LABELS[session.status] || session.status.toUpperCase()}
                  </span>
                  <button onClick={e => handleDelete(e, session)} aria-label={`Delete ${session.candidateName || 'session'}`} title={t("InterviewerDashboard.delete_session")} className="p-1.5 text-surface-variant hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none">
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={14} className="text-surface-variant flex-shrink-0" />
                </div>
              </div>;
      })}

          {/* Pager */}
          {filtered.length > PAGE_SIZE && <div className="flex items-center justify-between mt-6">
              <span className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">
                Page {safePage} of {pageCount} · {filtered.length} sessions
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn-outline inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                  <ChevronLeft size={13} /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={safePage === pageCount} className="btn-outline inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>}
        </div>}
    </div>;
}