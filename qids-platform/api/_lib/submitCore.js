// ─── Submission core (pure) ──────────────────────────────────────────────────
// Everything the submit endpoint does that is worth testing without a network:
// validate the payload, derive the score sheet from item-level answers, score
// it with the shared engine, hash the input, and assemble the records written
// to Firestore.
//
// Trust model, stated plainly:
//   * The client may send `answers` — item-level choices — and nothing else.
//   * The server derives the raw section totals itself and compares them with
//     whatever totals the client claims. Disagreement is recorded, never
//     silently accepted, and the derived numbers are the ones that count.
//   * A payload with no `answers` is still accepted (older deployed clients),
//     but it is marked `attested: false` and its credential cannot claim
//     server derivation.
//
// No Firebase, no HTTP. api/submit-assessment.js is the thin transport around
// this module, and tests/submit-core.test.mjs exercises it directly.

import { createHash } from 'node:crypto';
import { buildQidsResult, validateRawScores, PILLAR_IDS } from '../../shared/scoring/qids.js';
import { deriveRawScores } from '../../shared/scoring/answers.js';

export const ENGINE_ID = 'qids';
export const ENGINE_VERSION = '1.1.0';
export const MAX_BODY_BYTES = 128 * 1024;
export const MAX_INTAKE_BYTES = 4 * 1024;
export const MAX_ANSWERS = 500;

const SUBMISSION_ID = /^[A-Za-z0-9_-]{8,64}$/;
const AGE_GROUPS = ['11-18', '19-32'];
const MODES = ['qids', 'school'];

export class SubmissionError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {string[]} [details]
   */
  constructor(message, status = 400, details = []) {
    super(message);
    this.name = 'SubmissionError';
    this.status = status;
    this.details = details;
  }
}

/** JSON with sorted keys, so the same input always hashes the same way. */
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/** Reject payloads whose answer sheet is not a bounded object of primitives. */
function validateAnswers(answers) {
  if (answers == null) return null;
  if (typeof answers !== 'object' || Array.isArray(answers)) {
    throw new SubmissionError('answers must be an object');
  }
  let leaves = 0;
  const walk = (node, depth) => {
    if (depth > 6) throw new SubmissionError('answers are nested too deeply');
    if (node === null || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key.length > 64) throw new SubmissionError('answers contain an oversized key');
      if (value !== null && typeof value === 'object') {
        if (Array.isArray(value)) {
          leaves += value.length;
          if (leaves > MAX_ANSWERS) throw new SubmissionError('answers contain too many values');
          continue;
        }
        walk(value, depth + 1);
      } else {
        leaves += 1;
        if (leaves > MAX_ANSWERS) throw new SubmissionError('answers contain too many values');
        if (typeof value === 'string' && value.length > 2000) {
          throw new SubmissionError('an answer text is too long');
        }
      }
    }
  };
  walk(answers, 0);
  return answers;
}

/**
 * @param {unknown} body
 */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SubmissionError('Body must be a JSON object');
  }

  const { submissionId, clientAssessmentId, rawScores, answers, intake, ageGroup, mode, startedAt, durationMs } = /** @type {any} */ (body);

  if (typeof submissionId !== 'string' || !SUBMISSION_ID.test(submissionId)) {
    throw new SubmissionError('submissionId must be 8–64 characters of [A-Za-z0-9_-]');
  }
  if (clientAssessmentId != null && (typeof clientAssessmentId !== 'string' || clientAssessmentId.length > 128)) {
    throw new SubmissionError('clientAssessmentId must be a string of at most 128 characters');
  }

  const cleanAnswers = validateAnswers(answers);

  // Without answers the sheet is still checked against the instrument bounds,
  // but it is a claim rather than a derivation.
  if (!cleanAnswers && rawScores === undefined) {
    throw new SubmissionError('answers or rawScores is required');
  }
  if (!cleanAnswers) {
    const sheet = validateRawScores(rawScores);
    if (!sheet.ok) {
      throw new SubmissionError('rawScores do not match the instrument', 400, sheet.errors);
    }
  }

  const cleanIntake = intake == null ? {} : intake;
  if (typeof cleanIntake !== 'object' || Array.isArray(cleanIntake)) {
    throw new SubmissionError('intake must be an object');
  }
  if (Buffer.byteLength(JSON.stringify(cleanIntake), 'utf8') > MAX_INTAKE_BYTES) {
    throw new SubmissionError('intake is too large');
  }

  if (ageGroup != null && !AGE_GROUPS.includes(ageGroup)) {
    throw new SubmissionError(`ageGroup must be one of ${AGE_GROUPS.join(', ')}`);
  }
  if (mode != null && !MODES.includes(mode)) {
    throw new SubmissionError(`mode must be one of ${MODES.join(', ')}`);
  }
  if (startedAt != null && (typeof startedAt !== 'string' || startedAt.length > 40 || Number.isNaN(Date.parse(startedAt)))) {
    throw new SubmissionError('startedAt must be an ISO timestamp');
  }
  if (durationMs != null && (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0 || durationMs > 24 * 60 * 60 * 1000)) {
    throw new SubmissionError('durationMs must be a plausible duration in milliseconds');
  }

  return {
    submissionId,
    clientAssessmentId: clientAssessmentId ?? null,
    rawScores: cleanAnswers ? null : rawScores,
    answers: cleanAnswers,
    intake: cleanIntake,
    ageGroup: ageGroup ?? '11-18',
    mode: mode ?? 'qids',
    startedAt: startedAt ?? null,
    durationMs: durationMs ?? null,
  };
}

