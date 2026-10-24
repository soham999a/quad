// ─── Answer-sheet parity ────────────────────────────────────────────────────
// The assessment UI used to derive section totals with its own inline maths
// (Assessment.jsx, pre-1.1). Those numbers are the product's history: any drift
// silently re-scores everyone.
//
// This test reimplements that legacy maths verbatim and compares it with
// shared/scoring/answers.js across randomised but realistic answer sheets. A
// difference here means a live user's score would change.
//
//   npm run test:parity

import { deriveRawScores } from '../shared/scoring/answers.js';
import { IQ_QUESTIONS, EQ_QUESTIONS, SQ_QUESTIONS, AQ_QUESTIONS, mapAQLikert } from '../src/data/qidsData.js';

const EQ_COMPS = ['SA', 'ER', 'SM', 'E', 'IS'];
const AQ_COMPS = ['SA', 'PM', 'RR', 'RC'];

// ── The legacy implementation, copied from Assessment.jsx before the change ──
function legacyBuildRawScores(iqScores, eqScores, sqScores, aqScores) {
  const iqRaw = {};
  ['verbal', 'quantitative', 'psychometric', 'performance'].forEach(sec => {
    const secScores = iqScores[sec] || {};
    const secData = IQ_QUESTIONS[sec];
    let total = 0;
    secData.sections.forEach((section, si) => {
      section.questions.forEach((q, qi) => {
        const globalIdx = si * 5 + qi;
        const val = secScores[globalIdx];
        const qType = section.type === 'mixed' ? q.type || 'open' : section.type;
        if (qType === 'mcq' && val === q.answer) total += 1;
        else if (qType === 'open' && val && val.trim()) {
          if (q.answer !== undefined) {
            if (String(val).trim().toLowerCase() === String(q.answer).toLowerCase()) total += 1;
          } else {
            total += 1;
          }
        }
      });
    });
    iqRaw[sec] = Math.min(total, 25);
  });

  let aiBonus = 0;
  ['quantitative', 'psychometric'].forEach(sec => {
    const n = iqScores.agentGraded?.mcq?.[sec] || 0;
    aiBonus += Math.min(n * 2, 4);
  });
  ['verbal', 'performance'].forEach(sec => {
    const n = iqScores.agentGraded?.open?.[sec] || 0;
    aiBonus += Math.min(n * 2, 4);
  });
  iqRaw._aiBonus = Math.min(aiBonus, 16);
  iqRaw._visualBonus = Math.min(iqScores.agentGraded?.visualCorrect || 0, 9);

  const eqRaw = {};
  EQ_COMPS.forEach(comp => {
    const partAScores = eqScores.partA?.[comp] || {};
    const partARaw = Object.values(partAScores).reduce((s, v) => s + (v || 0), 0);
    const partANorm = Math.round(partARaw / 25 * 5);
    const actId = `B${EQ_COMPS.indexOf(comp) + 1}`;
    const partBScores = eqScores.partB?.[actId] || {};
    const partBTotal = Object.values(partBScores).reduce((s, v) => s + (v || 0), 0);
    eqRaw[comp] = Math.min(partANorm + partBTotal, 10);
  });

  const aceTotal = SQ_QUESTIONS.component1_ACE.exercises.reduce((sum, ex) => {
    const exS = sqScores.ACE?.[ex.id] || {};
    return sum + ex.rubric.reduce((s, r) => s + (exS[r.criterion] || 0), 0);
  }, 0);
  const csiTotal = SQ_QUESTIONS.component2_CSI.questions.reduce((sum, q) => {
    const sel = sqScores.CSI?.[q.id];
    return sum + (sel !== undefined ? q.options[sel]?.marks || 0 : 0);
  }, 0);
  const pbaTotal = (sqScores.selectedPBAs || []).reduce((sum, pbaId) => {
    const act = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === pbaId);
    if (!act) return sum;
    const pbaS = sqScores.PBA?.[pbaId] || {};
    return sum + act.rubric.reduce((s, r) => s + (pbaS[r.criterion] || 0), 0);
  }, 0);

  const aqRaw = {};
  AQ_COMPS.forEach(comp => {
    const partAScores = aqScores[comp]?.partA || {};
    const partAMarks = Object.values(partAScores).reduce((s, v) => s + mapAQLikert(v || 0), 0);
    const partBScores = aqScores[comp]?.partB || {};
    const partBMarks = Object.values(partBScores).reduce((s, v) => s + (v || 0), 0);
    aqRaw[comp] = Math.min(partAMarks + partBMarks, 19);
  });

  return { IQ: iqRaw, EQ: eqRaw, SQ: { ACE: aceTotal, CSI: csiTotal, PBA: pbaTotal }, AQ: aqRaw };
}

