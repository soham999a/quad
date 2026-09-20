// ─── Unified QIDS Scoring Engine ──────────────────────────────────────────────
// Pure functions. No React, no Firebase. Used by every mode and report.

import type {
  AgeGroup, AssessmentResult, DimensionScore, EnterpriseTier,
  PillarId, PillarScores, RFIResult, RoleDimension, RoleProfile,
  RoleTrackId, WorkStyleProfile, WorkStyleDimension,
} from '../types';
import { TIER_SCALING } from '../types';
import { BAND_T_SCORES, INTEGRATOR_ARCHETYPE, ARCHETYPES, PII_BANDS, RFI_THRESHOLDS, ROLE_PROFILES } from '../data/enterprise';
import { ROLE_TRACKS } from '../data/roleTracks';

const TRACK_LABELS: Record<string, string> = {};
for (const track of ROLE_TRACKS) {
  TRACK_LABELS[track.meta.id] = track.meta.label;
}

// ── QIDS grade bands ──────────────────────────────────────────────────────────

export const GRADE_BANDS = [
  { grade: 'A', label: 'Excellent', min: 90, max: 100, color: '#10b981' },
  { grade: 'B', label: 'Very Good', min: 75, max: 89, color: '#06b6d4' },
  { grade: 'C', label: 'Good', min: 60, max: 74, color: '#f59e0b' },
  { grade: 'D', label: 'Satisfactory', min: 45, max: 59, color: '#f97316' },
  { grade: 'E', label: 'Needs Improvement', min: 0, max: 44, color: '#ef4444' },
];

export const WEIGHTS: Record<PillarId, number> = { IQ: 1.0, EQ: 2.0, SQ: 2.0, AQ: 1.28 };
export const MAX_WEIGHT_SUM = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 6.28

export const IQ_MAX_SCORE = 125;
export const IQ_STATIC_MAX = 100;
export const IQ_AI_MAX = 16;
export const IQ_VISUAL_MAX = 9;

export function computeStandardized(raw: number, max: number): number {
  if (!max) return 0;
  return Math.round((raw / max) * 100);
}

export function mapAQLikert(val: number): number {
  if (val <= 2) return 0;
  if (val === 3) return 1;
  if (val === 4) return 2;
  return 3;
}

