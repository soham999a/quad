import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentClasses, getClassAssessments } from '../../services/schoolService';
import { getUserAssessments } from '../../services/firestoreService';
import { getGrade, computeWeightedScore } from '../../data/qidsData';
import { computeQidsPillarScores } from '../../core/engine/qids';
import { useToast } from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { Users, ClipboardList, ChevronRight, GraduationCap, BookOpen, CheckCircle2, Circle } from 'lucide-react';

// Same unified-score derivation the Dashboard uses for assessment cards.
const getResult = (a) => {
  const pillarScores = a?.pillarScores || computeQidsPillarScores(a?.rawScores || {});
  const unified = computeWeightedScore(pillarScores);
  return { unified, grade: getGrade(unified) };
};

/**
 * MyClass — the student-facing surface of the school loop.
 * This closes the hole where a student joined a class and then saw nothing:
 * assigned assessments now surface here with a one-tap start, completed
 * attempts show their scores, and the class join code lives on the teacher.
 */
export default function MyClass() {
  const { t } = useTranslation();
  usePageTitle('My class');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getStudentClasses(user.uid)
      .then(cls => {
        setClasses(cls);
        if (cls.length > 0) setActiveClassId(prev => prev || cls[0].id);
      })
      .catch(() => toast(t('myClass.could_not_load_classes'), 'error'))
      .finally(() => setLoading(false));
  }, [user, t, toast]);

  useEffect(() => {
    if (!user || !activeClassId) return;
    setLoading(true);
    Promise.all([
      getClassAssessments(activeClassId),
      getUserAssessments(user.uid).catch(() => []),
    ])
      .then(([asg, mine]) => {
        setAssignments(asg.filter(a => a.status !== 'archived'));
        setMyAttempts(mine.filter(a => a.schoolAssessmentId));
      })
      .catch(() => toast(t('myClass.could_not_load_assignments'), 'error'))
      .finally(() => setLoading(false));
  }, [user, activeClassId, t, toast]);

  const attemptFor = (assignmentId) =>
    myAttempts.find(a => a.schoolAssessmentId === assignmentId) || null;

  const startAssignment = (assignment) => {
    // Handoff consumed by Assessment.jsx on submit: stamps the attempt with
    // teacherUid/classId so the teacher roster can see completion.
    try {
      window.localStorage.setItem('qids-school-assignment', JSON.stringify({
        classId: activeClassId,
        teacherUid: assignment.teacherUid || null,
        title: assignment.title,
      }));
    } catch { /* best-effort */ }
    navigate(`/app/assessment?mode=school&classId=${activeClassId}&assignmentId=${assignment.id}`);
  };

  const activeClass = classes.find(c => c.id === activeClassId) || null;

  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
      <div className="skeleton h-8 w-56 mb-6" />
      <div className="card p-8 mb-6"><div className="skeleton h-24 w-full" /></div>
      <div className="card p-8"><div className="skeleton h-40 w-full" /></div>
    </div>;
  }

  // Not in any class yet — point at the join flow.
  if (classes.length === 0) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 md:py-24">
      <EmptyState
        icon={GraduationCap}
        title={t('myClass.no_class_yet')}
        description={t('myClass.no_class_yet_desc')}
        actionLabel={t('myClass.join_class')}
        onAction={() => navigate('/app/school/join')}
      />
    </div>;
  }

  const pending = assignments.filter(a => !attemptFor(a.id));
  const done = assignments.filter(a => !!attemptFor(a.id));

  return <div className="page-pad max-w-[960px] mx-auto animate-fade">
    <section className="mb-10">
      <div className="kicker mb-3">{t('myClass.my_class')}</div>
      <h1 className="text-headline-md font-headline-md text-on-background page-headline">
        {activeClass?.name || t('myClass.my_class')}
      </h1>
      {classes.length > 1 && <div className="flex flex-wrap gap-2 mt-5">
        {classes.map(c => <button key={c.id} onClick={() => setActiveClassId(c.id)}
          className={`px-4 py-2 text-label-sm font-label-sm border-[0.5px] transition-all cursor-pointer ${c.id === activeClassId ? 'border-primary/60 bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/30'}`}>
          {c.name}
        </button>)}
      </div>}
      <div className="gradient-rule mt-6" />
    </section>

    {/* Assigned work */}
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <span className="kicker">{t('myClass.assigned_assessments')}</span>
        <span className="text-technical-sm font-technical-sm text-surface-variant">
          {t('myClass.pending_count', { pending: pending.length, done: done.length })}
        </span>
      </div>
      <div className="gradient-rule mb-4" />

      {assignments.length === 0
        ? <EmptyState icon={ClipboardList} title={t('myClass.no_assignments')} description={t('myClass.no_assignments_desc')} />
        : <div className="space-y-3">
          {[...pending, ...done].map((a, i) => {
            const attempt = attemptFor(a.id);
            const score = attempt ? getResult(attempt).unified : null;
            const hasScore = score != null && Number.isFinite(Number(score));
            return <div key={a.id} className={`card p-5 flex items-center gap-4 ${attempt ? 'opacity-90' : ''}`}>
              <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              {attempt
                ? <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                : <Circle size={16} className="text-surface-variant flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="text-label-md font-label-md text-on-background truncate">{a.title}</div>
                {a.description && <div className="text-body-sm font-body-sm text-surface-variant truncate">{a.description}</div>}
                {attempt && hasScore && <div className="text-technical-sm font-technical-sm text-primary mt-1">
                  {t('myClass.your_score')}: {Math.round(Number(score))} · {attempt.grade || ''}
                </div>}
              </div>
              {attempt
                ? <button onClick={() => navigate(`/app/individual/results/${attempt.id}`)} className="btn-outline flex-shrink-0 flex items-center gap-2">
                  {t('myClass.view_results')}<ChevronRight size={13} />
                </button>
                : <button onClick={() => startAssignment(a)} className="btn-primary glow flex-shrink-0 flex items-center gap-2">
                  <BookOpen size={13} />{t('myClass.start')}
                </button>}
            </div>;
          })}
        </div>}
    </section>

    {/* Classmates count — context, not surveillance: just the size of your cohort */}
    <section className="mb-10">
      <div className="card p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users size={16} className="text-primary" />
        </div>
        <div>
          <div className="text-label-md font-label-md text-on-background">{activeClass?.name}</div>
          <div className="text-technical-sm font-technical-sm text-surface-variant">
            {activeClass?.gradeLevel || ''}{activeClass?.gradeLevel && activeClass?.subject ? ' · ' : ''}{activeClass?.subject || ''}
          </div>
        </div>
      </div>
    </section>
  </div>;
}
