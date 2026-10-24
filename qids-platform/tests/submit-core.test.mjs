// ─── Submission core tests ───────────────────────────────────────────────────
// Exercises api/_lib/submitCore.js without HTTP or Firebase, so the rules that
// protect the trust layer are testable in CI on every push.
//
//   npm run test:api

import { buildSubmissionRecord, buildVerificationSummary, canonicalHash, compareSheets, validateSubmission, SubmissionError } from '../api/_lib/submitCore.js';
import { buildQidsResult } from '../shared/scoring/qids.js';
import { deriveRawScores } from '../shared/scoring/answers.js';
import { IQ_QUESTIONS, EQ_QUESTIONS, SQ_QUESTIONS, AQ_QUESTIONS } from '../src/data/qidsData.js';

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

// A complete answer sheet, generated from the instrument itself so the fixture
// cannot drift from the questions it answers.
function fullAnswers() {
  const iq = {};
  for (const [sectionId, spec] of Object.entries(IQ_QUESTIONS)) {
    const sheet = {};
    spec.sections.forEach((section, si) => {
      section.questions.forEach((q, qi) => {
        const idx = si * 5 + qi;
        if (section.type === 'mcq') sheet[idx] = q.answer;
        else if (q.answer !== undefined) sheet[idx] = String(q.answer).toUpperCase();
        else sheet[idx] = 'a considered answer';
      });
    });
    iq[sectionId] = sheet;
  }
  iq.agentGraded = { mcq: { quantitative: 2, psychometric: 1 }, open: { verbal: 3, performance: 2 }, visualCorrect: 4 };

  const eq = { partA: {}, partB: {} };
  for (const [comp, spec] of Object.entries(EQ_QUESTIONS.partA)) {
    const items = spec.questions['11-18'];
    eq.partA[comp] = Object.fromEntries(items.map((_, i) => [i, 3]));
  }
  for (const activity of EQ_QUESTIONS.partB) {
    eq.partB[activity.id] = Object.fromEntries(activity.rubric.map(r => [r.criterion, r.marks]));
  }

  const sq = { ACE: {}, CSI: {}, PBA: {}, selectedPBAs: ['PBA1', 'PBA2'] };
  for (const ex of SQ_QUESTIONS.component1_ACE.exercises) {
    sq.ACE[ex.id] = Object.fromEntries(ex.rubric.map(r => [r.criterion, r.marks]));
  }
  for (const q of SQ_QUESTIONS.component2_CSI.questions) {
    // Pick the highest-marking option — the server reads marks from the
    // instrument, so this is the only way to max the section.
    const best = q.options.reduce((bi, o, i) => (o.marks > q.options[bi].marks ? i : bi), 0);
    sq.CSI[q.id] = best;
  }
  for (const activity of SQ_QUESTIONS.component3_PBA.activities.slice(0, 2)) {
    sq.PBA[activity.id] = Object.fromEntries(activity.rubric.map(r => [r.criterion, r.marks]));
  }

  const aq = {};
  for (const [comp, spec] of Object.entries(AQ_QUESTIONS.components)) {
    const items = spec.questions['11-18'];
    aq[comp] = {
      partA: Object.fromEntries(items.map((_, i) => [i, 4])),
      partB: Object.fromEntries(spec.activity.rubric.map(r => [r.criterion, r.marks])),
    };
  }
  return { IQ: iq, EQ: eq, SQ: sq, AQ: aq };
}

const answers = fullAnswers();
const derived = deriveRawScores(answers, { ageGroup: '11-18' });
const rawScores = derived.rawScores;

const baseBody = {
  submissionId: 'sub_1234567890',
  clientAssessmentId: 'client-doc-1',
  answers,
  rawScores,
  intake: { name: 'Test Person', ageGroup: '11-18' },
  ageGroup: '11-18',
  mode: 'qids',
  startedAt: '2026-10-23T10:00:00.000Z',
  durationMs: 1_800_000,
};

