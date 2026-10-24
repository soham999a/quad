// ─── Design-token contrast audit ─────────────────────────────────────────────
// Parses the two theme blocks in src/index.css, converts oklch() → sRGB, and
// reports WCAG 2.2 contrast for every text-token / surface-token pairing the
// pages actually use.
//
//   node tests/token-contrast.mjs
//
// Exit code 1 if any pairing that is used as body text falls below 4.5:1.
// This measures the *tokens*, so one failure explains every page using them.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'src', 'index.css'), 'utf8');

/** Pull `--name: value;` declarations out of a CSS block starting at `marker`. */
function blockVars(marker) {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`block not found: ${marker}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  const body = css.slice(open + 1, close);
  const out = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

const dark = {
  ...blockVars('@theme {'),
  ...blockVars(':root {'),
};
const light = { ...dark, ...blockVars('[data-theme="light"] {') };

// ── oklch → sRGB ─────────────────────────────────────────────────────────────
function oklchToSrgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toOnes = (v) => Math.min(1, Math.max(0, v));
  const toSrgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
  return [toOnes(toSrgb(r)), toOnes(toSrgb(g)), toOnes(toSrgb(bl))];
}

/** Resolve a token value (oklch, hex, or var()) to [r,g,b] 0..1. */
function resolve(value, vars, depth = 0) {
  if (depth > 10) throw new Error('var() depth exceeded');
  const v = value.trim();

  const varRef = v.match(/^var\(--([\w-]+)(?:\s*,\s*([^)]+))?\)$/);
  if (varRef) {
    const next = vars[varRef[1]] ?? varRef[2];
    if (next == null) throw new Error(`unresolved var: --${varRef[1]}`);
    return resolve(next, vars, depth + 1);
  }

  const ok = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (ok) return oklchToSrgb(+ok[1], +ok[2], +ok[3]);

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }

  throw new Error(`unsupported color: ${v}`);
}

function luminance([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg, bg) {
  const a = luminance(fg), b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const hex = (rgb) =>
  '#' + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');

// ── Pairings the pages actually use ──────────────────────────────────────────
// `token` is the Tailwind class stem; `where` is the usage we found by grep.
const PAIRS = [
  { token: 'on-background',                 label: 'headings, primary text',      min: 4.5 },
  { token: 'foreground',                    label: 'body text',                   min: 4.5 },
  { token: 'on-surface-variant',            label: 'secondary text',              min: 4.5 },
  { token: 'muted-foreground',              label: 'meta, captions',              min: 4.5 },
  { token: 'surface-variant',               label: 'secondary text — 317 uses',   min: 4.5 },
  { token: 'primary',                       label: 'gold accent text',            min: 4.5 },
  { token: 'gold',                          label: 'gold accent text',            min: 4.5 },
  // `ink` is deliberately absent: it is "text on a gold fill", and after the
  // light-theme gold was darkened for text use no single value satisfies both
  // roles, so the one reachable ink-on-gold hover now uses text-background
  // (which inverts correctly by theme). No live call site uses text-ink.
  { token: 'slate',                         label: 'frame.jsx body',              min: 4.5 },
  { token: 'error',                         label: 'error text',                  min: 4.5 },
  { token: 'success',                       label: 'success text',                min: 4.5 },
  { token: 'warning',                       label: 'warning text',                min: 4.5 },
];

const SURFACES = [
  { name: 'background', key: 'color-background' },
  { name: 'surface',    key: 'color-surface' },
  { name: 'surface-2',  key: 'color-surface-2' },
];

function audit(themeName, vars) {
  const rows = [];
  for (const pair of PAIRS) {
    const key = `color-${pair.token}`;
    let fg;
    try {
      if (!vars[key]) continue;
      fg = resolve(vars[key], vars);
    } catch (err) {
      console.log(`  ! skipped ${pair.token}: ${err.message}`);
      continue;
    }
    const surfaces = pair.on
      ? pair.on.map((name) => ({ name, key: `color-${name}` }))
      : SURFACES;
    for (const s of surfaces) {
      const bg = resolve(vars[s.key], vars);
      const ratio = contrast(fg, bg);
      rows.push({
        token: pair.token,
        label: pair.label,
        surface: s.name,
        ratio,
        min: pair.min,
        pass: ratio >= pair.min,
        fgHex: hex(fg),
        bgHex: hex(bg),
      });
    }
  }
  return { themeName, rows };
}

const ORIGINAL = process.env.TOKEN_AUDIT_JSON;
let failed = 0;

for (const { themeName, rows } of [audit('dark', dark), audit('light', light)]) {
  console.log(`\n══ ${themeName.toUpperCase()} THEME ═══════════════════════════════════════`);
  console.log(
    'token'.padEnd(20) + 'surface'.padEnd(12) + 'fg'.padEnd(10) + 'bg'.padEnd(10) +
    'ratio'.padEnd(8) + 'need'.padEnd(6) + 'result'
  );
  for (const r of rows) {
    if (!r.pass) failed++;
    console.log(
      r.token.padEnd(20) +
      r.surface.padEnd(12) +
      r.fgHex.padEnd(10) +
      r.bgHex.padEnd(10) +
      r.ratio.toFixed(2).padEnd(8) +
      r.min.toFixed(1).padEnd(6) +
      (r.pass ? '✓' : '✗ FAIL')
    );
  }
}

console.log(
  `\n${failed === 0 ? '✓ all token pairings pass' : `✗ ${failed} pairing(s) below the threshold`}`
);
process.exit(failed === 0 ? 0 : 1);