/** @param {ReturnType<typeof validateSubmission>} input */
export function canonicalHash(input) {
  return createHash('sha256')
    .update(stableStringify({
      answers: input.answers ?? null,
      rawScores: input.rawScores ?? null,
      intake: input.intake,
      ageGroup: input.ageGroup,
      mode: input.mode,
    }))
    .digest('hex');
}

/**
 * Compare the derived sheet with whatever the client claimed. Returns the list
 * of fields that disagree — empty when the client told the truth.
 */
export function compareSheets(derived, claimed) {
  if (!claimed || typeof claimed !== 'object') return [];
  const diffs = [];
  for (const pillar of PILLAR_IDS) {
    const d = derived[pillar] || {};
    const c = claimed[pillar];
    if (c === undefined) continue;
    if (!c || typeof c !== 'object') { diffs.push(pillar); continue; }
    for (const key of new Set([...Object.keys(d), ...Object.keys(c)])) {
      const dv = d[key] ?? 0;
      const cv = typeof c[key] === 'number' ? c[key] : 0;
      if (Math.abs(dv - cv) > 1e-6) diffs.push(`${pillar}.${key}`);
    }
  }
  return diffs;
}

/**
 * Validate → derive → score → assemble the record.
 *
 * @param {{ body: unknown, uid: string, now?: string }} args
 */
export function buildSubmissionRecord({ body, uid, now }) {
  if (typeof uid !== 'string' || !uid) {
    throw new SubmissionError('Authenticated user is required', 401);
  }
  const input = validateSubmission(body);
  const claimed = /** @type {any} */ (body).rawScores ?? null;
  const scoredAt = now ?? new Date().toISOString();

  const derived = input.answers
    ? deriveRawScores(input.answers, { ageGroup: input.ageGroup })
    : null;

  const rawScores = derived ? derived.rawScores : input.rawScores;
  const mismatches = derived ? compareSheets(rawScores, claimed) : [];

  const { result, pillarScores } = buildQidsResult({
    rawScores,
    intake: input.intake,
    ageGroup: input.ageGroup,
    mode: input.mode,
    now: scoredAt,
  });

  const attested = Boolean(derived) && mismatches.length === 0;

  return {
    submissionId: input.submissionId,
    mismatches,
    record: {
      uid,
      submissionId: input.submissionId,
      clientAssessmentId: input.clientAssessmentId,
      scoredBy: 'server',
      attested,
      engine: { id: ENGINE_ID, version: ENGINE_VERSION },
      inputHash: canonicalHash(input),
      input: {
        answers: input.answers,
        rawScores,
        claimedRawScores: claimed,
        intake: input.intake,
        ageGroup: input.ageGroup,
        mode: input.mode,
        startedAt: input.startedAt,
        durationMs: input.durationMs,
      },
      provenance: derived?.provenance ?? null,
      shares: derived?.shares ?? null,
      completeness: derived?.completeness ?? null,
      mismatches,
      result: {
        mode: result.mode,
        pillarScores,
        unifiedScore: result.unifiedScore,
        grade: { grade: result.grade.grade, label: result.grade.label },
        skillShape: result.skillShape,
        careerProfileId: result.careerProfile?.id ?? null,
      },
      scoredAt,
    },
  };
}

/**
 * The compact record a credential can point at. Public-safe: no answers, no
 * intake, no uid — just what a verifier needs to check the badge.
 *
 * @param {ReturnType<typeof buildSubmissionRecord>} submission
 */
export function buildVerificationSummary(submission) {
  const r = submission.record;
  return {
    submissionId: r.submissionId,
    clientAssessmentId: r.clientAssessmentId,
    engine: r.engine,
    inputHash: r.inputHash,
    attested: r.attested,
    mismatchCount: r.mismatches.length,
    unifiedScore: r.result.unifiedScore,
    grade: r.result.grade,
    pillarScores: r.result.pillarScores,
    skillShape: r.result.skillShape,
    shares: r.shares,
    completeness: r.completeness,
    durationMs: r.input.durationMs,
    scoredAt: r.scoredAt,
  };
}
