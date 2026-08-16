// ─── Enterprise domain data — from QIDS Enterprise Assessment Spec (Parts 1–3) ─
// Role profiles, work-style archetypes, band descriptors, development library.

import type {
  Archetype, BandDescriptor, BandLevel, RoleProfile, RoleDimension,
  WorkStyleDimension, RadarDimension,
} from '../types';

// ── Role competency weight profiles (Section 15.2) ────────────────────────────

const DIM: RoleDimension[] = ['Cog', 'CT', 'EQ', 'SQ', 'AQ', 'DQ', 'LA', 'Int'];

function profile(
  id: string, label: string, description: string,
  weights: Partial<Record<RoleDimension, number>>,
): RoleProfile {
  const w = {} as Record<RoleDimension, number>;
  let sum = 0;
  for (const d of DIM) {
    const v = weights[d] ?? 0;
    w[d] = v;
    sum += v;
  }
  if (sum !== 100) {
    // Normalise drift (keeps configs safe)
    const factor = 100 / sum;
    for (const d of DIM) w[d] = Math.round(w[d] * factor);
  }
  return { id, label, weights: w, description };
}

export const ROLE_PROFILES: RoleProfile[] = [
  profile('software-engineer', 'Software Engineer', 'Analytical depth, systems thinking and disciplined execution.', {
    Cog: 25, CT: 20, EQ: 10, SQ: 10, AQ: 15, DQ: 15, LA: 5, Int: 0 }),
  profile('business-analyst', 'Business Analyst', 'Structured problem decomposition and stakeholder communication.', {
    Cog: 20, CT: 25, EQ: 10, SQ: 15, AQ: 10, DQ: 15, LA: 5, Int: 0 }),
  profile('data-scientist', 'Data Scientist', 'Quantitative rigour, inference quality and model judgement.', {
    Cog: 25, CT: 20, EQ: 5, SQ: 10, AQ: 10, DQ: 20, LA: 10, Int: 0 }),
  profile('sales-executive', 'Sales Executive', 'Resilience, social intelligence and customer psychology.', {
    Cog: 10, CT: 10, EQ: 20, SQ: 25, AQ: 15, DQ: 10, LA: 5, Int: 5 }),
  profile('hr-business-partner', 'HR Business Partner', 'People insight, integrity and principled judgement.', {
    Cog: 10, CT: 10, EQ: 25, SQ: 20, AQ: 10, DQ: 10, LA: 5, Int: 10 }),
  profile('customer-support', 'Customer Support', 'Empathy, composure and de-escalation skill.', {
    Cog: 10, CT: 10, EQ: 25, SQ: 25, AQ: 15, DQ: 5, LA: 5, Int: 5 }),
  profile('operations-manager', 'Operations Manager', 'Balanced execution, coordination and resilience under delivery pressure.', {
    Cog: 15, CT: 15, EQ: 15, SQ: 15, AQ: 15, DQ: 15, LA: 5, Int: 5 }),
  profile('marketing-executive', 'Marketing Executive', 'Persuasion, creativity and audience intelligence.', {
    Cog: 15, CT: 20, EQ: 10, SQ: 20, AQ: 10, DQ: 15, LA: 5, Int: 5 }),
  profile('banking-finance', 'Banking & Finance', 'Rigour, risk judgement and regulatory integrity.', {
    Cog: 20, CT: 20, EQ: 10, SQ: 10, AQ: 10, DQ: 15, LA: 5, Int: 10 }),
  profile('leadership', 'Leadership (QLIA)', 'Strategic influence, people leadership and organisational impact.', {
    Cog: 15, CT: 15, EQ: 15, SQ: 15, AQ: 15, DQ: 10, LA: 10, Int: 5 }),
  profile('general-graduate', 'General Graduate', 'Balanced baseline for entry-level multi-track hiring.', {
    Cog: 20, CT: 15, EQ: 15, SQ: 15, AQ: 15, DQ: 10, LA: 10, Int: 0 }),
];

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_PROFILES.map(r => [r.id, r.label]),
);

// ── Work style dimensions (Section 13.1) ─────────────────────────────────────

