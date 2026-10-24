// ─── Answer sheet → raw section scores ───────────────────────────────────────
// The browser and the server both score from *item-level answers* here. This is
// the module that makes "server-verified" mean something: the client sends what
// the person chose, never the totals those choices produced.
//
// Round-tripping rule: for any answer sheet X, deriveRawScores(X) must equal
// what the assessment UI shows. Both call this function, so they cannot drift.
//
// Provenance is derived at the same time. Not every mark is equally checkable:
//   machine       auto-scored against the instrument's key (MCQ items, CSI)
//   selfReport    the person's own Likert rating — checkable, not verified
//   assessor      a human rubric score — a third party's claim
//   clientGraded  AI-generated items graded in the tab (IQ bonus only)
// The credential reports these shares instead of implying everything is equal.
//
// The instrument data carries no imports, so this module stays loadable by Node
// (the API) and by Vite (the app) without a build step.

import { IQ_QUESTIONS, EQ_QUESTIONS, SQ_QUESTIONS, AQ_QUESTIONS } from '../../src/data/qidsData.js';
import { mapAQLikert } from './qids.js';

export const IQ_SECTIONS = /** @type {const} */ (['verbal', 'quantitative', 'psychometric', 'performance']);
export const EQ_COMPONENTS = /** @type {const} */ (['SA', 'ER', 'SM', 'E', 'IS']);
export const EQ_ACTIVITY_ID = { SA: 'B1', ER: 'B2', SM: 'B3', E: 'B4', IS: 'B5' };
export const AQ_COMPONENTS = /** @type {const} */ (['SA', 'PM', 'RR', 'RC']);

const MAX_AI_BONUS = 16;
const MAX_VISUAL_BONUS = 9;

/** @param {unknown} v @param {number} min @param {number} max */
function intIn(v, min, max) {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return i >= min && i <= max ? i : null;
}

/** Marks a human rubric awarded for one criterion, clamped to the criterion. */
function rubricMarks(sheet, criterion, max) {
  const v = sheet?.[criterion];
  const i = intIn(v, 0, max);
  return i ?? 0;
}

function emptyProvenance() {
  return {
    machine: 0,
    selfReport: 0,
    assessor: 0,
    clientGraded: 0,
  };
}

// ─── IQ ──────────────────────────────────────────────────────────────────────

/**
 * One IQ section (25 marks). MCQ items are checked against the key; open items
 * with a key are matched case-insensitively; open items without a key are
 * effort marks — the instrument's rule, unchanged from the paper form.
 */
function scoreIQSection(sectionId, sectionAnswers) {
  const spec = IQ_QUESTIONS[sectionId];
  if (!spec) return { total: 0, answered: 0, expected: 0, machine: 0 };
  const sheet = sectionAnswers || {};
  let total = 0;
  let answered = 0;
  let expected = 0;

  spec.sections.forEach((section, si) => {
    section.questions.forEach((q, qi) => {
      expected += 1;
      const idx = si * 5 + qi;
      const val = sheet[idx];
      const qType = section.type === 'mixed' ? q.type || 'open' : section.type;

      if (qType === 'mcq') {
        if (val === undefined || val === null || val === '') return;
        answered += 1;
        if (val === q.answer) total += 1;
        return;
      }

      if (typeof val !== 'string' || !val.trim()) return;
      answered += 1;
      if (q.answer !== undefined) {
        if (val.trim().toLowerCase() === String(q.answer).toLowerCase()) total += 1;
      } else {
        total += 1; // effort mark — no key exists for this item
      }
    });
  });

  const capped = Math.min(total, spec.maxScore ?? 25);
  return { total: capped, answered, expected, machine: capped };
}

/**
 * The IQ bonus comes from AI-generated items whose key only ever exists in the
 * tab, so it cannot be re-derived here. The client reports counts per section
 * and each section's contribution is capped here — the shape mirrors the
 * instrument (2 marks per correct/attempted item, 4 per section).
 */
function scoreIQBonus(agentGraded) {
  const perSection = (group, sections) =>
    sections.reduce((sum, sec) => {
      const n = intIn(group?.[sec], 0, 4) ?? 0;
      return sum + Math.min(n * 2, 4);
    }, 0);

  const aiBonus = Math.min(
    perSection(agentGraded?.mcq, ['quantitative', 'psychometric']) +
    perSection(agentGraded?.open, ['verbal', 'performance']),
    MAX_AI_BONUS,
  );
  const visualCorrect = intIn(agentGraded?.visualCorrect, 0, 9) ?? 0;
  return { aiBonus, visualBonus: Math.min(visualCorrect, MAX_VISUAL_BONUS) };
}

// ─── EQ ──────────────────────────────────────────────────────────────────────

