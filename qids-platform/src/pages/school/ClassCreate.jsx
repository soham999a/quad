import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createClass } from '../../services/schoolService';
import { useToast } from '../../components/Toast';
import { BookOpen, ChevronRight } from 'lucide-react';

/**
 * ClassCreate — the real class-creation form behind /app/school/create.
 * (Previously this route rendered ClassManager with no classId and hung on a
 * skeleton forever — teachers had no way to create a class from the UI.)
 * On success, lands straight in the new class's manager with its join code.
 */
export default function ClassCreate() {
  const { t } = useTranslation();
  usePageTitle('Create class');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setCreating(true);
    try {
      const { id } = await createClass({
        name: name.trim(),
        gradeLevel: gradeLevel.trim() || '—',
        subject: subject.trim() || 'General',
        teacherUid: user.uid,
        teacherName: userProfile?.name || user.displayName || 'Teacher',
      });
      toast(t('classCreate.created'), 'success');
      navigate(`/app/school/class/${id}`);
    } catch (err) {
      console.error('createClass failed:', err);
      toast(t('classCreate.create_failed'), 'error');
      setCreating(false);
    }
  };

  const inputClass = "w-full h-12 px-4 bg-background border-[0.5px] border-outline-variant rounded-xl text-on-surface placeholder:text-surface-variant font-technical-sm transition-all outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--gold)]";

  return <div className="page-pad max-w-[560px] mx-auto animate-fade">
    <button onClick={() => navigate('/app/school')} className="text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 mb-6 flex items-center gap-1">
      <ChevronRight size={13} className="rotate-180" />{t('classCreate.back')}
    </button>

    <section className="mb-10">
      <div className="kicker mb-3">{t('classCreate.kicker')}</div>
      <h1 className="text-headline-md font-headline-md text-on-background page-headline">{t('classCreate.title')}</h1>
      <p className="text-body-md text-surface-variant mt-3">{t('classCreate.subtitle')}</p>
      <div className="gradient-rule mt-6" />
    </section>

    <form onSubmit={handleCreate} className="card p-6 md:p-8 flex flex-col gap-5">
      <div>
        <label htmlFor="class-name" className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t('classCreate.class_name')}</label>
        <input id="class-name" data-tour="class-name" className={inputClass} type="text" value={name}
          onChange={e => setName(e.target.value)} placeholder={t('classCreate.class_name_ph')}
          required maxLength={60} autoFocus />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="class-grade" className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t('classCreate.grade')}</label>
          <input id="class-grade" className={inputClass} type="text" value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)} placeholder={t('classCreate.grade_ph')} maxLength={30} />
        </div>
        <div>
          <label htmlFor="class-subject" className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t('classCreate.subject')}</label>
          <input id="class-subject" className={inputClass} type="text" value={subject}
            onChange={e => setSubject(e.target.value)} placeholder={t('classCreate.subject_ph')} maxLength={40} />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap pt-2">
        <button type="submit" disabled={creating || !name.trim()}
          className="btn-primary glow flex items-center gap-2 disabled:opacity-50 cursor-pointer">
          <BookOpen size={14} />{creating ? t('classCreate.creating') : t('classCreate.create')}
        </button>
        <Link to="/app/school" className="btn-outline">{t('classCreate.cancel')}</Link>
      </div>
      <p className="text-technical-sm font-technical-sm text-surface-variant mt-1">{t('classCreate.code_note')}</p>
    </form>
  </div>;
}
