import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { saveInterviewSession } from '../../services/interviewService';
import { generateInterviewQuestions } from '../../services/groqService';
import { RUBRIC_DIMENSIONS } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { FileText, Play, ChevronRight, Brain, Sparkles } from 'lucide-react';
export default function InterviewSetup() {
  const {
    t
  } = useTranslation();
  usePageTitle('Interview setup');
  const {
    user,
    userProfile
  } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState('post');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [role, setRole] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState(true);
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
        notes: notes.trim()
      };
      if (mode === 'live') {
        payload.liveQuestionIndex = 0;
        payload.liveResponses = [];
        // Role-aware question generation. If the AI call fails, the live page
        // transparently falls back to the standard bank — a session can always start.
        if (aiQuestions) {
          setGenerating(true);
          try {
            const generated = await generateInterviewQuestions({
              role: role.trim(),
              candidateName: candidateName.trim(),
              notes: notes.trim(),
            });
            if (generated.length >= 4) {
              payload.liveQuestions = generated;
              payload.questionsSource = 'ai';
            }
          } catch (err) {
            console.warn('AI question generation failed, using standard bank:', err?.message);
          } finally {
            setGenerating(false);
          }
        }
      }
      const sessionId = await saveInterviewSession(payload);
      toast('Session created', 'success');
      if (payload.liveQuestions) toast(`${payload.liveQuestions.length} questions generated for this role`, 'success');
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
  return <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">{t("InterviewSetup.interview_studio")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">{t("InterviewSetup.setup_interview_session")}</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-[640px]">{t("InterviewSetup.choose_your_interview_mode")}</p>
        <div className="gradient-rule mt-6" />
      </section>

      <div className="responsive-grid-12 gap-6 md:gap-12">
        {/* Left: Form */}
        <div className="md:col-span-7 col-span-full space-y-6">
          {/* Mode Selection */}
          <div>
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-4">{t("InterviewSetup.interview_mode")}</div>
            <div className="grid grid-cols-2 gap-3">
              {[{
              id: 'post',
              label: 'Post-Interview',
              desc: 'Score after the interview completes',
              icon: FileText
            }, {
              id: 'live',
              label: 'Live Interview',
              desc: 'Score in real-time during the interview',
              icon: Play
            }].map(({
              id,
              label,
              desc,
              icon: Icon
            }) => <button key={id} onClick={() => setMode(id)} className={`p-4 text-left border-[0.5px] transition-all cursor-pointer ${mode === id ? 'border-primary/50 bg-primary/5' : 'border-outline-variant bg-surface-container-low hover:border-primary/20'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon size={16} className={mode === id ? 'text-primary' : 'text-surface-variant'} />
                    <div className={`text-label-md font-label-md ${mode === id ? 'text-primary' : 'text-on-surface'}`}>{label}</div>
                  </div>
                  <div className="text-body-sm font-body-sm text-surface-variant">{desc}</div>
                </button>)}
            </div>
          </div>

          {/* Candidate Info */}
          <div className="space-y-4">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">{t("InterviewSetup.candidate_details")}</div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t("InterviewSetup.full_name")}</label>
              <input type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder={t("InterviewSetup.e_g_alex_morgan")} className="input-field w-full" />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t("InterviewSetup.email_optional")}</label>
              <input type="email" autoComplete="email" value={candidateEmail} onChange={e => setCandidateEmail(e.target.value)} placeholder={t("InterviewSetup.alex_example_com")} className="input-field w-full" />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t("InterviewSetup.role_position_optional")}</label>
              <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder={t("InterviewSetup.e_g_product_manager")} className="input-field w-full" />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface mb-1.5 block">{t("InterviewSetup.interview_notes_optional")}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("InterviewSetup.any_preparation_notes_or")} rows={3} className="input-field w-full resize-none" />
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
                <div className="text-label-md font-label-md text-on-background">{t("InterviewSetup.assessment_brief")}</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant">{RUBRIC_DIMENSIONS.length} Rubric Dimensions</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {RUBRIC_DIMENSIONS.map(d => <div key={d.id} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <div className="text-body-sm font-body-sm text-on-surface-variant">{d.label}</div>
                </div>)}
            </div>

            <div className="gradient-rule mb-6" />

            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("InterviewSetup.you_ll_receive")}</div>
            <div className="space-y-2 mb-6">
              {['Per-dimension scores (1–5 scale)', 'QIDS pillar scores (IQ, EQ, SQ, AQ)', 'Unified score + grade', 'Skill shape classification', 'Career alignment profile', 'Downloadable credential'].map(item => <div key={item} className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-body-sm font-body-sm text-on-surface-variant">{item}</div>
                </div>)}
            </div>

            {mode === 'post' && <>
                <div className="gradient-rule mb-6" />
                <div className="bg-surface-container-low p-4 border-[0.5px] border-outline-variant">
                  <div className="text-body-sm font-body-sm text-on-surface-variant">
                    <strong className="text-on-surface">{t("InterviewSetup.post_interview_mode")}</strong>{t("InterviewSetup.the_candidate_will_complete")}</div>
                </div>
              </>}

            <button onClick={handleStart} disabled={!canSubmit || saving || generating} className="btn-primary glow w-full mt-6">
              {generating ? 'GENERATING QUESTIONS…' : saving ? 'CREATING...' : mode === 'live' ? (aiQuestions ? 'GENERATE & START' : 'START LIVE SESSION') : 'CREATE SESSION'}
            </button>
            {mode === 'live' && <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none">
                <input type="checkbox" checked={aiQuestions} onChange={e => setAiQuestions(e.target.checked)} className="accent-[var(--primary)] cursor-pointer" />
                <span className="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary" />AI-generate questions for this role
                </span>
              </label>}
          </div>
        </div>
      </div>
    </div>;
}