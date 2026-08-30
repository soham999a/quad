// ─── QIDS Plans & Entitlements ───────────────────────────────────────────────
// Pure module. UI reads entitlements through this module; it never hard-codes
// plan names in gates. Billing integration (Stripe) can swap the source of
// truth later without touching feature code.

export type PlanId = 'free' | 'pro' | 'school' | 'talent';

export interface PlanTier {
  id: PlanId;
  name: string;
  audience: 'individual' | 'institution' | 'employer';
  priceLabel: string;
  status: 'current' | 'proposed';
  features: string[];
  /** Entitlements surfaced to feature code. */
  entitlements: {
    unlimitedCycles: boolean;
    allContexts: boolean;
    evidencePortfolio: boolean;
    credentialExport: boolean;
    interventionPlans: boolean;
    cohorts: boolean;
    evaluatorConsole: boolean;
    analytics: boolean;
    roleFit: boolean;
    pipReport: boolean;
    deployedBatteries: boolean;
  };
}

export const PLANS: Record<PlanId, PlanTier> = {
  free: {
    id: 'free',
    name: 'Free',
    audience: 'individual',
    priceLabel: '$0',
    status: 'current',
    features: ['One assessment cycle', 'Individual context', 'IQP summary report'],
    entitlements: {
      unlimitedCycles: false,
      allContexts: false,
      evidencePortfolio: false,
      credentialExport: false,
      interventionPlans: false,
      cohorts: false,
      evaluatorConsole: false,
      analytics: false,
      roleFit: false,
      pipReport: false,
      deployedBatteries: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    audience: 'individual',
    priceLabel: 'TBA',
    status: 'proposed',
    features: ['Unlimited cycles', 'All contexts', 'Evidence portfolio', 'Credential export', 'Intervention plans'],
    entitlements: {
      unlimitedCycles: true,
      allContexts: true,
      evidencePortfolio: true,
      credentialExport: true,
      interventionPlans: true,
      cohorts: false,
      evaluatorConsole: false,
      analytics: false,
      roleFit: true,
      pipReport: true,
      deployedBatteries: false,
    },
  },
  school: {
    id: 'school',
    name: 'School',
    audience: 'institution',
    priceLabel: 'TBA',
    status: 'proposed',
    features: ['Cohorts & classes', 'Evaluator console', 'School analytics', 'Age-banded instruments'],
    entitlements: {
      unlimitedCycles: true,
      allContexts: true,
      evidencePortfolio: false,
      credentialExport: false,
      interventionPlans: true,
      cohorts: true,
      evaluatorConsole: true,
      analytics: true,
      roleFit: false,
      pipReport: false,
      deployedBatteries: false,
    },
  },
  talent: {
    id: 'talent',
    name: 'Talent',
    audience: 'employer',
    priceLabel: 'Per assessment',
    status: 'proposed',
    features: ['QGRA/QPIA/QLIA batteries', 'Role Fit + PIP', 'Cohort benchmark', 'Self-serve + enterprise'],
    entitlements: {
      unlimitedCycles: true,
      allContexts: true,
      evidencePortfolio: false,
      credentialExport: false,
      interventionPlans: false,
      cohorts: true,
      evaluatorConsole: false,
      analytics: true,
      roleFit: true,
      pipReport: true,
      deployedBatteries: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'pro', 'school', 'talent'];

export function getPlan(id?: string): PlanTier {
  return (id && PLANS[id as PlanId]) || PLANS.free;
}

/**
 * Entitlement helper. `userPlan` is the user's current plan id, or the
 * tenant's plan id for B2B shells. Usage:
 *   const plan = getPlan(userProfile?.plan);
 *   if (!can(plan, 'credentialExport')) { ...lock UI... }
 */
export function can(plan: PlanTier | undefined, entitlement: keyof PlanTier['entitlements']): boolean {
  if (!plan) return false;
  return plan.entitlements[entitlement] === true;
}
