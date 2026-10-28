import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { subscribeSessionsForCandidate } from '../../services/interviewService';
import { Mic, ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import usePageTitle from '../../lib/usePageTitle';

/**
 * MyInterviews — the candidate hub for individual/student personas.
 * Everything about interviews where this user is the candidate: live
 * sessions to enter, scheduled self-assessments to complete, finished
 * reports to read (and a declined/cancelled archive so history stays honest).
 * Live via onSnapshot — the hub updates the instant the evaluator acts.
 */
export default function MyInterviews() {
  usePageTitle('My interviews');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = userProfile?.role || 'individual';
  const allowed = ['individual', 'student', 'evaluator', 'employer', 'admin'].includes(role);

  useEffect(() => {
    if (!user || !allowed) { setLoading(false); return undefined; }
    return subscribeSessionsForCandidate(user.uid, list => {
      setSessions(list);
      setLoading(false);
    });
  }, [user, allowed]);

  if (!allowed) {
    return <div className="page-pad max-w-[720px] mx-auto py-20 text-center">
      <Mic size={32} className="text-surface-variant mx-auto mb-3" />
      <p className="text-body-md text-on-surface-variant">Interviews are available on the individual and student journeys.</p>
    </div>;
  }

  const live = sessions.filter(s => ['invited', 'accepted', 'in_progress'].includes(s.status));
  const scheduled = sessions.filter(s => s.status === 'scheduled');
  const selfAssessed = s => (s.selfAssessment?.length || 0) > 0;
  const done = sessions.filter(s => s.status === 'completed');
  const closed = sessions.filter(s => s.status === 'declined' || s.status === 'cancelled');

  const statusChip = s => {
    const map = {
      invited: { label: 'CONFIRM TO START', cls: 'text-gold', dot: 'var(--gold)' },
      accepted: { label: 'WAITING TO BEGIN', cls: 'text-primary', dot: 'var(--color-primary)' },
      in_progress: { label: 'IN PROGRESS', cls: 'text-primary', dot: 'var(--color-primary)' },
      scheduled: { label: 'SELF-ASSESSMENT DUE', cls: selfAssessed(s) ? 'text-primary' : 'text-gold', dot: selfAssessed(s) ? 'var(--color-primary)' : 'var(--gold)' },
      completed: { label: 'RESULT READY', cls: 'text-primary', dot: 'var(--color-primary)' },
      declined: { label: 'DECLINED', cls: 'text-outline', dot: 'var(--bone-line, var(--outline))' },
      cancelled: { label: 'CANCELLED', cls: 'text-outline', dot: 'var(--bone-line, var(--outline))' },
    };
    return map[s.status] || { label: (s.status || 'UNKNOWN').toUpperCase(), cls: 'text-outline', dot: 'var(--outline)' };
  };

  const row = s => {
    const chip = statusChip(s);
    const livePending = ['invited', 'accepted', 'in_progress'].includes(s.status);
    const dest = s.status === 'completed'
      ? `/app/interview/report/${s.id}`
      : s.mode === 'live' && livePending
        ? `/app/interview/candidate/${s.id}`
        : `/app/interview/candidate/${s.id}`;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => navigate(dest)}
        className="w-full flex items-center justify-between gap-4 px-4 py-5 text-left border-b-[0.5px] border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: chip.dot }} />
            <span className={`text-[10px] font-mono uppercase tracking-widest ${chip.cls}`}>{chip.label}</span>
          </div>
          <div className="text-label-md font-label-md text-on-background truncate">
            {s.evaluatorName || 'Evaluator'} · {s.mode === 'live' ? 'Live' : 'Post-interview'}
          </div>
          <div className="text-technical-sm font-technical-sm text-surface-variant truncate mt-0.5">
            {s.role ? s.role : ''}{s.createdAt?.toDate ? ` · ${s.createdAt.toDate().toLocaleDateString()}` : ''}
          </div>
        </div>
        <ArrowRight size={14} className="text-surface-variant flex-shrink-0" />
      </button>
    );
  };

  const Group = ({ kicker, icon: Icon, children }) => (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={12} className="text-primary" />
        <span className="text-technical-sm font-technical-sm uppercase tracking-[0.2em] text-primary">{kicker}</span>
      </div>
      <div className="card overflow-hidden">{children}</div>
    </section>
  );

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10">
        <div className="kicker mb-3">Interviews</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">My interviews</h1>
        <p className="text-body-md text-on-surface-variant mt-2 max-w-[640px]">
          Where you're the candidate. An evaluator can invite you to a live two-screen interview, and your self-assessment merges with their scoring for the final result.
        </p>
      </section>

      {loading && <div className="card p-8"><div className="skeleton h-24 w-full" /></div>}

      {!loading && sessions.length === 0 && (
        <EmptyState
          icon={Mic}
          title="No interviews yet"
          description="Your evaluator can start one at any time — you'll get a confirmation on your dashboard the moment it happens. Until then, keep building your four pillars."
        />
      )}

      {!loading && live.length > 0 && <Group kicker="Live" icon={Mic}>{live.map(row)}</Group>}
      {!loading && scheduled.length > 0 && <Group kicker="Scheduled" icon={Clock}>{scheduled.map(row)}</Group>}
      {!loading && done.length > 0 && <Group kicker="Results" icon={CheckCircle2}>{done.map(row)}</Group>}
      {!loading && closed.length > 0 && <Group kicker="Archive" icon={AlertCircle}>{closed.map(row)}</Group>}
    </div>
  );
}
