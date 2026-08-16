// ─── Enterprise Item Bank Parser ─────────────────────────────────────────────
// Parses the extracted PDF text of the QIDS Enterprise Assessment (Parts 1 & 3)
// into structured item bank modules under src/core/data/itemBanks/.
//
// Usage: node scripts/parse-enterprise-items.mjs [--all]
// Output: src/core/data/itemBanks/<module>.ts  (one module per file)
//
// Format notes handled here:
//   - Item IDs are split across two lines in the source (e.g. "CR-V-" + "001",
//     "CT-00" + "1", "SJT-00" + "1", "WS-0" + "01").
//   - Metadata (`<D> <sec>s <construct> — <competency> <disc>`) can appear as a
//     block after the options OR inline mid-stem, and is often wrapped across
//     page breaks.
//   - Option text is occasionally split across page breaks (continuation lines).
//
// Outputs are structured item banks intended for human curation before use.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/dasso/Desktop/quad';
const OUT_DIR = path.join(ROOT, 'qids-platform/src/core/data/itemBanks');
const TMP = 'C:/Users/dasso/AppData/Local/Temp/opencode';

const MODULE_META = {
  CR:  { label: 'Cognitive Readiness',            qi: 'IQ',        bank: 60, deployed: 18, weight: 0.25, tier: 'QGRA', timeMin: 12, scoring: 'mcq' },
  CT:  { label: 'Critical Thinking',              qi: 'IQ',        bank: 30, deployed: 10, weight: 0.15, tier: 'QGRA', timeMin: 8,  scoring: 'mcq' },
  SJT: { label: 'Workplace Judgement',            qi: 'EQ',        bank: 36, deployed: 12, weight: 0.20, tier: 'QGRA', timeMin: 10, scoring: 'best_worst' },
  EI:  { label: 'Emotional Intelligence',         qi: 'EQ',        bank: 24, deployed: 8,  weight: 0.10, tier: 'QGRA', timeMin: 6,  scoring: 'mcq' },
  AQ:  { label: 'Adaptability & Resilience',      qi: 'AQ',        bank: 24, deployed: 8,  weight: 0.10, tier: 'QGRA', timeMin: 6,  scoring: 'mcq' },
  WS:  { label: 'Work Style',                     qi: 'WorkStyle', bank: 18, deployed: 6,  weight: 0.00, tier: 'QGRA', timeMin: 4,  scoring: 'ipsative' },
  INT: { label: 'Integrity & Risk',               qi: 'Ethics',    bank: 15, deployed: 5,  weight: 0.10, tier: 'QGRA', timeMin: 4,  scoring: 'mcq' },
  DQ:  { label: 'Decision Quality',               qi: 'IQ',        bank: 24, deployed: 8,  weight: 0.00, tier: 'QPIA', timeMin: 8,  scoring: 'mcq' },
  LR:  { label: 'Leadership Readiness',           qi: 'SQ',        bank: 18, deployed: 6,  weight: 0.00, tier: 'QPIA', timeMin: 8,  scoring: 'mcq' },
  ST:  { label: 'Strategic Thinking',             qi: 'IQ',        bank: 20, deployed: 10, weight: 0.00, tier: 'QLIA', timeMin: 8,  scoring: 'mcq' },
  PL:  { label: 'People Leadership',              qi: 'SQ',        bank: 20, deployed: 8,  weight: 0.00, tier: 'QLIA', timeMin: 6,  scoring: 'mcq' },
  OI:  { label: 'Organisational Impact',          qi: 'AQ',        bank: 18, deployed: 6,  weight: 0.00, tier: 'QLIA', timeMin: 6,  scoring: 'mcq' },
};

