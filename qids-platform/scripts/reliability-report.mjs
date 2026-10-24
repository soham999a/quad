#!/usr/bin/env node
// ─── Reliability report ─────────────────────────────────────────────────────
// Internal consistency (Cronbach's alpha) per pillar, from stored answer sheets.
//
//   node scripts/reliability-report.mjs answers.json [--min-n 30]
//
// answers.json may be:
//   • an array of answer sheets                  [{IQ:{…},EQ:{…},SQ:{…},AQ:{…}}]
//   • an export of assessmentRecords documents   [{input:{answers:{…}}}, …]
//
// No alpha is printed for a pillar below the minimum sample size: a coefficient
// from twelve respondents looks like evidence and is not. The methodology page
// quotes these numbers only once they clear the bar.

import fs from 'node:fs';
import { reliabilityReport } from '../shared/scoring/reliability.js';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const minNFlag = args.indexOf('--min-n');
const MIN_N = minNFlag >= 0 ? Number(args[minNFlag + 1]) : 30;

if (!file) {
  console.error('Usage: node scripts/reliability-report.mjs <answers.json> [--min-n 30]');
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(raw)) {
  console.error('Expected a JSON array.');
  process.exit(2);
}

// Accept raw sheets or Firestore record exports.
const sheets = raw.map(item => item?.input?.answers ?? item?.answers ?? item);
const report = reliabilityReport(sheets);

console.log(`\nResponses supplied: ${sheets.length}   minimum for reporting: ${MIN_N}\n`);
console.log('Pillar   Items   n      alpha');
console.log('─'.repeat(38));

let reported = 0;
for (const [pillar, r] of Object.entries(report)) {
  const alpha = r.alpha === null || r.n < MIN_N ? 'not reported' : r.alpha.toFixed(3);
  if (r.alpha !== null && r.n >= MIN_N) reported += 1;
  console.log(
    `${pillar.padEnd(8)} ${String(r.items).padEnd(7)} ${String(r.n).padEnd(6)} ${alpha}`,
  );
}

console.log('\nNote: alpha over mixed item types (SQ rubric + multiple choice) is not meaningful and is not computed.');
if (reported === 0) {
  console.log('No pillar cleared the minimum sample size — nothing can be quoted yet.\n');
}
