import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClass, getClassStudents } from '../../services/schoolService';
import { getUserAssessments } from '../../services/firestoreService';
import { computeClassAnalytics } from '../../core/engine/cohortAnalytics';
import { PILLARS } from '../../data/qidsData';
import { BarChart3, Users, Target, ChevronLeft, Download } from 'lucide-react';
const SHAPE_LABELS = {
  T: 'T-Shaped',
  I: 'I-Shaped',
  X: 'X-Shaped',
  M: 'M-Shaped'
};
const SHAPE_COLORS = {
  T: 'var(--color-primary)',
  I: 'var(--color-info)',
  X: 'var(--color-success)',
  M: 'var(--color-warning)'
};
export default function ClassAnalytics() {
  const {
    t
  } = useTranslation();
  usePageTitle('Class analytics');
  const {
    classId
  } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportRows, setExportRows] = useState([]);
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    (async () => {
      try {
        const classData = await getClass(classId);
        setCls(classData);
        const students = await getClassStudents(classId);
        const allAssessments = [];
        for (const s of students) {
          try {
            const a = await getUserAssessments(s.studentUid);
            allAssessments.push(...a);
          } catch {/* skip */}
        }
        const result = computeClassAnalytics(classId, allAssessments);
        setAnalytics(result);
        setExportRows(allAssessments.map(a => ({
          name: a.intake?.name || '—',
          ageGroup: a.ageGroup || a.intake?.ageGroup || '—',
          unified: a.result?.unifiedScore ?? '',
          IQ: a.pillarScores?.IQ ?? a.result?.pillarScores?.IQ ?? '',
          EQ: a.pillarScores?.EQ ?? a.result?.pillarScores?.EQ ?? '',
          SQ: a.pillarScores?.SQ ?? a.result?.pillarScores?.SQ ?? '',
          AQ: a.pillarScores?.AQ ?? a.result?.pillarScores?.AQ ?? '',
          grade: a.result?.grade?.grade ?? '',
          shape: a.result?.skillShape ?? '',
          date: a.createdAt?.toDate?.()?.toISOString?.().slice(0, 10) || ''
        })));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);
  if (loading) {
    return <div className="page-pad max-w-[1100px] mx-auto animate-fade py-16">
        <div className="card p-8"><div className="skeleton h-6 w-48 mb-4" /><div className="skeleton h-64 w-full" /></div>
      </div>;
  }
  return <div className="page-pad max-w-[1100px] mx-auto animate-fade">
      <div className="mb-6">
        <button onClick={() => navigate(`/app/school/class/${classId}`)} className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0">
          <ChevronLeft size={14} />
          Back to {cls?.name || 'Class'}
        </button>
      </div>

      {exportRows.length > 0 && <div className="mb-6 flex justify-end">
          <button onClick={() => {
        const headers = Object.keys(exportRows[0]);
        const csv = [headers.join(','), ...exportRows.map(r => headers.map(h => {
          const v = String(r[h] ?? '');
          return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}` : v;
        }).join(','))].join('\n');
        const blob = new Blob([csv], {
          type: 'text/csv;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(cls?.name || 'class').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-results.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }} className="btn-outline !py-2 !text-[12px]">
            <Download size={13} />{t("ClassAnalytics.export_csv")}</button>
        </div>}

      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">{t("ClassAnalytics.class_analytics")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{cls?.name || 'Class'}</h1>
        <div className="gradient-rule mt-6" />
      </section>

      {!analytics || analytics.studentCount === 0 ? <div className="card p-12 text-center">
          <BarChart3 size={32} className="text-surface-variant mx-auto mb-4 opacity-40" />
          <div className="text-body-md font-body-md text-surface-variant">{t("ClassAnalytics.no_assessment_data_available")}</div>
        </div> : <>
          {/* Stats */}
          <section className="responsive-grid-4 gap-3 md:gap-4 w-full mb-10 md:mb-16">
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3"><Users size={13} className="text-primary" /><span className="text-technical-sm font-technical-sm text-surface-variant">{t("ClassAnalytics.students")}</span></div>
              <div className="text-[24px] font-technical-sm text-on-background">{analytics.studentCount}</div>
            </div>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3"><BarChart3 size={13} className="text-primary" /><span className="text-technical-sm font-technical-sm text-surface-variant">{t("ClassAnalytics.avg_score")}</span></div>
              <div className="text-[24px] font-technical-sm text-on-background">{analytics.avgUnifiedScore}</div>
            </div>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3"><Target size={13} className="text-primary" /><span className="text-technical-sm font-technical-sm text-surface-variant">{t("ClassAnalytics.top_shape")}</span></div>
              <div className="text-[24px] font-technical-sm text-on-background">
                {Object.entries(analytics.shapeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
              </div>
            </div>
            <div className="card p-5 md:p-6">
              <div className="flex items-center gap-2 mb-3"><Users size={13} className="text-primary" /><span className="text-technical-sm font-technical-sm text-surface-variant">{t("ClassAnalytics.assessments")}</span></div>
              <div className="text-[24px] font-technical-sm text-on-background">{analytics.assessmentCount}</div>
            </div>
          </section>

          {/* Pillar Averages */}
          <section className="mb-8">
            <span className="kicker mb-4 block">{t("ClassAnalytics.average_pillar_scores")}</span>
            <div className="gradient-rule mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PILLARS.map(p => <div key={p.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{p.emoji}</span>
                    <span className="text-label-sm font-label-sm text-on-background">{p.short}</span>
                  </div>
                  <div className="text-[24px] font-technical-sm text-on-background">{analytics.avgPillarScores[p.id]}</div>
                  <div className="h-2 bg-surface-container-high mt-2 overflow-hidden">
                    <div className="h-full" style={{
                width: `${analytics.avgPillarScores[p.id]}%`,
                background: p.color
              }} />
                  </div>
                </div>)}
            </div>
          </section>

          {/* Grade Distribution */}
          {Object.keys(analytics.gradeDistribution).length > 0 && <section className="mb-8">
              <span className="kicker mb-4 block">{t("ClassAnalytics.grade_distribution")}</span>
              <div className="gradient-rule mb-6" />
              <div className="flex gap-3 flex-wrap">
                {Object.entries(analytics.gradeDistribution).sort().map(([grade, count]) => <div key={grade} className="card px-4 py-3 flex items-center gap-2">
                    <span className="text-label-md font-label-md text-on-background">{t("inter.grade_n", { n: grade })}</span>
                    <span className="text-technical-sm font-technical-sm text-surface-variant">× {count}</span>
                  </div>)}
              </div>
            </section>}

          {/* Top Performers */}
          {analytics.topPerformers.length > 0 && <section className="mb-8">
              <span className="kicker mb-4 block">{t("ClassAnalytics.top_performers")}</span>
              <div className="gradient-rule mb-6" />
              <div className="flex flex-col">
                {analytics.topPerformers.slice(0, 5).map((p, i) => <div key={i} className="card p-4 flex items-center gap-4 border-b-[0.5px] border-outline-variant">
                    <span className="text-technical-sm font-technical-sm text-surface-variant">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-label-md font-label-md text-on-background flex-1">{p.name}</span>
                    <span className="text-[18px] font-technical-sm text-primary">{p.score}</span>
                  </div>)}
              </div>
            </section>}
        </>}
    </div>;
}