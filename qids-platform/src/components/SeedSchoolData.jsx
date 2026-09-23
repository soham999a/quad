import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createClass, joinClass } from '../services/schoolService';
import { useToast } from './Toast';
import { BookOpen, Loader } from 'lucide-react';
const SAMPLE_CLASSES = [{
  name: 'Grade 10 — Section A',
  gradeLevel: '10',
  subject: 'General Studies'
}, {
  name: 'Grade 11 — Science',
  gradeLevel: '11',
  subject: 'Science'
}];
const SAMPLE_STUDENTS = ['Emma Wilson', 'Liam Patel', 'Olivia Nguyen', 'Noah Garcia', 'Ava Kim', 'Ethan Brown'];
export default function SeedSchoolData({
  onDone
}) {
  const {
    t
  } = useTranslation();
  const {
    user,
    userProfile
  } = useAuth();
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);
  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      for (const cls of SAMPLE_CLASSES) {
        const {
          id: classId,
          classCode
        } = await createClass({
          name: cls.name,
          gradeLevel: cls.gradeLevel,
          subject: cls.subject,
          teacherUid: user.uid,
          teacherName: userProfile?.name || user.displayName || 'Teacher'
        });

        // Add sample students (they just join via class code)
        for (const studentName of SAMPLE_STUDENTS.slice(0, Math.floor(Math.random() * 3) + 3)) {
          try {
            await joinClass(`seed-${studentName.replace(/\s/g, '-').toLowerCase()}`, studentName, classCode);
          } catch {/* some may fail — that's fine */}
        }
      }
      toast('Seeded 2 classes with students', 'success');
      onDone?.();
    } catch (e) {
      console.error('Seed failed:', e);
      toast('Seed failed — check console', 'error');
    } finally {
      setSeeding(false);
    }
  };
  return <div className="card p-8 text-center">
      <BookOpen size={32} className="text-surface-variant mx-auto mb-4 opacity-40" />
      <div className="text-label-md font-label-md text-on-background mb-2">{t("SeedSchoolData.no_classes_yet")}</div>
      <div className="text-body-sm font-body-sm text-surface-variant mb-6">{t("SeedSchoolData.seed_2_sample_classes")}</div>
      <button onClick={handleSeed} disabled={seeding} className="btn-primary glow mx-auto flex items-center gap-2">
        {seeding ? <Loader size={14} className="animate-spin" /> : null}
        {seeding ? 'SEEDING...' : 'SEED SAMPLE DATA'}
      </button>
    </div>;
}