// ─── PIP Report generator (Pages 1–4, Section 8 spec) ────────────────────────
// Pure functions. Turns a completed AssessmentResult + its deployment + answers
// into the structured data for the 7-page Performance Intelligence Profile.
// Pages 1–4 are generated here; Pages 5–7 (RFI chart, roadmap, interview guide)
// are employer-facing and covered in Phase 7 / interview-mode work.

import type {
  AnswerSheet, AnswerValue, AssessmentResult, BandLevel, EnterpriseItem, EnterpriseModuleId,
  RadarDimension, RoleDimension, WorkStyleDimension, WorkStyleProfile,
} from '../types';
import type { DeployedModules } from '../engine/moduleScoring';
import { moduleWeight, moduleDifficultyBias, scoreMcq, scoreSjt, asBestWorst, sjtGroupPct, candidateRoleDimensions } from '../engine/moduleScoring';
import { irtScale, normalCdf, bandFromTScore } from '../engine/scoring';
import { ROLE_PROFILES } from '../data/enterprise';

// ── Peer norm reference (Page 2 dashed line) ─────────────────────────────────
// Default cohort reference, configurable per employer in a later phase.
export const PEER_NORM: Record<RadarDimension, number> = {
  IQ: 62, EQ: 64, SQ: 60, AQ: 61, CT: 60, DQ: 58, LA: 59, PR: 66,
};

// 8-axis radar ← role candidate dimensions.
const RADAR_TO_ROLE: Record<RadarDimension, RoleDimension> = {
  IQ: 'Cog', CT: 'CT', EQ: 'EQ', SQ: 'SQ', AQ: 'AQ', DQ: 'DQ', LA: 'LA', PR: 'Int',
};

// Module → role dimension for the heatmap highlight rule.
const MODULE_DIM: Partial<Record<EnterpriseModuleId, RoleDimension>> = {
  CR: 'Cog', CT: 'CT', EI: 'EQ', SJT: 'SQ', AQ: 'AQ', INT: 'Int',
  DQ: 'DQ', LR: 'SQ', ST: 'CT', PL: 'SQ', OI: 'AQ',
};

// ── Sub-dimension scores (Page 3 heatmap rows) ────────────────────────────────

export interface SubDimensionScore {
  module: EnterpriseModuleId;
  name: string;                 // competency tag
  raw: number;
  max: number;
  pct: number;                  // raw % 0–100
  tScore: number;
  percentile: number;
  band: BandLevel;
  roleRelevant: boolean;        // highlighted for the top role fit
}

function perItemEarned(item: EnterpriseItem, value: AnswerValue | undefined): { earned: number; max: number } {
  if (item.module === 'SJT') {
    const { most, least } = asBestWorst(value);
    const r = scoreSjt(item, most, least);
    return { earned: r.earned, max: r.max };
  }
  const r = scoreMcq(item, typeof value === 'number' ? value : undefined);
  return { earned: r.earned, max: r.max };
}

function buildSubDimensions(
  deployed: DeployedModules,
  answers: AnswerSheet,
  roleDims: Record<RoleDimension, number> | undefined,
  roleWeights: Record<RoleDimension, number> | undefined,
): SubDimensionScore[] {
  const out: SubDimensionScore[] = [];
  for (const [id, items] of Object.entries(deployed)) {
    if (id === 'WS' || !items.length) continue;
    const groups = new Map<string, { earned: number; max: number }>();
    for (const item of items) {
      const key = item.competency || `${id} Module`;
      const { earned, max } = perItemEarned(item, answers[item.id]);
      const g = groups.get(key) ?? { earned: 0, max: 0 };
      g.earned += earned;
      g.max += max;
      groups.set(key, g);
    }
    const bias = moduleDifficultyBias(items);
    for (const [name, g] of groups) {
      if (g.max <= 0) continue;
      const s = irtScale(g.earned, g.max, bias);
      const mapped = MODULE_DIM[id as EnterpriseModuleId];
      const roleRelevant = !!mapped && !!roleWeights && (roleWeights[mapped] ?? 0) > 0;
      out.push({
        module: id as EnterpriseModuleId,
        name,
        raw: g.earned,
        max: g.max,
        pct: Math.round((g.earned / g.max) * 100),
        tScore: s.tScore,
        percentile: s.percentile,
        band: s.band,
        roleRelevant,
      });
    }
  }
  return out.sort((a, b) => a.module.localeCompare(b.module) || b.tScore - a.tScore);
}