export const WORK_STYLE_DIMENSIONS: { id: WorkStyleDimension; label: string; desc: string; high: string }[] = [
  { id: 'Ownership', label: 'Ownership', desc: 'Personal accountability for outcomes.', high: 'Takes initiative without being asked; acknowledges mistakes quickly.' },
  { id: 'Curiosity', label: 'Curiosity', desc: 'Orientation toward learning and novelty.', high: 'Asks probing questions; energised by new challenges.' },
  { id: 'Execution', label: 'Execution', desc: 'Discipline, precision and follow-through.', high: 'Meets deadlines reliably; systematic approach.' },
  { id: 'LearningAgility', label: 'Learning Agility', desc: 'Speed and flexibility in acquiring new knowledge.', high: 'Adapts quickly; applies lessons across contexts.' },
  { id: 'Communication', label: 'Communication', desc: 'Clear, direct, audience-appropriate communication.', high: 'Articulates complex ideas simply; proactive sharing.' },
  { id: 'Integrity', label: 'Integrity Orientation', desc: 'Alignment between stated values and behaviour.', high: 'Raises concerns; keeps promises; transparent under pressure.' },
];

// ── Eight work style archetypes (Section 13.2) ────────────────────────────────

export const ARCHETYPES: Archetype[] = [
  { id: 'architect', label: 'The Architect', signature: ['Execution', 'Curiosity'], strengths: 'Systematic, rigorous, self-directed. Builds quality outputs independently.', watchouts: 'May under-invest in relationship capital; can be perfectionistic under pressure.' },
  { id: 'catalyst', label: 'The Catalyst', signature: ['Curiosity', 'LearningAgility'], strengths: 'Generates energy, ideas and momentum. Excellent in ambiguous new challenges.', watchouts: 'Starts more than they finish; follow-through needs active management.' },
  { id: 'anchor', label: 'The Anchor', signature: ['Integrity', 'Execution'], strengths: 'Deeply reliable, trustworthy and consistent. Excels in high-stakes delivery.', watchouts: 'May resist necessary change; can underestimate the value of experimentation.' },
  { id: 'connector', label: 'The Connector', signature: ['Communication', 'Curiosity'], strengths: 'Builds relationships and shared understanding rapidly. Strong in cross-functional roles.', watchouts: 'Output quality depends heavily on team context; needs structure to execute independently.' },
  { id: 'pathfinder', label: 'The Pathfinder', signature: ['LearningAgility', 'Ownership'], strengths: 'Thrives on novel challenges and self-directed growth. First into new territory.', watchouts: 'Can undervalue proven processes; may resist slowing down for documentation.' },
  { id: 'executor', label: 'The Executor', signature: ['Execution', 'Ownership'], strengths: 'Delivers with exceptional reliability and precision. The backbone of project teams.', watchouts: 'May struggle in rapidly changing environments; prefers clear direction over ambiguity.' },
  { id: 'champion', label: 'The Champion', signature: ['Communication', 'Ownership'], strengths: 'Persuasive, principled and energising. Moves people and organisations through conviction.', watchouts: 'May move ahead of evidence; needs analytical partners for balanced decisions.' },
];

export const INTEGRATOR_ARCHETYPE: Archetype = {
  id: 'integrator', label: 'The Integrator', signature: ['Ownership', 'Curiosity'],
  strengths: 'Versatile and stable. Adapts to team needs. Rarely a point of failure.',
  watchouts: 'May lack a distinctive signature strength; development should focus on intentional specialisation.',
};

// ── Band descriptors (Section 14) — 8 radar dimensions × 4 bands ──────────────

export const BAND_T_SCORES: Record<BandLevel, { tMin: number; tMax: number; percentile: string }> = {
  Exceptional: { tMin: 65, tMax: 100, percentile: 'Top 7%' },
  Proficient:  { tMin: 50, tMax: 65,  percentile: 'Top 16–50%' },
  Developing:  { tMin: 35, tMax: 50,  percentile: 'Top 50–84%' },
  Emerging:    { tMin: 0,  tMax: 35,  percentile: 'Bottom 16%' },
};

