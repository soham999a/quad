import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInterviewSession, updateInterviewSession } from '../../services/interviewService';
import { computeInterviewResult } from '../../core/engine/interviewScoring';
import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../../core/data/interviewRubrics';
import { useToast } from '../../components/Toast';
import { Save, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

export default function InterviewPostScoring() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDimIdx, setCurrentDimIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getInterviewSession(sessionId)
      .then(s => {
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
      })
      .catch(() => toast('Failed to load session', 'error'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const currentDim = RUBRIC_DIMENSIONS[currentDimIdx];
  const currentScore = scores[currentDim?.id] || 0;
  const currentNotes = notes[currentDim?.id] || '';
  const completedCount = Object.keys(scores).filter(k => scores[k] > 0).length;
  const progress = Math.round((completedCount / RUBRIC_DIMENSIONS.length) * 100);
  const allScored = completedCount === RUBRIC_DIMENSIONS.length;

  const handleScore = (dimId, score) => {
    setScores(prev => ({ ...prev, [dimId]: score }));
  };

  const handleNotes = (dimId, text) => {
    setNotes(prev => ({ ...prev, [dimId]: text }));
  };

  const handleSave = async (andSubmit = false) => {
    if (!session || !user) return;
    setSaving(true);
    try {
      const evaluatorAssessment = RUBRIC_DIMENSIONS
        .filter(d => scores[d.id] != null && scores[d.id] > 0)
        .map(d => ({
          dimensionId: d.id,
          score: scores[d.id],
          notes: notes[d.id] || '',
        }));

      const updates = { evaluatorAssessment };

      if (andSubmit) {
        const result = computeInterviewResult({
          selfAssessment: session.selfAssessment,
          evaluatorAssessment,
          mode: session.mode || 'post',
        });
        Object.assign(updates, {
          mergedScores: result.mergedScores,
          pillarScores: result.pillarScores,
          unifiedScore: result.unifiedScore,
          grade: result.grade,
          skillShape: result.skillShape,
          careerProfile: result.careerProfile,
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      }

      await updateInterviewSession(session.id, updates);
      toast(andSubmit ? 'Session completed' : 'Draft saved', 'success');
      if (andSubmit) {
        navigate(`/app/interview/report/${session.id}`);
      }
    } catch (e) {
      console.error('Save failed:', e);
      toast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-3 w-64 mb-8" />
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
        <div className="text-body-md font-body-md text-surface-variant">Session not found</div>
        <button onClick={() => navigate('/app/interview')} className="btn-primary mt-6">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">Post-Interview Scoring</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">
          {session.candidateName || 'Candidate'}
        </h1>
        <div className="text-body-md font-body-md text-surface-variant mt-2">
          {session.role && <span>{session.role} · </span>}
          {completedCount}/{RUBRIC_DIMENSIONS.length} dimensions scored
        </div>
        <div className="gradient-rule mt-6" />
      </section>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-technical-sm font-technical-sm text-surface-variant">PROGRESS</span>
          <span className="text-technical-sm font-technical-sm text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-container-high overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Dimension Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {RUBRIC_DIMENSIONS.map((d, idx) => (
          <button
            key={d.id}
            onClick={() => setCurrentDimIdx(idx)}
            className={`px-3 py-1.5 text-technical-sm font-technical-sm uppercase tracking-widest border-[0.5px] transition-all cursor-pointer whitespace-nowrap ${
              idx === currentDimIdx
                ? 'bg-primary/10 border-primary/30 text-primary'
                : scores[d.id]
                  ? 'bg-success/10 border-success/30 text-success'
                  : 'bg-transparent border-outline-variant text-surface-variant hover:border-primary/20'
            }`}
          >
            {d.shortLabel}
            {scores[d.id] ? ` · ${scores[d.id]}` : ''}
          </button>
        ))}
      </div>

      {/* Current Dimension */}
      {currentDim && (
        <div className="card p-6 md:p-8 mb-8">
          <div className="mb-6">
            <div className="text-label-lg font-label-lg text-on-background mb-1">{currentDim.label}</div>
            <div className="text-body-sm font-body-sm text-surface-variant">{currentDim.description}</div>
            <div className="text-technical-sm font-technical-sm text-primary mt-1">Maps to: {currentDim.pillar}</div>
          </div>

          {/* Score Buttons */}
          <div className="mb-6">
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">Rating (1–5)</div>
            <div className="grid grid-cols-5 gap-2 max-w-[400px]">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => handleScore(currentDim.id, score)}
                  className={`p-3 text-center border-[0.5px] transition-all cursor-pointer ${
                    currentScore === score
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary/20'
                  }`}
                >
                  <div className="text-[20px] font-technical-sm">{score}</div>
                  <div className="text-technical-sm font-technical-sm mt-1">
                    {['', 'Emerging', 'Developing', 'Proficient', 'Strong', 'Exceptional'][score]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Descriptor */}
          {currentScore > 0 && (
            <div className="bg-surface-container-low p-4 border-[0.5px] border-outline-variant mb-6">
              <div className="text-body-sm font-body-sm text-on-surface-variant">
                <strong className="text-on-surface">Level {currentScore}:</strong> {currentDim.descriptors[currentScore]}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-2 block">Notes (optional)</label>
            <textarea
              value={currentNotes}
              onChange={e => handleNotes(currentDim.id, e.target.value)}
              placeholder="Observations, examples, or context..."
              rows={3}
              className="input-field w-full resize-none"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentDimIdx(Math.max(0, currentDimIdx - 1))}
          disabled={currentDimIdx === 0}
          className="btn-outline flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft size={14} />
          PREVIOUS
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn-outline flex items-center gap-2"
          >
            <Save size={14} />
            SAVE DRAFT
          </button>
          <button
            onClick={() => {
              if (!allScored && !window.confirm(`${RUBRIC_DIMENSIONS.length - completedCount} dimension(s) not scored. Submit anyway (unscored dimensions will be excluded)?`)) {
                return;
              }
              handleSave(true);
            }}
            disabled={saving || completedCount === 0}
            className="btn-primary glow flex items-center gap-2"
          >
            {allScored ? 'COMPLETE SCORING' : 'SUBMIT & GENERATE REPORT'}
            <ChevronRight size={14} />
          </button>
        </div>
        <button
          onClick={() => setCurrentDimIdx(Math.min(RUBRIC_DIMENSIONS.length - 1, currentDimIdx + 1))}
          disabled={currentDimIdx === RUBRIC_DIMENSIONS.length - 1}
          className="btn-outline flex items-center gap-2 disabled:opacity-30"
        >
          NEXT
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
