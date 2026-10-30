import type { RubricDimension, RubricDimensionId, InterviewQuestion } from '../types';

export const RUBRIC_DIMENSIONS: RubricDimension[] = [
  {
    id: 'Communication',
    label: 'Communication',
    shortLabel: 'COMM',
    description: 'Clarity, articulation, active listening, and ability to convey ideas effectively.',
    pillar: 'SQ',
    weight: 1,
    descriptors: {
      1: 'Struggles to articulate thoughts; frequent misunderstandings; minimal eye contact.',
      2: 'Basic communication; occasionally unclear; limited active listening.',
      3: 'Clear and competent; reasonable articulation; listens adequately.',
      4: 'Strong communicator; precise language; demonstrates active listening and follow-through.',
      5: 'Exceptional clarity and persuasion; adapts style to audience; excels at active listening.',
    },
  },
  {
    id: 'ProblemSolving',
    label: 'Problem-Solving',
    shortLabel: 'PROB',
    description: 'Analytical reasoning, structured thinking, and ability to break down complex problems.',
    pillar: 'IQ',
    weight: 1,
    descriptors: {
      1: 'Struggles to identify problems; relies on trial and error.',
      2: 'Basic problem identification; limited analytical approach.',
      3: 'Sound analytical skills; structured approach with moderate complexity.',
      4: 'Strong analytical thinker; identifies root causes; proposes effective solutions.',
      5: 'Exceptional problem-solver; systems-level thinking; innovative and data-driven solutions.',
    },
  },
  {
    id: 'Leadership',
    label: 'Leadership',
    shortLabel: 'LEAD',
    description: 'Decisiveness, initiative, ability to influence and guide others toward goals.',
    pillar: 'SQ',
    weight: 1,
    descriptors: {
      1: 'Avoids decisions; waits for direction; no initiative.',
      2: 'Takes limited initiative; struggles to influence others.',
      3: 'Makes reasonable decisions; can guide small tasks; shows some initiative.',
      4: 'Confident decision-maker; influences effectively; takes ownership of outcomes.',
      5: 'Visionary leader; inspires others; navigates ambiguity with confidence and integrity.',
    },
  },
  {
    id: 'EmotionalIntelligence',
    label: 'Emotional Intelligence',
    shortLabel: 'EQ',
    description: 'Self-awareness, empathy, emotional regulation, and interpersonal sensitivity.',
    pillar: 'EQ',
    weight: 1,
    descriptors: {
      1: 'Low self-awareness; difficulty managing emotions; limited empathy.',
      2: 'Basic emotional awareness; occasional empathy; emotional reactions sometimes disproportionate.',
      3: 'Adequate self-awareness; demonstrates empathy; generally manages emotions well.',
      4: 'High self-awareness; strong empathy; handles difficult situations with composure.',
      5: 'Exceptional emotional intelligence; reads rooms effortlessly; models emotional regulation.',
    },
  },
  {
    id: 'Adaptability',
    label: 'Adaptability',
    shortLabel: 'ADAP',
    description: 'Flexibility, resilience under change, and ability to pivot strategies effectively.',
    pillar: 'AQ',
    weight: 1,
    descriptors: {
      1: 'Resists change strongly; struggles with ambiguity; rigid in approach.',
      2: 'Uncomfortable with change; limited flexibility; prefers rigid structure.',
      3: 'Manages change adequately; adjusts when necessary; moderate resilience.',
      4: 'Embraces change; pivots effectively; demonstrates strong resilience.',
      5: 'Thrives in ambiguity; turns change into opportunity; models adaptability for others.',
    },
  },
  {
    id: 'Teamwork',
    label: 'Teamwork',
    shortLabel: 'TEAM',
    description: 'Collaboration, conflict resolution, and ability to work effectively within diverse teams.',
    pillar: 'SQ',
    weight: 1,
    descriptors: {
      1: 'Difficulty collaborating; avoids teamwork; creates friction.',
      2: 'Basic collaboration; occasional conflict; limited contribution to team goals.',
      3: 'Effective team member; resolves minor conflicts; contributes consistently.',
      4: 'Strong collaborator; facilitates team cohesion; navigates conflict constructively.',
      5: 'Exceptional team builder; creates psychological safety; elevates entire team performance.',
    },
  },
  {
    id: 'Integrity',
    label: 'Integrity',
    shortLabel: 'INT',
    description: 'Ethical judgment, honesty, consistency between words and actions, accountability.',
    pillar: 'EQ',
    weight: 1,
    descriptors: {
      1: 'Questionable ethical judgment; inconsistent accountability; avoids responsibility.',
      2: 'Basic honesty; occasional inconsistency; limited ownership of mistakes.',
      3: 'Demonstrates integrity; takes responsibility; generally consistent in ethics.',
      4: 'Strong ethical compass; transparent; holds self and others accountable.',
      5: 'Exemplary integrity; leads by example; earns trust consistently through actions.',
    },
  },
  {
    id: 'CriticalThinking',
    label: 'Critical Thinking',
    shortLabel: 'CT',
    description: 'Evidence evaluation, logical reasoning, questioning assumptions, and intellectual rigor.',
    pillar: 'IQ',
    weight: 1,
    descriptors: {
      1: 'Accepts information uncritically; limited logical reasoning; few questions.',
      2: 'Basic questioning; limited evidence evaluation; some logical gaps.',
      3: 'Sound critical thinking; questions assumptions; evaluates evidence adequately.',
      4: 'Strong analytical rigor; challenges assumptions with evidence; synthesizes well.',
      5: 'Exceptional critical thinker; evaluates biases; integrates multiple perspectives with precision.',
    },
  },
  {
    id: 'Resilience',
    label: 'Resilience & Stress Tolerance',
    shortLabel: 'RES',
    description: 'Composure under pressure, recovery from setbacks, and sustained effort despite difficulty.',
    pillar: 'AQ',
    weight: 1,
    descriptors: {
      1: 'Easily overwhelmed; gives up quickly under pressure; struggles to recover from setbacks.',
      2: 'Some composure; limited recovery; performance dips noticeably under stress.',
      3: 'Maintains composure in moderate pressure; recovers reasonably; persists on tough tasks.',
      4: 'Stays composed under significant pressure; recovers quickly; sustains effort through difficulty.',
      5: 'Thrives under high pressure; models calm confidence; turns setbacks into learning and momentum.',
    },
  },
];

