/**
 * interviewReportPdf — the one-click download behind the interview report's
 * Download button. Dynamically imports jsPDF so the report route doesn't pay
 * the bundle cost until someone downloads.
 *
 * Layout: the QiDS_sample_profile_report two-page professional profile —
 *
 *   Page 1  Professional Intelligence Profile
 *           hero ("a profile for development, not a pass/fail label"),
 *           the index block, the read-this-profile box with stand-out asset
 *           and growth edge, the dimension radar snapshot, and the band-coded
 *           competency heatmap.
 *   Page 2  Profile Interpretation & Development — from scores to observable
 *           behaviours: what the pattern could mean at work, the work-style /
 *           career alignment block, the likely working pattern (at best /
 *           when stretched / interview prompt), the role lens, the
 *           development-priority ranking and the 90-day development
 *           conversation built from the Section 16 development library.
 *   Page 3+ Decision audit trail (Appendix B) — the full session transcript,
 *           which the sample report condenses out for readability.
 *
 * Every number is real session data; sample-report furniture that assumed
 * synthetic values (145-point PII, invented profile IDs) is mapped to the
 * interview scale the platform actually scores (0–100 index) without
 * pretending to be a PII.
 */

import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../core/data/interviewRubrics';
import { interviewBand, INTERVIEW_PEER_NORM } from '../core/engine/interviewScoring';
import { interviewTScore } from '../core/engine/interviewCalibration';
import { DEVELOPMENT_LIBRARY } from '../core/data/enterprise';
import { GRADE_BANDS } from '../data/qidsData';

// Ink-on-paper palette — deliberately NOT the dark-theme tokens, which print
// near-white on white and previously made downloads unreadable.
const C = {
  ink: [22, 24, 29],
  grey: [107, 114, 128],
  gold: [138, 109, 31],
  hairline: [216, 216, 216],
  tint: [244, 241, 235],
  success: [31, 111, 67],
  warning: [156, 106, 15],
  error: [140, 47, 47],
  primary: [36, 51, 92],
};

const BAND_COLORS = {
  Exceptional: C.success,
  Proficient: C.primary,
  Developing: C.warning,
  Emerging: C.error,
};

const GRADE_COLORS = { A: C.success, B: C.primary, C: C.gold, D: C.warning, E: C.error };

const SHAPE_LABELS = {
  T: 'T-Shaped — deep in one area, broad across others',
  I: 'I-Shaped — deep specialist in one domain',
  X: 'X-Shaped — balanced high performance',
  M: 'M-Shaped — multi-disciplinary strength',
};

// Section 16 development library has no exact entry for every rubric
// dimension; where the dictionary is silent the nearest competency is used
// (documented here, not silently):
const LIBRARY_MAP = {
  EmotionalIntelligence: 'Emotional Regulation',
  Teamwork: 'Conflict Navigation',
  Integrity: 'Ethical Judgment',
  CriticalThinking: 'Critical Thinking',
  ProblemSolving: 'Decision Quality',
  Adaptability: 'Adaptability',
  Resilience: 'Adaptability', // nearest fit — recovery behaviour lives in the adaptability entry
  Communication: 'Empathy',   // nearest fit — audience awareness built on perspective-taking
  Leadership: 'Decision Quality', // nearest fit — ownership of ambiguous calls
};

/** 1–5 rubric → the sample's 0–100 snapshot scale. */
const to100 = v => v > 0 ? ((Number(v) - 1) / 4) * 100 : 0;

/**
 * Build and save the interview report as a PDF file.
 * @param {object} session  A completed interviewSessions doc.
 * @param {object|null} previous  The previous completed attempt (re-interview delta).
 */
