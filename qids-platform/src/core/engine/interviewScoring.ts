import type {
  RubricEvaluation, RubricDimensionId, PillarScores, PillarId,
  InterviewSession, InterviewMode,
} from '../types';
import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../data/interviewRubrics';
import { getGrade } from '../../data/qidsData';
import { getSkillShape, getCareerProfile, WEIGHTS } from './scoring';

/**
 * Merge self + evaluator assessments into a single score per dimension.
 *
 * Post-interview mode: 60% self + 40% evaluator.
 * Live interview mode: 100% evaluator (self-assessment is null).
 *
 * Only dimensions present in the evaluator assessment are included. Dimensions
 * that were never scored are omitted rather than silently defaulted to a
 * placeholder — so an incomplete assessment is never quietly inflated.
 */
export function mergeInterviewScores(
  selfAssessment: RubricEvaluation[] | undefined,
  evaluatorAssessment: RubricEvaluation[],
  mode: InterviewMode,
): Record<RubricDimensionId, number> {
  const merged: Record<string, number> = {};
  const evalById = new Map(evaluatorAssessment.map(e => [e.dimensionId, e]));

  for (const dim of RUBRIC_DIMENSIONS) {
    const evEval = evalById.get(dim.id);
    if (!evEval || evEval.score == null) continue; // skip unscored dimensions

    if (mode === 'live') {
      merged[dim.id] = evEval.score;
      continue;
    }

    // Post mode: blend with self-assessment when present, else evaluator only.
    const selfEval = selfAssessment?.find(e => e.dimensionId === dim.id);
    const selfScore = selfEval?.score;
    if (selfScore != null) {
      merged[dim.id] = Math.round((selfScore * 0.6 + evEval.score * 0.4) * 10) / 10;
    } else {
      merged[dim.id] = evEval.score;
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
    const score = mergedScores[dim.id];
    if (score == null) continue; // only average scored dimensions
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
 * Interview unified score (0–100).
 *
 * Unlike the individual engine's `computeWeightedScore` — which normalizes IQ
 * by a 125-point ceiling — interview pillars are already 0–100, so IQ must not
 * be re-scaled. This applies the shared QIDS pillar weights directly as a
 * weighted average. If no pillar was scored, returns 0.
 */
export function weightedInterviewScore(pillarScores: PillarScores): number {
  const valid = (Object.keys(pillarScores) as PillarId[])
    .filter(k => pillarScores[k] != null && pillarScores[k] > 0);
  if (valid.length === 0) return 0;
  const weighted = valid.reduce((sum, k) => sum + pillarScores[k] * (WEIGHTS[k] ?? 1), 0);
  const wSum = valid.reduce((sum, k) => sum + (WEIGHTS[k] ?? 1), 0);
  return Math.round(weighted / wSum);
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
  const unifiedScore = weightedInterviewScore(pillarScores) || 0;
  const grade = getGrade(unifiedScore);
  const skillShape = getSkillShape(pillarScores);
  const careerProfile = getCareerProfile(pillarScores);

  return { mergedScores, pillarScores, unifiedScore, grade, skillShape, careerProfile };
}
