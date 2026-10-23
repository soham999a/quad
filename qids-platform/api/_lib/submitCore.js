// ─── Submission core (pure) ──────────────────────────────────────────────────
// Everything the submit endpoint does that is worth testing without a network:
// validate the payload, score it with the shared engine, hash the input, and
// assemble the record written to Firestore.
//
// No Firebase, no HTTP. api/submit-assessment.js is the thin transport around
// this module, and tests/submit-core.test.mjs exercises it directly.

import { createHash } from 'node:crypto';
import { buildQidsResult, validateRawScores } from '../../shared/scoring/qids.js';

export const ENGINE_ID = 'qids';
export const ENGINE_VERSION = '1.0.0';
export const MAX_BODY_BYTES = 64 * 1024;
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

/**
 * @param {unknown} body
 * @returns {{
 *   submissionId: string,
 *   clientAssessmentId: string | null,
 *   rawScores: Record<string, any>,
 *   intake: Record<string, any>,
 *   ageGroup: string | null,
 *   mode: 'qids' | 'school',
 *   startedAt: string | null,
 *   durationMs: number | null,
 * }}
 */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SubmissionError('Body must be a JSON object');
  }

  const { submissionId, clientAssessmentId, rawScores, intake, ageGroup, mode, startedAt, durationMs } = /** @type {any} */ (body);

  if (typeof submissionId !== 'string' || !SUBMISSION_ID.test(submissionId)) {
    throw new SubmissionError('submissionId must be 8–64 characters of [A-Za-z0-9_-]');
  }
  if (clientAssessmentId != null && (typeof clientAssessmentId !== 'string' || clientAssessmentId.length > 128)) {
    throw new SubmissionError('clientAssessmentId must be a string of at most 128 characters');
  }

  const sheet = validateRawScores(rawScores);
  if (!sheet.ok) {
    throw new SubmissionError('rawScores do not match the instrument', 400, sheet.errors);
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
    rawScores,
    intake: cleanIntake,
    ageGroup: ageGroup ?? null,
    mode: mode ?? 'qids',
    startedAt: startedAt ?? null,
    durationMs: durationMs ?? null,
  };
}

/** @param {ReturnType<typeof validateSubmission>} input */
export function canonicalHash(input) {
  return createHash('sha256')
    .update(stableStringify({
      rawScores: input.rawScores,
      intake: input.intake,
      ageGroup: input.ageGroup,
      mode: input.mode,
    }))
    .digest('hex');
}

/**
 * Validate → score → assemble the record. The result written here is the
 * server's own derivation; nothing score-like is taken from the request.
 *
 * @param {{ body: unknown, uid: string, now?: string }} args
 */
export function buildShadowRecord({ body, uid, now }) {
  if (typeof uid !== 'string' || !uid) {
    throw new SubmissionError('Authenticated user is required', 401);
  }
  const input = validateSubmission(body);
  const scoredAt = now ?? new Date().toISOString();

  const { result, pillarScores } = buildQidsResult({
    rawScores: input.rawScores,
    intake: input.intake,
    ageGroup: input.ageGroup ?? undefined,
    mode: input.mode,
    now: scoredAt,
  });

  return {
    submissionId: input.submissionId,
    record: {
      uid,
      submissionId: input.submissionId,
      clientAssessmentId: input.clientAssessmentId,
      shadow: true,
      scoredBy: 'server',
      engine: { id: ENGINE_ID, version: ENGINE_VERSION },
      inputHash: canonicalHash(input),
      input: {
        rawScores: input.rawScores,
        intake: input.intake,
        ageGroup: input.ageGroup,
        mode: input.mode,
        startedAt: input.startedAt,
        durationMs: input.durationMs,
      },
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
