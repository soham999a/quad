// QIDS Core Data Configuration — modular, CMS-ready

export const CONTEXTS = [
  { id: 'school',     label: 'School',     icon: 'SCH', desc: 'Foundational development with age-appropriate activities and developmental milestones.' },
  { id: 'college',    label: 'College',    icon: 'COL', desc: 'Advanced development with specialization based on academic and career paths.' },
  { id: 'corporate',  label: 'Corporate',  icon: 'COR', desc: 'Professional application with focus on leadership, teamwork, and organizational effectiveness.' },
  { id: 'individual', label: 'Individual', icon: 'IND', desc: 'Personalized holistic development pathway tailored to unique goals and strengths.' },
  { id: 'custom',     label: 'Custom',     icon: 'CST', desc: 'Configurable context for specialized institutions and unique developmental needs.' },
];

export const WEIGHTS = { IQ: 1.00, EQ: 2.00, SQ: 2.00, AQ: 1.28 };
export const MAX_WEIGHT_SUM = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // 6.28

export const GRADE_BANDS = [
  { grade: 'A', label: 'Excellent', min: 90, max: 100, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { grade: 'B', label: 'Very Good', min: 75, max: 89, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  { grade: 'C', label: 'Good', min: 60, max: 74, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { grade: 'D', label: 'Satisfactory', min: 45, max: 59, color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { grade: 'E', label: 'Needs Improvement', min: 0, max: 44, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];

export const PILLARS = {
  IQ: {
    id: 'IQ',
    label: 'Intelligence Quotient',
    short: 'IQ',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
    weight: 1.00,
    maxScore: 100,
    description: 'Extends beyond traditional IQ testing to encompass multiple dimensions of cognitive ability including verbal, quantitative, psychometric, and performance intelligence.',
    framework: 'Four-Parameter Cognitive Model',
    subParams: [
      { id: 'verbal', label: 'Verbal Intelligence', max: 25, desc: 'Language comprehension, expression, and reasoning through words.' },
      { id: 'quantitative', label: 'Quantitative Intelligence', max: 25, desc: 'Numerical reasoning, mathematical problem-solving, and logical analysis.' },
      { id: 'psychometric', label: 'Psychometric Abilities', max: 25, desc: 'Pattern recognition, spatial reasoning, and abstract thinking.' },
      { id: 'performance', label: 'Performance Intelligence', max: 25, desc: 'Practical application of cognitive skills in real-world tasks.' },
    ],
    assessmentMethods: ['Standardized psychometric tests', 'Verbal reasoning tasks', 'Quantitative problem sets', 'Performance-based activities'],
    developmentFocus: ['Cognitive strengthening exercises', 'Reasoning and logic training', 'Problem-solving modules', 'Critical thinking workshops'],
    careerAlignment: 'High IQ profiles align with analytical, technical, research, and specialist career tracks.',
  },
  EQ: {
    id: 'EQ',
    label: 'Emotional Quotient',
    short: 'EQ',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    weight: 2.00,
    maxScore: 100,
    description: 'Assessed through the Dynamic Emotional Competency (DEC) Framework — measuring real-time emotional adaptability and contextual integration rather than static traits.',
    framework: 'Dynamic Emotional Competency (DEC)',
    subParams: [
      { id: 'self_awareness', label: 'Self-Awareness', max: 20, desc: 'Self-concept clarity, emotional literacy, and impulse recognition.' },
      { id: 'self_management', label: 'Self-Management', max: 20, desc: 'Impulse control, stress management, and emotional regulation.' },
      { id: 'social_awareness', label: 'Social Awareness', max: 20, desc: 'Empathy, organizational awareness, and reading social cues.' },
      { id: 'relationship_mgmt', label: 'Relationship Management', max: 20, desc: 'Influence, conflict management, and collaborative leadership.' },
      { id: 'emotional_resilience', label: 'Emotional Resilience', max: 20, desc: 'Growth mindset, emotional recovery velocity, and optimism under pressure.' },
    ],
    assessmentMethods: ['DEC Framework questionnaire', 'Scenario-based emotional response tasks', 'Peer and self-assessment', 'Behavioral observation'],
    developmentFocus: ['Pause-and-reflect drills (Stop-Think-Act)', 'Self-regulation practice', 'Emotional awareness journaling', 'Empathy-building activities'],
    careerAlignment: 'High EQ profiles excel in HR, counseling, customer relations, and high-level leadership roles.',
  },
  SQ: {
    id: 'SQ',
    label: 'Social Quotient',
    short: 'SQ',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #a855f7, #c084fc)',
    weight: 2.00,
    maxScore: 100,
    description: 'Measures the ability to navigate social environments effectively, build meaningful relationships, and demonstrate cognitive social intelligence.',
    framework: 'Social Intelligence Assessment Center',
    subParams: [
      { id: 'social_perception', label: 'Social Perception', max: 34, desc: 'Reading social situations, non-verbal cues, and group dynamics.' },
      { id: 'cognitive_social', label: 'Cognitive Social Intelligence', max: 33, desc: 'Understanding social norms, perspective-taking, and social reasoning.' },
      { id: 'performance_social', label: 'Performance-Based Social Skills', max: 33, desc: 'Demonstrated collaboration, communication, and social adaptability.' },
    ],
    assessmentMethods: ['Assessment center exercises', 'Group activity observation', 'Role-play scenarios', 'Peer interaction analysis'],
    developmentFocus: ['Collaboration workshops', 'Social awareness training', 'Communication skills modules', 'Team leadership exercises'],
    careerAlignment: 'High SQ profiles thrive in team leadership, community development, education, and social enterprise roles.',
  },
  AQ: {
    id: 'AQ',
    label: 'Adversity Quotient',
    short: 'AQ',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    weight: 1.28,
    maxScore: 100,
    description: 'Evaluated through the Resilience Dynamics Framework — measuring the ability to anticipate, navigate, and grow through adversity as a dynamic, developable system.',
    framework: 'Resilience Dynamics Framework (RDF)',
    subParams: [
      { id: 'situational_agility', label: 'Situational Agility', max: 20, desc: 'Rapid adaptation to changing circumstances and environments.' },
      { id: 'proactive_momentum', label: 'Proactive Momentum', max: 20, desc: 'Initiative-taking and forward-thinking under pressure.' },
      { id: 'adversity_response', label: 'Adversity Response', max: 20, desc: 'Behavioral and cognitive response quality during setbacks.' },
      { id: 'growth_integration', label: 'Growth Integration', max: 20, desc: 'Ability to extract learning and growth from difficult experiences.' },
      { id: 'resilience_sustainability', label: 'Resilience Sustainability', max: 20, desc: 'Long-term maintenance of resilience capacity and persistence.' },
    ],
    assessmentMethods: ['Resilience Dynamics questionnaire', 'Situational judgment tests', 'Stress simulation activities', 'Longitudinal behavioral tracking'],
    developmentFocus: ['Resilience-building modules', 'Anticipation and adaptability training', 'Persistence coaching', 'High-pressure simulation exercises'],
    careerAlignment: 'High AQ profiles are suited for high-pressure, adaptive, and resilience-heavy roles including entrepreneurship, crisis management, and military/emergency services.',
  },
};

export const PRE_INTERVENTION_NODES = [
  { id: 'intake', label: 'Intake & Consent', desc: 'Collect identity, demographics, context (school/college/corporate), language, history, and informed consent.', owner: 'Administrator', artifacts: ['Consent form', 'Demographic profile'] },
  { id: 'prepare', label: 'Prepare Assessment Suite', desc: 'Assemble instruments: IQ psychometrics, EQ DEC instruments, SQ assessment-center tasks, AQ resilience tools.', owner: 'Assessment Lead', artifacts: ['Assessment battery', 'Instrument checklist'] },
  { id: 'baseline', label: 'Baseline Data Collection', desc: 'Administer full assessment suite using questionnaires, observation, and engagement activities.', owner: 'Evaluator', artifacts: ['Raw score sheets', 'Observation logs'] },
  { id: 'standardize', label: 'Standardize & Score', desc: 'Normalize raw results to standardized scales. Compute sub-component scores and four quotient vectors.', owner: 'Data Analyst', artifacts: ['Standardized scoring tables'], kpi: 'Scoring accuracy 100%' },
  { id: 'profile', label: 'Integrated Profile Construction', desc: 'Aggregate sub-scores into pillar profiles. Generate radar chart and heatmap visualization.', owner: 'Analyst', artifacts: ['Quotient profile', 'Radar chart'] },
  { id: 'weighting', label: 'Dynamic Weightage Algorithm', desc: 'Apply context-sensitive weights (IQ×1.0, EQ×2.0, SQ×2.0, AQ×1.28) to compute unified score.', owner: 'Algorithm Engine', artifacts: ['Weighted score matrix'] },
  { id: 'banding', label: 'Banding & Intervention Mapping', desc: 'Assign grade bands (A–E). Flag critical parameters (<60%). Map to intervention modules.', owner: 'Counselor', artifacts: ['Grade report', 'Intervention map'] },
];

export const INTERVENTION_NODES = [
  { id: 'scheduling', label: 'Scheduling & Resource Allocation', desc: 'Plan intervention timeline, assign facilitators, allocate resources and session slots.', owner: 'Program Manager', artifacts: ['6-month roadmap', 'Resource plan'] },
  { id: 'deployment', label: 'Module Deployment', desc: 'Deploy targeted intervention modules based on gap analysis and priority flags.', owner: 'Facilitator', artifacts: ['Module library', 'Session plans'] },
  { id: 'capture', label: 'Session Data Capture', desc: 'Record attendance, engagement metrics, facilitator notes, and real-time progress indicators.', owner: 'Data Coordinator', artifacts: ['Session logs', 'Engagement data'] },
  { id: 'progress_eval', label: 'Progress Evaluation Engine', desc: 'Run mid-point assessments. Compare against baseline. Adjust module intensity dynamically.', owner: 'Evaluation Engine', artifacts: ['Progress reports', 'Adjustment flags'] },
  { id: 'eq_practice', label: 'Dynamic EQ Integration', desc: 'Embed real-time emotional regulation practice (Stop-Think-Act) across all intervention sessions.', owner: 'EQ Specialist', artifacts: ['EQ practice logs', 'Regulation metrics'] },
  { id: 'effectiveness', label: 'Module Effectiveness Measurement', desc: 'Evaluate module impact using pre/post micro-assessments and facilitator ratings.', owner: 'Quality Analyst', artifacts: ['Effectiveness scores', 'Module ratings'] },
];

export const POST_INTERVENTION_NODES = [
  { id: 'reassessment', label: 'Full Reassessment', desc: 'Administer complete assessment battery using same instruments as baseline for valid comparison.', owner: 'Evaluator', artifacts: ['Post-assessment scores'] },
  { id: 'outcomes', label: 'Compute Outcomes', desc: 'Calculate post-intervention scores. Compute delta values and improvement percentages per pillar.', owner: 'Data Analyst', artifacts: ['Outcome matrix', 'Delta report'] },
  { id: 'synthesis', label: 'Intervention Effectiveness Synthesis', desc: 'Synthesize module effectiveness data with outcome scores. Identify what worked and what needs revision.', owner: 'Program Lead', artifacts: ['Effectiveness synthesis', 'Module review'] },
  { id: 'idp', label: 'Final IDP & Maintenance Roadmap', desc: 'Construct Individual Development Plan with maintenance schedule, next-phase goals, and milestones.', owner: 'Counselor', artifacts: ['IDP document', 'Maintenance plan'] },
  { id: 'career', label: 'Career Guidance & Recommendations', desc: 'Generate career path recommendations based on final quotient profile and skill-shape topology.', owner: 'Career Advisor', artifacts: ['Career guidance report'] },
  { id: 'knowledge', label: 'Knowledge Base & Closed-Loop Update', desc: 'Feed outcomes back into the system knowledge base. Update norms, benchmarks, and module library.', owner: 'System Admin', artifacts: ['Updated benchmarks', 'Knowledge base entry'] },
];

export const INTERVENTION_MODULES = {
  IQ: [
    { id: 'iq_cog', label: 'Cognitive Strengthening', duration: '4 weeks', sessions: 8, priority: 'medium', desc: 'Structured exercises targeting reasoning, pattern recognition, and analytical thinking.' },
    { id: 'iq_prob', label: 'Problem-Solving Intensive', duration: '3 weeks', sessions: 6, priority: 'high', desc: 'Real-world problem sets with guided reflection and solution frameworks.' },
    { id: 'iq_crit', label: 'Critical Thinking Workshop', duration: '2 weeks', sessions: 4, priority: 'medium', desc: 'Socratic method, argument analysis, and logical fallacy identification.' },
  ],
  EQ: [
    { id: 'eq_pause', label: 'The Pause Button (Stop-Think-Act)', duration: '6 weeks', sessions: 12, priority: 'high', desc: 'Core EQ intervention using impulse control drills and emotional regulation practice.' },
    { id: 'eq_aware', label: 'Emotional Awareness Journey', duration: '4 weeks', sessions: 8, priority: 'high', desc: 'Journaling, reflection, and emotional literacy building activities.' },
    { id: 'eq_empathy', label: 'Empathy & Social Attunement', duration: '3 weeks', sessions: 6, priority: 'medium', desc: 'Perspective-taking exercises and empathy-building role-plays.' },
  ],
  SQ: [
    { id: 'sq_collab', label: 'Collaboration Dynamics', duration: '4 weeks', sessions: 8, priority: 'high', desc: 'Team-based challenges designed to build cooperative intelligence.' },
    { id: 'sq_comm', label: 'Communication Mastery', duration: '3 weeks', sessions: 6, priority: 'medium', desc: 'Verbal, non-verbal, and written communication skill development.' },
    { id: 'sq_social', label: 'Social Awareness Training', duration: '2 weeks', sessions: 4, priority: 'medium', desc: 'Reading social environments, group dynamics, and cultural intelligence.' },
  ],
  AQ: [
    { id: 'aq_resilience', label: 'Resilience Foundations', duration: '6 weeks', sessions: 12, priority: 'high', desc: 'Core resilience-building using the Resilience Dynamics Framework.' },
    { id: 'aq_adapt', label: 'Adaptability & Anticipation', duration: '4 weeks', sessions: 8, priority: 'high', desc: 'Scenario-based training for rapid adaptation and proactive thinking.' },
    { id: 'aq_persist', label: 'Persistence & Grit Coaching', duration: '3 weeks', sessions: 6, priority: 'medium', desc: 'Goal-setting, setback reframing, and sustained effort coaching.' },
  ],
};

export const CAREER_PROFILES = [
  { id: 'specialist',  label: 'Specialist / Technical Track',       condition: 'High IQ + Lower AQ',       icon: null, desc: 'Deep expertise in a focused domain. Thrives in structured, knowledge-intensive environments.',                                    roles: ['Research Scientist', 'Software Engineer', 'Data Analyst', 'Financial Analyst'] },
  { id: 'leader',      label: 'Leadership / People-Facing Track',   condition: 'High EQ + High SQ',        icon: null, desc: 'Natural people leader. Excels in team management, counseling, and organizational development.',                                  roles: ['HR Director', 'Counselor', 'Team Lead', 'Customer Success Manager'] },
  { id: 'versatile',   label: 'Versatile / Multidisciplinary Path', condition: 'Balanced High Scores',     icon: null, desc: 'Adaptable generalist with broad capability. Suited for cross-functional and entrepreneurial roles.',                            roles: ['Entrepreneur', 'Consultant', 'Product Manager', 'General Manager'] },
  { id: 'resilient',   label: 'Resilience-Heavy / Adaptive Track',  condition: 'Strong AQ',                icon: null, desc: 'Built for high-pressure, dynamic environments requiring rapid adaptation and sustained performance.',                           roles: ['Crisis Manager', 'Emergency Services', 'Military Officer', 'Startup Founder'] },
  { id: 'creative',    label: 'Creative / Innovation Track',        condition: 'High IQ + High EQ',        icon: null, desc: 'Combines cognitive power with emotional intelligence for creative problem-solving and innovation.',                             roles: ['UX Designer', 'Creative Director', 'Innovation Lead', 'Architect'] },
];

export const SKILL_SHAPES = [
  { id: 'T', label: 'T-Shaped', desc: 'Deep expertise in one area with broad general knowledge across others.', icon: 'T' },
  { id: 'I', label: 'I-Shaped', desc: 'Deep specialist with narrow but highly developed expertise.', icon: 'I' },
  { id: 'X', label: 'X-Shaped', desc: 'Cross-functional leader with depth in multiple areas and strong connective skills.', icon: 'X' },
  { id: 'M', label: 'M-Shaped', desc: 'Multi-specialist with mastery in several distinct domains.', icon: 'M' },
];

export const DEMO_SCORES = {
  IQ: { verbal: 20, quantitative: 18, psychometric: 22, performance: 17 },
  EQ: { self_awareness: 14, self_management: 12, social_awareness: 16, relationship_mgmt: 13, emotional_resilience: 11 },
  SQ: { social_perception: 28, cognitive_social: 22, performance_social: 20 },
  AQ: { situational_agility: 15, proactive_momentum: 13, adversity_response: 14, growth_integration: 16, resilience_sustainability: 12 },
};

export const DEMO_POST_SCORES = {
  IQ: { verbal: 23, quantitative: 21, psychometric: 24, performance: 20 },
  EQ: { self_awareness: 17, self_management: 16, social_awareness: 18, relationship_mgmt: 17, emotional_resilience: 15 },
  SQ: { social_perception: 31, cognitive_social: 27, performance_social: 26 },
  AQ: { situational_agility: 18, proactive_momentum: 17, adversity_response: 18, growth_integration: 19, resilience_sustainability: 16 },
};

export function computeStandardized(raw, max) {
  return Math.round((raw / max) * 100);
}

export function computePillarScore(pillarId, scores) {
  const pillar = PILLARS[pillarId];
  const totalMax = pillar.subParams.reduce((s, p) => s + p.max, 0);
  const totalRaw = pillar.subParams.reduce((s, p) => s + (scores[p.id] || 0), 0);
  return computeStandardized(totalRaw, totalMax);
}

export function computeWeightedScore(pillarScores) {
  const weighted = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + (pillarScores[k] || 0) * w, 0);
  return Math.round(weighted / MAX_WEIGHT_SUM);
}

export function getGrade(score) {
  return GRADE_BANDS.find(b => score >= b.min && score <= b.max) || GRADE_BANDS[4];
}

export function isCritical(score) { return score < 60; }

export function getSkillShape(pillarScores) {
  const vals = Object.values(pillarScores);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const highCount = vals.filter(v => v >= 75).length;
  if (highCount >= 3) return 'M';
  if (max - min < 15 && avg >= 70) return 'X';
  if (highCount === 1) return 'I';
  return 'T';
}

export function getCareerProfile(pillarScores) {
  const { IQ, EQ, SQ, AQ } = pillarScores;
  if (EQ >= 75 && SQ >= 75) return CAREER_PROFILES[1];
  if (IQ >= 75 && AQ < 60) return CAREER_PROFILES[0];
  if (AQ >= 75) return CAREER_PROFILES[3];
  if (IQ >= 75 && EQ >= 75) return CAREER_PROFILES[4];
  const avg = (IQ + EQ + SQ + AQ) / 4;
  if (avg >= 70) return CAREER_PROFILES[2];
  return CAREER_PROFILES[0];
}
