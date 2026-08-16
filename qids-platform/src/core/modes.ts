import type { ModeConfig, RunnerStep, EnterpriseModule, EnterpriseTier } from './types';

// ─── Enterprise module catalogue ──────────────────────────────────────────────

export const ENTERPRISE_MODULES: EnterpriseModule[] = [
  { id: 'CR',  label: 'Cognitive Readiness',  qi: 'IQ',        itemCount: 60, deployed: 18, timeMin: 12, weight: 0.25, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'CT',  label: 'Critical Thinking',    qi: 'IQ',        itemCount: 30, deployed: 10, timeMin: 8,  weight: 0.15, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'SJT', label: 'Workplace Judgement',  qi: 'EQ',        itemCount: 36, deployed: 12, timeMin: 10, weight: 0.20, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'best_worst' },
  { id: 'EI',  label: 'Emotional Intelligence', qi: 'EQ',      itemCount: 24, deployed: 8,  timeMin: 6,  weight: 0.10, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'AQ',  label: 'Adaptability & Resilience', qi: 'AQ',   itemCount: 24, deployed: 8,  timeMin: 6,  weight: 0.10, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'WS',  label: 'Work Style',           qi: 'WorkStyle', itemCount: 18, deployed: 6,  timeMin: 4,  weight: 0.00, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'ipsative' },
  { id: 'INT', label: 'Integrity & Risk',     qi: 'Ethics',    itemCount: 15, deployed: 5,  timeMin: 4,  weight: 0.10, bands: 4, tiers: ['QGRA', 'QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'DQ',  label: 'Decision Quality',     qi: 'IQ',        itemCount: 24, deployed: 8,  timeMin: 8,  weight: 0.00, bands: 4, tiers: ['QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'LR',  label: 'Leadership Readiness', qi: 'SQ',        itemCount: 18, deployed: 6,  timeMin: 8,  weight: 0.00, bands: 4, tiers: ['QPIA', 'QLIA'], scoring: 'mcq' },
  { id: 'ST',  label: 'Strategic Thinking',   qi: 'IQ',        itemCount: 20, deployed: 10, timeMin: 8,  weight: 0.00, bands: 4, tiers: ['QLIA'], scoring: 'mcq' },
  { id: 'PL',  label: 'People Leadership',    qi: 'SQ',        itemCount: 20, deployed: 8,  timeMin: 6,  weight: 0.00, bands: 4, tiers: ['QLIA'], scoring: 'mcq' },
  { id: 'OI',  label: 'Organisational Impact', qi: 'AQ',       itemCount: 18, deployed: 6,  timeMin: 6,  weight: 0.00, bands: 4, tiers: ['QLIA'], scoring: 'mcq' },
  // RIQ is deployed per role track (Section 6) rather than per tier; its tiers
  // list is intentionally empty so modulesForTier never auto-includes it.
  { id: 'RIQ', label: 'Role Intelligence',    qi: 'IQ',        itemCount: 124, deployed: 8, timeMin: 8,  weight: 0.00, bands: 4, tiers: [], scoring: 'mcq' },
];

export function modulesForTier(tier: EnterpriseTier): EnterpriseModule[] {
  return ENTERPRISE_MODULES.filter(m => m.tiers.includes(tier));
}

export const ENTERPRISE_TIERS: { id: EnterpriseTier; label: string; scaling: number; desc: string }[] = [
  { id: 'QGRA', label: 'QGRA — Core Assessment', scaling: 1.0, desc: 'Cognitive, judgement, resilience & integrity baseline for graduate/entry-level evaluation.' },
  { id: 'QPIA', label: 'QPIA — Professional Intelligence', scaling: 1.15, desc: 'Adds Decision Quality & Leadership Readiness for professional/mid-level roles.' },
  { id: 'QLIA', label: 'QLIA — Leadership Intelligence', scaling: 1.28, desc: 'Full battery incl. Strategic Thinking, People Leadership & Organisational Impact for senior roles.' },
];

// ─── Runner step builders ─────────────────────────────────────────────────────

function enterpriseSteps(tier: EnterpriseTier): RunnerStep[] {
  return modulesForTier(tier).map(m => ({
    id: m.id,
    label: m.label,
    module: m.id,
    deployCount: m.deployed,
    timeMin: m.timeMin,
    instructions: '',
  }));
}

function qidsSteps(): RunnerStep[] {
  return [
    { id: 'intake', label: 'Intake & Consent', pillar: 'IQ', deployCount: 0, timeMin: 2, instructions: 'Identity, demographics, context and informed consent.' },
    { id: 'IQ', label: 'IQ Assessment', pillar: 'IQ', deployCount: 0, timeMin: 20, instructions: 'Verbal, Quantitative, Psychometric, Performance + Visual & AI bonus.' },
    { id: 'EQ', label: 'EQ Assessment', pillar: 'EQ', deployCount: 0, timeMin: 15, instructions: 'DEC framework — self-report Part A and activity Part B.' },
    { id: 'SQ', label: 'SQ Assessment', pillar: 'SQ', deployCount: 0, timeMin: 15, instructions: 'Social Intelligence Assessment Center — ACE, CSI, PBA.' },
    { id: 'AQ', label: 'AQ Assessment', pillar: 'AQ', deployCount: 0, timeMin: 15, instructions: 'Resilience Dynamics Framework — weighted components.' },
    { id: 'review', label: 'Review & Submit', pillar: 'IQ', deployCount: 0, timeMin: 2, instructions: 'Confirm intake and submit for scoring.' },
  ];
}

// ─── The four mode configs ────────────────────────────────────────────────────

export const MODES: Record<string, ModeConfig> = {
  individual: {
    id: 'individual',
    label: 'Individual Development',
    shortLabel: 'Individual',
    description: 'Holistic 4-quotient baseline with pre/post intervention tracking, evaluator scoring and career guidance.',
    roles: ['student', 'individual'],
    icon: 'User',
    steps: qidsSteps(),
    scoring: 'qids',
  },
  school: {
    id: 'school',
    label: 'School / College',
    shortLabel: 'Institutional',
    description: 'Age-split instruments with evaluator rubric merge, IQP gap analysis and year-wise heatmaps.',
    roles: ['student', 'individual', 'evaluator'],
    icon: 'GraduationCap',
    steps: qidsSteps(),
    scoring: 'qids',
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise — QGRA',
    shortLabel: 'Enterprise',
    description: 'Tier-based professional intelligence assessment with adaptive difficulty and PII scoring.',
    roles: ['individual', 'employer'],
    icon: 'Building2',
    steps: enterpriseSteps('QGRA'),
    scoring: 'enterprise',
    availableTiers: ['QGRA', 'QPIA', 'QLIA'],
  },
  role: {
    id: 'role',
    label: 'Role Intelligence',
    shortLabel: 'Role Fit',
    description: 'QGRA + role-specific track generating Role Fit Index across 8 competency dimensions.',
    roles: ['individual', 'employer'],
    icon: 'Target',
    steps: enterpriseSteps('QGRA'),
    scoring: 'role',
    availableTiers: ['QGRA', 'QPIA', 'QLIA'],
  },
};

export function getMode(id: string): ModeConfig {
  return MODES[id] ?? MODES.individual;
}

export function buildModeSteps(modeId: string, tier?: EnterpriseTier): RunnerStep[] {
  const mode = getMode(modeId);
  if (mode.id === 'enterprise' || mode.id === 'role') {
    return enterpriseSteps(tier ?? 'QGRA');
  }
  return qidsSteps();
}
