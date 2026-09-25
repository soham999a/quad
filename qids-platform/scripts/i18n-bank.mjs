#!/usr/bin/env node
// ─── Question-bank translation (Groq, JSON mode) ──────────────────────────────
// Extracts translatable strings from src/data/qidsData.js (the main assessment
// bank: EQ Likert items, SQ rubrics/activities, IQ MCQs/open prompts, AQ Likert
// items, labels/instructions), translates them to hi/bn/mr via Groq, and writes
// src/data/qidsData.<lang>.json dictionaries keyed by stable IDs (structural
// path + content hash). Runtime looks up translated strings by ID and falls
// back to English when absent — so a partial translation can never corrupt an
// assessment. Idempotent + resumable: existing correct keys are kept.
//
// Env: VITE_GROQ_API_KEY (or GROQ_API_KEY). Usage: node scripts/i18n-bank.mjs

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load Groq key: env first, then qids-platform/.env (same policy as
// scripts/i18n-translate.mjs — build scripts never ship to the client).
function loadKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  if (process.env.VITE_GROQ_API_KEY) return process.env.VITE_GROQ_API_KEY;
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^(?:VITE_)?GROQ_API_KEY\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const req = createRequire(process.cwd() + '/package.json');
const parser = req('@babel/parser');

const SRC = 'src/data/qidsData.js';
const OUT_DIR = 'src/data/banks';
const LANGS = ['hi', 'bn', 'mr'];
const MODEL = 'openai/gpt-oss-120b';
const BATCH = 40;

const KEY = loadKey();
if (!KEY) {
  console.error('Missing GROQ_API_KEY / VITE_GROQ_API_KEY (env or qids-platform/.env) — cannot translate.');
  process.exit(1);
}

// ── 1. Extract: walk the AST, collect every string in translatable positions ─
const code = fs.readFileSync(SRC, 'utf8');
const ast = parser.parse(code, { sourceType: 'module' });
const strings = new Map(); // key -> english text
const TRANSLATABLE_PROPS = new Set(['label', 'q', 'text', 'instruction', 'activity', 'context']);

function hash8(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function walk(node, path_, inOptions) {
  if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;

  if (node.type === 'ObjectProperty' && node.key) {
    const keyName = node.key.type === 'Identifier' ? node.key.name
      : node.key.type === 'StringLiteral' ? node.key.value : null;
    if (keyName === 'options' && node.value.type === 'ArrayExpression') {
      // numbered keys: options.0, options.1 …
      node.value.elements.forEach((el, i) => {
        if (el && el.type === 'StringLiteral') {
          const k = `${path_}.options.${i}`;
          strings.set(k, { text: el.value, ctx: 'answer option' });
        }
      });
      return;
    }
    if (TRANSLATABLE_PROPS.has(keyName) && node.value.type === 'StringLiteral') {
      const k = `${path_}.${keyName}`;
      strings.set(k, { text: node.value.value, ctx: keyName });
      return;
    }
  }

  let nextPath = path_;
  let nextOpts = inOptions;
  if (node.type === 'ObjectProperty' && node.key) {
    const keyName = node.key.type === 'Identifier' ? node.key.name
      : node.key.type === 'StringLiteral' ? node.key.value : null;
    nextPath = path_ ? `${path_}.${keyName}` : keyName;
  }
  if (node.type === 'ArrayExpression') {
    nextOpts = true;
  }

  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'start' || k === 'end') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c, i) => {
      // arrays inside objects: index the path so positions stay stable
      if (node.type === 'ArrayExpression' && path_ && !inOptions) walk(c, `${path_}.${i}`, inOptions);
      else walk(c, nextPath, nextOpts);
    });
    else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v, nextPath, nextOpts);
  }
}
walk(ast, '', false);

console.log(`extracted ${strings.size} translatable strings from ${SRC}`);

// de-dup by content: identical english → one translation, many keys
const byText = new Map();
for (const [k, v] of strings) {
  if (!byText.has(v.text)) byText.set(v.text, { ids: [], ctx: v.ctx });
  byText.get(v.text).ids.push(k);
}
console.log(`${byText.size} unique strings to translate`);

// ── 2. Load existing dictionaries (resumable) ────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
const dicts = {};
for (const lang of LANGS) {
  const p = path.join(OUT_DIR, `qidsData.${lang}.json`);
  dicts[lang] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

// ── 3. Translate missing strings per language ───────────────────────────────
async function groqTranslate(texts, lang) {
  const payload = texts.map((t, i) => ({ i, t }));
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a professional localizer for a psychometric assessment platform used by Indian schools. Translate English assessment content to ${lang === 'hi' ? 'Hindi (Devanagari)' : lang === 'bn' ? 'Bengali' : 'Marathi (Devanagari)'}. Keep language natural for students aged 11-32. Keep QiDS, IQ, EQ, SQ, AQ in Latin script. Return JSON: {"items":[{"i":<index>,"t":"<translation>"}]}`,
        },
        { role: 'user', content: JSON.stringify({ items: payload }) },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq ${res.status}: ${err.error?.message || 'unknown'}`);
  }
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return parsed.items || [];
}

const RULES = { hi: 'Hindi', bn: 'Bengali', mr: 'Marathi' };
for (const lang of LANGS) {
  const dict = dicts[lang];
  const missing = [...byText.entries()].filter(([text]) => !dict[`t:${Buffer.from(text).toString('base64').slice(0, 40)}`]
    && !Object.values(dict).includes(text) && !dictHas(dict, text));
  if (missing.length === 0) {
    console.log(`${lang}: complete ✓`);
    continue;
  }
  console.log(`${lang}: ${missing.length} strings to translate`);
  let done = 0;
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const texts = batch.map(([text]) => text);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const items = await groqTranslate(texts, lang);
        for (const it of items) {
          if (it && Number.isInteger(it.i) && texts[it.i]) {
            dict[texts[it.i]] = it.t; // keyed by the English text itself
          }
        }
        done += batch.length;
        console.log(`  ${lang}: ${Math.min(done, missing.length)}/${missing.length}`);
        break;
      } catch (e) {
        console.warn(`  batch failed (attempt ${attempt + 1}):`, e.message);
        if (attempt === 2) console.warn('  skipping batch after 3 attempts');
        await new Promise(r => setTimeout(r, 20_000 * (attempt + 1)));
      }
    }
    fs.writeFileSync(path.join(OUT_DIR, `qidsData.${lang}.json`), JSON.stringify(dict, null, 1));
  }
  fs.writeFileSync(path.join(OUT_DIR, `qidsData.${lang}.json`), JSON.stringify(dict, null, 1));
  console.log(`${lang}: saved ${Object.keys(dict).length} entries`);
}

function dictHas(dict, text) {
  return Object.prototype.hasOwnProperty.call(dict, text);
}
console.log('bank translation pass complete');
