// ─── Adaptive Router — IRT-lite difficulty selection ─────────────────────────
// Simplified two-parameter logistic model. Tracks a running theta estimate and
// selects the next item whose difficulty is closest to the candidate's ability.
//
// The full IRT machinery from the spec (fixed-parameter conversion tables) is
// approximated: theta updates use a maximum-likelihood-style delta rule and a
// difficulty ladder E/M/H, so the runner stays deterministic and testable.

import type { EnterpriseItem, ItemDifficulty } from '../types';

export interface AdaptiveState {
  theta: number;                 // current ability estimate (logit scale)
  asked: string[];               // item ids already deployed
  correct: number;
  total: number;
  streak: number;
  steps: number;
}

export interface AdaptiveStep {
  item: EnterpriseItem;
  nextTheta: number;
}

export const DIFFICULTY_VALUE: Record<ItemDifficulty, number> = { E: -0.8, M: 0, H: 0.8 };
export const DIFFICULTY_ORDER: ItemDifficulty[] = ['E', 'M', 'H'];

export function initialAdaptiveState(): AdaptiveState {
  return { theta: 0, asked: [], correct: 0, total: 0, streak: 0, steps: 0 };
}

/** Probability of a correct response under 2PL: P = 1 / (1 + e^{-a(θ−b)}). */
export function probabilityCorrect(theta: number, difficulty: number, discrimination = 1.2): number {
  return 1 / (1 + Math.exp(-discrimination * (theta - difficulty)));
}

/** Update theta via a simple gradient step on the log-likelihood. */
export function updateTheta(state: AdaptiveState, item: EnterpriseItem, wasCorrect: boolean, stepSize = 0.25): number {
  const difficulty = DIFFICULTY_VALUE[item.difficulty];
  const p = probabilityCorrect(state.theta, difficulty);
  const gradient = wasCorrect ? (1 - p) : -p;
  const next = state.theta + stepSize * gradient;
  return Math.max(-3, Math.min(3, next));
}

/** Pick the next item: closest difficulty to current theta, weighted toward exploration. */
export function selectNextItem(
  pool: EnterpriseItem[],
  state: AdaptiveState,
  rng: () => number = Math.random,
): EnterpriseItem | undefined {
  const available = pool.filter(it => !state.asked.includes(it.id));
  if (available.length === 0) return undefined;

  // Exploration: with small probability pick a random available item to avoid
  // pathological loops; otherwise pick the best difficulty match.
  if (rng() < 0.15) {
    return available[Math.floor(rng() * available.length)];
  }

  let best: EnterpriseItem | null = null;
  let bestScore = Infinity;
  for (const item of available) {
    const d = DIFFICULTY_VALUE[item.difficulty];
    const score = Math.abs(state.theta - d);
    // Tie-break toward higher discrimination items for information.
    const disc = item.discrimination === 'High' ? 0 : item.discrimination === 'Med' ? 0.05 : 0.1;
    if (score - disc < bestScore) {
      bestScore = score - disc;
      best = item;
    }
  }
  return best ?? available[0];
}

/** Run one step of the adaptive loop and return the new item + updated theta. */
export function adaptiveStep(
  pool: EnterpriseItem[],
  state: AdaptiveState,
  itemId: string,
  wasCorrect: boolean,
): AdaptiveStep | undefined {
  const item = pool.find(i => i.id === itemId);
  if (!item) return undefined;
  const nextTheta = updateTheta(state, item, wasCorrect);
  return {
    item,
    nextTheta,
  };
}

/** Build the deploy list for a module: start mid-difficulty, adapt thereafter. */
export function buildDeployList(
  pool: EnterpriseItem[],
  count: number,
  startingDifficulty: ItemDifficulty = 'M',
  rng: () => number = Math.random,
): EnterpriseItem[] {
  const ordered = pool
    .filter(it => it.difficulty === startingDifficulty)
    .slice();
  const rest = pool.filter(it => it.difficulty !== startingDifficulty);
  const shuffled = (arr: EnterpriseItem[]) => [...arr].sort(() => rng() - 0.5);

  const list = [...shuffled(ordered), ...shuffled(rest)];
  return list.slice(0, Math.min(count, list.length));
}

/** After completion, estimate final ability from the deployment trail. */
export function finalTheta(state: AdaptiveState): number {
  if (state.total === 0) return 0;
  const ratio = state.correct / state.total;
  const logit = Math.log(Math.max(ratio, 0.02) / Math.max(1 - ratio, 0.02));
  return Math.max(-3, Math.min(3, state.theta * 0.7 + logit * 0.3));
}
