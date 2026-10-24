// ─── Reliability ────────────────────────────────────────────────────────────
// Internal consistency for a scale, computed from stored answers rather than
// asserted in a brochure.
//
// Cronbach's alpha:  α = (k / (k − 1)) × (1 − Σσ²ᵢ / σ²ₜ)
//   k   number of items
//   σ²ᵢ variance of item i across respondents
//   σ²ₜ variance of each respondent's total
//
// Listwise deletion by default: a respondent with any missing item is dropped,
// because partial rows bias alpha unpredictably in both directions.
//
// The instrument's own item structure lives in shared/scoring/answers.js; this
// module only knows about numbers.

import { IQ_QUESTIONS, EQ_QUESTIONS, AQ_QUESTIONS, SQ_QUESTIONS } from '../../src/data/qidsData.js';
import { mapAQLikert } from './qids.js';

/** @param {number[]} values */
function variance(values) {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
}

/**
 * @param {number[][]} rows respondents × items
 * @returns {number | null} alpha, or null when the data cannot support it
 */
export function cronbachAlpha(rows) {
  if (!Array.isArray(rows) || rows.length < 3) return null;
  const width = rows[0].length;
  if (!width || width < 2) return null;
  if (rows.some(r => r.length !== width)) return null;

  const itemVariances = [];
  for (let j = 0; j < width; j += 1) {
    itemVariances.push(variance(rows.map(r => r[j])));
  }
  const totals = rows.map(r => r.reduce((a, b) => a + b, 0));
  const totalVariance = variance(totals);
  if (totalVariance === 0) return null;

  const k = width;
  return (k / (k - 1)) * (1 - itemVariances.reduce((a, b) => a + b, 0) / totalVariance);
}

/**
 * Build one item matrix row per answer sheet, for a single pillar.
 * Items that are not answered leave the row out entirely (listwise).
 *
 * @param {object[]} sheets answer sheets ({IQ, EQ, SQ, AQ})
 * @param {'IQ'|'EQ'|'SQ'|'AQ'} pillar
 * @returns {{ rows: number[][], items: number }}
 */
export function itemMatrix(sheets, pillar) {
  const rows = [];

  if (pillar === 'IQ') {
    // 0/1 per item: correct answers only. Open items without a key are scored
    // for a genuine attempt, matching the instrument.
    let itemCount = 0;
    for (const spec of Object.values(IQ_QUESTIONS)) {
      for (const section of spec.sections) itemCount += section.questions.length;
    }

    for (const sheet of sheets) {
      const answers = sheet?.IQ || {};
      const row = [];
      let complete = true;
      for (const [sectionId, spec] of Object.entries(IQ_QUESTIONS)) {
        spec.sections.forEach((section, si) => {
          section.questions.forEach((q, qi) => {
            const val = answers[sectionId]?.[si * 5 + qi];
            const qType = section.type === 'mixed' ? q.type || 'open' : section.type;
            if (val === undefined || val === null || val === '') { complete = false; return; }
            if (qType === 'mcq') row.push(val === q.answer ? 1 : 0);
            else if (q.answer === undefined) row.push(1);
            else row.push(val.trim().toLowerCase() === String(q.answer).toLowerCase() ? 1 : 0);
          });
        });
      }
      if (complete && row.length === itemCount) rows.push(row);
    }
    return { rows, items: itemCount };
  }

  if (pillar === 'EQ' || pillar === 'AQ') {
    // Likert item ratings, one column per item across the five / four components.
    const comps = pillar === 'EQ' ? Object.keys(EQ_QUESTIONS.partA) : Object.keys(AQ_QUESTIONS.components);
    const expected = comps.reduce((sum, comp) => {
      const spec = pillar === 'EQ' ? EQ_QUESTIONS.partA[comp] : AQ_QUESTIONS.components[comp];
      const list = pillar === 'EQ' ? spec.questions['11-18'] : spec.questions['11-18'];
      return sum + list.length;
    }, 0);

    for (const sheet of sheets) {
      const row = [];
      let complete = true;
      for (const comp of comps) {
        const spec = pillar === 'EQ' ? EQ_QUESTIONS.partA[comp] : AQ_QUESTIONS.components[comp];
        const list = spec.questions['11-18'];
        const answers = sheet?.[pillar]?.partA?.[comp] || {};
        for (let i = 0; i < list.length; i += 1) {
          const v = answers[i];
          if (typeof v !== 'number' || v < 0 || v > 4) { complete = false; break; }
          row.push(pillar === 'AQ' ? mapAQLikert(v) : v);
        }
        if (!complete) break;
      }
      if (complete && row.length === expected) rows.push(row);
    }
    return { rows, items: expected };
  }

  // SQ is a mixed scale (rubric + multiple choice); alpha over heterogeneous
  // item types is not meaningful, so it is not estimated.
  void SQ_QUESTIONS;
  return { rows: [], items: 0 };
}

/**
 * Alpha for every pillar that supports it, with the sample size it rests on.
 * @param {object[]} sheets
 */
export function reliabilityReport(sheets) {
  const out = {};
  for (const pillar of ['IQ', 'EQ', 'AQ']) {
    const { rows, items } = itemMatrix(sheets, pillar);
    out[pillar] = { n: rows.length, items, alpha: cronbachAlpha(rows) };
  }
  return out;
}