export const RADAR_DIMENSIONS: { id: RadarDimension; label: string }[] = [
  { id: 'IQ',  label: 'Intelligence (Cognitive)' },
  { id: 'EQ',  label: 'Emotional Intelligence' },
  { id: 'SQ',  label: 'Social Intelligence' },
  { id: 'AQ',  label: 'Adversity & Resilience' },
  { id: 'CT',  label: 'Critical Thinking' },
  { id: 'DQ',  label: 'Decision Quality' },
  { id: 'LA',  label: 'Learning Agility' },
  { id: 'PR',  label: 'Professional Readiness' },
];

export const BAND_DESCRIPTORS: Record<RadarDimension, Record<BandLevel, string>> = {
  IQ: {
    Exceptional: 'Processes complex information rapidly and accurately. Excels in multi-step reasoning and data interpretation.',
    Proficient: 'Solid analytical and reasoning capability. Handles standard professional complexity with confidence.',
    Developing: 'Functional reasoning with some gaps in speed or accuracy under time pressure.',
    Emerging: 'Significant gaps in processing speed or reasoning accuracy. Structured practice recommended.',
  },
  EQ: {
    Exceptional: 'Highly attuned to own and others\u2019 emotional states. Maintains composure under significant pressure.',
    Proficient: 'Good emotional awareness and regulation in most situations. Empathy present but may not always translate into optimal action.',
    Developing: 'Functional emotional capability with some inconsistency under pressure or in conflict situations.',
    Emerging: 'Significant emotional intelligence gaps that may affect relationships and performance under stress.',
  },
  SQ: {
    Exceptional: 'Reads social contexts with precision and builds high-trust relationships rapidly.',
    Proficient: 'Navigates most social situations effectively and communicates with clarity.',
    Developing: 'Some inconsistency reading social cues or influencing groups; coaching beneficial.',
    Emerging: 'Significant gaps in social navigation that may limit influence and collaboration.',
  },
  AQ: {
    Exceptional: 'Thrives under adversity; recovers quickly and sustains performance through disruption.',
    Proficient: 'Handles typical pressure well; may show some reactivity under compound stress.',
    Developing: 'Functional resilience with vulnerability under sustained or compound pressure.',
    Emerging: 'Adversity tends to cascade; foundational resilience development required.',
  },
  CT: {
    Exceptional: 'Evaluates arguments rigorously, identifies assumptions and fallacies, and reasons from evidence.',
    Proficient: 'Structures analysis effectively on familiar problems; may miss deeper assumptions under time pressure.',
    Developing: 'Reasons soundly on straightforward cases but struggles with ambiguity or counter-evidence.',
    Emerging: 'Difficulty separating evidence from opinion; structured argument training recommended.',
  },
  DQ: {
    Exceptional: 'Makes high-quality decisions under ambiguity using explicit criteria and alternatives.',
    Proficient: 'Decides soundly when options are clear; may rush under time pressure.',
    Developing: 'Decisions sometimes rest on incomplete criteria or cognitive shortcuts.',
    Emerging: 'Decision-making under uncertainty is a significant development area.',
  },
  LA: {
    Exceptional: 'Learns fast and transfers insight across contexts; actively seeks new domains.',
    Proficient: 'Adapts to new demands with reasonable speed and reflection.',
    Developing: 'Builds competence steadily but may require structured learning support.',
    Emerging: 'Slow to integrate new knowledge; structured, deliberate practice required.',
  },
  PR: {
    Exceptional: 'Professionally ready across integrity, work style and delivery reliability.',
    Proficient: 'Solid professional readiness with minor development areas.',
    Developing: 'Readiness gaps in 1–2 professional dimensions.',
    Emerging: 'Significant professional readiness gaps; placement risk is elevated.',
  },
};

// ── PII banding (Section 7.3) ─────────────────────────────────────────────────

export const PII_BANDS = [
  { min: 125, max: 145, band: 'Exceptional', label: 'Top 5%', desc: 'Demonstrates elite professional intelligence across cognitive, interpersonal, and resilience dimensions.' },
  { min: 110, max: 124, band: 'High', label: 'Top 16%', desc: 'Consistently strong performance across most dimensions. Ready for accelerated development.' },
  { min: 90, max: 109, band: 'Proficient', label: 'Average', desc: 'Solid professional capability with identifiable development areas.' },
  { min: 75, max: 89, band: 'Developing', label: 'Below average', desc: 'Functional capability with significant gaps in 2+ dimensions.' },
  { min: 0, max: 74, band: 'Emerging', label: 'Bottom 16%', desc: 'Foundational gaps across multiple dimensions. Placement risk is elevated.' },
];