/** Normalise raw pillar section scores to 0–100 (IQ normalises /125). */
export function computePillarScore(pillarId: PillarId, scores: Record<string, number>): number {
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

/** Context-weighted unified score (0–100). */
export function computeWeightedScore(pillarScores: PillarScores): number {
  const iqNormalized = Math.min(Math.round(((pillarScores.IQ || 0) / IQ_MAX_SCORE) * 100), 100);
  const weighted =
    iqNormalized * WEIGHTS.IQ +
    (pillarScores.EQ || 0) * WEIGHTS.EQ +
    (pillarScores.SQ || 0) * WEIGHTS.SQ +
    (pillarScores.AQ || 0) * WEIGHTS.AQ;
  return Math.round(weighted / MAX_WEIGHT_SUM);
}

export function getGrade(score: number) {
  return GRADE_BANDS.find(b => score >= b.min && score <= b.max) ?? GRADE_BANDS[4];
}

export function isCritical(score: number): boolean { return score < 60; }

// ── Skill shape & career profile (QIDS) ───────────────────────────────────────

export function getSkillShape(pillarScores: PillarScores): 'T' | 'I' | 'X' | 'M' {
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

export function getCareerProfile(pillarScores: PillarScores) {
  const { IQ, EQ, SQ, AQ } = pillarScores;
  if (EQ >= 75 && SQ >= 75) return CAREER_PROFILES[1];
  if (IQ >= 75 && AQ < 60) return CAREER_PROFILES[0];
  if (AQ >= 75) return CAREER_PROFILES[3];
  if (IQ >= 75 && EQ >= 75) return CAREER_PROFILES[4];
  const avg = (IQ + EQ + SQ + AQ) / 4;
  if (avg >= 70) return CAREER_PROFILES[2];
  return CAREER_PROFILES[0];
}

// ── Enterprise: IRT-lite scaling ──────────────────────────────────────────────

/**
 * Convert a raw score (0..max) into theta + T-score + percentile + band.
 * Uses a logistic IRT-style transform calibrated so 50% accuracy maps to
 * theta 0 / T 50, with the module's difficulty profile shaping the curve.
 */
export function irtScale(
  raw: number, max: number,
  difficultyBias = 0,     // >0 means harder module: shifts T down at same raw ratio
  discrimination = 1.0,   // steeper curve
): { theta: number; tScore: number; percentile: number; band: DimensionScore['band'] } {
  const p = max > 0 ? raw / max : 0;
  // Logistic transform: logit(p) ~ theta. Guard p extremes.
  const logit = Math.log(Math.max(p, 0.001) / Math.max(1 - p, 0.001));
  // Positive difficultyBias = harder module → the same raw ratio reflects
  // *lower* ability, so the bias is subtracted (matches DIFFICULTY_VALUE's
  // E/M/H ladder where H > 0 is harder).
  const theta = logit * discrimination - difficultyBias;
  // Map theta to T-score (mean 50, sd 10) via inverse-normal-ish: use bounded linear map.
  const tScore = Math.max(20, Math.min(80, Math.round(50 + theta * 10)));
  const z = (tScore - 50) / 10;
  // Approximate percentile via standard normal CDF (Abramowitz–Stegun).
  const percentile = Math.max(1, Math.min(99, Math.round(normalCdf(z) * 100)));
  const band = bandFromTScore(tScore);
  return { theta, tScore, percentile, band };
}

/** Abramowitz–Stegun 7.1.26 approximation of Φ(z). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  let p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  if (z > 0) p = 1 - p;
  return p;
}

export function bandFromTScore(t: number): DimensionScore['band'] {
  if (t >= 65) return 'Exceptional';
  if (t >= 50) return 'Proficient';
  if (t >= 35) return 'Developing';
  return 'Emerging';
}

export function bandFromT(t: number): DimensionScore['band'] { return bandFromTScore(t); }

export function percentileOfT(t: number): number {
  return Math.max(1, Math.min(99, Math.round(normalCdf((t - 50) / 10) * 100)));
}

// ── PII composite (Section 7.3) ───────────────────────────────────────────────

export interface ModuleRaw {
  raw: number;
  max: number;
  weight: number;
  difficultyBias?: number;
}

/** Weighted composite of scored modules, Work Style excluded, then tier-scaled. */
export function computePII(
  modules: Partial<Record<string, ModuleRaw>>,
  tier: EnterpriseTier,
): { score: number; rawComposite: number; band: string; label: string; desc: string } {
  let weighted = 0;
  let weightSum = 0;
  for (const m of Object.values(modules)) {
    if (!m || m.weight <= 0) continue;
    const pct = m.max > 0 ? m.raw / m.max : 0;
    weighted += pct * m.weight;
    weightSum += m.weight;
  }
  // Standard score: mean 100, sd 15. Center the composite so 60% overall => ~100.
  const composite = weightSum > 0 ? weighted / weightSum : 0;
  const base = 40 + composite * 100;         // 0% -> 40, 60% -> 100, 100% -> 140
  const rawComposite = Math.round(base * 10) / 10;
  const score = Math.round(Math.min(rawComposite * TIER_SCALING[tier], 145));
  const bandRow = PII_BANDS.find(b => score >= b.min && score <= b.max) ?? PII_BANDS[4];
  return { score, rawComposite, band: bandRow.band, label: bandRow.label, desc: bandRow.desc };
}

// ── Learning Agility Index (PIP Page 1) ───────────────────────────────────────

export function computeLearningAgility(modules: Partial<Record<string, ModuleRaw>>): { score: number; label: 'Accelerator' | 'Builder' | 'Consolidator' | 'Grounded' } {
  const ag = modules.AQ?.raw !== undefined && modules.AQ.max ? modules.AQ.raw / modules.AQ.max : 0.5;
  const ct = modules.CT?.raw !== undefined && modules.CT.max ? modules.CT.raw / modules.CT.max : 0.5;
  const curiosity = modules.WS?.raw !== undefined && modules.WS.max ? modules.WS.raw / modules.WS.max : 0.5;
  const score = Math.round(((ag * 0.4 + ct * 0.35 + curiosity * 0.25) / 1) * 10);
  const label = score >= 8 ? 'Accelerator' : score >= 6 ? 'Builder' : score >= 4 ? 'Consolidator' : 'Grounded';
  return { score, label };
}

// ── Work style archetype assignment (Section 13.3) ────────────────────────────

export function assignArchetype(profile: WorkStyleProfile): { archetype: typeof INTEGRATOR_ARCHETYPE; watchouts: string[] } {
  const dims = Object.entries(profile) as [WorkStyleDimension, number][];
  const sorted = [...dims].sort((a, b) => b[1] - a[1]);
  const top2 = sorted.slice(0, 2);
  const third = sorted[2];

  // Integrator if top-2 within ±0.5 of the third dimension.
  if (third && Math.abs(third[1] - top2[1][1]) <= 0.5) {
    return { archetype: INTEGRATOR_ARCHETYPE, watchouts: [] };
  }

  const signature: [WorkStyleDimension, WorkStyleDimension] = [top2[0][0], top2[1][0]];
  const match = ARCHETYPES.find(a =>
    (a.signature[0] === signature[0] && a.signature[1] === signature[1]) ||
    (a.signature[0] === signature[1] && a.signature[1] === signature[0]),
  );

  // Bottom-decile watch-outs (bottom 10% of the 6 dimensions).
  const watchouts = dims.filter(([, v]) => v <= 1).map(([d]) => d);

  return { archetype: match ?? INTEGRATOR_ARCHETYPE, watchouts };
}

// ── Role Fit Index (Section 15.1) ─────────────────────────────────────────────

const ROLE_DIMS: RoleDimension[] = ['Cog', 'CT', 'EQ', 'SQ', 'AQ', 'DQ', 'LA', 'Int'];

/**
 * RFI(role) = Σ [ weight(i) × min(candidate(i) / requirement(i), 1.0) ] × 100
 * Role weights sum to 100 (percent points) so they are normalised to 0..1.
 * candidate scores are 0..100 per dimension.
 */
export function computeRFI(
  candidate: Record<RoleDimension, number>,
  role: RoleProfile,
): { matchPct: number; dimensionScores: Record<RoleDimension, number> } {
  let sum = 0;
  let weightTotal = 0;
  const dimensionScores = {} as Record<RoleDimension, number>;
  for (const d of ROLE_DIMS) {
    const w = role.weights[d] ?? 0;
    const req = role.required?.[d] ?? 70;      // default requirement level 70%
    const ratio = req > 0 ? Math.min(candidate[d] / req, 1.0) : 0;
    dimensionScores[d] = Math.round(ratio * 100);
    sum += w * ratio;
    weightTotal += w;
  }
  const norm = weightTotal > 0 ? sum / weightTotal : 0;
  return { matchPct: Math.round(norm * 100), dimensionScores };
}

export function evaluateRoleMatches(candidate: Record<RoleDimension, number>, roleIds?: string[]): RFIResult[] {
  const roles = roleIds?.length ? ROLE_PROFILES.filter(r => roleIds.includes(r.id)) : ROLE_PROFILES;
  return roles
    .map(role => {
      const { matchPct, dimensionScores } = computeRFI(candidate, role);
      const threshold = RFI_THRESHOLDS.find(t => matchPct >= t.min && matchPct <= t.max)?.level ?? 'mismatch';
      return { roleId: role.id, roleLabel: role.label, matchPct, dimensionScores, threshold };
    })
    .sort((a, b) => b.matchPct - a.matchPct);
}

// ── Integrity band ────────────────────────────────────────────────────────────

export function integrityBand(flaggedItems: string[], totalItems: number): { band: 'Pass' | 'Flag' | 'Concern'; flaggedItems: string[] } {
  if (flaggedItems.length === 0) return { band: 'Pass', flaggedItems };
  if (flaggedItems.length >= 2 || flaggedItems.length >= Math.ceil(totalItems * 0.5)) return { band: 'Flag', flaggedItems };
  return { band: 'Concern', flaggedItems };
}

// ── High-level result builder (used by all modes) ─────────────────────────────

export interface BuildResultInput {
  mode: 'qids' | 'school' | 'enterprise' | 'role';
  tier?: EnterpriseTier;
  intake?: Record<string, unknown>;
  pillarScores?: PillarScores;
  moduleRaws?: Partial<Record<string, ModuleRaw>>;
  roleCandidate?: Record<RoleDimension, number>;
  roleIds?: string[];                        // optional RFI scoping
  workStyle?: WorkStyleProfile;
  integrityFlags?: string[];
  roleTrack?: RoleTrackId;                   // optional RIQ track deployment
}

export function buildAssessmentResult(input: BuildResultInput): AssessmentResult {
  const base: AssessmentResult = {
    mode: input.mode === 'qids' ? 'individual' : input.mode === 'school' ? 'school' : input.mode === 'role' ? 'role' : 'enterprise',
    tier: input.tier,
    intake: input.intake ?? {},
    timestamp: new Date().toISOString(),
  };

  if ((input.mode === 'qids' || input.mode === 'school') && input.pillarScores) {
    base.pillarScores = input.pillarScores;
    const unified = computeWeightedScore(input.pillarScores);
    base.unifiedScore = unified;
    base.grade = getGrade(unified);
    base.skillShape = getSkillShape(input.pillarScores);
    base.careerProfile = getCareerProfile(input.pillarScores);
  }

  if (input.moduleRaws) {
    base.moduleScores = {};
    for (const [id, m] of Object.entries(input.moduleRaws)) {
      if (!m) continue;
      if (id === 'WS') continue; // ipsative profile, never a right/wrong T-score
      const s = irtScale(m.raw, m.max, m.difficultyBias ?? 0);
      base.moduleScores[id as keyof typeof base.moduleScores] = { raw: m.raw, max: m.max, ...s };
    }
  }

  if (input.mode !== 'qids' && input.tier && input.moduleRaws) {
    base.pii = computePII(input.moduleRaws, input.tier);
    base.learningAgility = computeLearningAgility(input.moduleRaws);
  }

  if (input.workStyle) {
    const { archetype, watchouts } = assignArchetype(input.workStyle);
    base.workStyle = { profile: input.workStyle, archetype, watchouts };
  }

  if (input.roleCandidate) {
    base.rfi = evaluateRoleMatches(input.roleCandidate, input.roleIds);
  }

  // RIQ: a role track was deployed; surface its T-score/band on the result.
  const riqRaw = input.moduleRaws?.['RIQ'];
  const riqModuleScore = base.moduleScores?.['RIQ'];
  if (input.roleTrack && riqRaw && riqModuleScore) {
    base.riq = {
      score: riqModuleScore.tScore,
      band: riqModuleScore.band,
      percentile: riqModuleScore.percentile,
      track: input.roleTrack,
      trackLabel: TRACK_LABELS[input.roleTrack] ?? input.roleTrack,
    };
  }

  if (input.integrityFlags) {
    base.integrity = integrityBand(input.integrityFlags, input.integrityFlags.length + 8);
  }

  return base;
}

// ── Age-group question pickers (QIDS) ─────────────────────────────────────────

export function pickForAge<T>(bucket: Record<AgeGroup, T> | Partial<Record<AgeGroup, T>>, age: AgeGroup): T | undefined {
  return bucket[age] ?? bucket['19-32'] ?? bucket['11-18'];
}

export const AGE_GROUPS: AgeGroup[] = ['11-18', '19-32'];
