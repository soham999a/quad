// ─── QIDS Unified Domain Types ────────────────────────────────────────────────
// Single source of truth for every assessment mode, scoring model, and report.

// ── Identity & modes ──────────────────────────────────────────────────────────

export type PillarId = 'IQ' | 'EQ' | 'SQ' | 'AQ';

export type AgeGroup = '11-18' | '19-32';

/** Four assessment modes the platform ships. */
export type AssessmentMode = 'individual' | 'school' | 'enterprise' | 'role';

/** Enterprise tiers. Scaling factor reflects elevated difficulty calibration. */
export type EnterpriseTier = 'QGRA' | 'QPIA' | 'QLIA';
export const TIER_SCALING: Record<EnterpriseTier, number> = {
  QGRA: 1.0,
  QPIA: 1.15,
  QLIA: 1.28,
};

export type UserRole = 'student' | 'individual' | 'evaluator' | 'employer' | 'admin';

// ── QIDS individual / school pillars ─────────────────────────────────────────

export interface PillarDef {
  id: PillarId;
  label: string;
  short: string;
  color: string;
  gradient: string;
  weight: number;
  maxScore: number;
  emoji: string;
  description: string;
  framework: string;
  subParams: { id: string; label: string; max: number; desc: string; weight?: number }[];
  bonusSections?: { id: string; label: string; max: number; desc: string }[];
  assessmentMethods: string[];
  developmentFocus: string[];
  careerAlignment: string;
  rdWeights?: Record<string, number>;
  rdMax?: number;
}

export type PillarScores = Record<PillarId, number>;

// ── Enterprise scoring dimensions ─────────────────────────────────────────────

/** The 8 radar dimensions shown in the PIP report. */
export type RadarDimension =
  | 'IQ' | 'EQ' | 'SQ' | 'AQ'
  | 'CT'            // Critical Thinking
  | 'DQ'            // Decision Quality
  | 'LA'            // Learning Agility
  | 'PR';           // Professional Readiness

/** Role competency dimensions (RFI model). */
export type RoleDimension =
  | 'Cog' | 'CT' | 'EQ' | 'SQ' | 'AQ'
  | 'DQ' | 'LA' | 'Int';

/** Six work-style dimensions (ipsative profile). */
export type WorkStyleDimension =
  | 'Ownership' | 'Curiosity' | 'Execution'
  | 'LearningAgility' | 'Communication' | 'Integrity';

export type WorkStyleProfile = Record<WorkStyleDimension, number>;

// ── Enterprise modules & items ────────────────────────────────────────────────

export type ItemDifficulty = 'E' | 'M' | 'H';
export type Discrimination = 'Low' | 'Med' | 'High';

export interface EnterpriseItem {
  id: string;
  module: EnterpriseModuleId;
  stem: string;
  options: string[];
  /** Index into options for the correct answer, or array of indices (Best/Worst). */
  answer: number | number[];
  /** 0-based index of the LEAST effective option for SJT Best/Worst items. */
  worst?: number;
  difficulty: ItemDifficulty;
  timeSec: number;
  competency: string;
  discrimination: Discrimination;
  /** Expected marks for SJT style: [most, second, third, least-as-most, least-correct]. */
  scoring?: { best: number; second: number; third: number; worstAsBest: number; worstCorrect: number };
}

export type EnterpriseModuleId =
  | 'CR' | 'CT' | 'SJT' | 'EI' | 'AQ' | 'WS' | 'INT'
  | 'DQ' | 'LR' | 'ST' | 'PL' | 'OI' | 'RIQ';

/** Role Intelligence (RIQ) role tracks — Section 6 item banks. */
export type RoleTrackId =
  | 'SE' | 'DS' | 'BF' | 'HR' | 'MK' | 'SA' | 'OL' | 'CS'
  | 'MF' | 'RT' | 'GG' | 'FI' | 'HC' | 'ED';