// ── Behavioural descriptors (Page 1 strengths/risks, Appendix A flavoured) ───

const DESCRIPTORS: Record<string, string> = {
  'Self-Regulation': 'Manages emotional responses to maintain performance under stress.',
  'Emotional Regulation': 'Manages emotional responses to maintain performance under stress.',
  'Empathy': 'Accurately perceives and responds to others\' emotional states.',
  'Empathy in Action': 'Accurately perceives and responds to others\' emotional states.',
  'Social Adaptability': 'Adjusts interpersonal style across diverse social and professional contexts.',
  'Conflict Navigation': 'Manages disagreements constructively toward productive resolution.',
  'Adversity Resilience': 'Recovers from setbacks and maintains effectiveness under sustained pressure.',
  'Regenerative Capacity': 'Recovers from setbacks and maintains effectiveness under sustained pressure.',
  'Recovery Speed': 'Recovers quickly from setbacks and re-engages with renewed focus.',
  'Growth Orientation': 'Continuously seeks learning and applies it to improve performance.',
  'Growth Mindset': 'Continuously seeks learning and applies it to improve performance.',
  'Change Orientation': 'Approaches change with curiosity and adjusts course readily.',
  'Professional Integrity': 'Acts in alignment with ethical standards even when costly or inconvenient.',
  'Integrity': 'Acts in alignment with ethical standards even when costly or inconvenient.',
  'Data Honesty': 'Represents information accurately and resists pressure to distort it.',
  'Learning Agility': 'Applies learning from past experience to new and unfamiliar challenges.',
  'Cognitive Flexibility': 'Shifts thinking between perspectives and adapts mental models quickly.',
  'Ambiguity Tolerance': 'Remains effective and composed when information or direction is unclear.',
  'Critical Thinking': 'Evaluates evidence and reasoning to reach well-justified conclusions.',
  'Evidence-Based Judgment': 'Bases conclusions on weighed evidence rather than assumption.',
  'Argument Evaluation': 'Weighs the strength of arguments before committing to a position.',
  'Decision Risk Assessment': 'Identifies and prices risks before committing to a decision.',
  'Expected Value Reasoning': 'Chooses options by expected value rather than sunk cost or impulse.',
  'Decision Quality Tool': 'Applies structured decision tools consistently under pressure.',
  'Systems Thinking': 'Sees the whole system and anticipates downstream effects of decisions.',
  'Scenario Planning': 'Prepares for multiple futures instead of a single forecast.',
  'Strategic Awareness': 'Reads context and longer-term implications beyond the immediate task.',
  'Stakeholder Management': 'Builds and leverages relationships to move work forward.',
  'Cross-functional Influence': 'Mobilises others outside one\'s direct authority toward shared goals.',
  'Upward Navigation': 'Influences leadership constructively with evidence and timing.',
  'Assertiveness': 'States positions clearly and directly while remaining open to input.',
  'Professional Assertiveness': 'States positions clearly and directly while remaining open to input.',
  'Communication Style': 'Communicates clearly, adapting tone and structure to the audience.',
  'Adaptive Problem-Solving': 'Pivots approach quickly and effectively when conditions change.',
  'Proactive Momentum': 'Sustains drive and progress without waiting for external prompting.',
  'Motivation Profile': 'Draws on intrinsic drivers to sustain engagement over time.',
  'EI Definition': 'Understands and applies emotional-intelligence concepts in practice.',
  'Vocabulary': 'Processes verbal information accurately and expresses ideas precisely.',
  'Concept Knowledge': 'Grasps and applies conceptual knowledge to novel contexts.',
};