// ── RFI thresholds (Section 15.3) ─────────────────────────────────────────────

export const RFI_THRESHOLDS = [
  { min: 85, max: 100, level: 'strong', label: 'Strong Fit', guidance: 'High hiring confidence for this specific role.' },
  { min: 70, max: 84, level: 'good', label: 'Good Fit', guidance: 'Solid match with minor gaps. Suitable for placement with standard onboarding.' },
  { min: 55, max: 69, level: 'partial', label: 'Partial Fit', guidance: 'Meets core requirements but has identifiable gaps in 1–2 weighted dimensions.' },
  { min: 40, max: 54, level: 'stretch', label: 'Stretch', guidance: 'Significant gaps relative to requirements. Consider longer-term pipeline.' },
  { min: 0, max: 39, level: 'mismatch', label: 'Role Mismatch', guidance: 'Profile does not align with this role. Recommend alternative role suggestions.' },
] as const;

// ── Development & onboarding content library (Section 16) ────────────────────

export interface DevelopmentEntry {
  subDimension: string;
  day30: string;
  day90: string;
  day180: string;
}

export const DEVELOPMENT_LIBRARY: DevelopmentEntry[] = [
  {
    subDimension: 'Emotional Regulation',
    day30: 'Practice a daily 5-minute self-check-in: name your emotional state and note triggers. Keep a brief log.',
    day90: 'Take on one high-pressure delivery with a pre-agreed debrief on how you managed your emotional responses.',
    day180: 'You can consistently describe your regulation strategy in a debrief — and others observe a calmer baseline under pressure.',
  },
  {
    subDimension: 'Empathy',
    day30: 'After each important conversation, write one sentence: \u201cWhat I think they were actually feeling was\u2026\u201d and reflect on accuracy.',
    day90: 'Conduct 3 structured empathy interviews with colleagues whose perspectives differ significantly from yours.',
    day180: 'Your peer feedback on \u201cmakes me feel heard\u201d improves measurably in a structured 360\u00b0 pulse.',
  },
  {
    subDimension: 'Conflict Navigation',
    day30: 'Study the Thomas-Kilmann Conflict Mode Instrument. Identify your default style and one alternative to practice.',
    day90: 'Volunteer to mediate or facilitate one real team disagreement. Debrief with a mentor.',
    day180: 'You can articulate a clear personal framework for navigating disagreement — and apply it in at least 2 observed situations.',
  },
  {
    subDimension: 'Critical Thinking',
    day30: 'Complete one structured exercise per week: find one argument in a news article and identify its assumptions, evidence and fallacies.',
    day90: 'Lead a structured pre-mortem on an upcoming project decision. Document potential failure modes.',
    day180: 'Your written analysis and decision memos consistently receive feedback on rigour and logical structure.',
  },
  {
    subDimension: 'Decision Quality',
    day30: 'For every significant decision, document: the decision, alternatives, criteria used, and what you would do differently.',
    day90: 'Take on a decision with genuine ambiguity and incomplete information. Review outcome at 6 weeks.',
    day180: 'You have a personal decision journal showing 5+ documented decisions with retrospective review.',
  },
  {
    subDimension: 'Adaptability',
    day30: 'In each team sync, propose one alternative approach to a planned task — even when the current plan works.',
    day90: 'Volunteer for a role or task outside your comfort zone with a defined learning goal.',
    day180: 'You can reference 3 situations where you changed approach mid-stream and articulate what informed each pivot.',
  },
  {
    subDimension: 'Ethical Judgment',
    day30: 'Review your organisation\u2019s ethics policy and map 3 real decisions you have faced to its principles.',
    day90: 'Facilitate one team conversation about an ethical grey area — without prescribing the answer.',
    day180: 'Colleagues cite you as someone who raises concerns constructively and transparently.',
  },
];
