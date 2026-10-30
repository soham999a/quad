/**
 * interviewCalibration — the two spec items that needed their own home:
 *
 * ① T-scores (Section 7.2): raw module scores convert to theta, then to
 *    T-scores (mean=50, SD=10) for display. The interview runs on the 1–5
 *    rubric, so the conversion here is a LINEAR ANCHOR pinned to Section 14's
 *    own band boundaries — not an IRT theta. Every anchor lands exactly on a
 *    boundary the spec prints:
 *
 *      T = 50 + 15 × (score − 3.5)
 *
 *      score 4.5 → T 65  → Exceptional starts  (spec: T ≥ 65)
 *      score 3.5 → T 50  → Proficient starts   (spec: T 50–64)
 *      score 2.5 → T 35  → Developing starts   (spec: T 35–49)
 *      score 1.5 → T 20  → Emerging            (spec: T < 35)
 *
 *    Because the anchors sit on the spec's own cut points, `interviewBand`
 *    and the T-band vocabulary agree at every boundary with no fudging, and
 *    the percentile equivalents follow from the standard normal table the
 *    spec itself quotes (T 65 ≈ top 7%, T 50 = top 50%, T 35 ≈ top 84%).
 *    The Phase 3 norming study (Appendix C) replaces the linear anchor with
 *    calibrated IRT tables — the function boundary stays identical.
 *
 * ② Calibration Nudge (Appendix B): "If interviewer rates all candidates
 *    'Strong', platform flags potential leniency bias and surfaces
 *    calibration reminder." Ratings and marks already live on the session
 *    docs — this is the pure read over the evaluator's recent history.
 */

/** Section 7.2 linear anchor — see module doc-header for the derivation. */
export function interviewTScore(score: number | null | undefined): {
  t: number;
  label: 'Exceptional' | 'Proficient' | 'Developing' | 'Emerging';
  percentile: string;
} | null {
  if (score == null || !(score > 0)) return null;
  const raw = 50 + 15 * (Number(score) - 3.5);
  // Clamp to the humanly-plausible display range: the rubric floor maps to
  // T 12.5, which we floor-display at 15 so no report ever prints a
  // single-digit T the norm table can't support.
  const t = Math.min(75, Math.max(15, Math.round(raw * 10) / 10));
  const label = raw >= 65 ? 'Exceptional' : raw >= 50 ? 'Proficient' : raw >= 35 ? 'Developing' : 'Emerging';
  // Percentile equivalents from the spec's normal-table language (Section 14).
  const percentile = raw >= 65 ? 'Top 7%'
    : raw >= 50 ? 'Top 16–50%'
    : raw >= 35 ? 'Top 50–84%'
    : 'Top 84%+';
  return { t, label, percentile };
}

/**
 * Leniency guard over an evaluator's completed sessions. Two signals, either
 * one sufficient (the PDF defines the pattern qualitatively; these make it
 * deterministic):
 *   - ≥ 80% of all Covered/Strong/Weak marks across the window are 'strong';
 *   - mean live rating ≥ 4.0 across every scored response.
 * Window: the most recent 10 completed sessions. `sessions` are already
 * evaluator-filtered session docs; the function is pure and side-effect free.
 */
export function calibrationNudge(
  sessions: Array<{
    status?: string,
    completedAt?: string | null,
    guideMarks?: Record<string, string>,
    liveResponses?: Array<{ score?: number | null }>,
  }>,
): { leniency: boolean; marksShare: number | null; meanRating: number | null; windowSessions: number } {
  const completed = sessions
    .filter(s => s.status === 'completed')
    .slice(0, 10); // callers pass newest-first; window = last 10
  if (completed.length < 3) {
    // A pattern needs a pattern: below three sessions any verdict would be
    // statistical noise, so the nudge stays quiet.
    return { leniency: false, marksShare: null, meanRating: null, windowSessions: completed.length };
  }
  const counts = { covered: 0, strong: 0, weak: 0 };
  let marksTotal = 0;
  for (const s of completed) {
    for (const m of Object.values(s.guideMarks || {})) {
      if (m === 'covered' || m === 'strong' || m === 'weak') counts[m] += 1;
      marksTotal += 1;
    }
  }
  const ratings: number[] = [];
  for (const s of completed) {
    for (const r of s.liveResponses || []) {
      const sc = Number(r?.score);
      if (Number.isFinite(sc) && sc > 0) ratings.push(sc);
    }
  }
  const marksShare = marksTotal > 0 ? counts.strong / marksTotal : null;
  const meanRating = ratings.length >= 15
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;
  const leniency = (marksShare != null && marksShare >= 0.8)
    || (meanRating != null && meanRating >= 4.0);
  return { leniency, marksShare, meanRating, windowSessions: completed.length };
}
