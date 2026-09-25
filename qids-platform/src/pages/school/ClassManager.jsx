import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClass, getClassStudents, createSchoolAssessment, getClassAssessments, getClassAttempts } from '../../services/schoolService';
import { notifyClassAssignment } from '../../services/notificationService';
import { useToast } from '../../components/Toast';
import EmptyState from '../../components/EmptyState';
import { Users, Plus, ClipboardList, BarChart3, Copy, ChevronRight, CheckCircle, Trash2, Send, Share2 } from 'lucide-react';
export default function ClassManager() {
  const {
    t
  } = useTranslation();
  usePageTitle('Manage class');
  const {
    classId
  } = useParams();
  const {
    user,
    userProfile
  } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDesc, setAssessmentDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [attempts, setAttempts] = useState([]);
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    Promise.all([getClass(classId), getClassStudents(classId), getClassAssessments(classId), getClassAttempts(classId)]).then(([c, s, a, at]) => {
      setCls(c);
      setStudents(s);
      setAssignments(a);
      setAttempts(at);
    }).catch(() => toast('Failed to load class', 'error')).finally(() => setLoading(false));
  }, [classId]);

  const attemptsFor = (assessmentId) => attempts.filter(a => a.schoolAssessmentId === assessmentId);
  const shareClass = async () => {
    const url = `${window.location.origin}/login`;
    const text = `Join my QiDS class — code: ${cls.classCode}`;
    if (navigator.share) {
      try { await navigator.share({ title: cls.name, text, url }); return; } catch { /* fell through */ }
    }
    try { await navigator.clipboard.writeText(`${text} → ${url}`); toast('Join link copied!', 'success'); } catch { /* noop */ }
  };
  const copyCode = () => {
    if (cls?.classCode) {
      navigator.clipboard.writeText(cls.classCode);
      toast('Class code copied!', 'success');
    }
  };
  const handleCreateAssessment = async () => {
    if (!assessmentTitle.trim() || !classId || !user) return;
    setCreating(true);
    try {
      await createSchoolAssessment({
        classId,
        teacherUid: user.uid,
        title: assessmentTitle.trim(),
        description: assessmentDesc.trim(),
        mode: 'school'
      });
      // refresh the list so the new assignment appears immediately
      getClassAssessments(classId).then(setAssignments).catch(() => {});
      // notify every student in the class (fire-and-forget)
      notifyClassAssignment({
        classId,
        teacherName: userProfile?.name || user.displayName || 'Your teacher',
        title: assessmentTitle.trim(),
        classCode: cls?.classCode || '',
      });
      toast('Assessment created', 'success');
      setShowNewAssessment(false);
      setAssessmentTitle('');
      setAssessmentDesc('');
    } catch (e) {
      toast('Failed to create assessment', 'error');
    } finally {
      setCreating(false);
    }
  };
  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8"><div className="skeleton h-6 w-48 mb-4" /><div className="skeleton h-48 w-full" /></div>
      </div>;
  }
  if (!cls) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <div className="text-body-md font-body-md text-surface-variant">{t("ClassManager.class_not_found")}</div>
        <button onClick={() => navigate('/app/school')} className="btn-primary mt-6">{t("ClassManager.back_to_dashboard")}</button>
      </div>;
  }
  return <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">{t("ClassManager.class_manager")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{cls.name}</h1>
        <div className="text-body-md font-body-md text-surface-variant mt-2">
          {cls.gradeLevel} · {cls.subject || 'General'}
        </div>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Class Code Card */}
      <div className="card p-6 mb-8 flex items-center justify-between">
        <div>
          <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-1">{t("ClassManager.class_join_code")}</div>
          <div className="text-[28px] font-technical-sm text-primary tracking-widest">{cls.classCode}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={copyCode} data-tour="class-code" className="btn-outline flex items-center gap-2">
            <Copy size={14} />{t("ClassManager.copy_code")}</button>
          <button onClick={shareClass} className="btn-outline flex items-center gap-2">
            <Share2 size={14} />{t("ClassManager.share")}</button>
        </div>
      </div>

      {/* Students */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="kicker">{t("inter.students_n", { n: students.length })}</span>
        </div>
        <div className="gradient-rule mb-4" />
        {students.length === 0 ? <EmptyState icon={Users} title={t("ClassManager.no_students_have_joined")} description="Share the class code with your students — they join from their dashboard." /> : <div className="flex flex-col">
            {students.map((s, i) => <div key={s.id} className="card p-4 flex items-center gap-4 border-b-[0.5px] border-outline-variant">
                <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-label-md font-label-md text-on-background truncate">{s.name}</div>
                  {s.email && <div className="text-technical-sm font-technical-sm text-surface-variant truncate">{s.email}</div>}
                </div>
                <CheckCircle size={14} className="text-success flex-shrink-0" />
              </div>)}
          </div>}
      </section>

      {/* Assigned Assessments */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="kicker">{t("ClassManager.assigned_assessments")}</span>
        </div>
        <div className="gradient-rule mb-4" />
        {assignments.length === 0 ? <EmptyState icon={ClipboardList} title={t("ClassManager.no_assignments_yet")} description={t("ClassManager.no_assignments_yet_desc")} /> : <div className="flex flex-col">
            {assignments.map((a, i) => {
              const done = attemptsFor(a.id);
              const pct = students.length > 0 ? Math.round(done.length / students.length * 100) : 0;
              return <div key={a.id} className="card p-4 flex items-center gap-4 border-b-[0.5px] border-outline-variant">
                <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-label-md font-label-md text-on-background truncate">{a.title}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mt-0.5">
                    {t("ClassManager.completed_count", { done: done.length, total: students.length })}
                  </div>
                  <div className="h-1 bg-surface-container-high mt-2 max-w-[240px]">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-technical-sm font-technical-sm text-primary flex-shrink-0 tabular-nums">{pct}%</span>
                <button onClick={() => navigate(`/app/school/class/${classId}/analytics`)} className="btn-outline flex-shrink-0 flex items-center gap-2 !py-2">
                  <ChevronRight size={13} />
                </button>
              </div>;
            })}
          </div>}
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/app/school/class/${classId}/analytics`)} className="btn-outline flex items-center gap-2">
          <BarChart3 size={14} />{t("ClassManager.view_analytics")}</button>
        <button onClick={() => setShowNewAssessment(true)} className="btn-primary glow flex items-center gap-2">
          <Plus size={14} />{t("ClassManager.new_assessment")}</button>
      </div>

      {/* New Assessment Modal */}
      {showNewAssessment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="card p-8 max-w-[480px] w-full mx-4">
            <h2 className="text-headline-sm font-headline-sm text-on-background mb-6">{t("ClassManager.new_class_assessment")}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t("ClassManager.title")}</label>
                <input type="text" value={assessmentTitle} onChange={e => setAssessmentTitle(e.target.value)} placeholder={t("ClassManager.e_g_mid_term")} className="input-field w-full" />
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t("ClassManager.description_optional")}</label>
                <textarea value={assessmentDesc} onChange={e => setAssessmentDesc(e.target.value)} placeholder={t("ClassManager.instructions_for_students")} rows={3} className="input-field w-full resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewAssessment(false)} className="btn-outline flex-1">{t("ClassManager.cancel")}</button>
              <button onClick={handleCreateAssessment} disabled={!assessmentTitle.trim() || creating} className="btn-primary flex-1">
                {creating ? 'CREATING...' : 'CREATE'}
              </button>
            </div>
          </div>
        </div>}
    </div>;
}