function scoreEQComponent(comp, eqAnswers, ageGroup) {
  const partA = eqAnswers?.partA?.[comp] || {};
  const itemCount = (EQ_QUESTIONS.partA?.[comp]?.questions?.[ageGroup] || EQ_QUESTIONS.partA?.[comp]?.questions?.['11-18'] || []).length || 5;

  let likertRaw = 0;
  let likertAnswered = 0;
  for (let i = 0; i < itemCount; i += 1) {
    const v = intIn(partA[i], 0, 4);
    if (v === null) continue;
    likertRaw += v;
    likertAnswered += 1;
  }
  // Instrument rule: Likert total (max 20) is stretched onto 0–5.
  const partANorm = Math.round((likertRaw / 25) * 5);

  const actId = EQ_ACTIVITY_ID[comp];
  // partB is a plain array of activities, keyed in the answer sheet by id.
  const activity = (EQ_QUESTIONS.partB || []).find(a => a.id === actId);
  const partB = eqAnswers?.partB?.[actId] || {};
  let rubricTotal = 0;
  let rubricAnswered = 0;
  for (const criterion of activity?.rubric || []) {
    if (partB[criterion.criterion] === undefined) continue;
    rubricAnswered += 1;
    rubricTotal += rubricMarks(partB, criterion.criterion, criterion.marks);
  }

  // Cap is the component maximum (0–10), not the activity's own 5 marks.
  const raw = Math.min(partANorm + rubricTotal, 10);
  return {
    raw,
    provenance: { selfReport: partANorm, assessor: raw - partANorm },
    answered: likertAnswered + rubricAnswered,
    expected: itemCount + (activity?.rubric?.length || 0),
  };
}

// ─── SQ ──────────────────────────────────────────────────────────────────────

function scoreSQ(sqAnswers) {
  const ace = sqAnswers?.ACE || {};
  let aceTotal = 0;
  let aceAnswered = 0;
  let aceExpected = 0;
  for (const ex of SQ_QUESTIONS.component1_ACE.exercises) {
    const sheet = ace[ex.id] || {};
    for (const criterion of ex.rubric) {
      aceExpected += 1;
      if (sheet[criterion.criterion] === undefined) continue;
      aceAnswered += 1;
      aceTotal += rubricMarks(sheet, criterion.criterion, criterion.marks);
    }
  }

  const csi = sqAnswers?.CSI || {};
  let csiTotal = 0;
  let csiAnswered = 0;
  const csiQuestions = SQ_QUESTIONS.component2_CSI.questions;
  for (const q of csiQuestions) {
    const sel = intIn(csi[q.id], 0, q.options.length - 1);
    if (sel === null) continue;
    csiAnswered += 1;
    // Marks come from the instrument's own option, never from the client.
    csiTotal += q.options[sel]?.marks || 0;
  }

  const selected = Array.isArray(sqAnswers?.selectedPBAs) ? sqAnswers.selectedPBAs.slice(0, 2) : [];
  const pba = sqAnswers?.PBA || {};
  let pbaTotal = 0;
  let pbaAnswered = 0;
  let pbaExpected = 0;
  for (const pbaId of selected) {
    const activity = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === pbaId);
    if (!activity) continue;
    const sheet = pba[pbaId] || {};
    for (const criterion of activity.rubric) {
      pbaExpected += 1;
      if (sheet[criterion.criterion] === undefined) continue;
      pbaAnswered += 1;
      pbaTotal += rubricMarks(sheet, criterion.criterion, criterion.marks);
    }
  }

  // Instrument maxima: ACE 20, CSI 10, PBA 20 (two activities of 10). The caps
  // only bind on a pathological sheet — the UI cannot exceed them.
  const cappedAce = Math.min(aceTotal, 20);
  const cappedCsi = Math.min(csiTotal, 10);
  const cappedPba = Math.min(pbaTotal, 20);

  const provenance = { machine: cappedCsi, assessor: cappedAce + cappedPba };
  return {
    raw: { ACE: cappedAce, CSI: cappedCsi, PBA: cappedPba },
    provenance,
    answered: aceAnswered + csiAnswered + pbaAnswered,
    expected: aceExpected + csiQuestions.length + pbaExpected,
  };
}

// ─── AQ ──────────────────────────────────────────────────────────────────────