export async function downloadInterviewReportPdf(session, previous = null) {
  // Dynamic import keeps jspdf out of every other chunk.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 16;                       // side margin
  const W = PAGE_W - M * 2;           // usable width
  const BOTTOM = PAGE_H - 18;         // footer reserve

  let y = M + 2;
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const setInk = () => doc.setTextColor(...C.ink);
  const setGrey = () => doc.setTextColor(...C.grey);
  const setGold = () => doc.setTextColor(...C.gold);

  const ensure = h => {
    if (y + h > BOTTOM) {
      footer();
      doc.addPage();
      y = M + 2;
      return true;
    }
    return false;
  };

  const footer = () => {
    const pages = doc.getNumberOfPages();
    doc.setDrawColor(...C.hairline);
    doc.setLineWidth(0.2);
    doc.line(M, PAGE_H - 14, PAGE_W - M, PAGE_H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setGrey();
    doc.text('QiDS | Quotient Intelligence & Development System — Interview Record · ' + today, M, PAGE_H - 10);
    doc.text(String(pages) + ' / ' + doc.getNumberOfPages(), PAGE_W - M, PAGE_H - 10, { align: 'right' });
  };

  const rule = (lighter = false) => {
    doc.setDrawColor(...(lighter ? C.hairline : C.ink));
    doc.setLineWidth(lighter ? 0.15 : 0.5);
    doc.line(M, y, PAGE_W - M, y);
    y += 4;
  };

  const kicker = (text, color = C.gold) => {
    ensure(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...color);
    doc.text(text.toUpperCase(), M, y);
    y += 4.5;
  };

  const head = (text, size = 13) => {
    ensure(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    setInk();
    doc.text(text, M, y + 4);
    y += 4 + size * 0.45 + 3;
  };

  const para = (text, size = 9, color = C.ink, style = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W);
    for (const line of lines) {
      ensure(size * 0.45 + 1);
      doc.text(line, M, y);
      y += size * 0.45 + 1;
    }
  };

  const box = (h, fillColor = C.tint, borderColor = C.hairline) => {
    ensure(h + 4);
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.rect(M, y, W, h, 'FD');
    y += 6;
  };

  // ── Derived profile data (every block below reads from here) ─────────────
  const ranked = RUBRIC_DIMENSIONS
    .map(d => ({ dim: d, score: Number(session.mergedScores?.[d.id]) || 0 }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0] || null;
  const worst = ranked[ranked.length - 1] || null;
  const bestBand = best ? interviewBand(best.score) : null;
  const worstBand = worst ? interviewBand(worst.score) : null;
  const score = session.unifiedScore ?? null;
  const grade = session.grade || (score != null ? GRADE_BANDS.find(b => score >= b.min && score <= b.max) : null);
  const gradeColor = GRADE_COLORS[grade?.grade] || C.primary;

  // The sample's confidence language (PIP Page 1) — thresholds sit on the
  // 145-point PII (Green ≥105, Amber 90–104, Red <90); this report scores
  // 0–100, so the same cut ratios apply (≈72 / ≈62), documented openly.
  const confidence = score == null ? null
    : score >= 72
      ? { label: 'HIGH', color: C.success, note: 'Interview evidence tracks the strong band across most dimensions — proceed with hiring confidence.' }
      : score >= 62
        ? { label: 'MODERATE', color: C.warning, note: 'Capability is present but uneven — probe the flagged areas before a decision.' }
        : { label: 'CAUTION', color: C.error, note: 'Interview evidence stayed thin or weak — treat as a development risk for now.' };

  // Interview prompt for the growth edge — drawn live from the session bank.
  const promptQ = session.liveQuestions?.find(q => worst && q.dimension === worst.dim.id);
  const promptText = promptQ?.probeBank?.[0] || promptQ?.followUp || promptQ?.text || null;

  // Development library entry for the growth edge.
  const library = worst ? DEVELOPMENT_LIBRARY.find(e => e.subDimension === LIBRARY_MAP[worst.dim.id]) : null;

  /* ══════════════════════════════ PAGE 1 ══════════════════════════════ */

  // Masthead — sample: "QiDS | Quotient Intelligence & Development System"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setGold();
  doc.text('QIDS | QUOTIENT INTELLIGENCE & DEVELOPMENT SYSTEM', M, y);
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setGrey();
  doc.text('INTERVIEW INTELLIGENCE PROFILE · COMPLETED INTERVIEW RECORD — NOT SYNTHETIC DATA', M, y);
  y += 8;

  // Hero
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setInk();
  doc.text('A profile for development, not a pass/fail label.', M, y);
  y += 6;

  // Meta line — sample: "Sample QPIA-style profile · target role: ... · Example profile ID:"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setGrey();
  const metaBits = ['QIDS interview profile'];
  if (session.role) metaBits.push('target role: ' + session.role);
  metaBits.push('record id: ' + String(session.id).slice(0, 8).toUpperCase());
  if ((session.sessionNumber || 1) > 1) metaBits.push('attempt #' + session.sessionNumber);
  metaBits.push('interviewed by ' + (session.evaluatorName || 'evaluator'));
  doc.text(metaBits.join('  ·  '), M, y);
  y += 7;

  // ── Index block (sample: Professional Intelligence Index 108 / 145) ─────
  {
    ensure(52);
    box(44);
    kicker('Interview Intelligence Index', C.gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    setInk();
    doc.text(score != null ? String(Math.round(score)) : '—', M + 4, y + 9);
    const w30 = score != null ? doc.getTextWidth(String(Math.round(score))) : 8;
    doc.setFontSize(12);
    doc.setTextColor(...C.grey);
    doc.text('/ 100', M + 8 + w30, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const bandLine = [
      grade ? 'Grade ' + grade.grade + ' · ' + grade.label + ' band' : null,
      confidence ? confidence.label + ' confidence' : null,
      confidence?.note,
    ].filter(Boolean).join('  —  ');
    doc.setTextColor(...(confidence?.color || C.ink));
    const bandLines = doc.splitTextToSize(bandLine, W - 10);
    doc.text(bandLines[0], M + 4, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    for (let i = 1; i < bandLines.length; i++) doc.text(bandLines[i], M + 4, y + 16 + i * 4);
    y += 22 + Math.max(0, bandLines.length - 1) * 4;
  }

  // Re-interview delta chip, when a previous attempt exists.
  if (previous?.unifiedScore != null && session.unifiedScore != null) {
    const delta = Math.round(session.unifiedScore) - Math.round(previous.unifiedScore);
    ensure(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...(delta >= 0 ? C.success : C.error));
    doc.text('Attempt #' + (previous.sessionNumber || 1) + ' to #' + (session.sessionNumber || 1) + ': '
      + (delta >= 0 ? '+' : '') + delta + ' index points', M, y);
    y += 5;
  }

  // ── Read-this-profile box (sample) ───────────────────────────────────────
  {
    ensure(46);
    box(42);
    kicker('Read this profile as', C.ink);
    para('A snapshot of likely work behaviours across the QiDS framework. Pair the interview record with the structured assessment, role evidence and the candidate\u2019s own context. Cover/Strong/Weak marks and notes throughout are the evaluator\u2019s live judgement — a prompt for conversation, not a verdict.', 8.5, C.grey);
    y += 1;
    if (best) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setInk();
      doc.text('Stand-out asset', M, y);
      doc.text('Growth edge', M + W / 2, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setGrey();
      doc.text(best.dim.label, M, y);
      doc.text(worst ? worst.dim.label : '', M + W / 2, y);
      y += 4.5;
      doc.setFontSize(8);
      doc.text(bestBand ? bestBand.label + ' · ' + Math.round(to100(best.score)) + '/100' : '', M, y);
      doc.text(worstBand ? worstBand.label + ' · ' + Math.round(to100(worst.score)) + '/100' : '', M + W / 2, y);
      y += 5;
    }
  }

  // ── Radar profile (sample page-1 snapshot, candidate + peer line) ────────
  const radarValues = RUBRIC_DIMENSIONS.map(d => to100(session.mergedScores?.[d.id]));
  const R_RADAR = 42;
  {
    ensure(R_RADAR * 2 + 34);
    kicker('Nine-dimension snapshot');
    rule(true);
    const cx = PAGE_W / 2;
    const cy = y + R_RADAR + 10;
    const N = radarValues.length;
    const pt = (i, r01, Rpx) => {
      const ang = (i / N) * 2 * Math.PI - Math.PI / 2;
      return [cx + Math.cos(ang) * Rpx * r01, cy + Math.sin(ang) * Rpx * r01];
    };
    const polyRing = (r01, Rpx) => {
      const verts = Array.from({ length: N }, (_, i) => pt(i, r01, Rpx));
      doc.setDrawColor(...C.hairline);
      doc.setLineWidth(0.2);
      for (let k = 0; k < verts.length; k++) {
        const a = verts[k];
        const b = verts[(k + 1) % verts.length];
        doc.line(a[0], a[1], b[0], b[1]);
      }
    };
    [0.25, 0.5, 0.75, 1].forEach(f => polyRing(f, R_RADAR));
    doc.setLineWidth(0.2);
    RUBRIC_DIMENSIONS.forEach((_, i) => {
      const [ex, ey] = pt(i, 1, R_RADAR);
      doc.line(cx, cy, ex, ey);
    });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    RUBRIC_DIMENSIONS.forEach((d, i) => {
      const [lx, ly] = pt(i, 1, R_RADAR + 7);
      doc.setTextColor(...C.grey);
      doc.text(d.shortLabel, lx, ly, { align: 'center', baseline: 'middle' });
    });
    const closedVecs = verts => {
      const vecs = [];
      for (let k = 1; k < verts.length; k++) vecs.push([verts[k][0] - verts[k - 1][0], verts[k][1] - verts[k - 1][1]]);
      vecs.push([verts[0][0] - verts[verts.length - 1][0], verts[0][1] - verts[verts.length - 1][1]]);
      return vecs;
    };
    const peerVerts = RUBRIC_DIMENSIONS.map((_, i) => pt(i, Math.max(0, Math.min(100, INTERVIEW_PEER_NORM[RUBRIC_DIMENSIONS[i].id])) / 100, R_RADAR));
    doc.setDrawColor(...C.grey);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([1.4, 1.2], 0);
    doc.lines(closedVecs(peerVerts), peerVerts[0][0], peerVerts[0][1], [1, 1], 'S', true);
    doc.setLineDashPattern([], 0);
    const candVerts = RUBRIC_DIMENSIONS.map((_, i) => pt(i, Math.max(0, Math.min(100, radarValues[i])) / 100, R_RADAR));
    doc.setDrawColor(...C.gold);
    doc.setFillColor(...C.tint);
    doc.setLineWidth(0.6);
    doc.lines(closedVecs(candVerts), candVerts[0][0], candVerts[0][1], [1, 1], 'FD', true);
    y = cy + R_RADAR + 12;
    doc.setFillColor(...C.gold);
    doc.rect(M, y - 2, 8, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setInk();
    doc.text('Candidate — radar profile (broad shape, not precise ranking)', M + 11, y);
    doc.setDrawColor(...C.grey);
    doc.setLineWidth(0.35);
    doc.setLineDashPattern([1.4, 1.2], 0);
    doc.line(M + 97, y - 1, M + 105, y - 1);
    doc.setLineDashPattern([], 0);
    setGrey();
    doc.text('Peer reference', M + 108, y);
    y += 8;
  }

  // ── Competency heatmap (sample page-1 table with band-coded rows) ────────
  {
    ensure(ranked.length * 8 + 24);
    kicker('Competency heatmap · interview indicators');
    rule(true);
    const barW = 56;
    const rowH = 7;
    for (const x of ranked) {
      const v = to100(x.score);
      const band = interviewBand(x.score);
      const ts = interviewTScore(x.score);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setInk();
      doc.text(x.dim.label, M, y);
      // Band-coded bar — colour is redundant with the written band, never the sole encoding.
      doc.setFillColor(...C.tint);
      doc.rect(M + 62, y - 3, barW, 3.4, 'F');
      doc.setFillColor(...(BAND_COLORS[band?.label] || C.primary));
      doc.rect(M + 62, y - 3, Math.max(1.5, v / 100 * barW), 3.4, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setInk();
      doc.text(String(Math.round(v)), M + 62 + barW + 5, y, { align: 'right' });
      setGrey();
      doc.setFontSize(7.5);
      doc.text(band ? band.label + (ts ? ' · T ' + ts.t : '') : '', M + 62 + barW + 10, y);
      y += rowH;
    }
    y += 2;
    // Legend + how-to note (sample wording, adapted to interview data)
    const bandOrder = ['Exceptional', 'Proficient', 'Developing', 'Emerging'];
    let lx = M;
    for (const b of bandOrder) {
      doc.setFillColor(...BAND_COLORS[b]);
      doc.rect(lx, y - 2.4, 4, 2.6, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setGrey();
      doc.text(b, lx + 5.5, y);
      lx += 5.5 + doc.getTextWidth(b) + 5;
    }
    y += 4.5;
    para('How to use the heatmap: scan for clusters, then read the specific behaviour behind each score. Colour is always redundant with a written band label and number. Every indicator is the evaluator\u2019s 1–5 rubric rating rescaled to 0–100.', 7.5, C.grey);
  }

  // Page 1 ends here — the sample's layout is explicit about it.
  footer();
  doc.addPage();
  y = M + 2;

  /* ══════════════════════════════ PAGE 2 ══════════════════════════════ */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setGold();
  doc.text('PROFILE INTERPRETATION & DEVELOPMENT', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setGrey();
  doc.text('FROM SCORES TO OBSERVABLE BEHAVIOURS', M, y + 4);
  y += 10;

  // ── What this pattern could mean at work ────────────────────────────────
  if (best && worst) {
    kicker('What this pattern could mean at work');
    rule(true);
    const edgeWords = worstBand?.label ? ' currently sits in the ' + worstBand.label.toLowerCase() + ' band' : ' is the development edge';
    para(
      'Real interpretation based on this session\u2019s completed ratings. In the room, the candidate '
      + 'demonstrated strongest evidence on ' + best.dim.label.toLowerCase() + ' (' + (bestBand?.label.toLowerCase() || '') + '), while '
      + worst.dim.label.toLowerCase() + edgeWords + '. Development effort converts most quickly where signals were '
      + 'concrete, so the priorities and 90-day conversation below are anchored on '
      + worst.dim.label.toLowerCase() + '. Treat every interpretation as a prompt for conversation, not a verdict.',
      9, C.ink,
    );
  }

  // ── Work-style archetype / career alignment (sample: The Integrator) ─────
  const career = session.careerProfile;
  if (career?.label) {
    ensure(30);
    kicker('Work-style & career alignment');
    rule(true);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    setInk();
    doc.text(career.label, M, y + 2);
    y += 7;
    if (session.skillShape && SHAPE_LABELS[session.skillShape]) {
      para('Shape: ' + SHAPE_LABELS[session.skillShape], 8.5, C.grey);
    }
    if (career.condition) para('Signal: ' + career.condition + '.', 9, C.ink);
    if (career.desc) para(career.desc, 9, C.grey);
  }

  // ── Likely working pattern (at best / when stretched / interview prompt) ─
  if (best && worst) {
    ensure(50);
    kicker('Likely working pattern');
    rule(true);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setInk();
    doc.text('At their best:', M, y);
    y += 4.5;
    para(best.dim.descriptors?.[Math.round(best.score) >= 4 ? 4 : Math.max(2, Math.round(best.score))] || '', 9, C.grey);
    y += 1;
    doc.setFont('helvetica', 'bold');
    setInk();
    doc.text('When stretched:', M, y);
    y += 4.5;
    para(worst.dim.descriptors?.[Math.max(2, Math.round(worst.score))] || '', 9, C.grey);
    y += 1;
    if (promptText) {
      doc.setFont('helvetica', 'bold');
      setInk();
      doc.text('Interview prompt:', M, y);
      y += 4.5;
      para('\u201C' + promptText + '\u201D', 9, C.gold, 'italic');
    }
  }

  // ── Role lens (sample: Role lens · Business Analyst) ─────────────────────
  if (session.role || career) {
    ensure(30);
    kicker('Role lens' + (session.role ? ' · ' + session.role : ''));
    rule(true);
    const roleBits = [];
    if (best) roleBits.push(best.dim.label + ' reads as a relative asset');
    if (worst) roleBits.push('also test ' + worst.dim.label.toLowerCase() + ' against ambiguous requirements, rapid feedback and unfamiliar tools');
    para(
      (session.role ? 'For this specific role, the interview pattern offers a plausible foundation: ' : 'In the room, ')
      + roleBits.join(', while the pattern suggests the debrief should ')
      + '. This is not a validated role-match percentage; fit should be weighed against the employer\u2019s configured competency weights and the complete assessment data.',
      9, C.grey,
    );
  }

  // ── Assessment-guided development priority (Page-7 generator provenance) ─
  if (session.flaggedPillars?.length >= 2) {
    ensure(8);
    para('Assessment-guided development priority (Page 7 Guide): ' + session.flaggedPillars.join(' · '), 8, C.grey);
  }

  // ── Development priorities — visual ranking (sample) ─────────────────────
  if (ranked.length > 0) {
    ensure(ranked.length * 7 + 18);
    kicker('Development priorities · visual ranking');
    rule(true);
    // Show the full ranking lowest-first, as the sample anchors on the edge.
    const shown = ranked.slice().reverse();
    for (const x of shown) {
      const band = interviewBand(x.score);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      setInk();
      doc.text(x.dim.label, M, y);
      doc.setFillColor(...C.tint);
      doc.rect(M + 62, y - 3, 56, 3, 'F');
      doc.setFillColor(...(BAND_COLORS[band?.label] || C.primary));
      doc.rect(M + 62, y - 3, Math.max(1.5, to100(x.score) / 100 * 56), 3, 'F');
      doc.setFont('helvetica', 'normal');
      setGrey();
      doc.text(String(Math.round(to100(x.score))), M + 62 + 56 + 5, y, { align: 'right' });
      y += 7;
    }
    y += 1;
    para('A lower score indicates a development conversation — not a risk label. Scale: 0–100.', 7.5, C.grey);
  }

  // ── 90-day development conversation (sample page-2 stages) ───────────────
  if (library) {
    ensure(52);
    kicker('90-day development conversation');
    rule(true);
    para('One measurable action per stage, from the QiDS development library, anchored on ' + worst.dim.label.toLowerCase() + ':', 8.5, C.grey);
    y += 2;
    const stage = (label, body) => {
      ensure(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setGold();
      doc.text(label, M, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setGrey();
      const lines = doc.splitTextToSize(body, W);
      let yy = y + 5;
      for (const line of lines) {
        ensure(5);
        doc.text(line, M + 4, yy);
        yy += 4;
      }
      y = yy + 2;
    };
    stage('DAYS 1–30 · BUILD', library.day30);
    stage('DAYS 31–90 · STRETCH', library.day90);
    stage('BY DAY 180 · APPLY', library.day180);
  } else if (worst) {
    para('Development library: no sourced entry for ' + worst.dim.label + ' — flag for the content pipeline rather than inventing one here.', 7.5, C.grey);
  }

  // ── Foundation line: what evidence this profile rests on (honest, replaces
  //    the sample's "fictional placeholders" disclaimer with the real state).
  ensure(16);
  y += 2;
  rule(true);
  para(
    'Interpretation note. Every score, band and narrative on these pages derives from one structured interview session with this candidate — not from norm-referenced psychometrics. Real hiring decisions pair this profile with the candidate\u2019s QiDS assessment data (60% assessment / 40% interview default weight), role evidence and their own context. Visual conventions follow the DataViz project guidance: radar as a broad profile shape, heatmap bands always redundant with written labels.',
    7.5, C.grey,
  );

  /* ════════════════════ PAGE 3+ — DECISION AUDIT TRAIL ═════════════════ */
  const responses = (session.liveResponses || []).filter(r =>
    (r.response && r.response.trim()) || r.score != null || r.questionText);
  if (responses.length > 0) {
    footer();
    doc.addPage();
    y = M + 2;
    kicker('Decision audit trail — session record');
    rule(true);
    para('Appendix B: all scores, timestamped notes and Covered/Strong/Weak ratings stored per session, retained for the 24-month compliance and bias-audit window.', 7.5, C.grey);
    y += 2;
    // Per-dimension evaluator anchors (the merged interview record's verbatim
    // judgement), so the audit trail carries the reasoning, not just the marks.
    (session.evaluatorAssessment || []).forEach(ev => {
      if (!ev?.notes) return;
      ensure(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setGrey();
      doc.text((RUBRIC_MAP?.[ev.dimensionId]?.label || ev.dimensionId || '') + ' — anchor', M, y);
      y += 4.5;
      para('\u201C' + ev.notes + '\u201D', 9, C.ink, 'italic');
    });
    responses.forEach((r, i) => {
      const dimLabel = RUBRIC_MAP?.[r.dimension]?.label || r.dimension || '';
      let timeLabel = null;
      if (r.answeredAt) {
        const d = /^\d+$/.test(r.answeredAt) ? new Date(Number(r.answeredAt)) : new Date(r.answeredAt);
        if (Number.isFinite(d?.getTime())) {
          timeLabel = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      }
      const mark = session.guideMarks?.[r.questionId];
      const headLine = 'Q' + String(i + 1).padStart(2, '0')
        + (dimLabel ? ' · ' + dimLabel : '')
        + (timeLabel ? ' · ' + timeLabel : '')
        + (mark ? ' · marked ' + mark.toUpperCase() : '')
        + (r.score != null ? '   ' + r.score + '/5' : '');
      ensure(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setGrey();
      doc.text(headLine, M, y);
      y += 4.5;
      if (r.questionText) para(r.questionText, 9, C.ink, 'bold');
      if (r.response && r.response.trim()) para('\u201C' + r.response.trim() + '\u201D', 9, C.grey, 'italic');
      y += 2;
      doc.setDrawColor(...C.hairline);
      doc.setLineWidth(0.1);
      doc.line(M, y, PAGE_W - M, y);
      y += 4;
    });
  }

  // Closing line — merge provenance, same as the sample's footer scope note.
  ensure(10);

  footer();
  const attempt = (session.sessionNumber || 1) > 1 ? '-Attempt-' + session.sessionNumber : '';
  const name = (session.candidateName || 'candidate').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'candidate';
  doc.save('QiDS-Profile-' + name + attempt + '.pdf');
}
