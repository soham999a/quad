// ─── Enterprise Module Scoring ────────────────────────────────────────────────
// Turns raw candidate answers against deployed item banks into module raw
// scores (feeding computePII / irtScale), a Work Style ipsative profile, and
// integrity flags. Pure functions; no React/Firebase.
//
// Answer-sheet contract (AnswerSheet keyed by item id):
//   MCQ (CR, CT, EI, AQ, INT, DQ, LR, ST, PL, OI) : number  -> selected option index
//   SJT (best_worst)                              : number[] -> [mostIdx, leastIdx]
//   WS  (ipsative)                                : number[] -> rank (4..1) per option index,
//                                                        or ordered preference array of
//                                                        option indices (most effective first).

import type {
  AnswerValue, EnterpriseItem, EnterpriseModuleId, EnterpriseTier,
  RoleDimension, WorkStyleDimension, WorkStyleProfile,
} from '../types';
import { ENTERPRISE_MODULES } from '../modes';
import { DIFFICULTY_VALUE } from './adaptive';

export interface ModuleScoreResult {
  raw: number;
  max: number;
  flagged?: string[];
}

// ── Answer parsing ────────────────────────────────────────────────────────────

export function asIndex(value: AnswerValue | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function asBestWorst(value: AnswerValue | undefined): { most?: number; least?: number } {
  if (Array.isArray(value) && value.length >= 1 && typeof value[0] === 'number') {
    return { most: value[0], least: typeof value[1] === 'number' ? value[1] : undefined };
  }
  if (typeof value === 'number') return { most: value };
  return {};
}

/**
 * Work Style ranks. Two accepted forms:
 *   rank-per-option   : number[] where index i -> rank (4=most .. 1=least)
 *   ordered preference: number[] of option indices, most effective first
 */
export function asWorkStyleRanks(value: AnswerValue | undefined, optionCount: number): (number | undefined)[] | undefined {
  if (!Array.isArray(value) || value.length !== optionCount) return undefined;
  if (!value.every(v => typeof v === 'number')) return undefined;
  const arr = value as number[];

  // Ordered preference (option indices, may include 0).
  if (arr.every(v => v >= 0 && v <= optionCount - 1)) {
    const ranks = new Array<number | undefined>(optionCount).fill(undefined);
    arr.forEach((opt, pos) => {
      if (ranks[opt] === undefined) ranks[opt] = optionCount - pos;
    });
    return ranks;
  }

  // Rank-per-option (1..optionCount).
  if (arr.every(v => v >= 1 && v <= optionCount)) return arr;
  return undefined;
}

// ── Per-item scoring ──────────────────────────────────────────────────────────

const SJT_DEFAULT = { best: 2, second: 1, third: 0, worstAsBest: -1, worstCorrect: 1 };

/** Score a single MCQ item: 1 per correct. */
export function scoreMcq(item: EnterpriseItem, selected: number | undefined): { earned: number; max: number } {
  const ans = Array.isArray(item.answer) ? item.answer[0] : item.answer;
  return { earned: selected === ans ? 1 : 0, max: 1 };
}

/**
 * Score a single SJT item (Best/Worst). Most selection uses the spec matrix;
 * Least selection credits the keyed least-effective option. Without expert
 * keying for second/third choices, only key-1 (answer) and key-4 (worst)
 * contribute, matching "maximum 3 points per item".
 */
export function scoreSjt(
  item: EnterpriseItem,
  most: number | undefined,
  least: number | undefined,
): { earned: number; max: number; flagged: boolean } {
  const s = item.scoring ?? SJT_DEFAULT;
  let earned = 0;
  const ans = Array.isArray(item.answer) ? item.answer[0] : item.answer;
  if (most !== undefined) {
    if (most === ans) earned += s.best;
    else if (item.worst !== undefined && most === item.worst) earned += s.worstAsBest;
    else earned += 0; // key-2/key-3 require expert keying (curation)
  }
  if (least !== undefined && item.worst !== undefined && least === item.worst) {
    earned += s.worstCorrect;
  }
  const flagged = item.worst !== undefined && most === item.worst;
  // Attainable max depends on keying: without a worst key the least-selection
  // bonus is unavailable, so max = best (+ worstCorrect only when keyed).
  const max = s.best + (item.worst !== undefined ? s.worstCorrect : 0);
  return { earned, max, flagged };
}

/** Whether an INT item was answered with a clearly unethical option. */
export function isUnethicalPick(item: EnterpriseItem, selected: number | undefined): boolean {
  const unethical = UNETHICAL_OPTIONS[item.id];
  return unethical !== undefined && selected === unethical;
}

// ── Module-level scoring ──────────────────────────────────────────────────────

export function scoreModule(
  moduleId: EnterpriseModuleId,
  items: EnterpriseItem[],
  answers: Record<string, AnswerValue>,
): ModuleScoreResult {
  if (moduleId === 'WS') return { raw: 0, max: 0 };

  let raw = 0;
  let max = 0;
  const flagged: string[] = [];

  for (const item of items) {
    const value = answers[item.id];
    if (moduleId === 'SJT') {
      const { most, least } = asBestWorst(value);
      const r = scoreSjt(item, most, least);
      raw += r.earned;
      max += r.max;
      if (r.flagged) flagged.push(item.id);
    } else {
      const r = scoreMcq(item, asIndex(value));
      raw += r.earned;
      max += r.max;
      if (moduleId === 'INT' && isUnethicalPick(item, asIndex(value))) flagged.push(item.id);
    }
  }

  return { raw, max, flagged: flagged.length ? flagged : undefined };
}

/** Average difficulty of deployed items → bias for irtScale (harder ⇒ lower T). */
export function moduleDifficultyBias(items: EnterpriseItem[]): number {
  if (items.length === 0) return 0;
  return items.reduce((s, it) => s + DIFFICULTY_VALUE[it.difficulty], 0) / items.length;
}

export function moduleWeight(moduleId: EnterpriseModuleId): number {
  return ENTERPRISE_MODULES.find(m => m.id === moduleId)?.weight ?? 0;
}

// ── Work Style ipsative profile ───────────────────────────────────────────────

// Best-effort mapping of each WS option to a work-style dimension. Subject to
// expert curation (Phase 8); every item is keyed for the current 6-item bank.
export const WS_DIMENSIONS: Record<string, WorkStyleDimension[]> = {
  'WS-001': ['Curiosity', 'Ownership', 'Communication', 'Execution'],
  'WS-002': ['Integrity', 'Ownership', 'Communication', 'Execution'],
  'WS-003': ['Execution', 'LearningAgility', 'Curiosity', 'Communication'],
  'WS-004': ['Execution', 'Communication', 'LearningAgility', 'Ownership'],
  'WS-005': ['Execution', 'LearningAgility', 'Ownership', 'Communication'],
  'WS-006': ['Execution', 'Communication', 'LearningAgility', 'Curiosity'],
};

const WS_DIMS: WorkStyleDimension[] = ['Ownership', 'Curiosity', 'Execution', 'LearningAgility', 'Communication', 'Integrity'];

export function computeWorkStyleProfile(
  items: EnterpriseItem[],
  answers: Record<string, AnswerValue>,
): WorkStyleProfile {
  const sums: WorkStyleProfile = { Ownership: 0, Curiosity: 0, Execution: 0, LearningAgility: 0, Communication: 0, Integrity: 0 };

  for (const item of items) {
    const dims = WS_DIMENSIONS[item.id];
    if (!dims) continue;
    const ranks = asWorkStyleRanks(answers[item.id], item.options.length);
    if (!ranks) continue;
    for (let i = 0; i < dims.length; i++) {
      const rank = ranks[i];
      if (rank !== undefined && rank >= 1 && rank <= 4) {
        sums[dims[i]] += rank;
      }
    }
  }

  // Normalise to 0..10 scale so profiles are comparable across deployments.
  const maxPossible = items.length * 4;
  if (maxPossible === 0) return sums;
  const out = {} as WorkStyleProfile;
  for (const d of WS_DIMS) {
    out[d] = Math.round((sums[d] / maxPossible) * 100) / 10;
  }
  return out;
}

// ── Integrity unethical-option index per INT item ─────────────────────────────

export const UNETHICAL_OPTIONS: Record<string, number> = {
  'INT-001': 0, // "Adjust the data — senior leaders have authority"
  'INT-002': 0, // "Accept — it's a gesture of appreciation"
  'INT-003': 0, // "Agree — your manager has more experience"
  'INT-004': 1, // "Use the information in your own work"
  'INT-005': 0, // "Ignore it — no harm was done"
  'INT-006': 3, // "Ask the candidate not to mention your connection"
  'INT-007': 3, // "Ask other colleagues ... without revealing you lack evidence"
  'INT-009': 3, // "Report it to the media"
};

// ── SJT tag attribution (competency prefix → role dimension) ──────────────────

export type SjtTag = 'EQ' | 'SQ' | 'AQ' | 'Int';

export function sjtTag(item: EnterpriseItem): SjtTag {
  const c = item.competency || '';
  if (/^EQ/.test(c)) return 'EQ';
  if (/^SQ/.test(c)) return 'SQ';
  if (/^AQ/.test(c)) return 'AQ';
  if (/Integrity/i.test(c)) return 'Int';
  return 'SQ';
}

// ── Enterprise scoring entry ──────────────────────────────────────────────────

export interface DeployedModules {
  [moduleId: string]: EnterpriseItem[];
}

export interface EnterpriseScoringResult {
  moduleRaws: Record<string, { raw: number; max: number; weight: number; difficultyBias: number }>;
  workStyle?: WorkStyleProfile;
  integrityFlags: string[];
}

export function scoreEnterprise(
  tier: EnterpriseTier,
  deployed: DeployedModules,
  answers: Record<string, AnswerValue>,
): EnterpriseScoringResult {
  const moduleRaws: EnterpriseScoringResult['moduleRaws'] = {};
  const integrityFlags: string[] = [];

  for (const [id, items] of Object.entries(deployed)) {
    if (id === 'WS' || !items.length) continue;
    const r = scoreModule(id as EnterpriseModuleId, items, answers);
    moduleRaws[id] = {
      raw: r.raw,
      max: r.max,
      weight: moduleWeight(id as EnterpriseModuleId),
      difficultyBias: moduleDifficultyBias(items),
    };
    if (r.flagged) integrityFlags.push(...r.flagged);
  }

  const wsItems = deployed.WS ?? [];
  const workStyle = wsItems.length ? computeWorkStyleProfile(wsItems, answers) : undefined;

  return { moduleRaws, workStyle, integrityFlags };
}

// ── Role dimension candidate vector (feeds RFI) ───────────────────────────────

const RADIAL_DIMS: RoleDimension[] = ['Cog', 'CT', 'EQ', 'SQ', 'AQ', 'DQ', 'LA', 'Int'];

function pct(raw: number | undefined, max: number | undefined, fallback = 50): number {
  return max ? (raw ?? 0) / max * 100 : fallback;
}

/** Per-tag SJT accuracy (%) for EQ / SQ / AQ / Int groups. */
export function sjtGroupPct(deployed: DeployedModules, answers: Record<string, AnswerValue>): Record<SjtTag, number> {
  const out: Record<SjtTag, { ok: number; n: number }> = { EQ: { ok: 0, n: 0 }, SQ: { ok: 0, n: 0 }, AQ: { ok: 0, n: 0 }, Int: { ok: 0, n: 0 } };
  for (const item of deployed.SJT ?? []) {
    const { most } = asBestWorst(answers[item.id]);
    const ans = Array.isArray(item.answer) ? item.answer[0] : item.answer;
    const tag = sjtTag(item);
    if (most === undefined) continue;
    out[tag].n += 1;
    if (most === ans) out[tag].ok += 1;
  }
  const res = {} as Record<SjtTag, number>;
  for (const t of Object.keys(out) as SjtTag[]) {
    res[t] = out[t].n ? Math.round(out[t].ok / out[t].n * 100) : 50;
  }
  return res;
}

/**
 * Map module results to the 8 role dimensions (0–100 each) used by the RFI
 * model. Modules absent from a tier default to a neutral 50 so the RFI is not
 * unfairly zeroed on dimensions a tier simply does not deploy.
 */
export function candidateRoleDimensions(
  moduleRaws: Record<string, { raw: number; max: number; weight: number; difficultyBias: number }>,
  workStyle: WorkStyleProfile | undefined,
  sjtGroups: Record<SjtTag, number>,
): Record<RoleDimension, number> {
  const cr = pct(moduleRaws.CR?.raw, moduleRaws.CR?.max);
  const ct = pct(moduleRaws.CT?.raw, moduleRaws.CT?.max);
  const st = pct(moduleRaws.ST?.raw, moduleRaws.ST?.max);
  const ei = pct(moduleRaws.EI?.raw, moduleRaws.EI?.max);
  const aq = pct(moduleRaws.AQ?.raw, moduleRaws.AQ?.max);
  const dq = pct(moduleRaws.DQ?.raw, moduleRaws.DQ?.max);
  const lr = pct(moduleRaws.LR?.raw, moduleRaws.LR?.max);
  const integrity = pct(moduleRaws.INT?.raw, moduleRaws.INT?.max);

  const la = workStyle
    ? Math.round(0.4 * workStyle.LearningAgility * 10 + 0.3 * aq + 0.3 * ct)
    : Math.round(0.5 * aq + 0.5 * ct);

  const dims: Record<RoleDimension, number> = {
    Cog: Math.round(moduleRaws.ST ? 0.7 * cr + 0.3 * st : cr),
    CT: Math.round(ct),
    EQ: Math.round(0.6 * ei + 0.4 * sjtGroups.EQ),
    SQ: Math.round(moduleRaws.LR ? 0.5 * sjtGroups.SQ + 0.5 * lr : sjtGroups.SQ),
    AQ: Math.round(0.6 * aq + 0.4 * sjtGroups.AQ),
    DQ: Math.round(dq),
    LA: Math.round(la),
    Int: Math.round(moduleRaws.INT ? 0.7 * integrity + 0.3 * sjtGroups.Int : sjtGroups.Int),
  };

  return RADIAL_DIMS.reduce((acc, d) => { acc[d] = dims[d]; return acc; }, {} as Record<RoleDimension, number>);
}

export { RADIAL_DIMS };

// ── End-to-end enterprise evaluation ──────────────────────────────────────────

import { buildAssessmentResult, type BuildResultInput } from './scoring';
import type { AssessmentResult } from '../types';

/**
 * Full enterprise/role pipeline: raw answers → module raws → work style →
 * role candidate vector → complete AssessmentResult (PII, RFI, archetype,
 * integrity band). This is the single entry point the runner calls on submit.
 */
export function evaluateEnterpriseAssessment(
  mode: 'enterprise' | 'role',
  tier: EnterpriseTier,
  deployed: DeployedModules,
  answers: Record<string, AnswerValue>,
  intake: Record<string, unknown> = {},
  roleIds?: string[],
  roleTrack?: import('../types').RoleTrackId,
): AssessmentResult {
  const { moduleRaws, workStyle, integrityFlags } = scoreEnterprise(tier, deployed, answers);

  // Feed the WS Curiosity dimension into the Learning Agility index.
  if (workStyle) {
    moduleRaws.WS = { raw: Math.round(workStyle.Curiosity * 10), max: 100, weight: 0, difficultyBias: 0 };
  }

  const sjtGroups = sjtGroupPct(deployed, answers);
  const roleCandidate = candidateRoleDimensions(moduleRaws, workStyle, sjtGroups);

  const input: BuildResultInput = {
    mode,
    tier,
    intake,
    moduleRaws,
    roleIds,
    workStyle,
    roleCandidate,
    integrityFlags,
    roleTrack,
  };

  return buildAssessmentResult(input);
}
