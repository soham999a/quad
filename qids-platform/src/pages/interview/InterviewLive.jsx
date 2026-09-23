import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInterviewSession, updateInterviewSession } from '../../services/interviewService';
import { computeInterviewResult } from '../../core/engine/interviewScoring';
import { LIVE_QUESTIONS, RUBRIC_MAP } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { Play, Pause, ChevronRight, ChevronLeft, CheckCircle, Clock } from 'lucide-react';
export default function InterviewLive() {
  const {
    t
  } = useTranslation();
  usePageTitle('Live interview');
  const {
    sessionId
  } = useParams();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getInterviewSession(sessionId).then(s => {
      setSession(s);
      setQuestionIdx(s?.liveQuestionIndex || 0);
      setScores({});
      setNotes({});
    }).catch(() => toast('Failed to load session', 'error')).finally(() => setLoading(false));
  }, [sessionId]);

  // Timer
  useEffect(() => {
    if (!session || session.status === 'completed' || paused) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [session?.status, paused]);
  const currentQuestion = LIVE_QUESTIONS[questionIdx];
  const currentDim = currentQuestion ? RUBRIC_MAP[currentQuestion.dimension] : null;
  const totalQuestions = LIVE_QUESTIONS.length;
  const answeredCount = Object.keys(scores).length;
  const isComplete = answeredCount === totalQuestions && Object.values(scores).every(s => s > 0);
  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const handleScore = (qId, score) => {
    setScores(prev => ({
      ...prev,
      [qId]: score
    }));
  };
  const handleNotes = (qId, text) => {
    setNotes(prev => ({
      ...prev,
      [qId]: text
    }));
  };
  const handleSaveProgress = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await updateInterviewSession(session.id, {
        liveQuestionIndex: questionIdx,
        liveResponses: LIVE_QUESTIONS.map(q => ({
          questionId: q.id,
          response: '',
          score: scores[q.id] || null
        }))
      });
      toast('Progress saved', 'success');
    } catch (e) {
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleComplete = async () => {
    if (!session || !isComplete) return;
    setSaving(true);
    try {
      // Build evaluator assessment from live scores
      const dimScores = {};
      LIVE_QUESTIONS.forEach(q => {
        if (!dimScores[q.dimension]) dimScores[q.dimension] = [];
        dimScores[q.dimension].push(scores[q.id]);
      });
      const evaluatorAssessment = Object.entries(dimScores).map(([dimId, dimScoreList]) => ({
        dimensionId: dimId,
        score: Math.round(dimScoreList.reduce((a, b) => a + b, 0) / dimScoreList.length),
        notes: ''
      }));
      const result = computeInterviewResult({
        selfAssessment: undefined,
        evaluatorAssessment,
        mode: 'live'
      });
      await updateInterviewSession(session.id, {
        evaluatorAssessment,
        liveQuestionIndex: questionIdx,
        liveResponses: LIVE_QUESTIONS.map(q => ({
          questionId: q.id,
          response: '',
          score: scores[q.id] || null
        })),
        mergedScores: result.mergedScores,
        pillarScores: result.pillarScores,
        unifiedScore: result.unifiedScore,
        grade: result.grade,
        skillShape: result.skillShape,
        careerProfile: result.careerProfile,
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      toast('Interview completed!', 'success');
      navigate(`/app/interview/report/${session.id}`);
    } catch (e) {
      console.error('Complete failed:', e);
      toast('Failed to complete', 'error');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>;
  }
  if (!session) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <div className="text-body-md font-body-md text-surface-variant">{t("InterviewLive.session_not_found")}</div>
        <button onClick={() => navigate('/app/interview')} className="btn-primary mt-6">{t("InterviewLive.back_to_dashboard")}</button>
      </div>;
  }
  return <div className="page-pad max-w-[960px] mx-auto animate-fade">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="kicker mb-2">{t("InterviewLive.live_interview")}</div>
          <h1 className="text-headline-sm font-headline-sm text-on-background">
            {session.candidateName || 'Candidate'}
          </h1>
          {session.role && <div className="text-body-sm font-body-sm text-surface-variant">{session.role}</div>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border-[0.5px] border-outline-variant">
            <Clock size={14} className="text-primary" />
            <span className="text-technical-sm font-technical-sm text-on-surface tabular-nums">{formatTime(elapsed)}</span>
          </div>
          <div className="text-technical-sm font-technical-sm text-surface-variant">
            {answeredCount}/{totalQuestions}
          </div>
          <button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume timer' : 'Pause timer'} title={paused ? 'Resume' : 'Pause'} className="flex items-center gap-2 px-3 py-2 bg-surface-container-high border-[0.5px] border-outline-variant text-body-sm font-body-sm text-on-surface cursor-pointer hover:bg-surface-container transition-colors">
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="h-1 bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{
          width: `${questionIdx / totalQuestions * 100}%`
        }} />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && <div className="card p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="chip text-[10px]" style={{
          background: 'var(--gold-tint)',
          color: 'var(--color-primary)',
          borderColor: 'var(--gold-line)'
        }}>
              Q{questionIdx + 1}/{totalQuestions}
            </span>
            {currentDim && <span className="text-technical-sm font-technical-sm text-primary">{currentDim.label}</span>}
          </div>

          <div className="text-body-lg font-body-lg text-on-background mb-4 leading-relaxed">
            {currentQuestion.text}
          </div>

          {currentQuestion.context && <div className="text-body-sm font-body-sm text-surface-variant italic mb-6">
              {currentQuestion.context}
            </div>}

          {/* Score Buttons */}
          <div className="mb-6">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("InterviewLive.rating")}</div>
            <div className="grid grid-cols-5 gap-2 max-w-[400px]">
              {[1, 2, 3, 4, 5].map(score => <button key={score} onClick={() => handleScore(currentQuestion.id, score)} className={`p-3 text-center border-[0.5px] transition-all cursor-pointer ${scores[currentQuestion.id] === score ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/20'}`}>
                  <div className="text-[20px] font-technical-sm">{score}</div>
                  <div className="text-technical-sm font-technical-sm mt-1">
                    {['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][score]}
                  </div>
                </button>)}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-2 block">{t("InterviewLive.notes_optional")}</label>
            <textarea value={notes[currentQuestion.id] || ''} onChange={e => handleNotes(currentQuestion.id, e.target.value)} placeholder={t("InterviewLive.observations_about_the_candidate")} rows={2} className="input-field w-full resize-none" />
          </div>

          {/* Follow-up */}
          {currentQuestion.followUp && <div className="mt-4 bg-surface-container-low p-3 border-[0.5px] border-outline-variant">
              <div className="text-technical-sm font-technical-sm text-surface-variant">{t("inter.follow_up", { x: currentQuestion.followUp })}</div>
            </div>}
        </div>}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setQuestionIdx(Math.max(0, questionIdx - 1))} disabled={questionIdx === 0} className="btn-outline flex items-center gap-2 disabled:opacity-30">
          <ChevronLeft size={14} />{t("InterviewLive.previous")}</button>
        <div className="flex gap-3">
          <button onClick={handleSaveProgress} disabled={saving} className="btn-outline">{t("InterviewLive.save")}</button>
          {isComplete && <button onClick={handleComplete} disabled={saving} className="btn-primary glow flex items-center gap-2">
              <CheckCircle size={14} />{t("InterviewLive.complete")}</button>}
        </div>
        <button onClick={() => setQuestionIdx(Math.min(totalQuestions - 1, questionIdx + 1))} disabled={questionIdx === totalQuestions - 1} className="btn-outline flex items-center gap-2 disabled:opacity-30">{t("InterviewLive.next")}<ChevronRight size={14} />
        </button>
      </div>
    </div>;
}