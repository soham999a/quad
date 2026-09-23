import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorSessions } from '../../services/interviewService';
import { ClipboardList, Users, Clock, CheckCircle, Plus, ChevronRight, Play, FileText, Filter, Trash2 } from 'lucide-react';
import { deleteInterviewSession } from '../../services/interviewService';
import SeedInterviewData from '../../components/SeedInterviewData';
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
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getEvaluatorSessions(user.uid).then(setSessions).catch(() => setSessions([])).finally(() => setLoading(false));
  }, [user]);
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);
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
          {['all', 'scheduled', 'in_progress', 'completed'].map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-technical-sm font-technical-sm uppercase tracking-widest border-[0.5px] transition-all cursor-pointer ${filter === f ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-transparent border-outline-variant text-surface-variant hover:border-primary/20'}`}>
              {f === 'all' ? 'All' : f === 'in_progress' ? 'Live' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>)}
        </div>
        <button onClick={() => navigate('/app/interview/setup')} className="btn-primary glow flex items-center gap-2">
          <Plus size={14} />{t("InterviewerDashboard.new_session")}</button>
      </div>

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
      getEvaluatorSessions(user.uid).then(setSessions).catch(() => {});
    }} /> : <div className="flex flex-col">
          {filtered.map(session => {
        
        const statusStyle = STATUS_STYLES[session.status] || STATUS_STYLES.scheduled;
        const score = session.unifiedScore;
        const grade = session.grade;
        return <div key={session.id} onClick={() => {
          if (session.status === 'completed') {
            navigate(`/app/interview/report/${session.id}`);
          } else if (session.status === 'in_progress' && session.mode === 'live') {
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
                      {session.mode === 'live' ? 'Live Interview' : 'Post-Interview'} · {formatDate(session.createdAt)}
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
                  <span className="chip text-[10px]" style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              borderColor: statusStyle.border
            }}>
                    {session.status === 'in_progress' ? 'LIVE' : session.status.toUpperCase()}
                  </span>
                  <button onClick={e => handleDelete(e, session)} aria-label={`Delete ${session.candidateName || 'session'}`} title={t("InterviewerDashboard.delete_session")} className="p-1.5 text-surface-variant hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none">
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={14} className="text-surface-variant flex-shrink-0" />
                </div>
              </div>;
      })}
        </div>}
    </div>;
}