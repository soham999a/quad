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
];

export const RUBRIC_MAP: Record<RubricDimensionId, RubricDimension> =
  Object.fromEntries(RUBRIC_DIMENSIONS.map(d => [d.id, d])) as Record<RubricDimensionId, RubricDimension>;

export const DIMENSION_TO_PILLAR: Record<RubricDimensionId, string> =
  Object.fromEntries(RUBRIC_DIMENSIONS.map(d => [d.id, d.pillar])) as Record<RubricDimensionId, string>;

/** 10 sample live interview questions — one per dimension (2 extra for variety). */
export const LIVE_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'LQ-01',
    text: 'Tell me about a time you had to explain a complex idea to someone unfamiliar with the topic. How did you ensure they understood?',
    dimension: 'Communication',
    context: 'Assesses clarity, audience awareness, and active listening.',
  },
  {
    id: 'LQ-02',
    text: 'Describe a situation where you faced an unexpected obstacle on a project. How did you analyze the problem and what solution did you implement?',
    dimension: 'ProblemSolving',
    context: 'Assesses structured analytical thinking and solution quality.',
  },
  {
    id: 'LQ-03',
    text: 'Give an example of a time you had to make a difficult decision without complete information. What was your process?',
    dimension: 'Leadership',
    context: 'Assesses decisiveness, initiative, and comfort with ambiguity.',
  },
  {
    id: 'LQ-04',
    text: 'Tell me about a time you received critical feedback that was hard to hear. How did you process it and what did you do with it?',
    dimension: 'EmotionalIntelligence',
    context: 'Assesses self-awareness, emotional regulation, and growth mindset.',
  },
  {
    id: 'LQ-05',
    text: 'Describe a major change in your work or personal life that required you to completely adjust your approach. How did you handle it?',
    dimension: 'Adaptability',
    context: 'Assesses resilience, flexibility, and ability to pivot.',
  },
  {
    id: 'LQ-06',
    text: 'Tell me about a time you worked with a difficult teammate. How did you manage the relationship and what was the outcome?',
    dimension: 'Teamwork',
    context: 'Assesses collaboration, conflict resolution, and interpersonal skill.',
  },
  {
    id: 'LQ-07',
    text: 'Describe a situation where you had to choose between doing what was easy and doing what was right. What did you choose and why?',
    dimension: 'Integrity',
    context: 'Assesses ethical judgment, accountability, and consistency.',
  },
  {
    id: 'LQ-08',
    text: 'Give an example of a time you identified a flaw in a plan or argument that others had accepted. How did you raise it?',
    dimension: 'CriticalThinking',
    context: 'Assesses evidence evaluation, intellectual rigor, and courage.',
  },
  {
    id: 'LQ-09',
    text: 'How do you typically prioritize competing deadlines? Walk me through your thought process with a specific example.',
    dimension: 'ProblemSolving',
    context: 'Additional probe — structured reasoning under pressure.',
  },
  {
    id: 'LQ-10',
    text: 'What is a belief or opinion you held strongly in the past that you later changed? What caused the shift?',
    dimension: 'CriticalThinking',
    context: 'Additional probe — intellectual humility and open-mindedness.',
  },
];

export function getRubricDimension(id: RubricDimensionId): RubricDimension {
  const dim = RUBRIC_MAP[id];
  if (!dim) throw new Error(`Unknown rubric dimension: ${id}`);
  return dim;
}
