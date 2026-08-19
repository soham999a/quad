import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getClass, getClassStudents, createSchoolAssessment } from '../../services/schoolService';
import { useToast } from '../../components/Toast';
import {
  Users, Plus, ClipboardList, BarChart3, Copy, ChevronRight,
  CheckCircle, Trash2,
} from 'lucide-react';

export default function ClassManager() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDesc, setAssessmentDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    Promise.all([getClass(classId), getClassStudents(classId)])
      .then(([c, s]) => { setCls(c); setStudents(s); })
      .catch(() => toast('Failed to load class', 'error'))
      .finally(() => setLoading(false));
  }, [classId]);

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
        mode: 'school',
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
    return (
      <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8"><div className="skeleton h-6 w-48 mb-4" /><div className="skeleton h-48 w-full" /></div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <div className="text-body-md font-body-md text-surface-variant">Class not found</div>
        <button onClick={() => navigate('/app/school')} className="btn-primary mt-6">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">Class Manager</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{cls.name}</h1>
        <div className="text-body-md font-body-md text-surface-variant mt-2">
          {cls.gradeLevel} · {cls.subject || 'General'}
        </div>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Class Code Card */}
      <div className="card p-6 mb-8 flex items-center justify-between">
        <div>
          <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-1">Class Join Code</div>
          <div className="text-[28px] font-technical-sm text-primary tracking-widest">{cls.classCode}</div>
        </div>
        <button onClick={copyCode} className="btn-outline flex items-center gap-2">
          <Copy size={14} />
          COPY CODE
        </button>
      </div>

      {/* Students */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="kicker">Students ({students.length})</span>
        </div>
        <div className="gradient-rule mb-4" />
        {students.length === 0 ? (
          <div className="card p-8 text-center">
            <Users size={24} className="text-surface-variant mx-auto mb-3 opacity-40" />
            <div className="text-body-sm font-body-sm text-surface-variant">
              No students have joined yet. Share the class code with your students.
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {students.map((s, i) => (
              <div key={s.id} className="card p-4 flex items-center gap-4 border-b-[0.5px] border-outline-variant">
                <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-label-md font-label-md text-on-background truncate">{s.name}</div>
                  {s.email && <div className="text-technical-sm font-technical-sm text-surface-variant truncate">{s.email}</div>}
                </div>
                <CheckCircle size={14} className="text-success flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate(`/app/school/class/${classId}/analytics`)} className="btn-outline flex items-center gap-2">
          <BarChart3 size={14} />
          VIEW ANALYTICS
        </button>
        <button onClick={() => setShowNewAssessment(true)} className="btn-primary glow flex items-center gap-2">
          <Plus size={14} />
          NEW ASSESSMENT
        </button>
      </div>

      {/* New Assessment Modal */}
      {showNewAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-8 max-w-[480px] w-full mx-4">
            <h2 className="text-headline-sm font-headline-sm text-on-background mb-6">New Class Assessment</h2>
            <div className="space-y-4">
              <div>
                <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">Title *</label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={e => setAssessmentTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Self-Assessment"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">Description (optional)</label>
                <textarea
                  value={assessmentDesc}
                  onChange={e => setAssessmentDesc(e.target.value)}
                  placeholder="Instructions for students..."
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewAssessment(false)} className="btn-outline flex-1">CANCEL</button>
              <button
                onClick={handleCreateAssessment}
                disabled={!assessmentTitle.trim() || creating}
                className="btn-primary flex-1"
              >
                {creating ? 'CREATING...' : 'CREATE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
