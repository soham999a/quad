import type {
  RubricEvaluation, RubricDimensionId, PillarScores, PillarId,
  InterviewSession, InterviewMode,
} from '../types';
import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../data/interviewRubrics';
import { getGrade, computeWeightedScore } from '../../data/qidsData';
import { getSkillShape, getCareerProfile } from './scoring';

/**
 * Merge self + evaluator assessments into a single score per dimension.
 *
 * Post-interview mode: 60% self + 40% evaluator.
 * Live interview mode: 100% evaluator (self-assessment is null).
 */
export function mergeInterviewScores(
  selfAssessment: RubricEvaluation[] | undefined,
  evaluatorAssessment: RubricEvaluation[],
  mode: InterviewMode,
): Record<RubricDimensionId, number> {
  const merged: Record<string, number> = {};

  for (const dim of RUBRIC_DIMENSIONS) {
    const selfEval = selfAssessment?.find(e => e.dimensionId === dim.id);
    const evEval = evaluatorAssessment.find(e => e.dimensionId === dim.id);
    const selfScore = selfEval?.score ?? 3;
    const evScore = evEval?.score ?? 3;

    if (mode === 'live') {
      merged[dim.id] = evScore;
    } else {
      // Post mode: 60% self, 40% evaluator
      merged[dim.id] = Math.round((selfScore * 0.6 + evScore * 0.4) * 10) / 10;
    }
  }

  return merged as Record<RubricDimensionId, number>;
}

/**
 * Map rubric dimension scores (1–5) to QIDS pillar scores (0–100).
 *
 * Each dimension maps to a pillar (IQ, EQ, SQ, AQ).
 * Pillar score = average of mapped dimensions, scaled to 0–100.
 */
export function rubricToPillarScores(
  mergedScores: Record<RubricDimensionId, number>,
): PillarScores {
  const pillarBuckets: Record<PillarId, number[]> = {
    IQ: [], EQ: [], SQ: [], AQ: [],
  };

  for (const dim of RUBRIC_DIMENSIONS) {
    const score = mergedScores[dim.id] ?? 3;
    // Scale 1–5 to 0–100
    const scaled = ((score - 1) / 4) * 100;
    pillarBuckets[dim.pillar].push(scaled);
  }

  const pillarScores: PillarScores = { IQ: 0, EQ: 0, SQ: 0, AQ: 0 };

  for (const [pillar, scores] of Object.entries(pillarBuckets) as [PillarId, number[]][]) {
    if (scores.length > 0) {
      pillarScores[pillar] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  return pillarScores;
}

/**
 * Compute the full interview result: merged scores → pillar scores → unified → grade.
 */
export function computeInterviewResult(session: Pick<InterviewSession, 'selfAssessment' | 'evaluatorAssessment' | 'mode'>) {
  const { selfAssessment, evaluatorAssessment, mode } = session;

  if (!evaluatorAssessment || evaluatorAssessment.length === 0) {
    return { mergedScores: null, pillarScores: null, unifiedScore: null, grade: null, skillShape: null, careerProfile: null };
  }

  const mergedScores = mergeInterviewScores(selfAssessment, evaluatorAssessment, mode);
  const pillarScores = rubricToPillarScores(mergedScores);
  const unifiedScore = computeWeightedScore(pillarScores) || 0;
  const grade = getGrade(unifiedScore);
  const skillShape = getSkillShape(pillarScores);
  const careerProfile = getCareerProfile(pillarScores);

  return { mergedScores, pillarScores, unifiedScore, grade, skillShape, careerProfile };
}