export const RUBRIC_MAP: Record<RubricDimensionId, RubricDimension> =
  Object.fromEntries(RUBRIC_DIMENSIONS.map(d => [d.id, d])) as Record<RubricDimensionId, RubricDimension>;

export const DIMENSION_TO_PILLAR: Record<RubricDimensionId, string> =
  Object.fromEntries(RUBRIC_DIMENSIONS.map(d => [d.id, d.pillar])) as Record<RubricDimensionId, string>;

/**
 * Live-interview question bank — built from the PIP Page 7 Interview Guide
 * format (QiDS Enterprise Intelligence Assessment spec): each item carries a
 * targeted behavioural question and strong/weak scoring anchors. Every item
 * also carries a probeBank (Appendix B: 2–3 follow-up probes displayed on
 * click). LQ-01–06 are verbatim from the spec's interview guide table; their
 * probeBank starts with the spec's own follow-up probe, followed by
 * platform-authored probes derived from the competency dictionary and each
 * item's scoring anchor. LQ-07–12 are platform-authored extensions (source:
 * 'platform') — three cover rubric dimensions the spec's table leaves out
 * (Communication, Teamwork, Leadership) and three are reserve probes the
 * interviewer can pull in, derived from the competency dictionary. Every
 * probeBank opens with a probe that also serves as `followUp`, so any
 * consumer reading only followUp still gets the spec-format single probe.
 */
