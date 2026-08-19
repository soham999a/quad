import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveInterviewSession, updateInterviewSession } from '../services/interviewService';
import { RUBRIC_DIMENSIONS } from '../core/data/interviewRubrics';
import { computeInterviewResult } from '../core/engine/interviewScoring';
import { useToast } from './Toast';
import { Users, Loader } from 'lucide-react';

const SAMPLE_CANDIDATES = [
  { name: 'Alex Morgan', role: 'Product Manager' },
  { name: 'Jordan Lee', role: 'Software Engineer' },
  { name: 'Sam Rivera', role: 'Data Analyst' },
  { name: 'Taylor Chen', role: 'UX Designer' },
];

function randomScore(min = 2, max = 5) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function SeedInterviewData({ onDone }) {
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      for (const candidate of SAMPLE_CANDIDATES) {
        const isPost = Math.random() > 0.4;
        const selfAssessment = isPost ? RUBRIC_DIMENSIONS.map(d => ({
          dimensionId: d.id,
          score: randomScore(),
        })) : undefined;

        const evaluatorAssessment = RUBRIC_DIMENSIONS.map(d => ({
          dimensionId: d.id,
          score: randomScore(),
        }));

        const result = computeInterviewResult({
          selfAssessment,
          evaluatorAssessment,
          mode: isPost ? 'post' : 'live',
        });

        const sessionId = await saveInterviewSession({
          mode: isPost ? 'post' : 'live',
          candidateName: candidate.name,
          role: candidate.role,
          evaluatorName: userProfile?.name || user.displayName || 'Evaluator',
          evaluatorUid: user.uid,
          status: 'completed',
          selfAssessment,
          evaluatorAssessment,
          mergedScores: result.mergedScores,
          pillarScores: result.pillarScores,
          unifiedScore: result.unifiedScore,
          grade: result.grade,
          skillShape: result.skillShape,
          completedAt: new Date().toISOString(),
        });
      }

      toast('Seeded 4 interview sessions', 'success');
      onDone?.();
    } catch (e) {
      console.error('Seed failed:', e);
      toast('Seed failed — check console', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="card p-8 text-center">
      <Users size={32} className="text-surface-variant mx-auto mb-4 opacity-40" />
      <div className="text-label-md font-label-md text-on-background mb-2">No interview sessions yet</div>
      <div className="text-body-sm font-body-sm text-surface-variant mb-6">
        Seed 4 sample interview sessions with random scores to see how the dashboard looks.
      </div>
      <button onClick={handleSeed} disabled={seeding} className="btn-primary glow mx-auto flex items-center gap-2">
        {seeding ? <Loader size={14} className="animate-spin" /> : null}
        {seeding ? 'SEEDING...' : 'SEED SAMPLE DATA'}
      </button>
    </div>
  );
}
