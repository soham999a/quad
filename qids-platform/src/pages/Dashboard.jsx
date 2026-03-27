import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAssessments, getUserReports } from '../services/firestoreService';
import { PILLARS, getGrade, computeWeightedScore } from '../data/qidsData';
import { ClipboardList, FileText, TrendingUp, Plus, Clock, ChevronRight, Activity } from 'lucide-react';
import SeedExampleData from '../components/SeedExampleData';

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserAssessments(user.uid), getUserReports(user.uid)])
      .then(([a, r]) => { setAssessments(a); setReports(r); })
      .finally(() => setLoading(false));
  }, [user]);

  const preAssessments = assessments.filter(a => a.phase === 'pre');
  const postAssessments = assessments.filter(a => a.phase === 'post');

  const getLinkedPost = (preId) => postAssessments.find(p => p.linkedAssessmentId === preId) || null;

  return (
    <div className="page-pad animate-fade" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Welcome */}
      <div className="dashboard-welcome" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))',
        border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            Welcome back, {userProfile?.name || user?.displayName || 'there'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {userProfile?.context ? `Context: ${userProfile.context}` : ''} · {userProfile?.role || 'Individual'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/assessment')}>
          <Plus size={14} /> New Assessment
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Assessments', val: preAssessments.length, icon: ClipboardList, color: '#6366f1' },
          { label: 'Post-Evaluations', val: postAssessments.length, icon: TrendingUp, color: '#14b8a6' },
          { label: 'Reports Generated', val: reports.length, icon: FileText, color: '#a855f7' },
          { label: 'Active Phase', val: preAssessments.length > postAssessments.length ? 'Intervention' : preAssessments.length === 0 ? 'Not Started' : 'Complete', icon: Activity, color: '#f59e0b', isText: true },
        ].map(({ label, val, icon: Icon, color, isText }) => (
          <div key={label} style={{ background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: isText ? 14 : 28, fontWeight: 800, color, fontFamily: 'Space Grotesk' }}>{val}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && preAssessments.length === 0 && (
        <div style={{ marginBottom: 28 }}>
          <SeedExampleData onDone={() => window.location.reload()} />
        </div>
      )}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Recent Assessments */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Assessments</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assessment')}>View all</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
          ) : preAssessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <ClipboardList size={28} color="var(--text-muted)" style={{ marginBottom: 8, opacity: 0.4 }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No assessments yet</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/assessment')}>
                Start First Assessment
              </button>
            </div>
          ) : (
            preAssessments.slice(0, 5).map(a => {
              const scores = a.pillarScores || {};
              const unified = computeWeightedScore(scores);
              const grade = getGrade(unified);
              return (
                <div key={a.id} onClick={() => navigate('/pre-intervention', { state: { assessment: a, postAssessment: getLinkedPost(a.id) } })} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--indigo)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.intake?.name || 'Assessment'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={10} />
                      {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getLinkedPost(a.id) && (
                      <span className="post-badge">✓ Post</span>
                    )}
                    <div style={{ padding: '3px 8px', borderRadius: 6, background: grade.bg, border: `1px solid ${grade.color}40`, fontSize: 12, fontWeight: 700, color: grade.color }}>
                      {grade.grade} · {unified}
                    </div>
                    <ChevronRight size={13} color="var(--text-muted)" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Start New Assessment', desc: 'Begin baseline evaluation', path: '/assessment', color: '#6366f1', icon: ClipboardList },
              { label: 'View Framework Map', desc: 'Explore QIDS architecture', path: '/framework', color: '#a855f7', icon: Activity },
              { label: 'Pre-Intervention Analysis', desc: 'Review scores and gaps', path: '/pre-intervention', color: '#06b6d4', icon: TrendingUp },
              { label: 'Generate Report', desc: 'Export development report', path: '/report', color: '#10b981', icon: FileText },
            ].map(({ label, desc, path, color, icon: Icon }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                transition: 'all 0.15s', width: '100%',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <ChevronRight size={13} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
