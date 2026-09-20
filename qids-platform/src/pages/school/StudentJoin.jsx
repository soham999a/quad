import usePageTitle from '../../lib/usePageTitle';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { joinClass } from '../../services/schoolService';
import { useToast } from '../../components/Toast';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

export default function StudentJoin() {
  usePageTitle('Join a class');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim() || !user) return;
    setJoining(true);
    try {
      const classId = await joinClass(user.uid, userProfile?.name || user.displayName || 'Student', code.trim().toUpperCase());
      toast('Joined class successfully!', 'success');
      navigate(`/app/school/class/${classId}`);
    } catch (e) {
      toast(e.message || 'Invalid class code', 'error');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="page-pad max-w-[480px] mx-auto animate-fade py-16 md:py-24">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <BookOpen size={28} className="text-primary" />
        </div>
        <h1 className="text-headline-md font-headline-md text-on-background mb-2">Join a Class</h1>
        <p className="text-body-md font-body-md text-surface-variant">
          Enter the class code from your teacher to join.
        </p>
      </div>

      <div className="card p-8">
        <div className="mb-6">
          <label className="text-label-sm font-label-sm text-on-surface mb-2 block">Class Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            maxLength={6}
            className="input-field w-full text-center text-[24px] font-technical-sm tracking-[0.3em]"
          />
          <div className="text-technical-sm font-technical-sm text-surface-variant mt-2 text-center">
            6-character code provided by your teacher
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={code.length < 6 || joining}
          className="btn-primary glow w-full flex items-center justify-center gap-2"
        >
          {joining ? 'JOINING...' : 'JOIN CLASS'}
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="text-center mt-8">
        <button onClick={() => navigate('/app/dashboard')} className="text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}
