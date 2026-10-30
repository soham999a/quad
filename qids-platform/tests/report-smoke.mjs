/**
 * report-smoke — renders the full interview report PDF (jsPDF) in Node with a
 * synthetic completed session and asserts the sample-profile layout blocks
 * are all present in the produced document. Layout guard against regressions
 * that would only show up at download time.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const require_ = (await import('node:module')).createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const platformRoot = path.resolve(__dirname, '..');
const modURL = p => pathToFileURL(p).href;


const jspdf = require_(path.join(platformRoot, 'node_modules/jspdf/dist/jspdf.node.min.js'));
const OUT_PDF = path.join(__dirname, '.report-smoke-out', 'report-smoke.pdf');
jspdf.jsPDF.API.save = function (filename) {
  fs.writeFileSync(OUT_PDF, Buffer.from(this.output('arraybuffer')));
  return this;
};

const OUT_DIR = path.join(__dirname, '.report-smoke-out');
// The emitted graph is CommonJS; without this marker the package-level
// "type": "module" makes Node treat it as ESM (same trick as engine-smoke).
const pkgMarker = path.join(OUT_DIR, 'package.json');
if (!fs.existsSync(pkgMarker)) fs.writeFileSync(pkgMarker, JSON.stringify({ type: 'commonjs' }));

const { downloadInterviewReportPdf } = await import(modURL(path.join(OUT_DIR, 'src/lib/interviewReportPdf.js')));

const session = {
  id: 'abc12345xyz',
  mode: 'live',
  candidateName: 'Test Candidate',
  role: 'Business Analyst',
  evaluatorName: 'Evaluator One',
  sessionNumber: 2,
  status: 'completed',
  completedAt: new Date().toISOString(),
  unifiedScore: 71,
  grade: { grade: 'C', label: 'Good', color: '#f59e0b' },
  skillShape: 'X',
  careerProfile: {
    id: 'versatile',
    label: 'Versatile / Multidisciplinary Path',
    condition: 'Balanced High Scores',
    desc: 'Adaptable generalist with broad capability.',
    roles: ['Entrepreneur', 'Consultant'],
  },
  pillarScores: { IQ: 82, EQ: 61, SQ: 74, AQ: 48 },
  mergedScores: {
    Communication: 4.2, ProblemSolving: 3.1, Leadership: 2.4, EmotionalIntelligence: 3.6,
    Adaptability: 2.2, Teamwork: 3.9, Integrity: 4.4, CriticalThinking: 3.3, Resilience: 2.1,
  },
  flaggedPillars: ['AQ', 'EQ', 'SQ', 'IQ'],
  guideMarks: { 'LQ-05': 'strong', 'LQ-01': 'covered' },
  liveQuestions: [
    { id: 'LQ-05', dimension: 'Resilience', text: 'Most significant setback?', probeBank: ['What differs now?', 'What did recovery require day to day?'], followUp: 'What differs now?' },
  ],
  liveResponses: [
    { questionId: 'LQ-05', questionText: 'Most significant setback?', dimension: 'Resilience', score: 2, response: 'Vague on recovery.', answeredAt: Date.now() - 30000 },
  ],
  evaluatorAssessment: [{ dimensionId: 'Resilience', score: 2, notes: 'Thin recovery story' }],
};

await downloadInterviewReportPdf(session, { sessionNumber: 1, unifiedScore: 64 });

const stats = fs.statSync(OUT_PDF);
if (stats.size < 2000) throw new Error('PDF suspiciously small: ' + stats.size);

// Extract text with the installed pdf-parse and assert the layout blocks.
const pdfParseMod = await import('pdf-parse');
// pdf-parse v2: class-based API
const parser = new pdfParseMod.PDFParse({ data: new Uint8Array(fs.readFileSync(OUT_PDF)) });
const parsed = await parser.getText();
const text = parsed.text.replace(/\s+/g, ' ');

const expectations = [
  ['masthead', 'QUOTIENT INTELLIGENCE & DEVELOPMENT SYSTEM'],
  ['hero', 'A profile for development, not a pass/fail label.'],
  ['index', 'INTERVIEW INTELLIGENCE INDEX'],
  ['index value', '/ 100'],
  ['confidence', 'MODERATE confidence'],
  ['read box', 'A snapshot of likely work behaviours'],
  ['stand-out', 'Stand-out asset'],
  ['growth edge', 'Growth edge'],
  ['radar', 'NINE-DIMENSION SNAPSHOT'],
  ['peer line', 'Peer reference'],
  ['heatmap', 'COMPETENCY HEATMAP'],
  ['heatmap legend', 'Exceptional'],
  ['heatmap note', 'How to use the heatmap'],
  ['page 2 header', 'PROFILE INTERPRETATION & DEVELOPMENT'],
  ['behaviours kicker', 'FROM SCORES TO OBSERVABLE BEHAVIOURS'],
  ['at-work', 'WHAT THIS PATTERN COULD MEAN AT WORK'],
  ['priority provenance', 'Assessment-guided development priority'],
  ['archetype', 'WORK-STYLE & CAREER ALIGNMENT'],
  ['archetype label', 'Versatile / Multidisciplinary Path'],
  ['shape', 'X-Shaped'],
  ['pattern', 'LIKELY WORKING PATTERN'],
  ['at best', 'At their best:'],
  ['stretched', 'When stretched:'],
  ['interview prompt', 'Interview prompt:'],
  ['role lens', 'ROLE LENS · BUSINESS ANALYST'],
  ['priorities', 'DEVELOPMENT PRIORITIES'],
  ['priorities scale note', 'not a risk label'],
  ['90day', '90-DAY DEVELOPMENT CONVERSATION'],
  ['build stage', 'BUILD'],
  ['stretch stage', 'STRETCH'],
  ['apply stage', 'APPLY'],
  ['note', 'Interpretation note'],
  ['audit trail', 'DECISION AUDIT TRAIL'],
  ['evaluator anchor', 'Thin recovery story'],
  ['marks', 'marked STRONG'],
  ['retention', '24-month'],
];

let failed = [];
for (const [label, needle] of expectations) {
  if (!text.includes(needle)) failed.push(label);
}
if (failed.length) {
  console.error('MISSING BLOCKS:', failed.join(', '));
  process.exit(1);
}
const pageCount = Array.isArray(parsed.pages) ? parsed.pages.length : (parsed.numpages || '?');
console.log('report-smoke OK — ' + pageCount + ' pages, ' + stats.size + ' bytes, all ' + expectations.length + ' layout blocks present');
