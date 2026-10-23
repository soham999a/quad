// ─── Scoring parity: golden fixtures vs the shared module ────────────────────
// The fixtures in tests/fixtures/qids-golden.json were produced by the engine
// as it existed in the browser before shared/scoring existed. If the shared
// module ever drifts from those numbers, this fails — which is the only thing
// standing between "server-authoritative" and "two scorers that disagree".
//
//   npm run test:scoring

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildQidsResult, validateRawScores } from '../shared/scoring/qids.js';

const golden = JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/qids-golden.json'), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { passed += 1; return; }
  failed += 1;
  if (failures.length < 10) failures.push(`${name}: got ${a}, expected ${e}`);
}

for (const [i, entry] of golden.cases.entries()) {
  const { result, pillarScores } = buildQidsResult({
    rawScores: entry.rawScores,
    intake: {},
    ageGroup: '19-32',
    mode: 'qids',
    now: '1970-01-01T00:00:00.000Z',
  });
  const label = `case ${i}`;
  check(`${label} pillarScores`, pillarScores, entry.result.pillarScores);
  check(`${label} unifiedScore`, result.unifiedScore, entry.result.unifiedScore);
  check(`${label} grade`, result.grade?.grade, entry.result.grade);
  check(`${label} gradeLabel`, result.grade?.label, entry.result.gradeLabel);
  check(`${label} skillShape`, result.skillShape, entry.result.skillShape);
  check(`${label} careerProfile`, result.careerProfile?.id, entry.result.careerProfile);
}

// (The browser path is checked against these same fixtures inside
// engine-smoke.cts, which is compiled — Node cannot import the TS engine
// directly because its imports are extensionless.)

// ── Validation: the API must refuse impossible sheets ───────────────────────
const good = validateRawScores({ IQ: { verbal: 25, _aiBonus: 16 }, EQ: { SA: 10 }, SQ: { ACE: 25 }, AQ: { RC: 19 } });
check('valid sheet accepted', good.ok, true);

const bad = [
  ['unknown pillar', { XX: { a: 1 } }],
  ['unknown field', { IQ: { madeUp: 3 } }],
  ['over maximum', { IQ: { verbal: 26 } }],
  ['negative', { EQ: { SA: -1 } }],
  ['non-numeric', { AQ: { RC: '19' } }],
  ['not an object', 'nope'],
];
for (const [name, sheet] of bad) {
  check(`rejects ${name}`, validateRawScores(sheet).ok, false);
}

console.log(`\n${passed} checks passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFirst failures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed ? 1 : 0);
