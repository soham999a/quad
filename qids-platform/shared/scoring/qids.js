// ─── Canonical QIDS scoring ───────────────────────────────────────────────────
// The single implementation of the QIDS individual/school maths, shared by:
//
//   * the browser  → src/core/engine/{qids,scoring}.ts re-export these,
//   * the server   → api/submit-assessment.js imports this file directly.
//
// Plain ESM, no imports, no React, no Firebase: Vite and Node load the exact
// same file, so a score can no longer differ between the tab and the API.
// Keep this module dependency-free — that is what makes the sharing honest.

export const PILLAR_IDS = /** @type {const} */ (['IQ', 'EQ', 'SQ', 'AQ']);

export const GRADE_BANDS = [
  { grade: 'A', label: 'Excellent', min: 90, max: 100, color: '#10b981' },
  { grade: 'B', label: 'Very Good', min: 75, max: 89, color: '#06b6d4' },
  { grade: 'C', label: 'Good', min: 60, max: 74, color: '#f59e0b' },
  { grade: 'D', label: 'Satisfactory', min: 45, max: 59, color: '#f97316' },
  { grade: 'E', label: 'Needs Improvement', min: 0, max: 44, color: '#ef4444' },
];

export const WEIGHTS = { IQ: 1.0, EQ: 2.0, SQ: 2.0, AQ: 1.28 };
export const MAX_WEIGHT_SUM = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 6.28

export const IQ_MAX_SCORE = 125;

// ── Instrument shape ─────────────────────────────────────────────────────────
// Bounds for each raw sub-score. The server rejects anything outside these, so
// a crafted payload cannot inflate a pillar with impossible values.
export const RAW_SCORE_BOUNDS = {
  IQ: { verbal: 25, quantitative: 25, psychometric: 25, performance: 25, _aiBonus: 16, _visualBonus: 9 },
  EQ: { SA: 10, ER: 10, SM: 10, E: 10, IS: 10 },
  SQ: { ACE: 25, CSI: 25, PBA: 25 },
  AQ: { SA: 19, PM: 19, RR: 19, RC: 19 },
};

/**
 * Validate a raw score sheet.
 * Unknown keys, non-numbers, negatives and values above the instrument maximum
 * are all rejected — the API must never score a sheet the instrument cannot
 * produce.
 * @param {Record<string, any>} rawScores
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRawScores(rawScores) {
  const errors = [];
  if (!rawScores || typeof rawScores !== 'object' || Array.isArray(rawScores)) {
    return { ok: false, errors: ['rawScores must be an object'] };
  }
  for (const key of Object.keys(rawScores)) {
    if (!PILLAR_IDS.includes(key)) errors.push(`unknown pillar: ${key}`);
  }
  for (const pillar of PILLAR_IDS) {
    const sheet = rawScores[pillar];
    if (sheet === undefined) continue;
    if (!sheet || typeof sheet !== 'object' || Array.isArray(sheet)) {
      errors.push(`${pillar} must be an object`);
      continue;
    }
    const bounds = RAW_SCORE_BOUNDS[pillar];
    for (const [key, value] of Object.entries(sheet)) {
      const max = bounds[key];
      if (max === undefined) { errors.push(`${pillar}.${key} is not an instrument field`); continue; }
      if (typeof value !== 'number' || !Number.isFinite(value)) { errors.push(`${pillar}.${key} must be a number`); continue; }
      if (value < 0) errors.push(`${pillar}.${key} is negative`);
      if (value > max) errors.push(`${pillar}.${key} exceeds ${max}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// ── Primitives ───────────────────────────────────────────────────────────────

/** @param {number} raw @param {number} max */
export function computeStandardized(raw, max) {
  if (!max) return 0;
  return Math.round((raw / max) * 100);
}

/** AQ part-A Likert (0–4) → 0–3 marks. @param {number} val */
export function mapAQLikert(val) {
  if (val <= 2) return 0;
  if (val === 3) return 1;
  if (val === 4) return 2;
  return 3;
}

/**
 * Normalise one pillar's raw section scores to 0–100 (IQ normalises against 125).
 * @param {'IQ'|'EQ'|'SQ'|'AQ'} pillarId
 * @param {Record<string, number>} scores
 */
export function computePillarScore(pillarId, scores) {
  if (pillarId === 'IQ') {
    const totalRaw =
      (scores.verbal || 0) + (scores.quantitative || 0) +
      (scores.psychometric || 0) + (scores.performance || 0);
    const aiBonus = scores._aiBonus || 0;
    const visualBonus = scores._visualBonus || 0;
    return Math.min(totalRaw + aiBonus + visualBonus, IQ_MAX_SCORE);
  }
  if (pillarId === 'EQ') {
    const comps = ['SA', 'ER', 'SM', 'E', 'IS'];
    const totalRaw = comps.reduce((s, c) => s + (scores[c] || 0), 0);
    return computeStandardized(totalRaw, 50);
  }
  if (pillarId === 'SQ') {
    const totalRaw = (scores.ACE || 0) + (scores.CSI || 0) + (scores.PBA || 0);
    return computeStandardized(totalRaw, 50);
  }
  if (pillarId === 'AQ') {
    const weights = { SA: 1.5, PM: 1.0, RR: 1.0, RC: 1.5 };
    const AQ_RD_MAX = 95;
    const rdScore = Object.entries(weights).reduce((sum, [comp, w]) => sum + (scores[comp] || 0) * w, 0);
    return Math.round((rdScore / AQ_RD_MAX) * 100);
  }
  return 0;
}