// ── Happy path ───────────────────────────────────────────────────────────────
{
  const { record, submissionId } = buildSubmissionRecord({ body: baseBody, uid: UID, now: '2026-10-23T10:30:00.000Z' });
  const expected = buildQidsResult({ rawScores, intake: baseBody.intake, ageGroup: '11-18', mode: 'qids', now: '2026-10-23T10:30:00.000Z' });

  check('submissionId is preserved', submissionId === baseBody.submissionId);
  check('record is owned by the authenticated uid', record.uid === UID);
  check('record is marked server-scored', record.scoredBy === 'server');
  check('a matching sheet is attested', record.attested === true && record.mismatches.length === 0);
  check('record carries engine provenance', record.engine?.version === '1.1.0' && record.engine?.id === 'qids');
  check('server result matches the shared engine', record.result.unifiedScore === expected.result.unifiedScore
    && JSON.stringify(record.result.pillarScores) === JSON.stringify(expected.result.pillarScores));
  check('grade is stored as grade + label', record.result.grade?.grade === expected.result.grade.grade
    && record.result.grade?.label === expected.result.grade.label);
  check('input hash is 64 hex chars', /^[0-9a-f]{64}$/.test(record.inputHash));
  check('duration is retained for integrity signals', record.input.durationMs === 1_800_000);
  check('provenance shares are recorded', record.shares && typeof record.shares.machine === 'number');
  check('completeness is recorded per pillar', record.completeness?.IQ === 1 && record.completeness?.SQ === 1);
}

// ── Client-supplied totals are never trusted ────────────────────────────────
{
  const forged = {
    ...baseBody,
    rawScores: {
      IQ: { verbal: 25, quantitative: 25, psychometric: 25, performance: 25, _aiBonus: 16, _visualBonus: 9 },
      EQ: { SA: 10, ER: 10, SM: 10, E: 10, IS: 10 },
      SQ: { ACE: 25, CSI: 25, PBA: 25 },
      AQ: { SA: 19, PM: 19, RR: 19, RC: 19 },
    },
    result: { unifiedScore: 100, grade: 'A' },
    pillarScores: { IQ: 100, EQ: 100, SQ: 100, AQ: 100 },
    unifiedScore: 100,
  };
  const { record, mismatches } = buildSubmissionRecord({ body: forged, uid: UID });
  const trueResult = buildQidsResult({ rawScores, intake: baseBody.intake, ageGroup: '11-18', mode: 'qids' });
  check('forged totals do not change the score', record.result.unifiedScore === trueResult.result.unifiedScore);
  check('forged pillar scores are discarded',
    JSON.stringify(record.result.pillarScores) === JSON.stringify(trueResult.result.pillarScores));
  check('forged totals are flagged as a mismatch', mismatches.length > 0 && record.attested === false);
  check('the mismatch names the divergent fields', mismatches.some(m => m.startsWith('IQ.')));
  check('top-level client result objects are ignored', record.result.unifiedScore !== 100);
}

// ── Answers are the only trusted source ─────────────────────────────────────
{
  const weaker = fullAnswers();
  // Wipe every IQ MCQ answer: the derived score must drop, the claimed score
  // must not be able to hold it up.
  for (const [sectionId, spec] of Object.entries(IQ_QUESTIONS)) {
    spec.sections.forEach((section, si) => {
      section.questions.forEach((q, qi) => {
        if (section.type === 'mcq') delete weaker.IQ[sectionId][si * 5 + qi];
      });
    });
  }
  const { record } = buildSubmissionRecord({ body: { ...baseBody, answers: weaker }, uid: UID });
  check('fewer answers cannot produce a higher score', record.result.pillarScores.IQ <= rawScores.IQ.verbal + rawScores.IQ.quantitative + rawScores.IQ.psychometric + rawScores.IQ.performance + 25);
  check('the derived score follows the answers, not the claim',
    record.result.pillarScores.IQ < buildQidsResult({ rawScores, intake: baseBody.intake, ageGroup: '11-18' }).result.pillarScores.IQ);
  check('an empty answer sheet scores zero, not the claim', (() => {
    const empty = buildSubmissionRecord({ body: { ...baseBody, answers: {} }, uid: UID });
    return empty.record.result.pillarScores.IQ === 0 && empty.record.result.unifiedScore < 10;
  })());
}

// ── Legacy payloads stay accepted but unverified ─────────────────────────────
{
  const legacy = { ...baseBody };
  delete legacy.answers;
  const { record } = buildSubmissionRecord({ body: legacy, uid: UID });
  check('a totals-only payload is scored', record.result.unifiedScore > 0);
  check('a totals-only payload is not attested', record.attested === false);
  check('a totals-only payload records no provenance', record.provenance === null && record.shares === null);
}