function descriptor(name: string): string {
  return DESCRIPTORS[name] ?? `Consistent performance on ${name.toLowerCase()} across deployed scenarios.`;
}

export interface Insight {
  name: string;
  descriptor: string;
  tScore: number;
  flagged?: boolean;
}
// ── Behavioural insight options (Page 4) ─────────────────────────────────────

interface InsightPick {
  label: string;
  detail: string;
}

const WORKS_BEST: InsightPick[] = [
  { label: 'Structured clarity', detail: 'Performs best with clear scope, defined milestones and predictable processes.' },
  { label: 'Defined autonomy', detail: 'Performs best when handed clear outcomes and trusted to determine the approach.' },
  { label: 'Collaborative challenge', detail: 'Performs best in fast, interactive settings where ideas are tested against peers.' },
  { label: 'Open-ended exploration', detail: 'Performs best with novel, ambiguous problems that reward curiosity and self-direction.' },
];

const NEEDS_SUPPORT: InsightPick[] = [
  { label: 'Managing ambiguity', detail: 'Most likely to need scaffolding when requirements are vague or shifting.' },
  { label: 'Receiving critical feedback', detail: 'May need feedback framed constructively with clear, actionable specifics.' },
  { label: 'Sustaining motivation independently', detail: 'May need external structure or checkpoints to sustain long-haul effort.' },
  { label: 'Navigating team conflict', detail: 'May need guidance when navigating interpersonal tension or disagreement.' },
];

const COMM_STYLES: InsightPick[] = [
  { label: 'Analytical communicator', detail: 'Communicates through evidence, structure and precision before emotion.' },
  { label: 'Collaborative facilitator', detail: 'Communicates by drawing others in and aligning perspectives.' },
  { label: 'Direct asserter', detail: 'Communicates candidly and decisively, prioritising clarity over consensus.' },
  { label: 'Diplomatic adapter', detail: 'Communicates with high situational awareness, tailoring tone to the listener.' },
];

const LEADERSHIP_STYLES: InsightPick[] = [
  { label: 'Emerging leader', detail: 'Early in leadership development; benefits from structured leadership exposure.' },
  { label: 'Peer influencer', detail: 'Leads through credibility and relationships rather than formal authority.' },
  { label: 'Directive achiever', detail: 'Leads by setting demanding targets and driving execution personally.' },
  { label: 'Coaching enabler', detail: 'Leads by developing others and building capability rather than controlling output.' },
];

const DECISION_STYLES: InsightPick[] = [
  { label: 'Analytical', detail: 'Reaches decisions through systematic analysis and option comparison.' },
  { label: 'Intuitive-experiential', detail: 'Reaches decisions quickly, drawing on experience and pattern recognition.' },
  { label: 'Collaborative', detail: 'Reaches decisions by consulting others and building consensus.' },
  { label: 'Systematic', detail: 'Reaches decisions through structured frameworks and staged evaluation.' },
];

const LEARNING_PREFERENCES: InsightPick[] = [
  { label: 'Self-directed research', detail: 'Learns best by seeking out sources and figuring things out independently.' },
  { label: 'Experiential / trial', detail: 'Learns best by doing, iterating and learning from mistakes.' },
  { label: 'Social learning', detail: 'Learns best through discussion, coaching and observing others.' },
  { label: 'Structured instruction', detail: 'Learns best through clear curriculum, courses and guided practice.' },
];

const EXECUTION_PREFERENCES: InsightPick[] = [
  { label: 'Systematic planner', detail: 'Prefers to sequence work, set milestones and track against a plan.' },
  { label: 'Adaptive executor', detail: 'Adjusts approach fluidly as conditions change, prioritising momentum.' },
  { label: 'Collaborative finisher', detail: 'Completes work best when team accountability is shared.' },
  { label: 'Deadline-driven sprinter', detail: 'Peaks under deadlines, compressing effort into final stretches.' },
];

