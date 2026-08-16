// ─── QIDS Individual / School scoring facade ──────────────────────────────────
// Bridges the legacy instrument answer sheets into the shared engine result
// shape (`AssessmentResult`), so every mode flows through `buildAssessmentResult`.
// Pure functions. No React, no Firebase.

import type { AgeGroup, AssessmentResult, PillarId, PillarScores } from '../types';
import { mergeEvaluationScores } from '../../data/qidsData';
import {
  buildAssessmentResult, computePillarScore, getCareerProfile, getSkillShape,
  computeWeightedScore, getGrade, isCritical, WEIGHTS, GRADE_BANDS, MAX_WEIGHT_SUM,
  IQ_MAX_SCORE,
} from './scoring';

export const PILLAR_IDS: PillarId[] = ['IQ', 'EQ', 'SQ', 'AQ'];

export interface QidsRawScores {
  IQ?: Record<string, number>;
  EQ?: Record<string, number>;
  SQ?: Record<string, number>;
  AQ?: Record<string, number>;
}

export interface QidsEvaluationInput {
  rawScores: QidsRawScores;
  intake?: Record<string, unknown>;
  ageGroup?: AgeGroup;
  mode?: 'qids' | 'school';
  /** Optional evaluator rubric scores merged into Part B before scoring. */
  evaluations?: unknown[];
  assessmentDoc?: Record<string, unknown>;
}

/** Derive the four pillar scores from a raw section score sheet. */
export function computeQidsPillarScores(rawScores: QidsRawScores): PillarScores {
  const pillarScores = {} as PillarScores;
  for (const id of PILLAR_IDS) {
    pillarScores[id] = computePillarScore(id, (rawScores[id] as Record<string, number> | undefined) ?? {});
  }
  return pillarScores;
}

/**
 * Full QIDS evaluation: evaluator-score merge → pillar scores → unified result.
 * Returns the shared `AssessmentResult` plus the raw scores that produced it
 * (raw scores remain part of the Firestore doc for intervention recomputation).
 */
export function evaluateQidsAssessment(input: QidsEvaluationInput): {
  result: AssessmentResult;
  rawScores: QidsRawScores;
  pillarScores: PillarScores;
} {
  let rawScores = input.rawScores;

  if (input.evaluations?.length) {
    const merged = mergeEvaluationScores(rawScores, input.evaluations, input.assessmentDoc);
    if (merged.merged) rawScores = merged.rawScores;
  }

  const pillarScores = computeQidsPillarScores(rawScores);
  const result = buildAssessmentResult({
    mode: input.mode ?? 'qids',
    pillarScores,
    intake: { ...(input.intake ?? {}), ageGroup: input.ageGroup },
  });

  return { result, rawScores, pillarScores };
}

// Re-exported conveniences so migrated pages can drop the legacy import.
export {
  computePillarScore, computeWeightedScore, getGrade, getSkillShape, getCareerProfile,
  isCritical, WEIGHTS, GRADE_BANDS, MAX_WEIGHT_SUM, IQ_MAX_SCORE,
};