// ── Out-of-range answers cannot inflate a score ─────────────────────────────
{
  const inflated = fullAnswers();
  inflated.EQ.partA.SA = { 0: 99, 1: 99, 2: 99, 3: 99, 4: 99 };
  inflated.SQ.CSI = Object.fromEntries(Object.keys(inflated.SQ.CSI).map(k => [k, 99]));
  inflated.SQ.selectedPBAs = ['PBA1', 'PBA2', 'PBA3', 'PBA4'];
  const { record } = buildSubmissionRecord({ body: { ...baseBody, answers: inflated }, uid: UID });
  check('Likert values above the scale are ignored', record.result.pillarScores.EQ <= 100);
  check('CSI option indexes outside the options are ignored', record.result.pillarScores.SQ <= 100);
  check('more than two PBAs are ignored', record.completeness.SQ <= 1);
}

// ── Validation ──────────────────────────────────────────────────────────────
check('authenticated uid is required', throws(() => buildSubmissionRecord({ body: baseBody, uid: '' }), 401));
check('missing submissionId is rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, submissionId: undefined }, uid: UID })));
check('short submissionId is rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, submissionId: 'abc' }, uid: UID })));
check('unsafe submissionId characters are rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, submissionId: 'abc/def/../../x' }, uid: UID })));
check('a payload with neither answers nor totals is rejected', throws(() => {
  const body = { ...baseBody };
  delete body.answers;
  delete body.rawScores;
  return buildSubmissionRecord({ body, uid: UID });
}));
check('over-maximum raw score is rejected', throws(() => {
  const body = { ...baseBody };
  delete body.answers;
  return buildSubmissionRecord({ body: { ...body, rawScores: { ...rawScores, IQ: { ...rawScores.IQ, verbal: 999 } } }, uid: UID });
}));
check('unknown instrument field is rejected', throws(() => {
  const body = { ...baseBody };
  delete body.answers;
  return buildSubmissionRecord({ body: { ...body, rawScores: { ...rawScores, IQ: { ...rawScores.IQ, freePoints: 10 } } }, uid: UID });
}));
check('negative raw score is rejected', throws(() => {
  const body = { ...baseBody };
  delete body.answers;
  return buildSubmissionRecord({ body: { ...body, rawScores: { ...rawScores, EQ: { ...rawScores.EQ, SA: -5 } } }, uid: UID });
}));
check('unknown age group is rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, ageGroup: '5-7' }, uid: UID })));
check('unknown mode is rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, mode: 'enterprise' }, uid: UID })));
check('negative duration is rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, durationMs: -1 }, uid: UID })));
check('oversized intake is rejected', throws(() => buildSubmissionRecord({ body: { ...baseBody, intake: { note: 'x'.repeat(5000) } }, uid: UID })));
check('non-object body is rejected', throws(() => buildSubmissionRecord({ body: 'nope', uid: UID })));
check('an oversized answer text is rejected', throws(() => {
  const answers = fullAnswers();
  answers.IQ.verbal[0] = 'x'.repeat(2001);
  return buildSubmissionRecord({ body: { ...baseBody, answers }, uid: UID });
}));

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
  const changedAnswers = fullAnswers();
  changedAnswers.AQ.SA.partA[0] = 1;
  const changed = validateSubmission({ ...baseBody, answers: changedAnswers });
  check('hash changes when an answer changes', canonicalHash(a) !== canonicalHash(changed));
}

// ── Verification summary ────────────────────────────────────────────────────
{
  const prepared = buildSubmissionRecord({ body: baseBody, uid: UID });
  const summary = buildVerificationSummary(prepared);
  check('summary carries the attested flag', summary.attested === true);
  check('summary mirrors the server score', summary.unifiedScore === prepared.record.result.unifiedScore);
  check('summary leaks no answers', summary.answers === undefined && summary.input === undefined);
  check('summary leaks no uid', summary.uid === undefined);
}

// ── Sheet comparison helper ─────────────────────────────────────────────────
{
  check('compareSheets reports nothing for equal sheets', compareSheets(rawScores, rawScores).length === 0);
  check('compareSheets reports a changed field', compareSheets(rawScores, { ...rawScores, AQ: { ...rawScores.AQ, RC: 0 } }).includes('AQ.RC'));
  check('compareSheets tolerates a missing claim', compareSheets(rawScores, null).length === 0);
}

console.log(`\n${passed} checks passed, ${failed} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed ? 1 : 0);
