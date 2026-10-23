// ─── Golden fixture generator ────────────────────────────────────────────────
// Run this BEFORE changing the scoring engine. It samples answer sheets,
// scores them with the *current* engine, and writes tests/fixtures/qids-golden.json.
// The parity test then requires the shared (server) module to reproduce every
// case exactly, so a formula can never drift between browser and API.
//
//   npm run test:scoring:golden
//
// Regenerate only when the instrument or the formulas change on purpose, and
// review the diff: every changed expectation is a changed score for a user.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateQidsAssessment } from '../src/core/engine/qids';

/** Deterministic PRNG so fixtures are reproducible. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20261023;
const CASES = 600;

const iqSection = () => ({
  verbal: randInt(0, 25),
  quantitative: randInt(0, 25),
  psychometric: randInt(0, 25),
  performance: randInt(0, 25),
  _aiBonus: randInt(0, 16),
  _visualBonus: randInt(0, 9),
});

let rnd = mulberry32(SEED);
function randInt(min: number, max: number) {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

function randomSheet() {
  return {
    IQ: iqSection(),
    EQ: { SA: randInt(0, 10), ER: randInt(0, 10), SM: randInt(0, 10), E: randInt(0, 10), IS: randInt(0, 10) },
    SQ: { ACE: randInt(0, 25), CSI: randInt(0, 25), PBA: randInt(0, 25) },
    AQ: { SA: randInt(0, 19), PM: randInt(0, 19), RR: randInt(0, 19), RC: randInt(0, 19) },
  };
}

function score(rawScores: any) {
  const { result, pillarScores } = evaluateQidsAssessment({
    rawScores,
    intake: { ageGroup: '19-32' },
    ageGroup: '19-32' as any,
    mode: 'qids',
  });
  return {
    pillarScores,
    unifiedScore: result.unifiedScore,
    grade: result.grade?.grade,
    gradeLabel: result.grade?.label,
    skillShape: result.skillShape,
    careerProfile: result.careerProfile?.id,
  };
}

const cases: any[] = [];

// Edge cases first — zeros, maxes, and each pillar isolated.
cases.push({ rawScores: { IQ: {}, EQ: {}, SQ: {}, AQ: {} }, result: score({ IQ: {}, EQ: {}, SQ: {}, AQ: {} }) });
for (const pillar of ['IQ', 'EQ', 'SQ', 'AQ'] as const) {
  const maxed: any = { IQ: {}, EQ: {}, SQ: {}, AQ: {} };
  maxed[pillar] =
    pillar === 'IQ' ? { verbal: 25, quantitative: 25, psychometric: 25, performance: 25, _aiBonus: 16, _visualBonus: 9 }
    : pillar === 'EQ' ? { SA: 10, ER: 10, SM: 10, E: 10, IS: 10 }
    : pillar === 'SQ' ? { ACE: 25, CSI: 25, PBA: 25 }
    : { SA: 19, PM: 19, RR: 19, RC: 19 };
  cases.push({ rawScores: maxed, result: score(maxed) });
}

rnd = mulberry32(SEED);
for (let i = 0; i < CASES; i++) {
  const rawScores = randomSheet();
  cases.push({ rawScores, result: score(rawScores) });
}

const out = {
  generatedBy: 'tests/make-golden.cts',
  seed: SEED,
  cases,
};

// Compiled into tests/.golden-out, so resolve from the package root instead of
// __dirname. Run via the npm script (cwd = qids-platform).
const target = resolve(process.cwd(), 'tests', 'fixtures', 'qids-golden.json');
mkdirSync(resolve(process.cwd(), 'tests', 'fixtures'), { recursive: true });
writeFileSync(target, JSON.stringify(out));
console.log(`wrote ${cases.length} cases → ${target}`);
