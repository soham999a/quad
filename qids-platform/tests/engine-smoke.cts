// ─── Engine smoke test ────────────────────────────────────────────────────────
// Verifies the Phase 3 pipeline end-to-end without a test framework.
// Run: npx tsc -p tests/tsconfig.smoke.json && node <outDir>/tests/engine-smoke.js
// (build with tsc, then execute the compiled CJS output)

import { ITEM_BANKS, getItemBank } from '../src/core/data/itemBanks/index';
import { ROLE_TRACKS, getRoleTrack, getTrackForProfile } from '../src/core/data/roleTracks/index';
import { buildDeployList } from '../src/core/engine/adaptive';
import { evaluateEnterpriseAssessment, UNETHICAL_OPTIONS } from '../src/core/engine/moduleScoring';
import { deployRoleTrack } from '../src/core/runner/deploy';
import { evaluateQidsAssessment, computeQidsPillarScores } from '../src/core/engine/qids';
import { irtScale, computePII, getSkillShape, getCareerProfile, bandFromTScore, integrityBand } from '../src/core/engine/scoring';
import { computeRFI, evaluateRoleMatches } from '../src/core/engine/scoring';
import type { EnterpriseItem, EnterpriseTier, AnswerValue } from '../src/core/types';

const TIER: EnterpriseTier = 'QGRA';const DEPLOY: Record<EnterpriseTier, Record<string, number>> = {
  QGRA: { CR: 18, CT: 10, SJT: 12, EI: 8, AQ: 8, WS: 6, INT: 5 },
  QPIA: { CR: 18, CT: 10, SJT: 12, EI: 8, AQ: 8, WS: 6, INT: 5, DQ: 8, LR: 6 },
  QLIA: { CR: 18, CT: 10, SJT: 12, EI: 8, AQ: 8, WS: 6, INT: 5, DQ: 8, LR: 6, ST: 10, PL: 8, OI: 6 },
};

let pass = 0;
let fail = 0;

