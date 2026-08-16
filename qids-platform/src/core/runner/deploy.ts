// ─── Unified runner deployment ────────────────────────────────────────────────
// Builds the deployed item set for a tier: adaptively selects items from each
// bank up to the module's spec deployed count, so the runner UI stays in sync
// with the scoring engine.

import type { EnterpriseItem, EnterpriseModuleId, EnterpriseTier, RoleTrackId } from '../types';
import { ENTERPRISE_MODULES, modulesForTier } from '../modes';
import { getItemBank } from '../data/itemBanks';
import { getRoleTrack } from '../data/roleTracks';
import { buildDeployList } from '../engine/adaptive';
import type { DeployedModules } from '../engine/moduleScoring';

// Deterministic seeded PRNG (mulberry32) so deployments can be reproduced in
// tests and replayed in reports. Math.random is used when no seed is given.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deploy items for a tier. Every module in the tier is deployed with its spec
 * count (banks smaller than the spec deploy what they have, e.g. 6/6 WS).
 * Pass a seed for a reproducible deployment.
 */
export function deployTier(
  tier: EnterpriseTier,
  seed?: number,
  rng: () => number = Math.random,
): DeployedModules {
  const r = seed !== undefined ? mulberry32(seed) : rng;
  const out: DeployedModules = {};
  for (const mod of modulesForTier(tier)) {
    const bank = getItemBank(mod.id);
    if (!bank || bank.items.length === 0) continue;
    const pool = [...bank.items];
    // Ipsative (WS) uses the full bank; adaptive batteries deploy up to spec count.
    const count = mod.scoring === 'ipsative' ? pool.length : mod.deployed;
    const items = buildDeployList(pool, Math.min(count, pool.length), 'M', r);
    if (items.length) out[mod.id] = items;
  }
  return out;
}

/** Total deployed item count across a tier. */
export function deployedCount(deployed: DeployedModules): number {
  return Object.values(deployed).reduce((s, items) => s + items.length, 0);
}

/**
 * Deploy a Role Intelligence (RIQ) track. The spec deploys 8 (QGRA) / 12
 * (QPIA) / 15 (QLIA) items; banks smaller than the target deploy what they
 * have (e.g. 6/6 for Manufacturing). Returns items keyed under `RIQ` so the
 * runner and scoring engine treat it as a module.
 */
export function deployRoleTrack(
  trackId: RoleTrackId,
  tier: EnterpriseTier,
  seed?: number,
  rng: () => number = Math.random,
): EnterpriseItem[] {
  const track = getRoleTrack(trackId);
  if (!track || track.items.length === 0) return [];
  const r = seed !== undefined ? mulberry32(seed) : rng;
  const count = Math.min(track.meta.deployed[tier] ?? track.meta.deployed.QGRA, track.items.length);
  return buildDeployList(track.items, count, 'M', r);
}

/** Flatten a deployment into a stable ordered item list (module order). */
export function flattenDeployment(deployed: DeployedModules): { module: EnterpriseModuleId; items: EnterpriseItem[] }[] {
  return ENTERPRISE_MODULES
    .filter(m => deployed[m.id]?.length)
    .map(m => ({ module: m.id, items: deployed[m.id] as EnterpriseItem[] }));
}

/** Estimated total time (minutes) for a deployment. */
export function deploymentMinutes(deployed: DeployedModules): number {
  return Object.entries(deployed).reduce((sum, [id, items]) => {
    const mod = ENTERPRISE_MODULES.find(m => m.id === id);
    return sum + (mod?.timeMin ?? 0);
  }, 0);
}
