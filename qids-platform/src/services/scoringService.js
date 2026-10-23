// ─── Server-side scoring (shadow mode, slice 1) ──────────────────────────────
// Sends the answer sheet to /api/submit-assessment, which scores it with the
// shared engine and stores its own record. Nothing reads that record yet: this
// exists to prove the server and the browser agree on real traffic before the
// app switches its source of truth.
//
// The call is fire-and-forget. It must never block submission, never surface an
// error to the user, and never throw.

const ENDPOINT = '/api/submit-assessment';
const TIMEOUT_MS = 8000;

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
 *   rawScores: object,
 *   intake: object,
 *   ageGroup?: string,
 *   mode?: 'qids' | 'school',
 *   startedAt?: string,
 *   durationMs?: number,
 * }} payload
 * @returns {Promise<{ ok: boolean, duplicate?: boolean, status?: number, reason?: string }>}
 */
export async function submitAssessmentShadow(user, payload) {
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
      if (import.meta.env.DEV) console.info('[scoring] shadow submit rejected:', res.status);
      return { ok: false, status: res.status };
    }

    // A dev server without /api answers with index.html; treat that as failure
    // rather than a success we cannot confirm.
    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      if (import.meta.env.DEV) console.info('[scoring] shadow submit: unexpected response');
      return { ok: false, reason: 'bad-response' };
    }
    return { ok: true, duplicate: !!data.duplicate };
  } catch (e) {
    if (import.meta.env.DEV) {
      console.info('[scoring] shadow submit skipped:', e?.name === 'AbortError' ? 'timeout' : 'network');
    }
    return { ok: false, reason: e?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