// ── Deterministic PRNG so a failure is reproducible ─────────────────────────
function mulberry32(seed) {
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSheet(rand) {
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const chance = p => rand() < p;
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

  const IQ = {};
  for (const [sectionId, spec] of Object.entries(IQ_QUESTIONS)) {
    const sheet = {};
    spec.sections.forEach((section, si) => {
      section.questions.forEach((q, qi) => {
        if (!chance(0.75)) return;
        const idx = si * 5 + qi;
        if (section.type === 'mcq') {
          sheet[idx] = chance(0.6) ? q.answer : int(0, q.options.length - 1);
        } else if (q.answer !== undefined) {
          sheet[idx] = chance(0.5) ? String(q.answer).toUpperCase() : 'some attempt';
        } else {
          sheet[idx] = 'an answer';
        }
      });
    });
    IQ[sectionId] = sheet;
  }
  IQ.agentGraded = {
    mcq: { quantitative: int(0, 4), psychometric: int(0, 4) },
    open: { verbal: int(0, 4), performance: int(0, 4) },
    visualCorrect: int(0, 9),
  };

  const EQ = { partA: {}, partB: {} };
  for (const comp of EQ_COMPS) {
    const sheet = {};
    const count = EQ_QUESTIONS.partA[comp].questions['11-18'].length;
    for (let i = 0; i < count; i += 1) if (chance(0.8)) sheet[i] = int(0, 4);
    EQ.partA[comp] = sheet;
  }
  for (const activity of EQ_QUESTIONS.partB) {
    const sheet = {};
    for (const r of activity.rubric) if (chance(0.7)) sheet[r.criterion] = int(0, r.marks);
    EQ.partB[activity.id] = sheet;
  }

  const SQ = { ACE: {}, CSI: {}, PBA: {}, selectedPBAs: [] };
  for (const ex of SQ_QUESTIONS.component1_ACE.exercises) {
    const sheet = {};
    for (const r of ex.rubric) if (chance(0.7)) sheet[r.criterion] = int(0, r.marks);
    SQ.ACE[ex.id] = sheet;
  }
  for (const q of SQ_QUESTIONS.component2_CSI.questions) {
    if (chance(0.8)) SQ.CSI[q.id] = int(0, q.options.length - 1);
  }
  const activityIds = SQ_QUESTIONS.component3_PBA.activities.map(a => a.id);
  SQ.selectedPBAs = [pick(activityIds)];
  const second = pick(activityIds.filter(id => id !== SQ.selectedPBAs[0]));
  SQ.selectedPBAs.push(second);
  for (const id of SQ.selectedPBAs) {
    const activity = SQ_QUESTIONS.component3_PBA.activities.find(a => a.id === id);
    const sheet = {};
    for (const r of activity.rubric) if (chance(0.7)) sheet[r.criterion] = int(0, r.marks);
    SQ.PBA[id] = sheet;
  }

  const AQ = {};
  for (const comp of AQ_COMPS) {
    const spec = AQ_QUESTIONS.components[comp];
    const partA = {};
    spec.questions['11-18'].forEach((_, i) => { if (chance(0.85)) partA[i] = int(0, 4); });
    const partB = {};
    for (const r of spec.activity.rubric) if (chance(0.7)) partB[r.criterion] = int(0, r.marks);
    AQ[comp] = { partA, partB };
  }

  return { IQ, EQ, SQ, AQ };
}

// ── Compare ─────────────────────────────────────────────────────────────────
const ITERATIONS = 400;
let compared = 0;
let mismatched = 0;
const samples = [];

for (let seed = 1; seed <= ITERATIONS; seed += 1) {
  const sheet = makeSheet(mulberry32(seed));
  const legacy = legacyBuildRawScores(sheet.IQ, sheet.EQ, sheet.SQ, sheet.AQ);
  const shared = deriveRawScores(sheet, { ageGroup: '11-18' }).rawScores;

  for (const pillar of ['IQ', 'EQ', 'SQ', 'AQ']) {
    for (const key of new Set([...Object.keys(legacy[pillar]), ...Object.keys(shared[pillar])])) {
      compared += 1;
      const a = legacy[pillar][key] ?? 0;
      const b = shared[pillar][key] ?? 0;
      if (Math.abs(a - b) > 1e-9) {
        mismatched += 1;
        if (samples.length < 8) samples.push(`seed ${seed} · ${pillar}.${key}: legacy ${a} vs shared ${b}`);
      }
    }
  }
}

console.log(`\nAnswer-sheet parity — ${ITERATIONS} randomised sheets, ${compared} values compared`);
if (mismatched) {
  console.log(`\n${mismatched} mismatched values:`);
  for (const s of samples) console.log(`  - ${s}`);
  process.exit(1);
}
console.log('0 mismatched values');
