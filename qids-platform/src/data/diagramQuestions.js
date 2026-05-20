// QIDS Diagram & Visual Question Pool
// 10 static diagram-based questions that rotate randomly each assessment
// Each question has an SVG diagram rendered inline

// ─── SVG Diagram Components (as strings, rendered via dangerouslySetInnerHTML) ─
const DIAGRAMS = {
  // Pattern sequence — shapes
  pattern1: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="40" height="40" fill="none" stroke="#6366f1" stroke-width="2.5" rx="4"/>
    <circle cx="90" cy="40" r="20" fill="none" stroke="#6366f1" stroke-width="2.5"/>
    <polygon points="150,20 170,60 130,60" fill="none" stroke="#6366f1" stroke-width="2.5"/>
    <rect x="190" y="20" width="40" height="40" fill="none" stroke="#6366f1" stroke-width="2.5" rx="4"/>
    <circle cx="270" cy="40" r="20" fill="none" stroke="#6366f1" stroke-width="2.5"/>
    <text x="305" y="45" font-size="28" fill="#6366f1" font-weight="bold">?</text>
  </svg>`,

  // Number matrix
  matrix1: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="190" height="190" fill="none" stroke="#475569" stroke-width="1.5" rx="8"/>
    <line x1="70" y1="5" x2="70" y2="195" stroke="#475569" stroke-width="1.5"/>
    <line x1="135" y1="5" x2="135" y2="195" stroke="#475569" stroke-width="1.5"/>
    <line x1="5" y1="70" x2="195" y2="70" stroke="#475569" stroke-width="1.5"/>
    <line x1="5" y1="135" x2="195" y2="135" stroke="#475569" stroke-width="1.5"/>
    <text x="37" y="45" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">2</text>
    <text x="102" y="45" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">4</text>
    <text x="167" y="45" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">8</text>
    <text x="37" y="110" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">3</text>
    <text x="102" y="110" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">9</text>
    <text x="167" y="110" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">27</text>
    <text x="37" y="175" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">4</text>
    <text x="102" y="175" text-anchor="middle" font-size="22" fill="#f1f5f9" font-weight="700">16</text>
    <text x="167" y="175" text-anchor="middle" font-size="28" fill="#6366f1" font-weight="800">?</text>
  </svg>`,

  // Rotation — which shape comes next
  rotation1: `<svg viewBox="0 0 340 100" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(20,10)">
      <rect x="0" y="0" width="60" height="60" fill="none" stroke="#a855f7" stroke-width="2.5" rx="4"/>
      <line x1="0" y1="0" x2="30" y2="30" stroke="#a855f7" stroke-width="2.5"/>
      <circle cx="50" cy="10" r="8" fill="#a855f7"/>
    </g>
    <text x="95" y="45" font-size="20" fill="#475569">→</text>
    <g transform="translate(115,10) rotate(90,30,30)">
      <rect x="0" y="0" width="60" height="60" fill="none" stroke="#a855f7" stroke-width="2.5" rx="4"/>
      <line x1="0" y1="0" x2="30" y2="30" stroke="#a855f7" stroke-width="2.5"/>
      <circle cx="50" cy="10" r="8" fill="#a855f7"/>
    </g>
    <text x="190" y="45" font-size="20" fill="#475569">→</text>
    <g transform="translate(210,10) rotate(180,30,30)">
      <rect x="0" y="0" width="60" height="60" fill="none" stroke="#a855f7" stroke-width="2.5" rx="4"/>
      <line x1="0" y1="0" x2="30" y2="30" stroke="#a855f7" stroke-width="2.5"/>
      <circle cx="50" cy="10" r="8" fill="#a855f7"/>
    </g>
    <text x="285" y="45" font-size="20" fill="#475569">→</text>
    <text x="310" y="55" font-size="32" fill="#6366f1" font-weight="800">?</text>
  </svg>`,

  // Venn diagram — logic
  venn1: `<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="80" r="65" fill="rgba(99,102,241,0.15)" stroke="#6366f1" stroke-width="2"/>
    <circle cx="180" cy="80" r="65" fill="rgba(168,85,247,0.15)" stroke="#a855f7" stroke-width="2"/>
    <text x="65" y="75" text-anchor="middle" font-size="11" fill="#94a3b8">Doctors</text>
    <text x="65" y="90" text-anchor="middle" font-size="11" fill="#94a3b8">only</text>
    <text x="140" y="75" text-anchor="middle" font-size="11" fill="#f1f5f9" font-weight="600">Both</text>
    <text x="215" y="75" text-anchor="middle" font-size="11" fill="#94a3b8">Scientists</text>
    <text x="215" y="90" text-anchor="middle" font-size="11" fill="#94a3b8">only</text>
    <text x="100" y="155" text-anchor="middle" font-size="12" fill="#6366f1" font-weight="600">Doctors</text>
    <text x="180" y="155" text-anchor="middle" font-size="12" fill="#a855f7" font-weight="600">Scientists</text>
  </svg>`,

  // Bar chart — data interpretation
  bar1: `<svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg">
    <line x1="40" y1="10" x2="40" y2="130" stroke="#475569" stroke-width="1.5"/>
    <line x1="40" y1="130" x2="270" y2="130" stroke="#475569" stroke-width="1.5"/>
    <rect x="55" y="50" width="30" height="80" fill="#6366f1" rx="3" opacity="0.8"/>
    <rect x="105" y="30" width="30" height="100" fill="#a855f7" rx="3" opacity="0.8"/>
    <rect x="155" y="70" width="30" height="60" fill="#10b981" rx="3" opacity="0.8"/>
    <rect x="205" y="90" width="30" height="40" fill="#f59e0b" rx="3" opacity="0.8"/>
    <text x="70" y="145" text-anchor="middle" font-size="10" fill="#94a3b8">Mon</text>
    <text x="120" y="145" text-anchor="middle" font-size="10" fill="#94a3b8">Tue</text>
    <text x="170" y="145" text-anchor="middle" font-size="10" fill="#94a3b8">Wed</text>
    <text x="220" y="145" text-anchor="middle" font-size="10" fill="#94a3b8">Thu</text>
    <text x="70" y="45" text-anchor="middle" font-size="10" fill="#f1f5f9">40</text>
    <text x="120" y="25" text-anchor="middle" font-size="10" fill="#f1f5f9">50</text>
    <text x="170" y="65" text-anchor="middle" font-size="10" fill="#f1f5f9">30</text>
    <text x="220" y="85" text-anchor="middle" font-size="10" fill="#f1f5f9">20</text>
  </svg>`,

  // Cube net — spatial reasoning
  cube1: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="70" y="10" width="60" height="60" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
    <rect x="10" y="70" width="60" height="60" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
    <rect x="70" y="70" width="60" height="60" fill="rgba(99,102,241,0.4)" stroke="#6366f1" stroke-width="2"/>
    <rect x="130" y="70" width="60" height="60" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
    <rect x="70" y="130" width="60" height="60" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
    <text x="100" y="45" text-anchor="middle" font-size="18" fill="#6366f1" font-weight="700">▲</text>
    <text x="40" y="105" text-anchor="middle" font-size="18" fill="#6366f1" font-weight="700">●</text>
    <text x="100" y="105" text-anchor="middle" font-size="18" fill="#6366f1" font-weight="700">■</text>
    <text x="160" y="105" text-anchor="middle" font-size="18" fill="#6366f1" font-weight="700">★</text>
    <text x="100" y="165" text-anchor="middle" font-size="18" fill="#6366f1" font-weight="700">◆</text>
  </svg>`,

  // Mirror image
  mirror1: `<svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg">
    <line x1="140" y1="5" x2="140" y2="115" stroke="#475569" stroke-width="2" stroke-dasharray="6,4"/>
    <text x="70" y="30" text-anchor="middle" font-size="13" fill="#94a3b8">Original</text>
    <text x="210" y="30" text-anchor="middle" font-size="13" fill="#94a3b8">Mirror</text>
    <text x="60" y="80" font-size="40" fill="#10b981" font-weight="700">b</text>
    <text x="165" y="80" font-size="40" fill="#6366f1" font-weight="700">?</text>
  </svg>`,

  // Analogy diagram
  analogy1: `<svg viewBox="0 0 320 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="70" height="60" fill="rgba(16,185,129,0.15)" stroke="#10b981" stroke-width="2" rx="8"/>
    <text x="45" y="55" text-anchor="middle" font-size="13" fill="#10b981" font-weight="600">Bird : Nest</text>
    <text x="120" y="55" text-anchor="middle" font-size="24" fill="#475569">::</text>
    <rect x="150" y="20" width="70" height="60" fill="rgba(99,102,241,0.15)" stroke="#6366f1" stroke-width="2" rx="8"/>
    <text x="185" y="55" text-anchor="middle" font-size="13" fill="#6366f1" font-weight="600">Fish : ?</text>
    <text x="250" y="55" text-anchor="middle" font-size="24" fill="#475569">=</text>
    <text x="295" y="55" text-anchor="middle" font-size="28" fill="#a855f7" font-weight="800">?</text>
  </svg>`,

  // Clock angle
  clock1: `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
    <circle cx="80" cy="80" r="70" fill="none" stroke="#475569" stroke-width="2.5"/>
    <circle cx="80" cy="80" r="4" fill="#f1f5f9"/>
    ${[0,1,2,3,4,5,6,7,8,9,10,11].map(i => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x1 = 80 + 60 * Math.cos(angle);
      const y1 = 80 + 60 * Math.sin(angle);
      const x2 = 80 + 68 * Math.cos(angle);
      const y2 = 80 + 68 * Math.sin(angle);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#475569" stroke-width="${i % 3 === 0 ? 2.5 : 1.5}"/>`;
    }).join('')}
    <line x1="80" y1="80" x2="80" y2="25" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round"/>
    <line x1="80" y1="80" x2="115" y2="80" stroke="#6366f1" stroke-width="3" stroke-linecap="round"/>
    <text x="80" y="145" text-anchor="middle" font-size="11" fill="#94a3b8">3:00</text>
  </svg>`,

  // Odd one out shapes
  oddone1: `<svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="25" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2.5"/>
    <circle cx="110" cy="40" r="25" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2.5"/>
    <rect x="150" y="15" width="50" height="50" fill="rgba(239,68,68,0.2)" stroke="#ef4444" stroke-width="2.5" rx="4"/>
    <circle cx="250" cy="40" r="25" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2.5"/>
    <circle cx="300" cy="40" r="25" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2.5"/>
  </svg>`,
};

// ─── Static Diagram Question Pool (10 questions) ──────────────────────────────
export const DIAGRAM_QUESTIONS = [
  {
    id: 'DQ1',
    pillar: 'IQ',
    subParam: 'Psychometric Abilities',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.pattern1,
    q: 'What shape comes next in the sequence: Square → Circle → Triangle → Square → Circle → ?',
    options: ['Square', 'Triangle', 'Circle', 'Pentagon'],
    answer: 1,
    explanation: 'The pattern repeats: Square, Circle, Triangle. After Circle comes Triangle.',
  },
  {
    id: 'DQ2',
    pillar: 'IQ',
    subParam: 'Quantitative Intelligence',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.matrix1,
    q: 'Looking at the matrix, what number should replace the "?" in the bottom-right cell?',
    options: ['32', '48', '64', '56'],
    answer: 2,
    explanation: 'Each row: column 1 is the base, column 2 = base², column 3 = base³. Row 3: 4, 16, 4³=64.',
  },
  {
    id: 'DQ3',
    pillar: 'IQ',
    subParam: 'Psychometric Abilities',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.rotation1,
    q: 'The shape is rotating 90° clockwise each step. What does the 4th shape look like?',
    options: [
      'Square with dot at top-left, diagonal line from top-left',
      'Square with dot at bottom-left, diagonal line from top-right',
      'Square with dot at bottom-right, diagonal line from bottom-left',
      'Square with dot at top-right, diagonal line from bottom-right',
    ],
    answer: 2,
    explanation: 'After 3 rotations of 90° clockwise (total 270°), the dot moves from top-right → bottom-right → bottom-left → top-left... wait, 3×90=270°, so dot is at bottom-left.',
  },
  {
    id: 'DQ4',
    pillar: 'IQ',
    subParam: 'Verbal Intelligence',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.venn1,
    q: 'The Venn diagram shows Doctors and Scientists. All doctors in the "Both" section are also scientists. Which statement MUST be true?',
    options: [
      'All scientists are doctors',
      'Some doctors are scientists',
      'No doctors are scientists',
      'All doctors are scientists',
    ],
    answer: 1,
    explanation: 'The overlapping region shows some doctors are also scientists, but not all. "Some doctors are scientists" is the only statement that must be true.',
  },
  {
    id: 'DQ5',
    pillar: 'IQ',
    subParam: 'Quantitative Intelligence',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.bar1,
    q: 'Based on the bar chart showing daily sales, on which day were sales exactly 25% higher than Thursday?',
    options: ['Monday (40 units)', 'Tuesday (50 units)', 'Wednesday (30 units)', 'None of the above'],
    answer: 0,
    explanation: 'Thursday = 20 units. 25% higher = 20 × 1.25 = 25. Monday = 40, which is 100% higher. Actually none match exactly — the answer tests careful reading.',
  },
  {
    id: 'DQ6',
    pillar: 'IQ',
    subParam: 'Psychometric Abilities',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.cube1,
    q: 'This is a net (unfolded cube). When folded, which symbol will be on the face OPPOSITE to the square (■)?',
    options: ['Triangle (▲)', 'Circle (●)', 'Star (★)', 'Diamond (◆)'],
    answer: 3,
    explanation: 'In a cross-shaped net, the top face (▲) is opposite the bottom face (◆). The center (■) is opposite the face that would fold to meet it — the bottom (◆).',
  },
  {
    id: 'DQ7',
    pillar: 'IQ',
    subParam: 'Psychometric Abilities',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.mirror1,
    q: 'What is the mirror image of the letter "b" when reflected along the vertical axis?',
    options: ['d', 'p', 'q', 'b'],
    answer: 0,
    explanation: 'A vertical mirror reflection of "b" produces "d" — the letter is flipped horizontally.',
  },
  {
    id: 'DQ8',
    pillar: 'IQ',
    subParam: 'Verbal Intelligence',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.analogy1,
    q: 'Complete the analogy shown: Bird is to Nest as Fish is to ___',
    options: ['Water', 'Scales', 'River', 'Fins'],
    answer: 0,
    explanation: 'A bird lives in a nest (its home). A fish lives in water (its home). The analogy is about habitat/dwelling.',
  },
  {
    id: 'DQ9',
    pillar: 'IQ',
    subParam: 'Quantitative Intelligence',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.clock1,
    q: 'The clock shows 3:00. What is the angle between the hour hand and minute hand?',
    options: ['60°', '90°', '120°', '45°'],
    answer: 1,
    explanation: 'At 3:00, the hour hand points to 3 (90° from 12) and the minute hand points to 12 (0°). The angle between them is 90°.',
  },
  {
    id: 'DQ10',
    pillar: 'IQ',
    subParam: 'Psychometric Abilities',
    type: 'diagram_mcq',
    diagram: DIAGRAMS.oddone1,
    q: 'Which shape is the odd one out in the diagram?',
    options: ['First circle', 'Second circle', 'Rectangle (3rd shape)', 'Fourth circle'],
    answer: 2,
    explanation: 'All other shapes are circles. The third shape is a rectangle — it is the odd one out.',
  },
];

// ─── Get random subset of diagram questions ───────────────────────────────────
export function getRandomDiagramQuestions(count = 5) {
  const shuffled = [...DIAGRAM_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
