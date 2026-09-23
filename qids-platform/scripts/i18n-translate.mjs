#!/usr/bin/env node
// ─── i18n translation seeder ─────────────────────────────────────────────────
// Phase 2 of the localization pipeline. Takes auto/en.auto.js and produces
// auto/hi.auto.js, auto/bn.auto.js, auto/mr.auto.js via Groq (JSON mode).
//
// Design:
//   • Batches of ~45 strings per request → few requests, reliable JSON.
//   • Idempotent + resumable: existing keys are kept, only missing ones are
//     fetched. A failed batch logs and stops without corrupting prior work.
//   • Placeholder-safe: translations that lose a {{placeholder}} are replaced
//     with the English string (never render broken interpolations).
//   • Reads GROQ_API_KEY from the environment or qids-platform/.env.
//
// Usage: node scripts/i18n-translate.mjs [--lang=hi,bn,mr] [--batch=45]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

const ROOT = process.cwd();
const AUTO_DIR = path.join(ROOT, 'src', 'i18n', 'auto');
const EN_FILE = path.join(AUTO_DIR, 'en.auto.js');

const LANGS = {
  hi: 'Hindi (Devanagari script)',
  bn: 'Bengali (Bengali script)',
  mr: 'Marathi (Devanagari script)',
};

const args = process.argv.slice(2);
const langArg = args.find(a => a.startsWith('--lang='))?.split('=')[1];
const batchArg = Number(args.find(a => a.startsWith('--batch='))?.split('=')[1]) || 12;
const targets = langArg ? langArg.split(',') : Object.keys(LANGS);

// ── Load Groq key: env first, then qids-platform/.env ────────────────────────
function loadKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    // The local .env exposes the Groq key to Vite as VITE_GROQ_API_KEY —
    // accept either name (build scripts never ship to the client).
    const m = text.match(/^(?:VITE_)?GROQ_API_KEY\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

const KEY = loadKey();
if (!KEY) {
  console.error('GROQ_API_KEY not found (env or .env). Cannot run translation.');
  process.exit(1);
}

// ── Load English source of truth ─────────────────────────────────────────────
const enAuto = (await import(pathToFileURL(EN_FILE).href)).default;
const enKeys = Object.keys(enAuto);
console.log(`English source: ${enKeys.length} strings`);

async function groqChat(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.15,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

function extractPlaceholders(s) {
  return (s.match(/\{\{[^}]+\}\}/g) || []).sort();
}

async function translateBatch(dict, targetLang, label, entries) {
  const sys = [
    `You are a professional localizer for QiDS, a psychometric assessment web platform used by schools, counselors, and employers in India.`,
    `Translate UI strings from English into ${label}.`,
    `Rules:`,
    `1. Natural, warm, professional product UI language — never word-for-word literal.`,
    `2. Keep every {{placeholder}} EXACTLY as-is (e.g. {{name}} must appear in the output).`,
    `3. Keep proper nouns and technical marks in Latin script: QiDS, IQ, EQ, SQ, AQ, QGRA+, PDF, CSV, Ctrl, Shift, ⌘, K.`,
    `4. Keep it short — these are buttons, labels, headings, tooltips. Prefer the natural term students/teachers use.`,
    `5. Educational terms: use the standard school vocabulary of the target language.`,
    `6. Output STRICT JSON: an object with the same keys, values = translated strings. No commentary.`,
  ].join('\n');

  const user = JSON.stringify(Object.fromEntries(entries));
  const raw = await groqChat([
    { role: 'system', content: sys },
    { role: 'user', content: user },
  ]);

  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    // Retry once with a sterner instruction on the exact failure.
    const raw2 = await groqChat([
      { role: 'system', content: sys + '\nYour previous output was not valid JSON. Return ONLY the JSON object.' },
      { role: 'user', content: user },
    ]);
    parsed = JSON.parse(raw2);
  }

  let kept = 0, fellBack = 0;
  for (const [k, en] of entries) {
    const val = parsed[k];
    if (typeof val !== 'string' || !val.trim()) { dict[k] = en; fellBack += 1; continue; }
    const need = extractPlaceholders(en);
    const got = extractPlaceholders(val);
    if (need.join('|') !== got.join('|')) { dict[k] = en; fellBack += 1; continue; }
    dict[k] = val.trim();
    kept += 1;
  }
  console.log(`  ${label}: batch ok — ${kept} translated, ${fellBack} fell back to English`);
}

async function run() {
  let delay = 1500;
  for (const lang of targets) {
    const label = LANGS[lang];
    if (!label) { console.error(`Unknown language: ${lang}`); continue; }
    const outFile = path.join(AUTO_DIR, `${lang}.auto.js`);
    const dict = fs.existsSync(outFile)
      ? (await import(`${pathToFileURL(outFile).href}?t=${Date.now()}`)).default
      : {};
    const missing = enKeys.filter(k => !(k in dict));
    console.log(`\n${lang} → ${missing.length} missing of ${enKeys.length}`);

    for (let i = 0; i < missing.length; i += batchArg) {
      const chunk = missing.slice(i, i + batchArg)
        .map(k => [k, enAuto[k]]);
      let attempt = 0;
      for (;;) {
        try {
          await translateBatch(dict, lang, label, chunk);
          break;
        } catch (e) {
          attempt += 1;
          const isRate = /429|rate/i.test(e.message);
          if (isRate && attempt <= 4) {
            // TPM windows are per-minute; wait generously and retry the same batch.
            const wait = 15000 * attempt;
            console.log(`  rate-limited; waiting ${wait / 1000}s (attempt ${attempt})…`);
            await new Promise(r => setTimeout(r, wait));
            continue;
          }
          console.error(`  batch failed (${e.message}); saving progress and stopping ${lang}.`);
          attempt = Infinity; break;
        }
      }
      if (attempt === Infinity) break;
      // Persist after every batch → resumable.
      fs.writeFileSync(outFile,
        `// AUTO-GENERATED by scripts/i18n-translate.mjs — do not edit by hand.\n` +
        `export default ${JSON.stringify(dict, null, 2)};\n`);
      await new Promise(r => setTimeout(r, delay));
    }

    const done = enKeys.filter(k => k in dict).length;
    console.log(`${lang}: ${done}/${enKeys.length} complete → ${path.relative(ROOT, outFile)}`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
