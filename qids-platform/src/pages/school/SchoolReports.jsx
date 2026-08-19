import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTeacherClasses } from '../../services/schoolService';
import { FileText, Download, ChevronRight, BarChart3 } from 'lucide-react';

export default function SchoolReports() {
  const { user } = useAuth();
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
    <div className="page-pad max-w-[1100px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">School Reports</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Cohort Reports</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-[640px]">
          View and export reports for your classes. Select a class to see its analytics.
        </p>
        <div className="gradient-rule mt-6" />
      </section>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="card p-6 flex items-center justify-between">
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={32} className="text-surface-variant mx-auto mb-4 opacity-40" />
          <div className="text-body-md font-body-md text-surface-variant">No classes to report on</div>
        </div>
      ) : (
        <div className="flex flex-col">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="card p-5 md:p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer border-b-[0.5px] border-outline-variant"
              onClick={() => navigate(`/app/school/class/${cls.id}/analytics`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-label-md font-label-md text-on-background">{cls.name}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant">
                    {cls.gradeLevel} · {cls.studentCount || 0} students
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={e => { e.stopPropagation(); navigate(`/app/school/class/${cls.id}/analytics`); }}
                  className="btn-outline flex items-center gap-2 text-[11px]"
                >
                  <BarChart3 size={12} />
                  ANALYTICS
                </button>
                <ChevronRight size={14} className="text-surface-variant" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
