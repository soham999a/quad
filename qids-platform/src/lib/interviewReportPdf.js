/**
 * interviewReportPdf — the one-click download behind the interview report's
 * Download button.
 *
 * The old button called window.print(), which only opens the browser's print
 * dialog — the user had to fiddle with "Save as PDF" themselves. This draws a
 * real, self-contained PDF document directly (jsPDF, dynamically imported so
 * the report route doesn't pay the bundle cost until someone downloads).
 *
 * Content is the spec content, not a screenshot of the dark screen: the
 * Section 14 band vocabulary with plain-language descriptors, the Appendix B
 * strengths / develop-next panel, pillar scores, career profile, and the full
 * decision-audit transcript. Ink-on-paper styling — it reads like the PDF
 * spec's own report layer.
 */

import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../core/data/interviewRubrics';
import { interviewBand } from '../core/engine/interviewScoring';
import { PILLARS } from '../data/qidsData';

const PILLAR_LIST = ['IQ', 'EQ', 'SQ', 'AQ'].map(id => PILLARS[id]).filter(Boolean);

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
    doc.text('QIDS Assessment Division — Interview Intelligence · ' + today, M, PAGE_H - 10);
    doc.text('Page ' + pages, PAGE_W - M, PAGE_H - 10, { align: 'right' });
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

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setGold();
  doc.text('QIDS — INTERVIEW INTELLIGENCE REPORT', M, y);
  doc.setFont('helvetica', 'normal');
  setGrey();
  doc.setFontSize(7.5);
  doc.text('Generated ' + today, PAGE_W - M, y, { align: 'right' });
  y += 3;
  rule();

  // ── Hero ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  setInk();
  doc.text(session.candidateName || 'Candidate', M, y + 8);
  y += 14;

  const metaBits = [
    session.mode === 'live' ? 'Live interview' : 'Post-interview',
    'Scored by ' + (session.evaluatorName || 'evaluator'),
  ];
  if ((session.sessionNumber || 1) > 1) metaBits.push('Re-interview · Attempt #' + session.sessionNumber);
  let delta = null;
  if (previous?.unifiedScore != null && session.unifiedScore != null) {
    delta = Math.round(session.unifiedScore) - Math.round(previous.unifiedScore);
    metaBits.push((delta >= 0 ? '+' : '') + delta + ' vs attempt #' + (previous.sessionNumber || 1));
  }
  para(metaBits.filter(Boolean).join('  ·  '), 9.5, C.grey);

  // Focal score block
  const score = Math.round(session.unifiedScore ?? 0);
  ensure(26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  setInk();
  doc.text(String(score), M, y + 10);
  doc.setFontSize(10);
  doc.text('/ 100', M + 20, y + 10);
  const gradeColor = GRADE_COLORS[session.grade?.grade] || C.primary;
  doc.setFontSize(10);
  doc.setTextColor(...gradeColor);
  doc.text(session.grade?.grade ? 'GRADE ' + session.grade.grade : '', M + 36, y + 10);
  if (session.skillShape && SHAPE_LABELS[session.skillShape]) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setGrey();
    doc.text(SHAPE_LABELS[session.skillShape], M + 62, y + 10);
  }
  // Score bar
  y += 14;
  doc.setFillColor(...C.tint);
  doc.rect(M, y, W, 3, 'F');
  doc.setFillColor(...gradeColor);
  doc.rect(M, y, Math.max(2, score / 100 * W), 3, 'F');
  y += 10;

  // ── Dimension scores ────────────────────────────────────────────────────
  kicker('Dimension scores');
  rule();

  for (const d of RUBRIC_DIMENSIONS) {
    const raw = session.mergedScores?.[d.id] ?? 0;
    const score5 = Number(raw) || 0;
    if (!(score5 > 0)) continue;
    const band = interviewBand(score5);
    const qsCount = (session.liveResponses || []).filter(r => r.dimension === d.id).length;
    const prevDim = previous?.mergedScores?.[d.id];
    const deltaD = prevDim != null ? Math.round((score5 - prevDim) * 10) / 10 : null;

    // Two-column row: name + provenance on the left, numbers on the right.
    const need = 9 + (band ? 5 : 0) + (session.evaluatorAssessment?.length ? 5 : 0);
    ensure(need + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setInk();
    doc.text(d.label, M, y);
    if (qsCount > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setGrey();
      doc.text(qsCount + ' question' + (qsCount > 1 ? 's' : '') + ' probed', M + doc.getTextWidth(d.label) + 3, y);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setInk();
    doc.text(score5.toFixed(1) + ' / 5', PAGE_W - M, y, { align: 'right' });
    if (band) {
      doc.setTextColor(...(BAND_COLORS[band.label] || C.primary));
      doc.setFontSize(8);
      doc.text(band.label.toUpperCase(), PAGE_W - M - 16, y, { align: 'right' });
    }
    if (deltaD != null) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...(deltaD >= 0 ? C.success : C.error));
      doc.text((deltaD >= 0 ? '+' : '') + deltaD.toFixed(1), PAGE_W - M - 36, y, { align: 'right' });
    }
    y += 4.5;
    if (band) {
      para(band.desc, 8, C.grey, 'italic');
    }
    const evNote = (session.evaluatorAssessment || []).find(e => e.dimensionId === d.id)?.notes;
    if (evNote) para('“' + evNote + '”', 8, C.primary, 'italic');
    y += 1.5;
    doc.setDrawColor(...C.hairline);
    doc.setLineWidth(0.1);
    doc.line(M, y, PAGE_W - M, y);
    y += 4;
  }

  // ── Strengths & development focus (Appendix B panel) ────────────────────
  const ranked = RUBRIC_DIMENSIONS
    .map(d => ({ dim: d, score: session.mergedScores?.[d.id] }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (ranked.length > 0) {
    ensure(40);
    kicker('Strengths & development focus');
    rule();
    const strengths = ranked.slice(0, Math.min(3, ranked.length));
    const gaps = ranked.slice().reverse().slice(0, 2).filter(x => !strengths.find(s => s.dim.id === x.dim.id));
    const colW = (W - 8) / 2;
    const listBlock = (title, titleColor, items, x) => {
      const startY = y;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...titleColor);
      doc.text(title.toUpperCase(), x, startY);
      let yy = startY + 6;
      doc.setFontSize(9);
      items.forEach((x_, i) => {
        doc.setFont('helvetica', 'bold');
        setInk();
        doc.text(x_.dim.label, x + 5, yy);
        yy += 4;
        doc.setFont('helvetica', 'normal');
        setGrey();
        doc.setFontSize(8);
        doc.text(x_.score.toFixed(1) + '/5 · ' + (interviewBand(x_.score)?.label || ''), x + 5, yy);
        yy += 6;
        doc.setFontSize(9);
      });
      if (items.length === 0) {
        doc.setFont('helvetica', 'italic');
        setGrey();
        doc.setFontSize(8);
        doc.text('Nothing flagged — every dimension landed in the top half.', x + 5, yy);
      }
      return yy;
    };
    const yEndL = listBlock('Top strengths', C.success, strengths, M);
    const yEndR = listBlock('Develop next', C.gold, gaps, M + colW + 8);
    y = Math.max(yEndL, yEndR) + 2;
  }

  // ── Pillar scores ───────────────────────────────────────────────────────
  if (session.pillarScores) {
    ensure(40);
    kicker('QIDS pillar scores');
    rule();
    for (const p of PILLAR_LIST) {
      const v = session.pillarScores[p.id] || 0;
      ensure(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      setInk();
      doc.text(p.short || p.id, M, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(v) + ' / 100', PAGE_W - M, y, { align: 'right' });
      y += 3.5;
      doc.setFillColor(...C.tint);
      doc.rect(M, y, W, 2.6, 'F');
      doc.setFillColor(...gradeColor);
      doc.rect(M, y, Math.max(1, v / 100 * W), 2.6, 'F');
      y += 8;
    }
  }

  // ── Career profile ──────────────────────────────────────────────────────
  const career = session.careerProfile;
  if (career?.label) {
    ensure(30);
    kicker('Career alignment profile');
    rule();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setInk();
    doc.text(career.label, M, y + 2);
    y += 7;
    if (career.condition) para(career.condition, 8.5, C.grey);
    if (Array.isArray(career.roles) && career.roles.length > 0) {
      para('Recommended paths: ' + career.roles.join(' · '), 9, C.ink);
    }
  }

  // ── Session transcript (decision audit trail) ───────────────────────────
  const responses = (session.liveResponses || []).filter(r =>
    (r.response && r.response.trim()) || r.score != null || r.questionText);
  if (responses.length > 0) {
    ensure(20);
    kicker('Session transcript — decision audit trail');
    rule();
    responses.forEach((r, i) => {
      const dimLabel = RUBRIC_MAP?.[r.dimension]?.label || r.dimension || '';
      const headLine = 'Q' + String(i + 1).padStart(2, '0') + (dimLabel ? ' · ' + dimLabel : '') + (r.score != null ? '   ' + r.score + '/5' : '');
      ensure(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setGrey();
      doc.text(headLine, M, y);
      y += 4.5;
      if (r.questionText) para(r.questionText, 9, C.ink, 'bold');
      if (r.response && r.response.trim()) para('“' + r.response.trim() + '”', 9, C.grey, 'italic');
      y += 2;
      doc.setDrawColor(...C.hairline);
      doc.setLineWidth(0.1);
      doc.line(M, y, PAGE_W - M, y);
      y += 4;
    });
  }

  footer();
  const attempt = (session.sessionNumber || 1) > 1 ? '-Attempt-' + session.sessionNumber : '';
  const name = (session.candidateName || 'candidate').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'candidate';
  doc.save('QIDS-Interview-' + name + attempt + '.pdf');
}
