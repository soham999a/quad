// ─── Role Intelligence (RIQ) Track Parser ────────────────────────────────────
// Parses Section 6 (Role Intelligence Item Banks) of the QIDS Enterprise
// Assessment Part 2 into per-track item bank files under
// src/core/data/roleTracks/.
//
// Usage: node scripts/parse-role-tracks.mjs
// Output: src/core/data/roleTracks/<track>.ts + index.ts
//
// Item format is identical to Parts 1 & 3: ids may be split across two lines
// ("SE-00" + "1"), options are "A." / "✔ B." lines, and the metadata block
// ("M 40s Retail — Customer Handling Med") may be split across lines.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'C:/Users/dasso/Desktop/quad';
const OUT_DIR = path.join(ROOT, 'qids-platform/src/core/data/roleTracks');
const SRC = 'C:/Users/dasso/AppData/Local/Temp/opencode/QIDS_Enterprise_Assessment_Part2.txt';

// Track registry: id, label, deployed per tier (8/12/15 per spec), and the
// ROLE_PROFILES id it maps to (undefined when no profile exists yet).
const TRACKS = [
  { id: 'SE', label: 'Software Engineering', profile: 'software-engineer' },
  { id: 'DS', label: 'Data Science / Analytics', profile: 'data-scientist' },
  { id: 'BF', label: 'Banking & Finance', profile: 'banking-finance' },
  { id: 'HR', label: 'Human Resources', profile: 'hr-business-partner' },
  { id: 'MK', label: 'Marketing', profile: 'marketing-executive' },
  { id: 'SA', label: 'Sales', profile: 'sales-executive' },
  { id: 'OL', label: 'Operations & Logistics', profile: 'operations-manager' },
  { id: 'CS', label: 'Customer Support', profile: 'customer-support' },
  { id: 'MF', label: 'Manufacturing', profile: undefined },
  { id: 'RT', label: 'Retail', profile: undefined },
  { id: 'GG', label: 'General Graduate Recruitment', profile: 'general-graduate' },
  { id: 'FI', label: 'Finance', profile: undefined },
  { id: 'HC', label: 'Healthcare', profile: undefined },
  { id: 'ED', label: 'Teacher / Education', profile: undefined },
];

const DEPLOYED = { QGRA: 8, QPIA: 12, QLIA: 15 };

// ── Tokenization (mirrors parse-enterprise-items.mjs) ─────────────────────────

const META_INLINE_RE = /\b[EMH]\s+\d+s\b/;
const DISCRIM_RE = /\b(High|Med|Low)\b/;
const OPT_RE = /^([✔✓]?)\s*([A-F])\.\s*(.*)$/;
const NOISE_RES = [
  /^--\s*\d+\s+of\s+\d+\s*--$/,
  /^ID\s+Question/,
  /^\.\s*$/,
  /^Item bank/,
  /^Modules?\s+\d/,
  /^SECTION\s+\d/,
  /^role_track\s/,
  /^QiDS Enterprise/,
  /^[A-Za-z].* \| \d+ items$/,
  /^Response|^score_|^item_|^candidate|^role_|^bank_/,
];

function isNoise(line) {
  const t = line.trim();
  if (!t) return true;
  return NOISE_RES.some(re => re.test(t));
}

// ── Split items ───────────────────────────────────────────────────────────────

function splitItems(lines) {
  const items = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const intact = line.match(/^([A-Z]{2})-(\d{3})$/);
    if (intact) {
      current = { id: `${intact[1]}-${intact[2]}`, lines: [] };
      items.push(current);
      continue;
    }
    const head = line.match(/^([A-Z]{2})-(\d{1,2})$/);
    if (head) {
      const next = (lines[i + 1] ?? '').trim();
      const tail = next.match(/^(\d{1,3})$/);
      if (tail && head[2].length + tail[1].length === 3) {
        current = { id: `${head[1]}-${head[2]}${tail[1]}`, lines: [] };
        items.push(current);
        i++;
        continue;
      }
      continue;
    }
    if (current && !isNoise(line)) current.lines.push(lines[i]);
  }
  return items;
}