const TIER_LIST = {
  QGRA: ['QGRA', 'QPIA', 'QLIA'],
  QPIA: ['QPIA', 'QLIA'],
  QLIA: ['QLIA'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadText(file) {
  const p = path.join(TMP, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const NOISE_RES = [
  /^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/,
  /^ID\s+Question\s*\+/,
  /^\.\s*$/,
  /items in bank/,
  /items\s*\|\s*\d+\s*deployed/,
  /^Format Note:/,
  /\(\d+\s*items\)\s*$/,
  /^MODULE \d/,
];

function isNoise(line) {
  const t = line.trim();
  if (!t) return true;
  return NOISE_RES.some(re => re.test(t));
}

const DIFF = { E: 'E', M: 'M', H: 'H' };

// ── Tokenization ─────────────────────────────────────────────────────────────

const META_FULL_RE = /^[EMH]\s+\d+s\b/;      // meta block line (starts with marker)
const META_INLINE_RE = /\b[EMH]\s+\d+s\b/;   // inline meta marker anywhere in line
const DISCRIM_RE = /\b(High|Med|Low)\b/;

// Construct prefixes to strip from competency fragments.
const CONSTRUCT_PREFIX_RE =
  /^(?:SJT|CT|CR|EI|AQ|WS|INT|DQ|LR|ST|PL|OI|RIQ|Verbal|Numerical|Logical|Abstract|Data Interpretation|Work Style|Emotion Recognition|Ethical Dilemma|Integrity|Critical Thinking|Strategic Thinking|Decision|Leadership|Resilience|Communication|Ownership|Curiosity|Execution|Growth Mindset|Trade-off|Long-term|Systems|Change)\s*[-–—]?\s*/;

/** Turn a raw line into a token stream, pulling metadata fragments out. */
function tokenize(line) {
  const tokens = [];
  const text = line.trim();
  const m = text.match(META_INLINE_RE);
  if (m) {
    const before = text.slice(0, m.index).trim();
    if (before) tokens.push({ kind: 'text', text: before });
    tokens.push({ kind: 'meta', text: text.slice(m.index).trim() });
    return tokens;
  }
  tokens.push({ kind: 'text', text });
  return tokens;
}

function parseMetaFrag(frag) {
  const out = { difficulty: 'M', timeSec: 40, discrimination: 'Med' };
  const dm = frag.match(/([EMH])\s+(\d+)s/);
  if (dm) {
    out.difficulty = DIFF[dm[1]];
    out.timeSec = parseInt(dm[2], 10);
  }
  const disc = frag.match(DISCRIM_RE);
  if (disc) out.discrimination = disc[1];
  return out;
}

// ── Item splitting (handles split IDs) ───────────────────────────────────────

const ID_PREFIX_RE = /^(CR-[A-Z]-|[A-Z]{2,3}-)([0-9]*)$/;
const DIGITS_RE = /^([0-9]{1,3})$/;

function moduleOfId(id) {
  if (id.startsWith('CR-')) return 'CR';
  const m = id.match(/^([A-Z]{2,3})-/);
  return m ? m[1] : '';
}

function splitItems(lines) {
  const items = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const idMatch = line.match(ID_PREFIX_RE);
    if (idMatch) {
      const prefix = idMatch[1];
      let digits = idMatch[2];
      if (digits.length < 3) {
        const next = (lines[i + 1] ?? '').trim();
        const nd = next.match(DIGITS_RE);
        if (nd && nd[1].length <= 3 - digits.length) {
          digits += nd[1];
          i++;
        }
      }
      if (digits.length < 3) continue;
      current = { id: prefix + digits, lines: [] };
      items.push(current);
    } else if (current && !isNoise(line)) {
      current.lines.push(lines[i]);
    }
  }
  return items;
}

// ── Item builder ─────────────────────────────────────────────────────────────

const OPT_RE = /^([✔✓]?)\s*([A-D])\.\s*(.*)$/;

function cleanCompetency(metaText) {
  let s = metaText.replace(META_INLINE_RE, '').trim();
  s = s.replace(DISCRIM_RE, '').trim();
  s = s.replace(CONSTRUCT_PREFIX_RE, '').trim();
  return s.replace(/\s+/g, ' ').trim();
}

function buildItem(id, itemLines, moduleId) {
  // 1. Tokenize; collect meta info from fragments.
  let difficulty = 'M';
  let timeSec = 40;
  let discrimination = 'Med';
  const metaFrags = [];
  const tokens = [];
  for (const raw of itemLines) {
    for (const tok of tokenize(raw.trim())) {
      if (tok.kind === 'meta') {
        const info = parseMetaFrag(tok.text);
        difficulty = info.difficulty;
        timeSec = info.timeSec;
        discrimination = info.discrimination;
        metaFrags.push(tok.text);
      }
      tokens.push(tok);
    }
  }

  // 2. Find first option among text tokens (index in text-token order).
  const textTokens = tokens.filter(t => t.kind === 'text');
  const firstOpt = textTokens.findIndex(t => OPT_RE.test(t.text));
  if (firstOpt === -1) return null;

  // 3. Walk: options, option continuations, meta block.
  // A meta block keeps absorbing following text until it contains a
  // discrimination word (High/Med/Low). This handles both "meta before the
  // options" (page-break splits) and "meta after the options".
  const stem = [];
  const options = [];
  let correctIdx = -1;
  let textCount = 0;
  let metaOpen = false;
  let metaBlock = '';

  const hasDiscr = s => DISCRIM_RE.test(s);

  for (const tok of tokens) {
    if (tok.kind === 'meta') {
      metaBlock += ' ' + tok.text;
      metaOpen = !hasDiscr(tok.text);
      continue;
    }
    const om = tok.text.match(OPT_RE);
    if (om) {
      metaOpen = false;
      const idx = om[2].charCodeAt(0) - 65;
      options[idx] = om[3].trim();
      if (om[1] === '✔' || om[1] === '✓') correctIdx = idx;
    } else if (metaOpen) {
      metaBlock += ' ' + tok.text;
      if (hasDiscr(metaBlock)) metaOpen = false;
    } else if (textCount < firstOpt) {
      stem.push(tok.text);
    } else if (options.length) {
      options[options.length - 1] += ' ' + tok.text;
    }
    textCount++;
  }

  const stemText = stem.join(' ').replace(/\s+/g, ' ').trim();
  const opts = options.map(o => o.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (!stemText || opts.length < 2) return null;

  return {
    id,
    module: moduleId,
    stem: stemText,
    options: opts,
    answer: correctIdx >= 0 ? correctIdx : 0,
    difficulty,
    timeSec,
    competency: cleanCompetency(metaBlock),
    discrimination,
    bank: MODULE_META[moduleId].bank,
    present: opts.length,
  };
}

// ── Module builder ───────────────────────────────────────────────────────────

const SOURCE_FILES = ['QIDS_Enterprise_Assessment_Part1.txt', 'QIDS_Enterprise_Assessment_Part3.txt'];

const TAIL_CUT_RE = /^APPENDIX\b|^Appendix\b|^SECTION 13\b|Completion Volume|QiDS Enterprise Intelligence Assessment — Part \d+:\s*Completion/;

function buildModule(moduleId) {
  // Split each file independently so trailing cover/header lines never bleed
  // into the last item of a previous file, then merge item lists.
  const items = [];
  for (const f of SOURCE_FILES) {
    const text = loadText(f);
    if (!text) continue;
    const lines = [];
    for (const line of text.split('\n')) {
      if (TAIL_CUT_RE.test(line)) break;
      if (!isNoise(line)) lines.push(line);
    }
    for (const it of splitItems(lines)) {
      if (moduleOfId(it.id) !== moduleId) continue;
      const built = buildItem(it.id, it.lines, moduleId);
      if (built) items.push(built);
    }
  }
  return items;
}

// ── Emit module file ─────────────────────────────────────────────────────────

function emitModule(moduleId) {
  const parsed = buildModule(moduleId);
  const meta = MODULE_META[moduleId];
  const tiers = JSON.stringify(TIER_LIST[meta.tier]);
  const missing = parsed.length < meta.bank
    ? `\n// NOTE: source PDFs contain ${parsed.length} of the ${meta.bank} spec'd items.`
    : '';

  const lines = [
    `// Auto-generated item bank: ${meta.label} (${moduleId}).`,
    `// Source: QIDS Enterprise Assessment Spec (Parts 1 & 3). Review before production.${missing}`,
    `import type { EnterpriseItem, EnterpriseModuleId } from '../../types';`,
    ``,
    `export const ITEMS: EnterpriseItem[] = [`,
  ];

  for (const it of parsed) {
    lines.push(`  {
    id: '${it.id}',
    module: '${moduleId}' as EnterpriseModuleId,
    stem: ${JSON.stringify(it.stem)},
    options: ${JSON.stringify(it.options)},
    answer: ${it.answer},
    difficulty: '${it.difficulty}',
    timeSec: ${it.timeSec},
    competency: ${JSON.stringify(it.competency)},
    discrimination: '${it.discrimination}',
  },`);
  }

  lines.push(`];`);
  lines.push(``);
  lines.push(`export const MODULE_META = {`);
  lines.push(`  id: '${moduleId}',`);
  lines.push(`  label: ${JSON.stringify(meta.label)},`);
  lines.push(`  qi: ${JSON.stringify(meta.qi)},`);
  lines.push(`  bank: ${meta.bank},`);
  lines.push(`  deployed: ${meta.deployed},`);
  lines.push(`  timeMin: ${meta.timeMin},`);
  lines.push(`  weight: ${meta.weight},`);
  lines.push(`  scoring: '${meta.scoring}',`);
  lines.push(`  tiers: ${tiers},`);
  lines.push(`};`);
  lines.push(`export default ITEMS;`);

  return { src: lines.join('\n'), count: parsed.length };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const modules = process.argv.includes('--all')
    ? Object.keys(MODULE_META)
    : ['CR', 'CT', 'SJT', 'EI', 'AQ', 'WS', 'INT'];
  for (const m of modules) {
    const { src, count } = emitModule(m);
    fs.writeFileSync(path.join(OUT_DIR, `${m.toLowerCase()}.ts`), src);
    console.log(`${m}: ${count} items -> ${m.toLowerCase()}.ts`);
  }
}

main();
