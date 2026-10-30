import type {
  RubricEvaluation, RubricDimensionId, PillarScores, PillarId,
  InterviewSession, InterviewMode,
} from '../types';
import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../data/interviewRubrics';
import { getGrade } from '../../data/qidsData';
import { getSkillShape, getCareerProfile, WEIGHTS } from './scoring';
import { PEER_NORM } from '../report/pip';

/**
 * Peer-norm reference per rubric dimension, 0–100 scale — the PIP Page 2
 * dashed line, adapted to the interview radar's axes.
 *
 * Sourced from the platform's standing PEER_NORM (core/report/pip.ts), mapped
 * through each dimension's pillar; Critical Thinking uses its own spec axis
 * rather than the IQ pillar value. Placeholders like these stay honest until
 * the Phase 3 norming study (Appendix C) supplies real cohort tables.
 */
export const INTERVIEW_PEER_NORM: Record<RubricDimensionId, number> =
  Object.fromEntries(
    RUBRIC_DIMENSIONS.map(d => [
      d.id,
      d.id === 'CriticalThinking' ? PEER_NORM.CT
        : d.pillar === 'IQ' ? PEER_NORM.IQ
        : d.pillar === 'EQ' ? PEER_NORM.EQ
        : d.pillar === 'SQ' ? PEER_NORM.SQ
        : PEER_NORM.AQ,
    ]),
  ) as Record<RubricDimensionId, number>;

/**
 * Post-Interview Score Integration weights — Appendix B: "Structured interview
 * ratings (1–5 per competency) averaged with assessment scores at configurable
 * weight (default: 40% interview, 60% assessment)."
 *
 * `assessment` blends the candidate's own pre/post assessment evidence, and
 * `interview` the evaluator's structured rating — the two must sum to 1.
 * Exported so an organisation can re-weight via a config surface without
 * touching the engine: pass a custom `{ interview, assessment }` to
 * `mergeInterviewScores` / `computeInterviewResult`.
 */
export const INTERVIEW_WEIGHTS: { interview: number; assessment: number } = {
  interview: 0.4,
  assessment: 0.6,
};

/**
 * Merge self + evaluator assessments into a single score per dimension.
 *
 * Post-interview mode: `weights.assessment` self + `weights.interview`
 * evaluator (spec default 60% / 40%, see INTERVIEW_WEIGHTS).
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
  weights: { interview: number; assessment: number } = INTERVIEW_WEIGHTS,
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
      merged[dim.id] = Math.round((selfScore * weights.assessment + evEval.score * weights.interview) * 10) / 10;
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
 * Interview band (PIP Page 7 vocabulary, adapted to the 1–5 rubric scale).
 *
 * The spec's band descriptors (Exceptional | Proficient | Developing | Emerging)
 * are written for T-scores; interview dimensions are scored 1–5, so the bands
 * are mapped onto that range with equivalent plain-language descriptors.
 */
export function interviewBand(score: number | null | undefined): {
  label: 'Exceptional' | 'Proficient' | 'Developing' | 'Emerging';
  short: string;
  color: string;
  desc: string;
} | null {
  if (score == null || !(score > 0)) return null;
  if (score >= 4.5) return {
    label: 'Exceptional', short: 'EXC', color: 'var(--color-success)',
    desc: 'Consistently strong evidence in the room — specific behaviours, clear outcomes, fast recovery.',
  };
  if (score >= 3.5) return {
    label: 'Proficient', short: 'PROF', color: 'var(--color-primary)',
    desc: 'Solid capability in the room with occasional gaps under novelty or pressure.',
  };
  if (score >= 2.5) return {
    label: 'Developing', short: 'DeV', color: 'var(--gold-strong, var(--color-primary))',
    desc: 'Functional but inconsistent — answers trend generic or hypothetical under probing.',
  };
  return {
    label: 'Emerging', short: 'EMG', color: 'var(--color-warning, var(--gold-strong, var(--color-primary)))',
    desc: 'Limited evidence in the room — answers stay superficial, externalise cause, or avoid detail.',
  };
}

/**
 * Compute the full interview result: merged scores → pillar scores → unified → grade.
 */
export function computeInterviewResult(
  session: Pick<InterviewSession, 'selfAssessment' | 'evaluatorAssessment' | 'mode'>,
  weights: { interview: number; assessment: number } = INTERVIEW_WEIGHTS,
) {
  const { selfAssessment, evaluatorAssessment, mode } = session;

  if (!evaluatorAssessment || evaluatorAssessment.length === 0) {
    return { mergedScores: null, pillarScores: null, unifiedScore: null, grade: null, skillShape: null, careerProfile: null };
  }

  const mergedScores = mergeInterviewScores(selfAssessment, evaluatorAssessment, mode, weights);
  const pillarScores = rubricToPillarScores(mergedScores);
  const unifiedScore = weightedInterviewScore(pillarScores) || 0;
  const grade = getGrade(unifiedScore);
  const skillShape = getSkillShape(pillarScores);
  const careerProfile = getCareerProfile(pillarScores);

  return { mergedScores, pillarScores, unifiedScore, grade, skillShape, careerProfile };
}
