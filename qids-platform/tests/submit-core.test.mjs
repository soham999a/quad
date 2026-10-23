// ─── Submission core tests ───────────────────────────────────────────────────
// Exercises api/_lib/submitCore.js without HTTP or Firebase, so the rules that
// protect the trust layer are testable in CI on every push.
//
//   npm run test:api

import { buildShadowRecord, canonicalHash, validateSubmission, SubmissionError } from '../api/_lib/submitCore.js';
import { buildQidsResult } from '../shared/scoring/qids.js';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = '') {
  if (cond) { passed += 1; return; }
  failed += 1;
  if (failures.length < 12) failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function throws(fn, status = 400) {
  try { fn(); return false; } catch (e) {
    return e instanceof SubmissionError ? e.status === status : false;
  }
}

const UID = 'test-uid-123';
const rawScores = {
  IQ: { verbal: 18, quantitative: 21, psychometric: 17, performance: 20, _aiBonus: 8, _visualBonus: 6 },
  EQ: { SA: 7, ER: 8, SM: 6, E: 9, IS: 7 },
  SQ: { ACE: 19, CSI: 20, PBA: 18 },
  AQ: { SA: 15, PM: 13, RR: 16, RC: 14 },
};

const baseBody = {
  submissionId: 'sub_1234567890',
  clientAssessmentId: 'client-doc-1',
  rawScores,
  intake: { name: 'Test Person', ageGroup: '19-32' },
  ageGroup: '19-32',
  mode: 'qids',
  startedAt: '2026-10-23T10:00:00.000Z',
  durationMs: 1_800_000,
};

// ── Happy path ───────────────────────────────────────────────────────────────
{
  const { record, submissionId } = buildShadowRecord({ body: baseBody, uid: UID, now: '2026-10-23T10:30:00.000Z' });
  const expected = buildQidsResult({ rawScores, intake: baseBody.intake, ageGroup: '19-32', mode: 'qids', now: '2026-10-23T10:30:00.000Z' });

  check('submissionId is preserved', submissionId === baseBody.submissionId);
  check('record is owned by the authenticated uid', record.uid === UID);
  check('record is marked server-scored', record.scoredBy === 'server' && record.shadow === true);
  check('record carries engine provenance', record.engine?.version === '1.0.0' && record.engine?.id === 'qids');
  check('server result matches the shared engine', record.result.unifiedScore === expected.result.unifiedScore
    && JSON.stringify(record.result.pillarScores) === JSON.stringify(expected.pillarScores));
  check('grade is stored as grade + label', record.result.grade?.grade === expected.result.grade.grade
    && record.result.grade?.label === expected.result.grade.label);
  check('input hash is 64 hex chars', /^[0-9a-f]{64}$/.test(record.inputHash));
  check('duration is retained for integrity signals', record.input.durationMs === 1_800_000);
}

// ── Client-supplied scores are ignored ──────────────────────────────────────
{
  const forged = {
    ...baseBody,
    result: { unifiedScore: 100, grade: 'A' },
    pillarScores: { IQ: 100, EQ: 100, SQ: 100, AQ: 100 },
    unifiedScore: 100,
  };
  const { record } = buildShadowRecord({ body: forged, uid: UID });
  const trueResult = buildQidsResult({ rawScores, intake: baseBody.intake, ageGroup: '19-32', mode: 'qids' });
  check('forged client scores cannot reach the record', record.result.unifiedScore === trueResult.result.unifiedScore);
  check('forged client pillar scores are discarded',
    JSON.stringify(record.result.pillarScores) === JSON.stringify(trueResult.pillarScores));
}

// ── Validation ──────────────────────────────────────────────────────────────
check('authenticated uid is required', throws(() => buildShadowRecord({ body: baseBody, uid: '' }), 401));
check('missing submissionId is rejected', throws(() => buildShadowRecord({ body: { ...baseBody, submissionId: undefined }, uid: UID })));
check('short submissionId is rejected', throws(() => buildShadowRecord({ body: { ...baseBody, submissionId: 'abc' }, uid: UID })));
check('unsafe submissionId characters are rejected', throws(() => buildShadowRecord({ body: { ...baseBody, submissionId: 'abc/def/../../x' }, uid: UID })));
check('over-maximum raw score is rejected', throws(() => buildShadowRecord({
  body: { ...baseBody, rawScores: { ...rawScores, IQ: { ...rawScores.IQ, verbal: 999 } } }, uid: UID,
})));
check('unknown instrument field is rejected', throws(() => buildShadowRecord({
  body: { ...baseBody, rawScores: { ...rawScores, IQ: { ...rawScores.IQ, freePoints: 10 } } }, uid: UID,
})));
check('negative raw score is rejected', throws(() => buildShadowRecord({
  body: { ...baseBody, rawScores: { ...rawScores, EQ: { ...rawScores.EQ, SA: -5 } } }, uid: UID,
})));
check('unknown age group is rejected', throws(() => buildShadowRecord({ body: { ...baseBody, ageGroup: '5-7' }, uid: UID })));
check('unknown mode is rejected', throws(() => buildShadowRecord({ body: { ...baseBody, mode: 'enterprise' }, uid: UID })));
check('negative duration is rejected', throws(() => buildShadowRecord({ body: { ...baseBody, durationMs: -1 }, uid: UID })));
check('oversized intake is rejected', throws(() => buildShadowRecord({
  body: { ...baseBody, intake: { note: 'x'.repeat(5000) } }, uid: UID,
})));
check('non-object body is rejected', throws(() => buildShadowRecord({ body: 'nope', uid: UID })));

// ── Hashing ─────────────────────────────────────────────────────────────────
{
  const a = validateSubmission(baseBody);
  const reordered = validateSubmission({
    ...baseBody,
    rawScores: {
      AQ: rawScores.AQ, SQ: rawScores.SQ, EQ: rawScores.EQ, IQ: rawScores.IQ,
    },
  });
  check('hash is stable across key order', canonicalHash(a) === canonicalHash(reordered));
  const changed = validateSubmission({
    ...baseBody,
    rawScores: { ...rawScores, AQ: { ...rawScores.AQ, RC: 15 } },
  });
  check('hash changes when an answer changes', canonicalHash(a) !== canonicalHash(changed));
}

console.log(`\n${passed} checks passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed ? 1 : 0);
