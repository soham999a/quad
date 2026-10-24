// ─── Server-side scoring ────────────────────────────────────────────────────
// Sends item-level answers to /api/submit-assessment, which derives the section
// totals itself and stores its own record. The server's numbers are the ones a
// credential can point at; the tab's numbers are for immediate display.
//
// The call never blocks submission and never throws. A network failure costs
// the verification badge, not the assessment.

import { reportError } from '../lib/errorReport';

const ENDPOINT = '/api/submit-assessment';
const TIMEOUT_MS = 12000;

/** Stable id per attempt, so a retry can never double-score. */
export function newSubmissionId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {import('firebase/auth').User | null} user
 * @param {{
 *   submissionId: string,
 *   clientAssessmentId?: string | null,
 *   answers: object,
 *   rawScores?: object,
 *   intake: object,
 *   ageGroup?: string,
 *   mode?: 'qids' | 'school',
 *   startedAt?: string,
 *   durationMs?: number,
 * }} payload
 * @returns {Promise<{
 *   ok: boolean,
 *   duplicate?: boolean,
 *   attested?: boolean,
 *   mismatches?: string[],
 *   result?: object,
 *   shares?: object,
 *   status?: number,
 *   reason?: string,
 * }>}
 */
export async function submitAssessmentForVerification(user, payload) {
  if (!user?.getIdToken) return { ok: false, reason: 'signed-out' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const token = await user.getIdToken();
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    });

    if (!res.ok) {
      if (import.meta.env.DEV) console.info('[scoring] submission rejected:', res.status);
      return { ok: false, status: res.status };
    }

    // A dev server without /api answers with index.html; treat that as failure
    // rather than a success we cannot confirm.
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      if (import.meta.env.DEV) console.info('[scoring] submission: unexpected response');
      return { ok: false, reason: 'bad-response' };
    }
    return {
      ok: true,
      duplicate: !!data.duplicate,
      attested: !!data.attested,
      mismatches: data.mismatches || [],
      result: data.result,
      shares: data.shares,
    };
  } catch (e) {
    const reason = e?.name === 'AbortError' ? 'timeout' : 'network';
    if (import.meta.env.DEV) console.info('[scoring] submission skipped:', reason);
    // Only a genuine anomaly (not an offline tab) is worth a report.
    if (reason === 'timeout') reportError(e, { kind: 'scoring-timeout' });
    return { ok: false, reason };
  } finally {
    clearTimeout(timer);
  }
}
