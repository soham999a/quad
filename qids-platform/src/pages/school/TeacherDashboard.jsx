import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTeacherClasses } from '../../services/schoolService';
import {
  Users, BookOpen, Plus, ChevronRight, ClipboardList, BarChart3,
} from 'lucide-react';
import SeedSchoolData from '../../components/SeedSchoolData';

export default function TeacherDashboard() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getTeacherClasses(user.uid)
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="page-pad max-w-[1280px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">School</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Teacher Dashboard</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-[640px]">
          Manage your classes, invite students, and view cohort analytics.
        </p>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Stats */}
      <section className="responsive-grid-3 gap-3 md:gap-4 w-full mb-10 md:mb-16">
        {[
          { label: 'CLASSES', value: classes.length, icon: BookOpen },
          { label: 'TOTAL STUDENTS', value: classes.reduce((s, c) => s + (c.studentCount || 0), 0), icon: Users },
          { label: 'ASSESSMENTS', value: classes.reduce((s, c) => s + (c.assessmentCount || 0), 0), icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5 md:p-6">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <span className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon size={13} className="text-primary" />
              </span>
              <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">{label}</div>
            </div>
            <div className="text-[24px] md:text-[28px] font-technical-sm text-on-background">{value}</div>
          </div>
        ))}
      </section>

      {/* New Class Button */}
      <div className="flex items-center justify-between mb-6">
        <span className="kicker">Your Classes</span>
        <button
          onClick={() => navigate('/app/school/create')}
          className="btn-primary glow flex items-center gap-2"
        >
          <Plus size={14} />
          NEW CLASS
        </button>
      </div>

      {/* Classes List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="card p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10" />
                <div>
                  <div className="skeleton h-3 w-48 mb-2" />
                  <div className="skeleton h-2.5 w-32" />
                </div>
              </div>
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <SeedSchoolData onDone={() => {
          getTeacherClasses(user.uid).then(setClasses).catch(() => {});
        }} />
      ) : (
        <div className="flex flex-col">
          {classes.map(cls => (
            <div
              key={cls.id}
              onClick={() => navigate(`/app/school/class/${cls.id}`)}
              className="card p-5 md:p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer border-b-[0.5px] border-outline-variant"
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-label-md font-label-md text-on-background truncate">{cls.name}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant truncate">
                    {cls.gradeLevel} · {cls.subject || 'General'} · Code: {cls.classCode}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                <div className="text-right">
                  <div className="text-label-md font-label-md text-on-background">{cls.studentCount || 0}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">students</div>
                </div>
                <ChevronRight size={14} className="text-surface-variant flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
