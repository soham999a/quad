import usePageTitle from '../../lib/usePageTitle';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveInterviewSession } from '../../services/interviewService';
import { RUBRIC_DIMENSIONS } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { FileText, Play, ChevronRight, Brain } from 'lucide-react';

export default function InterviewSetup() {
  usePageTitle('Interview setup');
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState('post');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = candidateName.trim().length > 0;

  const handleStart = async () => {
    if (!canSubmit || !user) return;
    setSaving(true);
    try {
      const payload = {
        mode,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
        role: role.trim(),
        evaluatorName: userProfile?.name || user.displayName || 'Evaluator',
        evaluatorUid: user.uid,
        status: mode === 'live' ? 'in_progress' : 'scheduled',
        notes: notes.trim(),
      };
      if (mode === 'live') {
        payload.liveQuestionIndex = 0;
        payload.liveResponses = [];
      }
      const sessionId = await saveInterviewSession(payload);

      toast('Session created', 'success');
      if (mode === 'live') {
        navigate(`/app/interview/live/${sessionId}`);
      } else {
        navigate(`/app/interview/scoring/${sessionId}`);
      }
    } catch (e) {
      console.error('Failed to create session:', e);
      toast('Failed to create session', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">Interview Studio</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Setup Interview Session</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-[640px]">
          Choose your interview mode and enter candidate details to begin.
        </p>
        <div className="gradient-rule mt-6" />
      </section>

      <div className="responsive-grid-12 gap-6 md:gap-12">
        {/* Left: Form */}
        <div className="md:col-span-7 col-span-full space-y-6">
          {/* Mode Selection */}
          <div>
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-4">Interview Mode</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'post', label: 'Post-Interview', desc: 'Score after the interview completes', icon: FileText },
                { id: 'live', label: 'Live Interview', desc: 'Score in real-time during the interview', icon: Play },
              ].map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`p-4 text-left border-[0.5px] transition-all cursor-pointer ${
                    mode === id
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-outline-variant bg-surface-container-low hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon size={16} className={mode === id ? 'text-primary' : 'text-surface-variant'} />
                    <div className={`text-label-md font-label-md ${mode === id ? 'text-primary' : 'text-on-surface'}`}>{label}</div>
                  </div>
                  <div className="text-body-sm font-body-sm text-surface-variant">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Info */}
          <div className="space-y-4">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Candidate Details</div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">Full Name *</label>
              <input
                type="text"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">Email (optional)</label>
              <input
                type="email"
                value={candidateEmail}
                onChange={e => setCandidateEmail(e.target.value)}
                placeholder="alex@example.com"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">Role / Position (optional)</label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Product Manager"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">Interview Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any preparation notes or context..."
                rows={3}
                className="input-field w-full resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right: Brief */}
        <div className="md:col-span-5 col-span-full">
          <div className="card p-6 md:p-8 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-label-md font-label-md text-on-background">Assessment Brief</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant">{RUBRIC_DIMENSIONS.length} Rubric Dimensions</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {RUBRIC_DIMENSIONS.map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="text-body-sm font-body-sm text-on-surface-variant">{d.label}</div>
                </div>
              ))}
            </div>

            <div className="gradient-rule mb-6" />

            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">You'll Receive</div>
            <div className="space-y-2 mb-6">
              {[
                'Per-dimension scores (1–5 scale)',
                'QIDS pillar scores (IQ, EQ, SQ, AQ)',
                'Unified score + grade',
                'Skill shape classification',
                'Career alignment profile',
                'Downloadable credential',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-body-sm font-body-sm text-on-surface-variant">{item}</div>
                </div>
              ))}
            </div>

            {mode === 'post' && (
              <>
                <div className="gradient-rule mb-6" />
                <div className="bg-surface-container-low p-4 border-[0.5px] border-outline-variant">
                  <div className="text-body-sm font-body-sm text-on-surface-variant">
                    <strong className="text-on-surface">Post-Interview Mode:</strong> The candidate will complete a self-assessment first, then you'll score them. Final scores are merged 60% self + 40% evaluator.
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleStart}
              disabled={!canSubmit || saving}
              className="btn-primary glow w-full mt-6"
            >
              {saving ? 'CREATING...' : mode === 'live' ? 'START LIVE SESSION' : 'CREATE SESSION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