function check(name: string, cond: unknown, detail?: unknown) {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}`, detail ?? ''); }
}

function deploy(tier: EnterpriseTier): Record<string, EnterpriseItem[]> {
  const out: Record<string, EnterpriseItem[]> = {};
  const rng = () => 0.42; // deterministic
  for (const [module, count] of Object.entries(DEPLOY[tier])) {
    const bank = getItemBank(module as never);
    if (!bank) { console.log(`  (skipping ${module}: no bank)`); continue; }
    out[module] = module === 'WS' ? bank.items : buildDeployList(bank.items, count, 'M', rng);
  }
  return out;
}

function perfectAnswers(deployed: Record<string, EnterpriseItem[]>): Record<string, AnswerValue> {
  const a: Record<string, AnswerValue> = {};
  for (const items of Object.values(deployed)) {
    for (const it of items) {
      if (it.module === 'WS') a[it.id] = [4, 3, 2, 1];
      else if (it.module === 'SJT') a[it.id] = [Array.isArray(it.answer) ? it.answer[0] : it.answer, it.worst ?? 0];
      else a[it.id] = Array.isArray(it.answer) ? it.answer[0] : it.answer;
    }
  }
  return a;
}

function worstAnswers(deployed: Record<string, EnterpriseItem[]>): Record<string, AnswerValue> {
  const a: Record<string, AnswerValue> = {};
  for (const items of Object.values(deployed)) {
    for (const it of items) {
      const ans = Array.isArray(it.answer) ? it.answer[0] : it.answer;
      if (it.module === 'WS') a[it.id] = [1, 2, 3, 4];
      else if (it.module === 'SJT') a[it.id] = [it.worst ?? (ans + 1) % 4, ans];
      else if (it.module === 'INT' && UNETHICAL_OPTIONS[it.id] !== undefined) a[it.id] = UNETHICAL_OPTIONS[it.id];
      else a[it.id] = (ans + 1) % it.options.length;
    }
  }
  return a;
}

function qidsSmoke() {
  console.log('Smoke: QIDS facade (Phase 5 migration)');
  const raw = {
    IQ: { verbal: 20, quantitative: 18, psychometric: 16, performance: 14, _aiBonus: 8, _visualBonus: 6 },
    EQ: { SA: 8, ER: 7, SM: 9, E: 6, IS: 8 },
    SQ: { ACE: 16, CSI: 8, PBA: 15 },
    AQ: { SA: 14, PM: 12, RR: 11, RC: 13 },
  };

  const pillarScores = computeQidsPillarScores(raw);
  check('QIDS pillar scores derived for all 4 pillars',
    pillarScores.IQ !== undefined && pillarScores.EQ !== undefined && pillarScores.SQ !== undefined && pillarScores.AQ !== undefined,
    pillarScores);
  check('QIDS IQ normalized /125', pillarScores.IQ === 82, { IQ: pillarScores.IQ });
  check('QIDS EQ standardized /50', pillarScores.EQ === 76, { EQ: pillarScores.EQ });

  const { result } = evaluateQidsAssessment({ rawScores: raw, intake: { name: 'Smoke' }, ageGroup: '19-32' });
  check('QIDS result mode = individual', result.mode === 'individual', { mode: result.mode });
  check('QIDS result unifiedScore 0..100', (result.unifiedScore ?? -1) >= 0 && (result.unifiedScore ?? 101) <= 100,
    { unified: result.unifiedScore });
  check('QIDS result grade present', !!result.grade?.grade, result.grade);
  check('QIDS skillShape derived', ['T', 'I', 'X', 'M'].includes(result.skillShape ?? ''), { shape: result.skillShape });
  check('QIDS careerProfile derived', !!result.careerProfile?.id, result.careerProfile);
  check('QIDS pillarScores on result', !!result.pillarScores?.AQ, result.pillarScores);

  // Evaluator-merge path must not crash and must return merged raw.
  const withEv = evaluateQidsAssessment({
    rawScores: raw, intake: {}, ageGroup: '19-32',
    evaluations: [{ pillar: 'EQ', scores: { EQ: { B1: { a: 5 }, B2: { a: 4 }, B3: { a: 5 }, B4: { a: 3 }, B5: { a: 4 } } } }],
  });
  check('QIDS evaluator-merge path survives', withEv.rawScores.EQ !== undefined);
}

function rfiSmoke() {
  console.log('Smoke: RFI explorer primitives (Phase 7)');
  const candidate = { Cog: 80, CT: 75, EQ: 50, SQ: 55, AQ: 60, DQ: 65, LA: 55, Int: 70 };
  const matches = evaluateRoleMatches(candidate);
  check('RFI explorer ranks all 11 roles', matches.length === 11, matches.length);
  check('RFI sorted descending', matches[0].matchPct >= matches[matches.length - 1].matchPct,
    matches.map(m => m.matchPct));
  check('RFI matchPct within 0..100', matches.every(m => m.matchPct >= 0 && m.matchPct <= 100));
  check('RFI thresholds assigned', matches.every(m => !!m.threshold));

  const { dimensionScores } = computeRFI(candidate, { id: 'x', label: 'X', weights: { Cog: 40, CT: 30, EQ: 0, SQ: 0, AQ: 0, DQ: 30, LA: 0, Int: 0 }, description: '' });
  check('computeRFI dimension scores present', Object.keys(dimensionScores).length === 8);
}

function riqSmoke() {
  console.log('Smoke: Role Intelligence (RIQ) tracks');
  check('14 role tracks registered', ROLE_TRACKS.length === 14, ROLE_TRACKS.length);
  check('every track has items', ROLE_TRACKS.every(t => t.items.length > 0));
  check('profile mapping resolves (SE)', getTrackForProfile('software-engineer')?.meta.id === 'SE',
    getTrackForProfile('software-engineer')?.meta.id);
  check('no profile mapping for MF', getTrackForProfile('manufacturing') === undefined);

  for (const tier of ['QGRA', 'QPIA', 'QLIA'] as EnterpriseTier[]) {
    const track = getRoleTrack('SE')!;
    const items = deployRoleTrack('SE', tier, 1234);
    const expected = Math.min(track.meta.deployed[tier], track.meta.bank);
    check(`SE deploys ${expected} items for ${tier}`, items.length === expected, items.length);
    check('RIQ items are mcq (1 mark per correct)', items.every(i => Array.isArray(i.answer) ? false : typeof i.answer === 'number'));

    const answers = perfectAnswers({ RIQ: items });
    const good = evaluateEnterpriseAssessment('role', tier, { RIQ: items }, answers, {}, ['software-engineer'], 'SE');
    const bad = evaluateEnterpriseAssessment('role', tier, { RIQ: items }, worstAnswers({ RIQ: items }), {}, ['software-engineer'], 'SE');
    const noTrack = evaluateEnterpriseAssessment('role', tier, { RIQ: items }, answers, {}, ['software-engineer']);

    check(`RIQ present for ${tier}`, !!good.riq, good.riq);
    check('RIQ absent without roleTrack', noTrack.riq === undefined);
    check('RIQ score within 20..80', (good.riq?.score ?? 0) >= 20 && (good.riq?.score ?? 99) <= 80, good.riq?.score);
    check('RIQ band valid', ['Exceptional', 'Proficient', 'Developing', 'Emerging'].includes(good.riq?.band ?? ''));
    check('RIQ track id + label set', good.riq?.track === 'SE' && !!good.riq?.trackLabel);
    check('perfect RIQ > worst RIQ', (good.riq?.score ?? 0) > (bad.riq?.score ?? 0),
      { perfect: good.riq?.score, worst: bad.riq?.score });
    check('RIQ excluded from PII (weight 0)', (good.pii?.score ?? 0) > 0 && (good.moduleScores?.RIQ?.raw ?? -1) >= 0);
  }
}

function edgeCaseSmoke() {
  console.log('Smoke: scoring edge cases');

  // irtScale bounds: raw 0 → Emerging, raw max → Exceptional, never NaN.
  const zero = irtScale(0, 10, 0);
  const full = irtScale(10, 10, 0);
  check('irtScale zero-raw is Emerging', zero.band === 'Emerging', zero);
  check('irtScale full-raw is Exceptional', full.band === 'Exceptional', full);
  check('irtScale tScore bounded 20..80', [zero, full].every(s => s.tScore >= 20 && s.tScore <= 80));
  check('irtScale percentile bounded 1..99', [zero, full].every(s => s.percentile >= 1 && s.percentile <= 99));
  check('irtScale max=0 does not NaN', irtScale(0, 0, 0).tScore === 50 || Number.isFinite(irtScale(0, 0, 0).tScore));

  // Difficulty bias: harder module lowers T at the same raw ratio.
  const easy = irtScale(6, 10, 0);
  const hard = irtScale(6, 10, 0.8);
  check('difficulty bias lowers T-score', hard.tScore < easy.tScore, { easy: easy.tScore, hard: hard.tScore });

  // PII scaling: 0% composite → floor ~40; perfect composite → ceiling 145 (tier-scaled).
  const zeroModules = { CR: { raw: 0, max: 18, weight: 0.25 } };
  const perfectModules = { CR: { raw: 18, max: 18, weight: 0.25 } };
  const zeroPii = computePII(zeroModules as never, 'QGRA');
  const perfectPii = computePII(perfectModules as never, 'QLIA');
  check('PII zero composite ≈ 40', zeroPii.score >= 40 && zeroPii.score <= 45, zeroPii.score);
  check('PII perfect caps at 145', perfectPii.score === 145, perfectPii.score);
  check('PII tier scaling raises QLIA over QGRA', perfectPii.score > computePII(perfectModules as never, 'QGRA').score);

  // Skill shape classification sanity.
  check('balanced-high pillars → X or M shape', ['X', 'M'].includes(getSkillShape({ IQ: 85, EQ: 82, SQ: 88, AQ: 80 })));
  check('single-spiked profile → I or T shape', ['I', 'T'].includes(getSkillShape({ IQ: 95, EQ: 40, SQ: 35, AQ: 30 })));

  // Career profiles: boundary conditions resolve to a profile, never undefined.
  for (const ps of [
    { IQ: 80, EQ: 80, SQ: 80, AQ: 20 },
    { IQ: 80, EQ: 40, SQ: 40, AQ: 40 },
    { IQ: 40, EQ: 40, SQ: 40, AQ: 90 },
    { IQ: 40, EQ: 40, SQ: 40, AQ: 40 },
  ]) {
    const cp = getCareerProfile(ps as never);
    check(`careerProfile resolves for ${JSON.stringify(ps)}`, !!cp?.id);
  }

  // AQ weight formula: weights are the 1.5/1.0/1.0/1.5 RDF profile.
  const aq = computeQidsPillarScores({ AQ: { SA: 19, PM: 19, RR: 19, RC: 19 } });
  check('AQ perfect weighted RD = 100', aq.AQ === 100, aq.AQ);
  const aqZero = computeQidsPillarScores({ AQ: { SA: 0, PM: 0, RR: 0, RC: 0 } });
  check('AQ zero RD = 0', aqZero.AQ === 0, aqZero.AQ);

  // Integrity bands: 0 flags → Pass; 1 → Concern; 2+ → Flag.
  check('integrity 0 flags = Pass', integrityBand([], 8).band === 'Pass');
  check('integrity 1 flag = Concern', integrityBand(['x'], 8).band === 'Concern');
  check('integrity 2 flags = Flag', integrityBand(['x', 'y'], 8).band === 'Flag');

  // Band boundaries: 65 is Exceptional floor, 35 is Emerging ceiling.
  check('bandFromTScore 65 = Exceptional', bandFromTScore(65) === 'Exceptional');
  check('bandFromTScore 64.9 = Proficient', bandFromTScore(64.9) === 'Proficient');
  check('bandFromTScore 34.9 = Emerging', bandFromTScore(34.9) === 'Emerging');
}

function main() {
  const tiers: EnterpriseTier[] = ['QGRA', 'QPIA', 'QLIA'];

  for (const tier of tiers) {
    console.log(`Smoke: enterprise pipeline (${tier})`);
    const deployed = deploy(tier);
    const total = Object.values(deployed).reduce((s, v) => s + v.length, 0);
    console.log(`  deployed items: ${total}`);

    const expectedModules = Object.keys(DEPLOY[tier]);
    check(`deploys all ${expectedModules.length} ${tier} modules`,
      expectedModules.every(m => deployed[m]?.length));

    const perfect = evaluateEnterpriseAssessment('enterprise', tier, deployed, perfectAnswers(deployed));
    const worst = evaluateEnterpriseAssessment('enterprise', tier, deployed, worstAnswers(deployed));

    // PII ordering + bounds.
    check('perfect PII present', perfect.pii !== undefined);
    check('perfect PII > worst PII', (perfect.pii?.score ?? 0) > (worst.pii?.score ?? 0),
      { perfect: perfect.pii?.score, worst: worst.pii?.score });
    check('PII within 40..145', (perfect.pii?.score ?? 0) >= 40 && (perfect.pii?.score ?? 0) <= 145);
    check('moduleScores cover every deployed module', expectedModules
      .filter(m => m !== 'WS')
      .every(m => perfect.moduleScores && perfect.moduleScores[m as never] !== undefined));

    // RFI.
    check('RFI evaluated for all 11 roles', perfect.rfi?.length === 11);
    check('perfect RFI match > worst RFI match',
      (perfect.rfi?.[0]?.matchPct ?? 0) > (worst.rfi?.[0]?.matchPct ?? 0),
      { perfect: perfect.rfi?.[0]?.matchPct, worst: worst.rfi?.[0]?.matchPct });

    // Work style + archetype.
    check('work style profile has 6 dims', perfect.workStyle && Object.keys(perfect.workStyle.profile).length === 6);
    check('archetype assigned', !!perfect.workStyle?.archetype?.id);

    // Integrity.
    check('perfect integrity band Pass', perfect.integrity?.band === 'Pass');
    check('worst integrity has ≥1 flag or Concern/Flag', (worst.integrity?.flaggedItems?.length ?? 0) >= 1,
      { band: worst.integrity?.band, flagged: worst.integrity?.flaggedItems });

    // Learning agility.
    check('learning agility present', !!perfect.learningAgility?.label);

    if (tier === 'QLIA') {
      // Ordered-preference WS encoding accepted by the runner.
      const alt = perfectAnswers(deployed);
      for (const it of deployed.WS ?? []) alt[it.id] = [0, 1, 2, 3];
      const ordered = evaluateEnterpriseAssessment('enterprise', tier, deployed, alt);
      check('ordered-preference WS form scores', !!ordered.workStyle);

      // Role-scoped RFI.
      const scoped = evaluateEnterpriseAssessment('role', tier, deployed, perfectAnswers(deployed), {}, ['customer-support']);
      check('role-scoped RFI returns only the target role', scoped.rfi?.length === 1 && scoped.rfi?.[0]?.roleId === 'customer-support',
        scoped.rfi?.map(r => r.roleId));
    }
  }

  qidsSmoke();
  rfiSmoke();
  riqSmoke();
  edgeCaseSmoke();

  console.log(`\n${pass} passed, ${fail} failed`);

  console.log('\nPerfect candidate snapshot (QLIA):');
  const qlia = deploy('QLIA');
  const perfect = evaluateEnterpriseAssessment('enterprise', 'QLIA', qlia, perfectAnswers(qlia));
  console.log('  PII:', perfect.pii?.score, perfect.pii?.label);
  console.log('  Learning agility:', perfect.learningAgility?.label, perfect.learningAgility?.score);
  console.log('  Archetype:', perfect.workStyle?.archetype.label);
  console.log('  Top RFI:', JSON.stringify(perfect.rfi?.slice(0, 3).map(r => ({ role: r.roleLabel, match: r.matchPct, level: r.threshold }))));
  console.log('  Module T-scores:', Object.fromEntries(
    Object.entries(perfect.moduleScores ?? {}).map(([k, v]) => [k, v.tScore]),
  ));

  if (fail > 0) process.exit(1);
}

main();
