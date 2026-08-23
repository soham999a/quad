import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAssessments, getUserReports } from '../services/firestoreService';
import { PILLARS, getGrade, computeWeightedScore } from '../data/qidsData';
import { computeQidsPillarScores } from '../core/engine/qids';
import { ClipboardList, TrendingUp, FileText, Activity, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import SeedExampleData from '../components/SeedExampleData';
import { getSkillShape } from '../core/engine/scoring';

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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const preAssessments = assessments.filter(a => a.phase === 'pre');
  const postAssessments = assessments.filter(a => a.phase === 'post');

  const getLinkedPost = (preId) => postAssessments.find(p => p.linkedAssessmentId === preId) || null;

  const getResult = (a) => {
    if (a.result?.unifiedScore != null) {
      return { unified: a.result.unifiedScore, grade: a.result.grade, pillarScores: a.result.pillarScores || a.pillarScores || {} };
    }
    const scores = a.pillarScores || {};
    const pillarScores = Object.keys(scores).length ? scores : computeQidsPillarScores(a.rawScores || {});
    const unified = computeWeightedScore(pillarScores) || 0;
    return { unified, grade: getGrade(unified), pillarScores };
  };

  const totalAssessments = preAssessments.length;
  const totalReports = reports.length;
  const avgScore = preAssessments.length > 0
    ? Math.round(preAssessments.reduce((sum, a) => sum + (getResult(a).unified || 0), 0) / preAssessments.length)
    : '--';

  return (
    <div className="page-pad max-w-[1520px] mx-auto animate-fade">
      {/* Page Header */}
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">Dashboard</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Good morning, {userProfile?.name || user?.displayName || 'there'}.</h1>
        <div className="gradient-rule mt-6" />
      </section>

      {!loading && assessments.length === 0 && (
        <section className="card card-gold p-6 md:p-8 mb-10 flex flex-wrap items-center justify-between gap-6 animate-fade-up">
          <div>
            <div className="label-eyebrow-gold mb-3">STEP 01 — BEGIN</div>
            <h2 className="font-display text-[22px] md:text-[26px] leading-snug">
              No assessment on record yet.
            </h2>
            <p className="mt-2 text-[13px] text-muted-foreground max-w-xl leading-relaxed">
              Your first assessment establishes the baseline every report, plan, and growth
              trajectory is built on.
            </p>
          </div>
          <button onClick={() => navigate('/app/assessment')} className="btn-primary">
            Begin Assessment <ArrowRight size={15} />
          </button>
        </section>
      )}

      {/* Stats Row */}
      <section className="responsive-grid-4 gap-3 md:gap-4 w-full mb-10 md:mb-16">
        {loading ? (
          <>
            <div className="card p-5 md:p-6">
              <div className="skeleton h-3 w-24 mb-4" />
              <div className="skeleton h-8 w-14" />
            </div>
            <div className="card p-5 md:p-6">
              <div className="skeleton h-3 w-16 mb-4" />
              <div className="skeleton h-8 w-10" />
            </div>
            <div className="card p-5 md:p-6">
              <div className="skeleton h-3 w-20 mb-4" />
              <div className="skeleton h-8 w-12" />
            </div>
            <div className="card p-5 md:p-6">
              <div className="skeleton h-3 w-24 mb-4" />
              <div className="skeleton h-8 w-16" />
            </div>
          </>
        ) : (
          <>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"><ClipboardList size={13} className="text-primary" /></span>
                <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Assessments</div>
              </div>
              <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{totalAssessments}</div>
            </div>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"><FileText size={13} className="text-primary" /></span>
                <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Reports</div>
              </div>
              <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{totalReports}</div>
            </div>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"><Activity size={13} className="text-primary" /></span>
                <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Avg Score</div>
              </div>
              <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{avgScore}</div>
            </div>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"><TrendingUp size={13} className="text-primary" /></span>
                <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Since Last</div>
              </div>
              <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{preAssessments.length ? 'Active' : '--'}</div>
            </div>
            {preAssessments.length > 0 && (() => {
              const latest = preAssessments[0];
              const latestMode = latest.mode || 'qids';
              if (latestMode !== 'individual') return null;
              const { pillarScores } = getResult(latest);
              const shape = getSkillShape(pillarScores);
              const shapeLabel = { T: 'T-Shaped', I: 'I-Shaped', X: 'X-Shaped', M: 'M-Shaped' }[shape] || shape;
              return (
                <div className="card p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center"><Sparkles size={13} className="text-primary" /></span>
                    <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Skill Shape</div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{shape}</div>
                    <button
                      onClick={() => navigate(`/app/individual/results/${latest.id}`)}
                      className="text-technical-sm font-technical-sm text-primary hover:underline cursor-pointer bg-transparent border-none p-0 mb-1"
                    >
                      View Results →
                    </button>
                  </div>
                  <div className="text-body-sm font-body-sm text-surface-variant mt-1">{shapeLabel}</div>
                </div>
              );
            })()}
          </>
        )}
      </section>

      {/* Seed Data */}
      {!loading && preAssessments.length === 0 && (
        <div className="mb-8 md:mb-12">
          <SeedExampleData onDone={() => {
            Promise.all([getUserAssessments(user.uid), getUserReports(user.uid)])
              .then(([a, r]) => { setAssessments(a); setReports(r); })
              .catch(() => {});
          }} />
        </div>
      )}

      {/* Main Grid */}
      <div className="responsive-grid-12 gap-6 md:gap-12">
        {/* Recent Assessments */}
        <div className="md:col-span-8 col-span-full">
          <div className="flex justify-between items-end mb-5">
            <span className="kicker">Recent Assessments</span>
            <span className="text-technical-sm font-technical-sm text-surface-variant">
              Showing 01 — {Math.min(preAssessments.length, 4)} of {preAssessments.length}
            </span>
          </div>
          <div className="gradient-rule mb-6" />

          {loading ? (
            <div className="flex flex-col" aria-busy="true" aria-label="Loading assessments">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="h-14 md:h-16 flex items-center justify-between border-b-[0.5px] border-outline-variant px-2">
                  <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                    <div className="skeleton h-3 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="skeleton h-3 w-40 mb-2" />
                      <div className="skeleton h-2.5 w-24" />
                    </div>
                  </div>
                  <div className="skeleton h-5 w-16 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : preAssessments.length === 0 ? (
            <div className="py-10 md:py-16 text-center">
              <ClipboardList size={24} className="text-surface-variant mx-auto mb-4 opacity-40" />
              <div className="text-technical-sm font-technical-sm text-surface-variant mb-4">No assessments recorded</div>
              <button onClick={() => navigate('/app/assessment')} className="btn-primary glow mx-auto">
                START FIRST ASSESSMENT
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {preAssessments.slice(0, 4).map((a, idx) => {
                const { unified, grade } = getResult(a);
                const hasPost = !!getLinkedPost(a.id);
                const isIndividual = a.mode === 'individual';
                return (
                  <div key={a.id}
                    onClick={() => isIndividual ? navigate(`/app/individual/results/${a.id}`) : navigate('/app/assessment', { state: { assessment: a, postAssessment: getLinkedPost(a.id) } })}
                    className="h-14 md:h-16 flex items-center justify-between border-b-[0.5px] border-outline-variant group hover:bg-surface-container-low transition-colors px-2 cursor-pointer touch-target">
                    <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                      <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-label-md font-label-md text-on-background truncate">
                          {a.intake?.name || 'Assessment'}
                          {isIndividual && <span className="chip ml-2 text-[10px] py-0 px-2" style={{ background: 'rgba(235,192,115,0.12)', color: 'var(--color-primary)', borderColor: 'rgba(235,192,115,0.35)' }}>INDIVIDUAL</span>}
                        </div>
                        <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                          {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                          {hasPost && ' | Post-Complete'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                      {unified && grade ? (
                        <span className="chip" style={{ background: 'rgba(235,192,115,0.12)', color: 'var(--color-primary)', borderColor: 'rgba(235,192,115,0.35)' }}>
                          GRADE {grade.grade}
                        </span>
                      ) : (
                        <span className="chip">PENDING</span>
                      )}
                      <ChevronRight size={14} className="text-surface-variant flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {preAssessments.length > 0 && (
            <div className="mt-6 md:mt-8">
              <button onClick={() => navigate('/app/assessment')} className="btn-outline w-full md:w-auto">
                VIEW ALL ASSESSMENTS
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-4 col-span-full">
          <div className="flex items-center gap-3 mb-5">
            <span className="kicker">Quick Actions</span>
          </div>
          <div className="gradient-rule mb-6" />
          <div className="flex flex-col gap-3">
            {[
              { label: 'Start Assessment', path: '/app/assessment' },
              { label: 'Generate Report', path: '/app/report' },
              { label: 'View My Evaluator', path: '/app/my-evaluator' },
              { label: 'Intervention Plan', path: '/app/intervention-plan' },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="card card-hover group flex items-center justify-between w-full p-4 text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent touch-target text-left">
                <span>{label}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-surface-variant" />
              </button>
            ))}
          </div>

          <div className="mt-6 card p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest">System Notification</div>
            </div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Your intelligence profile is being updated. New dimensional insights will be available upon completion of your next assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