function scoreAQComponent(comp, compAnswers, ageGroup) {
  const spec = AQ_QUESTIONS.components[comp];
  const itemCount = (spec?.questions?.[ageGroup] || spec?.questions?.['11-18'] || []).length || 4;

  const partA = compAnswers?.partA || {};
  let likertMarks = 0;
  let likertAnswered = 0;
  for (let i = 0; i < itemCount; i += 1) {
    const v = intIn(partA[i], 0, 4);
    if (v === null) continue;
    likertAnswered += 1;
    likertMarks += mapAQLikert(v);
  }

  const partB = compAnswers?.partB || {};
  let rubricMarksAwarded = 0;
  let rubricAnswered = 0;
  for (const criterion of spec?.activity?.rubric || []) {
    if (partB[criterion.criterion] === undefined) continue;
    rubricAnswered += 1;
    rubricMarksAwarded += rubricMarks(partB, criterion.criterion, criterion.marks);
  }

  const raw = Math.min(likertMarks + rubricMarksAwarded, 19);
  return {
    raw,
    provenance: { selfReport: likertMarks, assessor: raw - likertMarks },
    answered: likertAnswered + rubricAnswered,
    expected: itemCount + (spec?.activity?.rubric?.length || 0),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Derive the raw section score sheet from item-level answers.
 *
 * @param {{
 *   IQ?: Record<string, any>,
 *   EQ?: Record<string, any>,
 *   SQ?: Record<string, any>,
 *   AQ?: Record<string, any>,
 * }} answers
 * @param {{ ageGroup?: string }} [options]
 * @returns {{
 *   rawScores: Record<string, any>,
 *   provenance: { machine: number, selfReport: number, assessor: number, clientGraded: number },
 *   shares: { machine: number, selfReport: number, assessor: number, clientGraded: number },
 *   completeness: { IQ: number, EQ: number, SQ: number, AQ: number },
 *   answered: { answered: number, expected: number },
 * }}
 */
export function deriveRawScores(answers, options = {}) {
  const sheet = answers && typeof answers === 'object' ? answers : {};
  const ageGroup = options.ageGroup === '19-32' ? '19-32' : '11-18';

  // IQ
  let iqAnswered = 0;
  let iqExpected = 0;
  let iqMachine = 0;
  const iqRaw = {};
  for (const sectionId of IQ_SECTIONS) {
    const scored = scoreIQSection(sectionId, sheet.IQ?.[sectionId]);
    iqRaw[sectionId] = scored.total;
    iqAnswered += scored.answered;
    iqExpected += scored.expected;
    iqMachine += scored.machine;
  }
  const bonus = scoreIQBonus(sheet.IQ?.agentGraded);
  iqRaw._aiBonus = bonus.aiBonus;
  iqRaw._visualBonus = bonus.visualBonus;

  // EQ
  let eqAnswered = 0;
  let eqExpected = 0;
  let eqSelf = 0;
  let eqAssessor = 0;
  const eqRaw = {};
  for (const comp of EQ_COMPONENTS) {
    const scored = scoreEQComponent(comp, sheet.EQ, ageGroup);
    eqRaw[comp] = scored.raw;
    eqAnswered += scored.answered;
    eqExpected += scored.expected;
    eqSelf += scored.provenance.selfReport;
    eqAssessor += scored.provenance.assessor;
  }

  // SQ
  const sq = scoreSQ(sheet.SQ);

  // AQ
  let aqAnswered = 0;
  let aqExpected = 0;
  let aqSelf = 0;
  let aqAssessor = 0;
  const aqRaw = {};
  for (const comp of AQ_COMPONENTS) {
    const scored = scoreAQComponent(comp, sheet.AQ?.[comp], ageGroup);
    aqRaw[comp] = scored.raw;
    aqAnswered += scored.answered;
    aqExpected += scored.expected;
    aqSelf += scored.provenance.selfReport;
    aqAssessor += scored.provenance.assessor;
  }

  const provenance = {
    ...emptyProvenance(),
    machine: iqMachine + sq.provenance.machine,
    selfReport: eqSelf + aqSelf,
    assessor: eqAssessor + sq.provenance.assessor + aqAssessor,
    clientGraded: bonus.aiBonus + bonus.visualBonus,
  };

  const total = provenance.machine + provenance.selfReport + provenance.assessor + provenance.clientGraded;
  const pct = n => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  const answered = {
    answered: iqAnswered + eqAnswered + sq.answered + aqAnswered,
    expected: iqExpected + eqExpected + sq.expected + aqExpected,
  };

  return {
    rawScores: { IQ: iqRaw, EQ: eqRaw, SQ: sq.raw, AQ: aqRaw },
    provenance,
    shares: {
      machine: pct(provenance.machine),
      selfReport: pct(provenance.selfReport),
      assessor: pct(provenance.assessor),
      clientGraded: pct(provenance.clientGraded),
    },
    completeness: {
      IQ: ratio(iqAnswered, iqExpected),
      EQ: ratio(eqAnswered, eqExpected),
      SQ: ratio(sq.answered, sq.expected),
      AQ: ratio(aqAnswered, aqExpected),
    },
    answered,
  };
}

function ratio(answered, expected) {
  if (!expected) return 0;
  return Math.round((answered / expected) * 1000) / 1000;
}

/**
 * The IQ bonus counts the AI-generated items the client graded itself. It is
 * reported separately so a verifier can see the score is not wholly derived
 * from the static instrument.
 * @param {{ clientGraded: number }} provenance
 */
export function agentGradedPoints(provenance) {
  return provenance?.clientGraded ?? 0;
}
