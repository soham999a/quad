// ─── Credential verification lookup ─────────────────────────────────────────
// Asks the server what it recorded for an assessment. The credential page uses
// the answer to decide its badge and, when the record exists, to display the
// server's numbers rather than the tab's.
//
// Statuses:
//   found    the server has a record (see `attested`, `mismatchCount`)
//   absent   the server has no record for this id (404)
//   error    the lookup could not be made (offline, dev server without /api)

const TIMEOUT_MS = 8000;

/**
 * @param {string | undefined} assessmentId
 * @param {import('firebase/auth').User | null} [user] owner token widens access
 * @returns {Promise<{ status: 'found' | 'absent' | 'error', verification?: object }>}
 */
export async function fetchVerification(assessmentId, user) {
  if (!assessmentId) return { status: 'absent' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers = {};
    if (user?.getIdToken) {
      try {
        headers.Authorization = `Bearer ${await user.getIdToken()}`;
      } catch { /* anonymous lookup still works for published credentials */ }
    }
    const res = await fetch(`/api/verification?id=${encodeURIComponent(assessmentId)}`, {
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (res.status === 404) return { status: 'absent' };
    if (!res.ok) return { status: 'error' };
    const data = await res.json().catch(() => null);
    if (!data?.ok || !data.verification) return { status: 'error' };
    return { status: 'found', verification: data.verification };
  } catch {
    return { status: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Do the numbers on screen match the server's record?
 * Rounded to whole points, the way both the credential and the record display.
 */
export function numbersAgree(verification, clientUnified, clientPillars) {
  if (!verification) return false;
  if (typeof clientUnified === 'number' && typeof verification.unifiedScore === 'number') {
    if (Math.round(clientUnified) !== Math.round(verification.unifiedScore)) return false;
  }
  if (clientPillars && verification.pillarScores) {
    for (const [key, value] of Object.entries(clientPillars)) {
      const serverValue = verification.pillarScores[key];
      if (serverValue === undefined) continue;
      if (Math.round(value) !== Math.round(serverValue)) return false;
    }
  }
  return true;
}

/** Turn the raw record into the three states the badge renders. */
export function verificationState(result, clientUnified, clientPillars) {
  if (!result || result.status === 'error') return 'unavailable';
  if (result.status === 'absent') return 'absent';
  const v = result.verification;
  if (!v.attested) return 'unattested';
  if (!numbersAgree(v, clientUnified, clientPillars)) return 'mismatch';
  return 'verified';
}