function pickFrom(list: InsightPick[], index: number): InsightPick {
  return list[Math.max(0, Math.min(list.length - 1, index))];
}

// ── Page 4 derivations ────────────────────────────────────────────────────────

interface Page4Input {
  ws: WorkStyleProfile | undefined;
  wsItemsCount: number;
  moduleT: Record<string, number>;
  sjtGroups: Record<'EQ' | 'SQ' | 'AQ' | 'Int', number>;
}

function buildPage4(i: Page4Input) {
  const ws = i.ws;
  const top: WorkStyleDimension = ws
    ? (Object.entries(ws).sort((a, b) => b[1] - a[1])[0]?.[0] as WorkStyleDimension ?? 'Execution')
    : 'Execution';
  const low: WorkStyleDimension = ws
    ? (Object.entries(ws).sort((a, b) => a[1] - b[1])[0]?.[0] as WorkStyleDimension ?? 'Communication')
    : 'Communication';

  const wsTop = (ws?.[top] ?? 5) / 10;
  const aq = i.moduleT.AQ ?? 50;

  // Works Best Under: combine top work-style dimension with AQ situational agility.
  let worksBest = pickFrom(WORKS_BEST, 1); // default: Defined autonomy
  if (top === 'Curiosity' || top === 'LearningAgility') worksBest = WORKS_BEST[3];
  else if (top === 'Communication') worksBest = WORKS_BEST[2];
  else if (top === 'Execution') worksBest = aq >= 55 ? WORKS_BEST[0] : WORKS_BEST[1];
  else worksBest = WORKS_BEST[1];

  // Needs Support When: lowest WS dimension + EI score.
  let needs = pickFrom(NEEDS_SUPPORT, 2); // default: sustaining motivation
  if (low === 'Communication') needs = NEEDS_SUPPORT[3];
  else if (low === 'LearningAgility' || low === 'Curiosity') needs = NEEDS_SUPPORT[0];
  else if (low === 'Integrity') needs = NEEDS_SUPPORT[2];
  else if (low === 'Ownership') needs = NEEDS_SUPPORT[1];
  else needs = NEEDS_SUPPORT[0];

  // Communication style: WS communication rank + SJT EQ groups.
  const comm = ws?.Communication ?? 5;
  let commStyle = COMM_STYLES[3]; // default diplomatic adapter
  if (comm >= 8) commStyle = COMM_STYLES[2];
  else if (comm >= 6.5) commStyle = i.sjtGroups.EQ >= 60 ? COMM_STYLES[3] : COMM_STYLES[2];
  else commStyle = i.sjtGroups.EQ >= 60 ? COMM_STYLES[1] : COMM_STYLES[0];

  // Leadership style: QPIA/QLIA LR module + SJT SQ groups.
  const lr = i.moduleT.LR ?? 50;
  let leader = LEADERSHIP_STYLES[0];
  if (lr >= 65) leader = LEADERSHIP_STYLES[3];
  else if (lr >= 55) leader = i.sjtGroups.SQ >= 60 ? LEADERSHIP_STYLES[2] : LEADERSHIP_STYLES[1];
  else if (i.sjtGroups.SQ >= 65) leader = LEADERSHIP_STYLES[1];
  else leader = LEADERSHIP_STYLES[0];

  // Decision style: CT + Cognitive scores.
  const ct = i.moduleT.CT ?? 50;
  const cr = i.moduleT.CR ?? 50;
  let decision = DECISION_STYLES[3];
  if (ct >= 65 && cr >= 60) decision = DECISION_STYLES[0];
  else if (ct >= 55) decision = DECISION_STYLES[3];
  else decision = (cr + ct) / 2 >= 55 ? DECISION_STYLES[0] : DECISION_STYLES[1];

  // Learning preference: WS learning dimension.
  const la = ws?.LearningAgility ?? 5;
  let learn = LEARNING_PREFERENCES[1]; // experiential
  if (la >= 7) learn = LEARNING_PREFERENCES[0];
  else if (la >= 5) learn = LEARNING_PREFERENCES[1];
  else learn = LEARNING_PREFERENCES[3];

  // Execution preference: WS execution dimension.
  const ex = ws?.Execution ?? 5;
  let exec = EXECUTION_PREFERENCES[1]; // adaptive executor
  if (ex >= 7) exec = EXECUTION_PREFERENCES[0];
  else if (ex >= 5) exec = EXECUTION_PREFERENCES[1];
  else exec = EXECUTION_PREFERENCES[3];

  return {
    worksBestUnder: worksBest,
    needsSupportWhen: needs,
    communicationStyle: commStyle,
    leadershipStyle: leader,
    decisionStyle: decision,
    learningPreference: learn,
    executionPreference: exec,
  };
}

