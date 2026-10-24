// ─── Reliability tests ──────────────────────────────────────────────────────
// The methodology page promises Cronbach's alpha computed from stored answers.
// These tests pin the estimator: perfect consistency → 1, independent noise →
// low, unusable data → null. Without this, "we compute alpha" is a claim.

import { cronbachAlpha, itemMatrix, reliabilityReport } from '../shared/scoring/reliability.js';
import { IQ_QUESTIONS, EQ_QUESTIONS, AQ_QUESTIONS } from '../src/data/qidsData.js';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { passed += 1; return; }
  failed += 1;
  if (failures.length < 10) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

// ── Perfectly consistent items ──────────────────────────────────────────────
{
  // Every item is the same value: total variance is k² × item variance, so
  // alpha is exactly 1.
  const rows = [[1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]];
  check('identical items give alpha 1', near(cronbachAlpha(rows), 1), String(cronbachAlpha(rows)));
}

// ── Independent noise ───────────────────────────────────────────────────────
{
  // A deterministic pseudo-random matrix with no shared structure.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const rows = Array.from({ length: 400 }, () => [0, 1, 2, 3, 4].map(() => Math.floor(rand() * 5)));
  const alpha = cronbachAlpha(rows);
  check('unrelated items give a low alpha', alpha !== null && alpha < 0.3, String(alpha));
  check('alpha stays inside the plausible range', alpha > -1 && alpha <= 1, String(alpha));
}

// ── Degenerate inputs ───────────────────────────────────────────────────────
check('fewer than three respondents is not estimable', cronbachAlpha([[1, 2], [2, 3]]) === null);
check('a single item is not estimable', cronbachAlpha([[1], [2], [3]]) === null);
check('ragged rows are rejected', cronbachAlpha([[1, 2], [1, 2, 3], [2, 3]]) === null);
check('zero total variance is not estimable', cronbachAlpha([[2, 2], [1, 1]]) === null);
check('a negative alpha is reported, not clamped', (() => {
  // Items that move in opposite directions depress alpha below zero. (Fully
  // opposed items would instead leave a constant total, which is null.)
  const rows = [[4, 0], [3, 0], [4, 1], [2, 1], [3, 2], [1, 1], [2, 2], [0, 1]];
  const a = cronbachAlpha(rows);
  return a !== null && a < 0;
})());

// ── Item matrix extraction ──────────────────────────────────────────────────
function completeIQSheet() {
  const sheet = {};
  for (const [sectionId, spec] of Object.entries(IQ_QUESTIONS)) {
    const answers = {};
    spec.sections.forEach((section, si) => {
      section.questions.forEach((q, qi) => {
        answers[si * 5 + qi] = section.type === 'mcq' ? q.answer : 'a considered answer';
      });
    });
    sheet[sectionId] = answers;
  }
  return sheet;
}

function completeLikertSheet(pillar) {
  const out = { partA: {} };
  const comps = pillar === 'EQ' ? EQ_QUESTIONS.partA : AQ_QUESTIONS.components;
  for (const [comp, spec] of Object.entries(comps)) {
    const items = spec.questions['11-18'];
    out.partA[comp] = Object.fromEntries(items.map((_, i) => [i, 3]));
  }
  return out;
}

{
  const sheets = [
    { IQ: completeIQSheet(), EQ: completeLikertSheet('EQ'), AQ: completeLikertSheet('AQ') },
    { IQ: completeIQSheet(), EQ: completeLikertSheet('EQ'), AQ: completeLikertSheet('AQ') },
    { IQ: completeIQSheet(), EQ: completeLikertSheet('EQ'), AQ: completeLikertSheet('AQ') },
  ];
  const iq = itemMatrix(sheets, 'IQ');
  check('IQ matrix has one row per complete sheet', iq.rows.length === 3);
  check('IQ matrix has one column per item', iq.rows[0].length === iq.items && iq.items === 100);

  const eq = itemMatrix(sheets, 'EQ');
  check('EQ matrix columns equal the Likert items', eq.rows[0].length === eq.items && eq.items === 25);

  const aq = itemMatrix(sheets, 'AQ');
  check('AQ matrix columns equal the Likert items', aq.rows[0].length === aq.items && aq.items === 16);

  // An incomplete sheet is dropped rather than zero-filled.
  const partial = { IQ: completeIQSheet(), EQ: { partA: { SA: { 0: 2 } } }, AQ: completeLikertSheet('AQ') };
  const withPartial = itemMatrix([...sheets, partial], 'EQ');
  check('incomplete sheets are dropped', withPartial.rows.length === 3);

  const report = reliabilityReport(sheets);
  check('report covers the pillars alpha is meaningful for', Object.keys(report).join(',') === 'IQ,EQ,AQ');
  check('report carries item and respondent counts', report.IQ.items === 100 && report.IQ.n === 3);
  check('a constant sample yields no alpha', report.EQ.alpha === null);
}

console.log(`\nReliability — ${passed} checks passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed ? 1 : 0);
