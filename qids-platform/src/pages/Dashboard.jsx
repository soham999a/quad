import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAssessments, getUserReports } from '../services/firestoreService';
import { PILLARS, getGrade, computeWeightedScore } from '../data/qidsData';
import { ClipboardList, TrendingUp, FileText, Activity, ChevronRight, ArrowRight } from 'lucide-react';
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const preAssessments = assessments.filter(a => a.phase === 'pre');
  const postAssessments = assessments.filter(a => a.phase === 'post');

  const getLinkedPost = (preId) => postAssessments.find(p => p.linkedAssessmentId === preId) || null;

  const totalAssessments = preAssessments.length;
  const totalReports = reports.length;
  const avgScore = preAssessments.length > 0
    ? Math.round(preAssessments.reduce((sum, a) => {
      const scores = a.pillarScores || {};
      return sum + (computeWeightedScore(scores) || 0);
    }, 0) / preAssessments.length)
    : '--';

  return (
    <div className="page-pad max-w-[1200px] mx-auto animate-fade">
      {/* Page Header */}
      <section className="mb-10 md:mb-16">
        <div className="text-technical-sm font-technical-sm text-primary mb-2">DASHBOARD</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Good morning, {userProfile?.name || user?.displayName || 'there'}.</h1>
      </section>

      {/* Stats Row */}
      <section className="responsive-grid-4 w-full border-y-[0.5px] border-outline-variant mb-10 md:mb-16">
        <div className="py-6 md:py-8 pr-4 md:pr-8 border-r-[0.5px] border-outline-variant border-b-[0.5px] md:border-b-0 border-outline-variant">
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 md:mb-4 uppercase tracking-widest">Assessments</div>
          <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{totalAssessments}</div>
        </div>
        <div className="py-6 md:py-8 px-4 md:px-8 border-r-[0.5px] border-outline-variant border-b-[0.5px] md:border-b-0 border-outline-variant">
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 md:mb-4 uppercase tracking-widest">Reports</div>
          <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{totalReports}</div>
        </div>
        <div className="py-6 md:py-8 px-4 md:px-8 border-r-[0.5px] border-outline-variant">
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 md:mb-4 uppercase tracking-widest">Avg Score</div>
          <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{avgScore}</div>
        </div>
        <div className="py-6 md:py-8 pl-4 md:pl-8">
          <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 md:mb-4 uppercase tracking-widest">Since Last</div>
          <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{preAssessments.length ? 'Active' : '--'}</div>
        </div>
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
          <div className="flex justify-between items-end mb-4 md:mb-6 pb-2 border-b-[0.5px] border-outline-variant">
            <h2 className="text-label-md font-label-md text-on-background">RECENT ASSESSMENTS</h2>
            <span className="text-technical-sm font-technical-sm text-surface-variant">
              Showing 01 — {Math.min(preAssessments.length, 4)} of {preAssessments.length}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-technical-sm font-technical-sm text-surface-variant">Loading...</div>
          ) : preAssessments.length === 0 ? (
            <div className="py-10 md:py-16 text-center">
              <ClipboardList size={24} className="text-surface-variant mx-auto mb-4 opacity-40" />
              <div className="text-technical-sm font-technical-sm text-surface-variant mb-4">No assessments recorded</div>
              <button onClick={() => navigate('/app/assessment')}
                className="px-6 py-3 md:py-2 bg-primary text-on-primary text-label-md font-label-md hover:opacity-90 transition-all cursor-pointer border-none">
                START FIRST ASSESSMENT
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {preAssessments.slice(0, 4).map((a, idx) => {
                const scores = a.pillarScores || {};
                const unified = computeWeightedScore(scores);
                const grade = unified ? getGrade(unified) : null;
                const hasPost = !!getLinkedPost(a.id);
                return (
                  <div key={a.id}
                    onClick={() => navigate('/app/assessment', { state: { assessment: a, postAssessment: getLinkedPost(a.id) } })}
                    className="h-14 md:h-16 flex items-center justify-between border-b-[0.5px] border-outline-variant group hover:bg-surface-container-low transition-colors px-2 cursor-pointer touch-target">
                    <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                      <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-label-md font-label-md text-on-background truncate">{a.intake?.name || 'Assessment'}</div>
                        <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                          {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                          {hasPost && ' | Post-Complete'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                      {unified && grade ? (
                        <span className="px-2 md:px-3 py-1 bg-primary/10 text-primary text-technical-sm font-technical-sm tracking-wider">
                          GRADE {grade.grade}
                        </span>
                      ) : (
                        <span className="px-2 md:px-3 py-1 border-[0.5px] border-outline text-technical-sm font-technical-sm text-outline tracking-wider">
                          PENDING
                        </span>
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
              <button onClick={() => navigate('/app/assessment')}
                className="w-full md:w-auto px-6 py-3 md:py-2 border-[0.5px] border-outline-variant text-label-md font-label-md text-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent">
                VIEW ALL ASSESSMENTS
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-4 col-span-full">
          <div className="mb-4 md:mb-6 pb-2 border-b-[0.5px] border-outline-variant">
            <h2 className="text-label-md font-label-md text-on-background">QUICK ACTIONS</h2>
          </div>
          <ul className="flex flex-col gap-4 md:gap-6">
            {[
              { label: 'Start Assessment', path: '/app/assessment' },
              { label: 'Generate Report', path: '/app/report' },
              { label: 'View My Evaluator', path: '/app/my-evaluator' },
              { label: 'Intervention Plan', path: '/app/intervention-plan' },
            ].map(({ label, path }) => (
              <li key={label}>
                <button onClick={() => navigate(path)}
                  className="group flex items-center justify-between w-full text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none touch-target">
                  <span>{label}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="h-[0.5px] bg-outline-variant opacity-50 mt-4 md:mt-6"></div>
              </li>
            ))}
          </ul>

          <div className="mt-10 md:mt-16 p-6 md:p-8 border-[0.5px] border-outline-variant bg-surface-container-lowest">
            <div className="text-technical-sm font-technical-sm text-primary mb-4">SYSTEM NOTIFICATION</div>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Your intelligence profile is being updated. New dimensional insights will be available upon completion of your next assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