// ── Radar (Page 2) ────────────────────────────────────────────────────────────

export interface RadarPoint {
  dimension: RadarDimension;
  score: number;          // 0–100 candidate
  norm: number;           // 0–100 peer norm
  tScore: number;
  percentile: number;
  band: BandLevel;
}

function buildRadar(roleCandidate: Record<RoleDimension, number>): RadarPoint[] {
  return (Object.keys(RADAR_TO_ROLE) as RadarDimension[]).map(dim => {
    const score = Math.round(roleCandidate[RADAR_TO_ROLE[dim]] ?? 50);
    const s = irtScale(score, 100, 0);
    return {
      dimension: dim,
      score,
      norm: PEER_NORM[dim],
      tScore: s.tScore,
      percentile: s.percentile,
      band: s.band,
    };
  });
}

// ── PIP assembler ─────────────────────────────────────────────────────────────

export interface PipReportData {
  header: {
    name: string;
    date: string;
    tier: string;
    targetRole: string;
    assessorOrg: string;
  };
  page1: {
    piiScore: number;
    piiMax: number;
    piiBand: string;
    piiLabel: string;
    percentile: number;
    strengths: Insight[];
    risks: Insight[];
    learningAgility: { score: number; label: string };
    roleRecommendation: {
      role: string;
      matchPct: number;
      statement: string;
      alternatives: { role: string; matchPct: number; rationale: string }[];
    };
    hiringConfidence: { level: 'High' | 'Moderate' | 'Caution'; color: string; rationale: string };
  };
  page2: {
    radar: RadarPoint[];
    peerNorm: Record<RadarDimension, number>;
  };
  page3: {
    rows: SubDimensionScore[];
  };
  page4: {
    worksBestUnder: InsightPick;
    needsSupportWhen: InsightPick;
    communicationStyle: InsightPick;
    leadershipStyle: InsightPick;
    decisionStyle: InsightPick;
    learningPreference: InsightPick;
    executionPreference: InsightPick;
  };
}

const HIRING_COLOR: Record<'High' | 'Moderate' | 'Caution', string> = { High: '#10b981', Moderate: '#f59e0b', Caution: '#ef4444' };