export interface EnterpriseModule {
  id: EnterpriseModuleId;
  label: string;
  qi: PillarId | 'WorkStyle' | 'Ethics';
  itemCount: number;
  deployed: number;
  timeMin: number;
  weight: number;                       // PII composite weight (Work Style = 0)
  bands: 4 | 3;
  tiers: EnterpriseTier[];              // which tiers deploy this module
  scoring: 'mcq' | 'best_worst' | 'ipsative' | 'ranking';
}

// ── Enterprise role profiles ──────────────────────────────────────────────────

export interface RoleProfile {
  id: string;
  label: string;
  /** 8 role dimensions must sum to 100%. */
  weights: Record<RoleDimension, number>;
  required?: Record<RoleDimension, number>;  // candidate_requirement targets
  description: string;
}

// ── Work style archetypes ─────────────────────────────────────────────────────

export interface Archetype {
  id: string;
  label: string;
  /** Profile signature: top-2 dimension pair. */
  signature: [WorkStyleDimension, WorkStyleDimension];
  strengths: string;
  watchouts: string;
}

// ── Band descriptors (8 radar dimensions × 4 bands) ───────────────────────────

export type BandLevel = 'Exceptional' | 'Proficient' | 'Developing' | 'Emerging';

export interface BandDescriptor {
  level: BandLevel;
  tMin: number;   // inclusive lower bound (T-score)
  tMax: number;   // exclusive upper bound
  percentile: string;
  descriptor: string;
}

// ── Scores ────────────────────────────────────────────────────────────────────

export interface DimensionScore {
  raw: number;
  max: number;
  theta: number;      // IRT theta estimate
  tScore: number;     // mean=50, sd=10
  percentile: number;
  band: BandLevel;
}

export type ModuleScores = Partial<Record<EnterpriseModuleId, DimensionScore>>;

export interface RFIResult {
  roleId: string;
  roleLabel: string;
  matchPct: number;
  dimensionScores: Record<RoleDimension, number>;
  threshold: 'strong' | 'good' | 'partial' | 'stretch' | 'mismatch';
}

export interface AssessmentResult {
  mode: AssessmentMode;
  tier?: EnterpriseTier;
  intake: Record<string, unknown>;
  pillarScores?: PillarScores;
  unifiedScore?: number;
  grade?: { grade: string; label: string; color: string };
  skillShape?: 'T' | 'I' | 'X' | 'M';
  careerProfile?: { id: string; label: string; condition: string; roles: string[] };
  moduleScores?: ModuleScores;
  pii?: {
    score: number;           // standard score mean=100 sd=15, scaled
    rawComposite: number;    // pre-scaling weighted composite
    band: string;
    label: string;
  };
  learningAgility?: { score: number; label: 'Accelerator' | 'Builder' | 'Consolidator' | 'Grounded' };
  workStyle?: { profile: WorkStyleProfile; archetype: Archetype; watchouts: string[] };
  rfi?: RFIResult[];
  integrity?: { band: 'Pass' | 'Flag' | 'Concern'; flaggedItems: string[] };
  /** Role Intelligence quotient for a role track (T-score 20–80, 4 bands). */
  riq?: { score: number; band: DimensionScore['band']; percentile: number; track: RoleTrackId; trackLabel: string };
  timestamp: string;
}

// ── Runner (unified assessment flow) ──────────────────────────────────────────

export type AnswerValue = number | string | number[] | Record<string, unknown>;

/** Normalised answer store used by the unified runner across all modes. */
export type AnswerSheet = Record<string, AnswerValue>;

export interface ModeConfig {
  id: AssessmentMode;
  label: string;
  shortLabel: string;
  description: string;
  roles: string[];
  icon: string;
  /** Ordered runner steps. Each step is a section of the assessment. */
  steps: RunnerStep[];
  scoring: 'qids' | 'enterprise' | 'role';
  availableTiers?: EnterpriseTier[];
  availableRoles?: RoleProfile[];
}

export interface RunnerStep {
  id: string;
  label: string;
  module?: EnterpriseModuleId;
  pillar?: PillarId;
  deployCount: number;
  timeMin: number;
  instructions: string;
}
