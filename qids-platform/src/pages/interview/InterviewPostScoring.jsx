import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInterviewSession, updateInterviewSession, subscribeSession } from '../../services/interviewService';
import { notifyInterviewResult } from '../../services/notificationService';
import { computeInterviewResult } from '../../core/engine/interviewScoring';
import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { Save, ChevronRight, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
export default function InterviewPostScoring() {
  const {
    t
  } = useTranslation();
  usePageTitle('Post-interview scoring');
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
  const [currentDimIdx, setCurrentDimIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);
  // Saved-and-submitted closing screen. Completing an interview used to be a
  // toast plus an instant redirect — nothing that said "this is finished".
  const [finished, setFinished] = useState(null);
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getInterviewSession(sessionId).then(s => {
      setSession(s);
      // Pre-fill existing scores
      if (s?.evaluatorAssessment) {
        const map = {};
        const noteMap = {};
        s.evaluatorAssessment.forEach(e => {
          map[e.dimensionId] = e.score;
          if (e.notes) noteMap[e.dimensionId] = e.notes;
        });
        setScores(map);
        setNotes(noteMap);
      }
    }).catch(() => toast('Failed to load session', 'error')).finally(() => setLoading(false));
  }, [sessionId]);
  // Live mirror of the candidate's side. Post mode runs in parallel: the
  // evaluator scores on their screen while the candidate rates themselves on
  // theirs, and the 60/40 merge needs both. Without this subscription the
  // evaluator had no idea whether the candidate had even started — they were
  // scoring blind against a person who might still be mid-self-assessment.
  const [candidateStatus, setCandidateStatus] = useState(null);
  useEffect(() => {
    if (!sessionId) return undefined;
    return subscribeSession(sessionId, s => {
      setCandidateStatus(s ? {
        status: s.status,
        selfDone: (s.selfAssessment?.length || 0) > 0,
        selfCount: s.selfAssessment?.length || 0,
      } : null);
    });
  }, [sessionId]);

  const currentDim = RUBRIC_DIMENSIONS[currentDimIdx];
  const currentScore = scores[currentDim?.id] || 0;
  const currentNotes = notes[currentDim?.id] || '';
  const completedCount = Object.keys(scores).filter(k => scores[k] > 0).length;
  const progress = Math.round(completedCount / RUBRIC_DIMENSIONS.length * 100);
  const allScored = completedCount === RUBRIC_DIMENSIONS.length;
  const handleScore = (dimId, score) => {
    setScores(prev => ({
      ...prev,
      [dimId]: score
    }));
  };
  const handleNotes = (dimId, text) => {
    setNotes(prev => ({
      ...prev,
      [dimId]: text
    }));
  };
  const handleSave = async (andSubmit = false) => {
    if (!session || !user) return;
    setSaving(true);
    try {
      const evaluatorAssessment = RUBRIC_DIMENSIONS.filter(d => scores[d.id] != null && scores[d.id] > 0).map(d => ({
        dimensionId: d.id,
        score: scores[d.id],
        notes: notes[d.id] || ''
      }));
      const updates = {
        evaluatorAssessment
      };
      if (andSubmit) {
        const result = computeInterviewResult({
          selfAssessment: session.selfAssessment,
          evaluatorAssessment,
          mode: session.mode || 'post'
        });
        Object.assign(updates, {
          mergedScores: result.mergedScores,
          pillarScores: result.pillarScores,
          unifiedScore: result.unifiedScore,
          grade: result.grade,
          skillShape: result.skillShape,
          careerProfile: result.careerProfile,
          status: 'completed',
          completedAt: new Date().toISOString()
        });
      }
      await updateInterviewSession(session.id, updates);
      toast(andSubmit ? 'Session completed' : 'Draft saved', 'success');
      if (andSubmit) {
        // Bell as a record: the completed session lands in the evaluator's
        // feed with a direct link (candidate copy goes out only when the
        // candidate is a platform user). Fire-and-forget.
        notifyInterviewResult({
          candidateUid: session.candidateUid || null,
          evaluatorUid: session.evaluatorUid,
          candidateName: session.candidateName,
          evaluatorName: session.evaluatorName,
          sessionId: session.id,
          mode: session.mode || 'post',
        });
        // Report navigation belongs to the ending screen, not to here.
        setFinished({
          unifiedScore: result.unifiedScore,
          grade: result.grade,
          scored: evaluatorAssessment.length,
        });
      }
    } catch (e) {
      console.error('Save failed:', e);
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-3 w-64 mb-8" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>;
  }
  if (!session) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
        <div className="text-body-md font-body-md text-surface-variant">{t("InterviewPostScoring.session_not_found")}</div>
        <button onClick={() => navigate('/app/interview')} className="btn-primary mt-6">{t("InterviewPostScoring.back_to_dashboard")}</button>
      </div>;
  }

  // ── The ending moment ────────────────────────────────────────────────────
  if (finished) {
    const selfCount = session.selfAssessment?.length || 0;
    const selfGiven = session.mode === 'live' ? false : selfCount > 0;
    return <div className="page-pad max-w-[720px] mx-auto py-16 text-center animate-fade">
        <CheckCircle size={36} className="text-primary mx-auto mb-4" />
        <div className="kicker mb-2">Interview ended</div>
        <h1 className="text-headline-md font-headline-md text-on-background mb-4">Scoring complete</h1>
        <p className="text-body-md text-on-surface-variant mb-8 max-w-[520px] mx-auto leading-relaxed">
          {session.candidateName || 'Your candidate'}'s post-interview is scored and closed.
          The report is built and they've been notified.
        </p>

        <div className="grid grid-cols-3 gap-3 max-w-[480px] mx-auto mb-8">
          {[
            { label: 'SCORE', value: finished.unifiedScore != null ? Math.round(finished.unifiedScore) : '—' },
            { label: 'GRADE', value: finished.grade?.grade || '—' },
            { label: 'RATED', value: `${finished.scored}/${RUBRIC_DIMENSIONS.length}` },
          ].map(s => (
            <div key={s.label} className="card px-3 py-4">
              <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-1.5">{s.label}</div>
              <div className="text-headline-sm font-headline-sm text-on-background mono-numbers">{s.value}</div>
            </div>
          ))}
        </div>

        <p className="text-body-sm text-on-surface-variant mb-8 max-w-[480px] mx-auto">
          {selfGiven
            ? `Merged ${selfCount} of their self-assessments with your independent ratings — 60% them, 40% you.`
            : 'Your ratings stand alone as the scoring record for this session.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate(`/app/interview/report/${session.id}`)} className="btn-primary glow inline-flex items-center gap-2 cursor-pointer">
            Open the report <ChevronRight size={14} />
          </button>
          <button onClick={() => navigate('/app/interview')} className="btn-outline cursor-pointer">
            {t("InterviewPostScoring.back_to_dashboard")}
          </button>
        </div>
      </div>;
  }
  return <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">{t("InterviewPostScoring.post_interview_scoring")}</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">
          {session.candidateName || 'Candidate'}
        </h1>
        <div className="text-body-md font-body-md text-surface-variant mt-2">
          {session.role && <span>{session.role} · </span>}
          {completedCount}/{RUBRIC_DIMENSIONS.length} dimensions scored
        </div>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Candidate status — the other half of this merge, live */}
      {candidateStatus && session?.mode !== 'live' && (
        <div className="flex items-start gap-2.5 border-[0.5px] border-outline-variant bg-surface-container-low px-4 py-3 mb-8" style={{ borderRadius: '6px' }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{
            background: candidateStatus.selfDone ? 'var(--color-primary)' : 'var(--gold)',
          }} />
          <div className="min-w-0">
            <div className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{
              color: candidateStatus.selfDone ? 'var(--color-primary)' : 'var(--gold)',
            }}>
              {candidateStatus.selfDone ? 'Self-assessment received' : 'Waiting on the candidate'}
            </div>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {candidateStatus.selfDone
                ? `${session.candidateName || 'They'} rated ${candidateStatus.selfCount}/${RUBRIC_DIMENSIONS.length} dimensions. Score independently — the merge is 60% them / 40% you.`
                : `${session.candidateName || 'The candidate'} is still doing their self-assessment. You can start scoring now; the merge picks up their ratings when they submit.`}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-technical-sm font-technical-sm text-surface-variant">{t("InterviewPostScoring.progress")}</span>
          <span className="text-technical-sm font-technical-sm text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{
          width: `${progress}%`
        }} />
        </div>
      </div>

      {/* Dimension Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {RUBRIC_DIMENSIONS.map((d, idx) => <button key={d.id} onClick={() => setCurrentDimIdx(idx)} className={`px-3 py-1.5 text-technical-sm font-technical-sm uppercase tracking-widest border-[0.5px] transition-all cursor-pointer whitespace-nowrap ${idx === currentDimIdx ? 'bg-primary/10 border-primary/30 text-primary' : scores[d.id] ? 'bg-success/10 border-success/30 text-success' : 'bg-transparent border-outline-variant text-surface-variant hover:border-primary/20'}`}>
            {d.shortLabel}
            {scores[d.id] ? ` · ${scores[d.id]}` : ''}
          </button>)}
      </div>

      {/* Current Dimension */}
      {currentDim && <div className="card p-6 md:p-8 mb-8">
          <div className="mb-6">
            <div className="text-label-lg font-label-lg text-on-background mb-1">{currentDim.label}</div>
            <div className="text-body-sm font-body-sm text-surface-variant">{currentDim.description}</div>
            <div className="text-technical-sm font-technical-sm text-primary mt-1">{t("inter.maps_to", { x: currentDim.pillar })}</div>
          </div>

          {/* Score Buttons */}
          <div className="mb-6">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{t("InterviewPostScoring.rating_1_5")}</div>
            <div className="grid grid-cols-5 gap-2 max-w-[400px]">
              {[1, 2, 3, 4, 5].map(score => <button key={score} onClick={() => handleScore(currentDim.id, score)} className={`p-3 text-center border-[0.5px] transition-all cursor-pointer ${currentScore === score ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/20'}`}>
                  <div className="text-[20px] font-technical-sm">{score}</div>
                  <div className="text-technical-sm font-technical-sm mt-1">
                    {['', 'Emerging', 'Developing', 'Proficient', 'Strong', 'Exceptional'][score]}
                  </div>
                </button>)}
            </div>
          </div>

          {/* Descriptor */}
          {currentScore > 0 && <div className="bg-surface-container-low p-4 border-[0.5px] border-outline-variant mb-6">
              <div className="text-body-sm font-body-sm text-on-surface-variant">
                <strong className="text-on-surface">{t("inter.level_n", { n: currentScore })}</strong> {currentDim.descriptors[currentScore]}
              </div>
            </div>}

          {/* Notes */}
          <div>
            <label className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-2 block">{t("InterviewPostScoring.notes_optional")}</label>
            <textarea value={currentNotes} onChange={e => handleNotes(currentDim.id, e.target.value)} placeholder={t("InterviewPostScoring.observations_examples_or_context")} rows={3} className="input-field w-full resize-none" />
          </div>
        </div>}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentDimIdx(Math.max(0, currentDimIdx - 1))} disabled={currentDimIdx === 0} className="btn-outline flex items-center gap-2 disabled:opacity-30">
          <ChevronLeft size={14} />{t("InterviewPostScoring.previous")}</button>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-outline flex items-center gap-2">
            <Save size={14} />{t("InterviewPostScoring.save_draft")}</button>
          <button onClick={() => {
          if (!allScored && !window.confirm(`${RUBRIC_DIMENSIONS.length - completedCount} dimension(s) not scored. Submit anyway (unscored dimensions will be excluded)?`)) {
            return;
          }
          handleSave(true);
        }} disabled={saving || completedCount === 0} className="btn-primary glow flex items-center gap-2">
            {allScored ? 'COMPLETE SCORING' : 'SUBMIT & GENERATE REPORT'}
            <ChevronRight size={14} />
          </button>
        </div>
        <button onClick={() => setCurrentDimIdx(Math.min(RUBRIC_DIMENSIONS.length - 1, currentDimIdx + 1))} disabled={currentDimIdx === RUBRIC_DIMENSIONS.length - 1} className="btn-outline flex items-center gap-2 disabled:opacity-30">{t("InterviewPostScoring.next")}<ChevronRight size={14} />
        </button>
      </div>
    </div>;
}