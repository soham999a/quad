// Groq AI service — dynamic question generation for QIDS assessments
// Uses llama-3.3-70b-versatile via Groq API

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ─── Core API call ────────────────────────────────────────────────────────────
async function groqChat(messages, options = {}) {
  if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY not configured');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1500,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── QIDS System Prompt ───────────────────────────────────────────────────────
const QIDS_SYSTEM_PROMPT = `You are the QIDS (Quadrant Intelligence Development System) assessment agent.
QIDS measures four intelligence pillars:
- IQ (Intelligence Quotient): Verbal, Quantitative, Psychometric, Performance — weight ×1.0
- EQ (Emotional Quotient): Self-Awareness, Emotion Regulation, Self-Motivation, Empathy, Interpersonal Skills — weight ×2.0
- SQ (Social Quotient): Assessment Centre, Cognitive Social Intelligence, Performance Activities — weight ×2.0
- AQ (Adversity Quotient): Situational Agility, Proactive Momentum, Relational Resilience, Regenerative Capacity — weight ×1.28

You generate age-appropriate, contextually relevant assessment questions.
Always respond with valid JSON only. No markdown, no explanation outside JSON.`;

// ─── Generate dynamic IQ questions ───────────────────────────────────────────
export async function generateIQQuestions({ ageGroup, section, count = 3, context = 'individual' }) {
  const sectionDescriptions = {
    verbal: 'verbal reasoning, vocabulary, comprehension, analogies, and language-based logic',
    quantitative: 'numerical reasoning, arithmetic, algebra, pattern sequences, and applied mathematics',
    psychometric: 'abstract reasoning, spatial intelligence, pattern recognition, and logical deduction',
    performance: 'real-world problem solving, creative thinking, decision making, and adaptive reasoning',
  };

  const prompt = `Generate ${count} IQ assessment questions for the "${section}" sub-section (${sectionDescriptions[section]}).
Age group: ${ageGroup === '11-18' ? '11–18 years (school level)' : '19–32 years (college/professional level)'}.
Context: ${context}.

Return JSON in this exact format:
{
  "questions": [
    {
      "type": "mcq" or "open",
      "subParam": "the specific sub-parameter being tested",
      "q": "the question text",
      "options": ["A", "B", "C", "D"] (only for mcq type),
      "answer": 0 (index of correct option, only for mcq type),
      "hint": "brief hint for evaluator" (optional)
    }
  ]
}

Rules:
- MCQ questions must have exactly 4 options with one clearly correct answer
- Open questions should be thought-provoking and allow multiple valid responses
- Questions must be age-appropriate and culturally sensitive
- Avoid repetition of the static question bank
- For 11-18: use school/daily life scenarios
- For 19-32: use professional/adult scenarios`;

  const content = await groqChat([
    { role: 'system', content: QIDS_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { jsonMode: true, temperature: 0.8 });

  const parsed = JSON.parse(content);
  return parsed.questions || [];
}

// ─── Generate dynamic EQ questions ───────────────────────────────────────────
export async function generateEQQuestions({ ageGroup, component, count = 2, context = 'individual' }) {
  const componentDescriptions = {
    SA: 'Self-Awareness — recognising emotions, understanding personal patterns, self-concept clarity',
    ER: 'Emotion Regulation — impulse control, emotional flexibility, resilience under pressure',
    SM: 'Self-Motivation — intrinsic drive, goal orientation, growth mindset, self-efficacy',
    E: 'Empathy — perspective-taking, emotional resonance, compassion, non-verbal sensitivity',
    IS: 'Interpersonal Skills — authentic communication, conflict navigation, social adaptability',
  };

  const prompt = `Generate ${count} EQ Likert-scale self-report statements for the "${component}" component (${componentDescriptions[component]}).
Age group: ${ageGroup === '11-18' ? '11–18 years' : '19–32 years'}.
Context: ${context}.

These are rated 1 (Never) to 5 (Always). They should be first-person statements about behaviour or experience.

Return JSON:
{
  "statements": [
    {
      "subParam": "specific sub-parameter",
      "statement": "I [behaviour/experience statement]..."
    }
  ]
}

Rules:
- Statements must be clear, honest, and non-leading
- Avoid double negatives
- For 11-18: use school/peer/family contexts
- For 19-32: use professional/adult contexts
- Each statement should target a distinct aspect of the component`;

  const content = await groqChat([
    { role: 'system', content: QIDS_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { jsonMode: true, temperature: 0.75 });

  const parsed = JSON.parse(content);
  return parsed.statements || [];
}

// ─── Generate dynamic AQ scenario questions ───────────────────────────────────
export async function generateAQQuestions({ ageGroup, component, count = 2, context = 'individual' }) {
  const componentDescriptions = {
    SA: 'Situational Agility — adaptive problem-solving, cognitive flexibility, emotional anchoring under sudden change',
    PM: 'Proactive Momentum — anticipatory readiness, initiative, sustaining progress despite disruptions',
    RR: 'Relational Resilience — collective synergy, boundary navigation, empathic advocacy under stress',
    RC: 'Regenerative Capacity — energy restoration, growth integration, future-proofing after adversity',
  };

  const prompt = `Generate ${count} AQ scenario-based questions for the "${component}" component (${componentDescriptions[component]}).
Age group: ${ageGroup === '11-18' ? '11–18 years' : '19–32 years'}.
Context: ${context}.

These use a 1–5 Likert scale (1=Not at all, 5=Completely). Each question presents a realistic adversity scenario.
Scoring: 1-2=0pts, 3=1pt, 4=2pts, 5=3pts.

Return JSON:
{
  "questions": [
    {
      "subParam": "specific sub-parameter being tested",
      "scenario": "brief scenario setup (1-2 sentences)",
      "q": "the full question asking about their response/capability"
    }
  ]
}

Rules:
- Scenarios must be realistic and relatable
- Questions must ask about capability/behaviour, not just feelings
- For 11-18: school, sports, friendships, family contexts
- For 19-32: workplace, professional relationships, career contexts
- Each scenario should be distinct and test a different aspect`;

  const content = await groqChat([
    { role: 'system', content: QIDS_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { jsonMode: true, temperature: 0.8 });

  const parsed = JSON.parse(content);
  return parsed.questions || [];
}

// ─── Generate SQ CSI scenario questions ──────────────────────────────────────
export async function generateSQQuestions({ count = 2, context = 'individual' }) {
  const prompt = `Generate ${count} Social Quotient (SQ) Cognitive Social Intelligence scenario questions.
Context: ${context}.

Each question presents a social scenario and asks for the most socially intelligent response.
Scoring: Best response = 2 marks, Adequate = 1 mark, Ineffective = 0 marks.

Return JSON:
{
  "questions": [
    {
      "subParam": "one of: Understanding Social Cues | Predicting Social Outcomes | Social Problem-Solving | Empathy & Perspective-Taking | Decision-Making in Social Contexts",
      "scenario": "realistic social scenario (2-3 sentences)",
      "question": "What is the most socially intelligent response?",
      "options": [
        { "text": "option A", "marks": 0 },
        { "text": "option B", "marks": 2 },
        { "text": "option C", "marks": 1 }
      ],
      "assessorNote": "brief explanation of why the best answer is correct"
    }
  ]
}

Rules:
- Scenarios must involve real social complexity (not obvious right/wrong)
- Options must be plausible — no obviously silly answers
- The 2-mark answer should require genuine social intelligence to identify`;

  const content = await groqChat([
    { role: 'system', content: QIDS_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { jsonMode: true, temperature: 0.75 });

  const parsed = JSON.parse(content);
  return parsed.questions || [];
}

// ─── Generate full assessment report narrative ────────────────────────────────
export async function generateReportNarrative({ intake, pillarScores, grade, careerProfile, ageGroup }) {
  const prompt = `Generate a professional QIDS assessment narrative for the following profile:

Name: ${intake?.name || 'the individual'}
Age Group: ${ageGroup === '11-18' ? '11–18 years' : '19–32 years'}
Overall Grade: ${grade?.grade} — ${grade?.label} (Score: ${Object.values(pillarScores).reduce((a, b) => a + b, 0) / 4}/100 avg)
Pillar Scores: IQ=${pillarScores.IQ}, EQ=${pillarScores.EQ}, SQ=${pillarScores.SQ}, AQ=${pillarScores.AQ}
Career Profile: ${careerProfile?.label}

Write a 3-paragraph professional narrative:
1. Overall profile summary (strengths and the unified score meaning)
2. Key development areas (which pillars need attention and why)
3. Actionable recommendations (specific next steps for the individual)

Return JSON:
{
  "summary": "paragraph 1",
  "development": "paragraph 2", 
  "recommendations": "paragraph 3"
}`;

  const content = await groqChat([
    { role: 'system', content: QIDS_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { jsonMode: true, temperature: 0.6, maxTokens: 800 });

  return JSON.parse(content);
}