// ── Item builder ──────────────────────────────────────────────────────────────

function parseItem(item) {
  let difficulty = 'M';
  let timeSec = 40;
  let discrimination = 'Med';
  let metaBlock = '';
  let metaOpen = false;

  const tokens = [];
  for (const raw of item.lines) {
    const text = raw.trim();
    const m = text.match(META_INLINE_RE);
    if (m) {
      const before = text.slice(0, m.index).trim();
      if (before) tokens.push({ kind: 'text', text: before });
      tokens.push({ kind: 'meta', text: text.slice(m.index).trim() });
    } else {
      tokens.push({ kind: 'text', text });
    }
  }

  const textTokens = tokens.filter(t => t.kind === 'text');
  const firstOpt = textTokens.findIndex(t => OPT_RE.test(t.text));
  if (firstOpt === -1) return null;

  const stem = [];
  const options = [];
  let correctIdx = -1;
  let textCount = 0;

  for (const tok of tokens) {
    if (tok.kind === 'meta') {
      const dm = tok.text.match(/([EMH])\s+(\d+)s/);
      if (dm) { difficulty = dm[1]; timeSec = parseInt(dm[2], 10); }
      const dc = tok.text.match(DISCRIM_RE);
      if (dc) discrimination = dc[1];
      metaBlock += ' ' + tok.text;
      metaOpen = !DISCRIM_RE.test(tok.text);
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
      if (DISCRIM_RE.test(metaBlock)) metaOpen = false;
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

  const competency = metaBlock
    .replace(META_INLINE_RE, '')
    .replace(DISCRIM_RE, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    id: item.id,
    stem: stemText,
    options: opts,
    answer: correctIdx >= 0 ? correctIdx : 0,
    difficulty,
    timeSec,
    competency,
    discrimination,
    correct: correctIdx >= 0,
  };
}

// ── Parse the whole section ───────────────────────────────────────────────────

function parseTracks() {
  const text = fs.readFileSync(SRC, 'utf8');
  const lines = [];
  for (const line of text.split('\n')) {
    if (/^SECTION\s+7\b/.test(line.trim())) break;   // stop at the next section
    lines.push(line);
  }

  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const heading =
      t.match(/^RI Track\s+\d+\s*[—–-]\s*(.*)$/) ||
      t.match(/^RI Track\s+\d+\s+(.*)$/) ||
      t.match(/^RI-\d+\s*[—–-]\s*(.*)$/);
    if (heading) {
      current = { name: heading[1].trim(), items: [] };
      sections.push(current);
      continue;
    }
    if (current && !isNoise(t)) current.items.push(t);
  }

  const byId = new Map(TRACKS.map(t => [t.id, { meta: t, items: [] }]));
  for (const section of sections) {
    const match = byId.get(section.name.replace(/^Track\s+\d+\s*/, ''));
    if (match) {
      match.items.push(...section.items);
      continue;
    }
    // match by label prefix (e.g. section name "Software Engineering")
    for (const [id, entry] of byId) {
      if (!entry.meta.parsed && section.name.toLowerCase().includes(entry.meta.label.toLowerCase())) {
        entry.meta.parsed = true;
        entry.items.push(...section.items);
        break;
      }
    }
  }

  const out = new Map();
  for (const [id, entry] of byId) {
    if (!entry.items.length) continue;
    const parsed = splitItems(entry.items)
      .map(parseItem)
      .filter(Boolean);
    out.set(id, parsed);
  }
  return out;
}

// ── Emit ──────────────────────────────────────────────────────────────────────

function emitTrack(id, items) {
  const meta = TRACKS.find(t => t.id === id);
  const deployed = DEPLOYED;
  const lines = [
    `// Auto-generated role track item bank: ${meta.label} (${id}).`,
    `// Source: QIDS Enterprise Assessment Spec (Part 2, Section 6). Review before production.`,
    `import type { EnterpriseItem } from '../../types';`,
    ``,
    `export const ITEMS: EnterpriseItem[] = [`,
  ];
  for (const it of items) {
    lines.push(`  {
    id: '${it.id}',
    module: 'RIQ' as const,
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
  lines.push(`export const TRACK_META = {`);
  lines.push(`  id: '${id}' as const,`);
  lines.push(`  label: ${JSON.stringify(meta.label)},`);
  lines.push(`  bank: ${items.length},`);
  lines.push(`  deployed: ${JSON.stringify(deployed)},`);
  lines.push(`  profileId: ${meta.profile ? JSON.stringify(meta.profile) : 'undefined'},`);
  lines.push(`};`);
  lines.push(`export default ITEMS;`);
  return lines.join('\n');
}

function emitIndex(entries) {
  const lines = [
    `// Role track registry (RIQ) — Section 6 item banks, one file per track.`,
    `// Auto-generated; regenerate with: node scripts/parse-role-tracks.mjs`,
    `import type { EnterpriseItem, RoleTrackId } from '../../types';`,
    ``,
  ];
  for (const { id } of entries) {
    lines.push(`import { ITEMS as ${id}_ITEMS, TRACK_META as ${id}_META } from './${id.toLowerCase()}';`);
  }
  lines.push(``);
  lines.push(`export interface RoleTrackMeta {`);
  lines.push(`  id: RoleTrackId;`);
  lines.push(`  label: string;`);
  lines.push(`  bank: number;`);
  lines.push(`  deployed: Record<'QGRA' | 'QPIA' | 'QLIA', number>;`);
  lines.push(`  profileId?: string;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export interface RoleTrackEntry {`);
  lines.push(`  meta: RoleTrackMeta;`);
  lines.push(`  items: EnterpriseItem[];`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`const META: Record<RoleTrackId, RoleTrackMeta> = {`);
  for (const { id } of entries) {
    lines.push(`  ${id}: ${id}_META,`);
  }
  lines.push(`};`);
  lines.push(``);
  lines.push(`const ITEMS: Record<RoleTrackId, EnterpriseItem[]> = {`);
  for (const { id } of entries) {
    lines.push(`  ${id}: ${id}_ITEMS,`);
  }
  lines.push(`};`);
  lines.push(``);
  lines.push(`export const ROLE_TRACKS: RoleTrackEntry[] = (Object.keys(META) as RoleTrackId[]).map(id => ({ meta: META[id], items: ITEMS[id] }));`);
  lines.push(``);
  lines.push(`export function getRoleTrack(trackId: RoleTrackId): RoleTrackEntry | undefined {`);
  lines.push(`  return ROLE_TRACKS.find(t => t.meta.id === trackId);`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export function getTrackForProfile(profileId: string): RoleTrackEntry | undefined {`);
  lines.push(`  return ROLE_TRACKS.find(t => t.meta.profileId === profileId);`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export const ROLE_TRACK_IDS: RoleTrackId[] = Object.keys(META) as RoleTrackId[];`);
  return lines.join('\n');
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const parsed = parseTracks();
  const entries = [];
  let total = 0;
  let missing = 0;
  for (const t of TRACKS) {
    const items = parsed.get(t.id);
    if (!items) { console.log(`  (skipping ${t.id}: no items found)`); missing++; continue; }
    entries.push(t);
    fs.writeFileSync(path.join(OUT_DIR, `${t.id.toLowerCase()}.ts`), emitTrack(t.id, items));
    const noCheck = items.filter(i => !i.correct).length;
    console.log(`${t.id.padEnd(4)} ${t.label.padEnd(28)} ${items.length} items (${noCheck} no checkmark) -> ${t.id.toLowerCase()}.ts`);
    total += items.length;
  }
  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), emitIndex(entries));
  console.log(`\n${entries.length} tracks, ${total} items, index.ts written. (${missing} skipped)`);
}

main();