/** @param {Record<string, number>} rawScores @returns {Record<string, number>} */
export function computeQidsPillarScores(rawScores) {
  /** @type {Record<string, number>} */
  const pillarScores = {};
  for (const id of PILLAR_IDS) {
    pillarScores[id] = computePillarScore(id, (rawScores && rawScores[id]) || {});
  }
  return pillarScores;
}

/** Context-weighted unified score (0–100). @param {Record<string, number>} pillarScores */
export function computeWeightedScore(pillarScores) {
  const iqNormalized = Math.min(Math.round(((pillarScores.IQ || 0) / IQ_MAX_SCORE) * 100), 100);
  const weighted =
    iqNormalized * WEIGHTS.IQ +
    (pillarScores.EQ || 0) * WEIGHTS.EQ +
    (pillarScores.SQ || 0) * WEIGHTS.SQ +
    (pillarScores.AQ || 0) * WEIGHTS.AQ;
  return Math.round(weighted / MAX_WEIGHT_SUM);
}

/** @param {number} score */
export function getGrade(score) {
  return GRADE_BANDS.find(b => score >= b.min && score <= b.max) ?? GRADE_BANDS[4];
}

/** @param {number} score */
export function isCritical(score) {
  return score < 60;
}

/** @param {Record<string, number>} pillarScores @returns {'T'|'I'|'X'|'M'} */
export function getSkillShape(pillarScores) {
  const vals = Object.values(pillarScores);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const highCount = vals.filter(v => v >= 75).length;
  if (highCount >= 3) return 'M';
  if (max - min < 15 && avg >= 70) return 'X';
  if (highCount === 1) return 'I';
  return 'T';
}

export const CAREER_PROFILES = [
  { id: 'specialist', label: 'Specialist / Technical Track', condition: 'High IQ + Lower AQ', roles: ['Research Scientist', 'Software Engineer', 'Data Analyst', 'Financial Analyst'] },
  { id: 'leader', label: 'Leadership / People-Facing Track', condition: 'High EQ + High SQ', roles: ['HR Director', 'Counselor', 'Team Lead', 'Customer Success Manager'] },
  { id: 'versatile', label: 'Versatile / Multidisciplinary Path', condition: 'Balanced High Scores', roles: ['Entrepreneur', 'Consultant', 'Product Manager', 'General Manager'] },
  { id: 'resilient', label: 'Resilience-Heavy / Adaptive Track', condition: 'Strong AQ', roles: ['Crisis Manager', 'Emergency Services', 'Military Officer', 'Startup Founder'] },
  { id: 'creative', label: 'Creative / Innovation Track', condition: 'High IQ + High EQ', roles: ['UX Designer', 'Creative Director', 'Innovation Lead', 'Architect'] },
];

/** @param {Record<string, number>} pillarScores */
export function getCareerProfile(pillarScores) {
  const { IQ, EQ, SQ, AQ } = pillarScores;
  if (EQ >= 75 && SQ >= 75) return CAREER_PROFILES[1];
  if (IQ >= 75 && AQ < 60) return CAREER_PROFILES[0];
  if (AQ >= 75) return CAREER_PROFILES[3];
  if (IQ >= 75 && EQ >= 75) return CAREER_PROFILES[4];
  const avg = (IQ + EQ + SQ + AQ) / 4;
  if (avg >= 70) return CAREER_PROFILES[2];
  return CAREER_PROFILES[0];
}

// ── Result assembly ──────────────────────────────────────────────────────────

/**
 * Score a QIDS individual/school answer sheet into the shared AssessmentResult
 * shape. Mirrors `buildAssessmentResult` for the qids/school branch exactly.
 *
 * @param {{
 *   rawScores: Record<string, any>,
 *   intake?: Record<string, any>,
 *   ageGroup?: string,
 *   mode?: 'qids'|'school',
 *   now?: string,
 * }} input
 * @returns {{ result: Record<string, any>, rawScores: Record<string, any>, pillarScores: Record<string, number> }}
 */
export function buildQidsResult(input) {
  const { rawScores } = input;
  const pillarScores = computeQidsPillarScores(rawScores);

  // Matches buildAssessmentResult: 'qids' renders as the 'individual' mode.
  const mode = input.mode === 'qids' || input.mode === undefined ? 'individual' : 'school';

  /** @type {Record<string, any>} */
  const result = {
    mode,
    intake: input.intake ?? {},
    timestamp: input.now ?? new Date().toISOString(),
    pillarScores,
  };

  const unified = computeWeightedScore(pillarScores);
  result.unifiedScore = unified;
  result.grade = getGrade(unified);
  result.skillShape = getSkillShape(pillarScores);
  result.careerProfile = getCareerProfile(pillarScores);

  return { result, rawScores, pillarScores };
}