export const LIVE_QUESTIONS: InterviewQuestion[] = [
  // ── From the spec — Conflict Resolution (EQ low) ─────────────────────────
  {
    id: 'LQ-01',
    text: 'Tell me about a significant disagreement you had with a teammate or peer. What happened and how did you handle it?',
    dimension: 'EmotionalIntelligence',
    context: 'Flagged: emotional intelligence — conflict handling.',
    followUp: 'What did you learn about your own conflict style from that experience?',
    probeBank: [
      'What did you learn about your own conflict style from that experience?',
      'How did you separate the person from the problem while it was still live?',
      'If the same disagreement resurfaced tomorrow, what would you do earlier?',
    ],
    strong: 'Takes ownership, describes specific resolution behaviour, reflects.',
    weak: 'Blames others, vague, avoids detail.',
    source: 'pdf',
  },
  // ── From the spec — Adaptability (AQ low) ────────────────────────────────
  {
    id: 'LQ-02',
    text: 'Describe a situation where requirements or direction changed significantly midway through something you were leading.',
    dimension: 'Adaptability',
    context: 'Flagged: adaptability — mid-course pivot.',
    followUp: 'How did you manage your own reaction to the change before deciding how to act?',
    probeBank: [
      'How did you manage your own reaction to the change before deciding how to act?',
      'Which assumptions did you have to drop for the pivot to work?',
      'What earlier signal that change was coming did you overlook?',
    ],
    strong: 'Specific, actionable pivot, manages emotional response.',
    weak: 'Reactive, complains about change, no learning.',
    source: 'pdf',
  },
  // ── From the spec — Ethical Judgment (Integrity flag) ────────────────────
  {
    id: 'LQ-03',
    text: 'Have you ever been in a situation where doing the right thing was professionally risky? What did you do?',
    dimension: 'Integrity',
    context: 'Flagged: integrity — costly ethical choice.',
    followUp: 'How did you decide that was the right course of action?',
    probeBank: [
      'How did you decide that was the right course of action?',
      'What did the choice cost you personally — and was it worth it?',
      'How would you counsel a peer who took the easier path in that same situation?',
    ],
    strong: 'Clear ethical reasoning, accepts discomfort, no exaggeration.',
    weak: 'Vague, rule-based only, no personal ownership.',
    source: 'pdf',
  },
  // ── From the spec — Critical Thinking (CT low) ───────────────────────────
  {
    id: 'LQ-04',
    text: 'Tell me about a decision you made that turned out to be wrong. How did you identify it was wrong?',
    dimension: 'CriticalThinking',
    context: 'Flagged: critical thinking — error recognition.',
    followUp: 'What process do you now use to stress-test your decisions before acting on them?',
    probeBank: [
      'What process do you now use to stress-test your decisions before acting on them?',
      'Which early signal of the failure was visible but dismissed?',
      'Which of your usual decision inputs do you trust less now?',
    ],
    strong: 'Specific, accepts responsibility, articulates learning.',
    weak: 'Externalises cause, no process articulated.',
    source: 'pdf',
  },
  // ── From the spec — Resilience (AQ-RC low) ───────────────────────────────
  {
    id: 'LQ-05',
    text: 'What is the most significant setback you have faced professionally? How did you recover?',
    dimension: 'Resilience',
    context: 'Flagged: resilience — recovery from adversity.',
    followUp: 'What is different about how you approach similar situations now?',
    probeBank: [
      'What is different about how you approach similar situations now?',
      'What did the recovery actually require, day to day?',
      'How do you know — with evidence — that you handle setbacks differently today?',
    ],
    strong: 'Specific adversity, structured recovery, concrete learning.',
    weak: 'Minimises setback, no growth integration.',
    source: 'pdf',
  },
  // ── From the spec — Learning Agility (composite low) → ProblemSolving ────
  // The spec flags this question to a LOW LEARNING-AGILITY composite. The
  // interview rubric has no dedicated LearningAgility dimension — learning
  // agility is observed through ProblemSolving (IQ pillar: decomposition,
  // novel-problem method, speed of acquisition) — so the spec's verbatim text
  // routes there. The scoring anchor is the spec's own strong/weak wording.
  {
    id: 'LQ-06',
    text: 'Describe a time you had to learn something significantly new in a short period. What did you do and how did it go?',
    dimension: 'ProblemSolving',
    context: 'Flagged: learning agility — fast acquisition under pressure.',
    followUp: 'What does your typical learning process look like when you start something completely new?',
    probeBank: [
      'What does your typical learning process look like when you start something completely new?',
      'How much of what you learned came from your own method rather than formal training?',
      'What did you get wrong on the first attempt, and when did you notice?',
    ],
    strong: 'Self-directed approach, concrete method, applied successfully.',
    weak: 'Relies only on training, no personal initiative.',
    source: 'pdf',
  },
  // ── Platform — Communication ────────────────────────────────────────────
  {
    id: 'LQ-07',
    text: 'Tell me about a time you had to explain a complex idea to someone unfamiliar with the topic. How did you ensure they understood?',
    dimension: 'Communication',
    context: 'Assesses clarity, audience awareness, and active listening.',
    followUp: 'How did you check their understanding instead of assuming it?',
    probeBank: [
      'How did you check their understanding instead of assuming it?',
      'Where did you first notice the explanation landing wrong, and what did you change?',
      'What did you leave out on purpose — and how did you decide it was safe to cut?',
    ],
    strong: 'Audience-aware language, checks for understanding, invites questions.',
    weak: 'Describes what they said, not how the other person received it.',
    source: 'platform',
  },
  // ── Platform — Teamwork ─────────────────────────────────────────────────
  {
    id: 'LQ-08',
    text: 'Tell me about a time you worked with a difficult teammate. How did you manage the relationship and what was the outcome?',
    dimension: 'Teamwork',
    context: 'Assesses collaboration, conflict resolution, and interpersonal skill.',
    followUp: 'Looking back, is there anything you would do earlier the next time?',
    probeBank: [
      'Looking back, is there anything you would do earlier the next time?',
      'When did you first sense the friction — and what did you try before it escalated?',
      'How did you keep the shared outcome alive while the relationship was strained?',
    ],
    strong: 'Separates the person from the problem, acts early, keeps the goal central.',
    weak: 'Escalates first, labels the teammate, outcome unclear.',
    source: 'platform',
  },
  // ── Platform — Leadership ────────────────────────────────────────────────
  {
    id: 'LQ-09',
    text: 'Give an example of a time you had to make a difficult decision without complete information. What was your process?',
    dimension: 'Leadership',
    context: 'Assesses decisiveness, initiative, and comfort with ambiguity.',
    followUp: 'What would have made that decision easier — and what could you decide earlier next time?',
    probeBank: [
      'What would have made that decision easier — and what could you decide earlier next time?',
      'Which information did you decide you could safely act without? How did you make that call?',
      'Who did you involve in the decision — and did the call stay yours or get diluted?',
    ],
    strong: 'Weighs trade-offs explicitly, owns the call, states the review point.',
    weak: 'Defers to others, decision criteria unclear, no reflection.',
    source: 'platform',
  },
  // ── Probe bank — reserve items the interviewer can pull in on click ─────
  {
    id: 'LQ-10',
    text: 'How do you typically prioritise competing deadlines? Walk me through your thought process with a specific example.',
    dimension: 'ProblemSolving',
    context: 'Assesses structured reasoning under pressure.',
    followUp: 'Walk me through what you postponed, not just what you did first.',
    probeBank: [
      'Walk me through what you postponed, not just what you did first.',
      'When did you revisit the priorities — and what changed on the re-check?',
      'What did you cut to protect the top item? Was it the right trade?',
    ],
    strong: 'Names explicit criteria and trade-offs within a real example.',
    weak: 'Generic priority advice, no lived example.',
    source: 'platform',
  },
  {
    id: 'LQ-11',
    text: 'What is a belief or opinion you held strongly in the past that you later changed? What caused the shift?',
    dimension: 'CriticalThinking',
    context: 'Assesses intellectual humility and open-mindedness.',
    followUp: 'What evidence finally moved you — and how long did you resist it first?',
    probeBank: [
      'What evidence finally moved you — and how long did you resist it first?',
      'Who helped change your mind, and how did they do it without a fight?',
      'What changed in your decisions once the old belief was gone?',
    ],
    strong: 'Names the evidence or experience that changed the view.',
    weak: 'Cannot recall any changed belief.',
    source: 'platform',
  },
  {
    id: 'LQ-12',
    text: 'Tell me about a time you were under intense pressure or faced a setback. What did you do to stay productive and how did you recover?',
    dimension: 'Resilience',
    context: 'Assesses composure and sustained effort.',
    followUp: 'What did the first 24 hours of that setback actually look like?',
    probeBank: [
      'What did the first 24 hours of that setback actually look like?',
      'Which part of your routine kept you functional — and where did it nearly break?',
      'What would the same pressure have cracked in you two years earlier?',
    ],
    strong: 'Concrete coping routine, sustained output, honest reflection.',
    weak: 'Claims no pressure or no recovery story.',
    source: 'platform',
  },
];

export function getRubricDimension(id: RubricDimensionId): RubricDimension {
  const dim = RUBRIC_MAP[id];
  if (!dim) throw new Error(`Unknown rubric dimension: ${id}`);
  return dim;
}