export function buildPipReport(
  result: AssessmentResult,
  deployed: DeployedModules,
  answers: AnswerSheet,
): PipReportData {
  // Reconstruct module raws so role candidate + radar can be recomputed.
  const moduleRaws: Record<string, { raw: number; max: number; weight: number; difficultyBias: number }> = {};
  for (const [id, s] of Object.entries(result.moduleScores ?? {})) {
    if (!s) continue;
    moduleRaws[id] = {
      raw: s.raw,
      max: s.max,
      weight: moduleWeight(id as EnterpriseModuleId),
      difficultyBias: moduleDifficultyBias(deployed[id as EnterpriseModuleId] ?? []),
    };
  }

  const wsItems = deployed.WS ?? [];
  const workStyle = result.workStyle?.profile;
  const sjtGroups = sjtGroupPct(deployed, answers);
  const roleCandidate = candidateRoleDimensions(moduleRaws, workStyle, sjtGroups);

  const subDims = buildSubDimensions(deployed, answers, roleCandidate, topRoleWeights(result.rfi?.[0]?.roleId));

  // Strengths / risks from sub-dimensions.
  const scored = subDims.filter(d => d.pct > 0).sort((a, b) => b.tScore - a.tScore);
  const strengths: Insight[] = scored.slice(0, 3).map(d => ({ name: d.name, descriptor: descriptor(d.name), tScore: d.tScore }));
  const riskCandidates = [...scored].sort((a, b) => a.tScore - b.tScore);
  const risks: Insight[] = riskCandidates.slice(0, 3).map(d => ({ name: d.name, descriptor: descriptor(d.name), tScore: d.tScore }));
  const flagged = (result.integrity?.flaggedItems?.length ?? 0) > 0;
  if (flagged && risks.length) {
    risks.unshift({ name: 'Ethical Judgment', descriptor: 'One or more integrity items were answered with a clearly inappropriate option.', tScore: risks[0].tScore, flagged: true });
    risks.length = 3;
  }

  const pii = result.pii;
  const piiScore = pii?.score ?? 0;
  const percentile = Math.max(1, Math.min(99, Math.round(normalCdf((piiScore - 100) / 15) * 100)));

  const rfi = result.rfi ?? [];
  const top = rfi[0];
  const alternatives = rfi.slice(1, 3).map(r => ({
    role: r.roleLabel,
    matchPct: r.matchPct,
    rationale: `Scores ${r.matchPct}% against the ${r.roleId} requirement profile.`,
  }));

  const confidenceLevel: 'High' | 'Moderate' | 'Caution' = piiScore >= 105 ? 'High' : piiScore >= 90 ? 'Moderate' : 'Caution';
  const confidenceRationale =
    confidenceLevel === 'High' ? `PII of ${piiScore} places the candidate in a strong competitive range.` :
    confidenceLevel === 'Moderate' ? `PII of ${piiScore} suggests moderate readiness; review against role requirements.` :
    `PII of ${piiScore} warrants caution; recommend development before placement.`;

  const page4 = buildPage4({
    ws: workStyle,
    wsItemsCount: wsItems.length,
    moduleT: Object.fromEntries(Object.entries(result.moduleScores ?? {}).map(([k, v]) => [k, v.tScore])),
    sjtGroups,
  });

  const intake = result.intake ?? {};
  const name = typeof intake.name === 'string' ? intake.name : 'Candidate';

  return {
    header: {
      name,
      date: new Date(result.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      tier: result.tier ?? 'QGRA',
      targetRole: top?.roleLabel ?? 'General',
      assessorOrg: typeof intake.org === 'string' && intake.org ? intake.org : 'Not specified',
    },
    page1: {
      piiScore,
      piiMax: 145,
      piiBand: pii?.band ?? '—',
      piiLabel: pii?.label ?? '—',
      percentile,
      strengths,
      risks,
      learningAgility: { score: result.learningAgility?.score ?? 0, label: result.learningAgility?.label ?? 'Grounded' },
      roleRecommendation: top
        ? {
            role: top.roleLabel,
            matchPct: top.matchPct,
            statement: `Hiring confidence for ${top.roleLabel} based on Role Fit Index match.`,
            alternatives,
          }
        : { role: '—', matchPct: 0, statement: 'No role fits evaluated.', alternatives: [] },
      hiringConfidence: { level: confidenceLevel, color: HIRING_COLOR[confidenceLevel], rationale: confidenceRationale },
    },
    page2: {
      radar: buildRadar(roleCandidate),
      peerNorm: PEER_NORM,
    },
    page3: { rows: subDims },
    page4,
  };
}

function topRoleWeights(roleId: string | undefined): Record<RoleDimension, number> | undefined {
  if (!roleId) return undefined;
  return ROLE_PROFILES.find(r => r.id === roleId)?.weights;
}

// Keep the file import-only (no side effects) for browsers.
export const PIP_MAX_PAGES = 7;
