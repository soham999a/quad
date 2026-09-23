#!/usr/bin/env node
// ─── i18n extractor/codemod ──────────────────────────────────────────────────
// Phase 1 of the localization pipeline. Walks every page/component, extracts
// hardcoded UI strings (JSX text + aria-label/title/placeholder attributes +
// setError('...') calls), writes them into src/i18n/auto/en.auto.js under a
// file-keyed namespace, and REWRITES the source files to use t('ns.key').
//
// Safe-by-construction rules:
//   • Strings already inside t('...') calls are never re-extracted.
//   • Mixed text+expression JSX (e.g. `Good morning, {name}.`) is left for
//     manual conversion — splitting it would mangle sentence order.
//   • Module-scope strings (nav registries, data tables) are skipped.
//   • Class components are skipped (hooks don't apply).
//   • src/core/** (assessment content) is not in scope — that is phase 2 (AI).
//
// Idempotent: a second run finds (almost) nothing new.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

const { parseSync: parse } = require('@babel/core');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const AUTO_DIR = path.join(SRC, 'i18n', 'auto');
const OUT_EN = path.join(AUTO_DIR, 'en.auto.js');

const TARGET_DIRS = ['src/pages', 'src/components'];
const SKIP_FILES = new Set([
  'src/App.jsx',
  'src/components/LanguageSwitcher.jsx',
  'src/components/PublicCredentialShell.jsx',
]);
const ATTRS = new Set(['aria-label', 'title', 'placeholder']);
const CALLEES = new Set(['setError']);
const FN_TYPES = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ClassMethod'];

const dict = {};
let extracted = 0, moduleScopeSkips = 0, mixedSkips = 0, classSkips = 0;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(jsx|tsx)$/.test(e.name) ? [p] : [];
  });
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split(/\s+/)
    .slice(0, 4).join('_').slice(0, 40).replace(/_+$/, '') || 'text';
}

function keyFor(ns, text) {
  let base = `${ns}.${slug(text)}`;
  if (!(base in dict)) { dict[base] = text; return base; }
  if (dict[base] === text) return base;
  let i = 2;
  while (`${base}_${i}` in dict && dict[`${base}_${i}`] !== text) i += 1;
  const k = `${base}_${i}`;
  dict[k] = text;
  return k;
}

function hasUseTranslationT(fnNode) {
  // True if the function body already declares `t` from useTranslation().
  const body = fnNode.body;
  if (!body || !Array.isArray(body.body)) return false;
  return body.body.some(st =>
    t.isVariableDeclaration(st) &&
    st.declarations.some(d =>
      t.isCallExpression(d.init) &&
      t.isIdentifier(d.init.callee) &&
      d.init.callee.name === 'useTranslation' &&
      t.isObjectPattern(d.id) &&
      d.id.properties.some(pr => t.isObjectProperty(pr) &&
        ((t.isIdentifier(pr.key) && pr.key.name === 't') ||
         (t.isStringLiteral(pr.key) && pr.key.value === 't')))),
  );
}

const files = TARGET_DIRS.flatMap(d => walk(path.join(ROOT, d)))
  .map(f => path.relative(ROOT, f).replace(/\\/g, '/'))
  .filter(rel => !SKIP_FILES.has(rel));

const report = [];

for (const rel of files) {
  const file = path.join(ROOT, rel);
  const code = fs.readFileSync(file, 'utf8');
  const ns = path.basename(rel).replace(/\.(jsx|tsx)$/, '');

  let ast;
  try {
    const isTs = /\.tsx$/.test(rel);
    ast = parse(code, {
      filename: rel, babelrc: false, configFile: false,
      parserOpts: { sourceType: 'module', plugins: ['jsx', 'classProperties', ...(isTs ? ['typescript'] : [])] },
    });
  } catch (e) { console.error(`PARSE FAIL ${rel}: ${e.message}`); continue; }

  const hits = [];           // { path, key, kind }
  const fnStack = [];        // enclosing function nodes
  const fnsNeedingT = new Set();

  traverse(ast, {
    [FN_TYPES.join('|')]: {
      enter(p) { fnStack.push(p.node); },
      exit() { fnStack.pop(); },
    },
    JSXText(p) {
      const text = p.node.value.replace(/\s+/g, ' ').trim();
      if (!text || !/[A-Za-z\u0900-\u097F\u0980-\u09FF]/.test(text)) return;
      const fn = fnStack[fnStack.length - 1];
      if (!fn || t.isClassMethod(fn)) { moduleScopeSkips += fn ? 0 : 1; if (fn) classSkips += 1; return; }
      // Mixed text + expression children: skip to avoid mangling sentences.
      const parent = p.parent;
      if (t.isJSXElement(parent)) {
        const meaningful = parent.children.filter(c => !t.isJSXText(c) || c.value.trim() !== '');
        const hasExpr = parent.children.some(c => t.isJSXExpressionContainer(c));
        if (meaningful.length > 1 && hasExpr) { mixedSkips += 1; return; }
      }
      hits.push({ p, key: keyFor(ns, text), kind: 'text' });
      fnsNeedingT.add(fn);
    },
    JSXAttribute(p) {
      const name = p.node.name && (p.node.name.name || p.node.name.nameText);
      if (!ATTRS.has(name)) return;
      if (!p.node.value || !t.isStringLiteral(p.node.value)) return;
      const text = p.node.value.value.replace(/\s+/g, ' ').trim();
      if (!text || !/[A-Za-z]/.test(text)) return;
      if (/^[\w-]+\.(png|svg|jpg|ico)$/.test(text)) return;
      const fn = fnStack[fnStack.length - 1];
      if (!fn || t.isClassMethod(fn)) { fn ? classSkips++ : moduleScopeSkips++; return; }
      hits.push({ p, key: keyFor(ns, text), kind: 'attr' });
      fnsNeedingT.add(fn);
    },
    CallExpression(p) {
      const name = t.isIdentifier(p.node.callee) && p.node.callee.name;
      if (!CALLEES.has(name)) return;
      const a0 = p.node.arguments[0];
      if (!a0 || !t.isStringLiteral(a0)) return;
      const text = a0.value.replace(/\s+/g, ' ').trim();
      if (!text || !/[A-Za-z]/.test(text)) return;
      const fn = fnStack[fnStack.length - 1];
      if (!fn || t.isClassMethod(fn)) { fn ? classSkips++ : moduleScopeSkips++; return; }
      hits.push({ p, key: keyFor(ns, text), kind: 'call' });
      fnsNeedingT.add(fn);
    },
  });

  if (hits.length === 0) continue;

  // Inject `const { t } = useTranslation();` at AST level (before generate).
  for (const fn of fnsNeedingT) {
    if (!fn.body || !Array.isArray(fn.body.body)) continue;
    if (hasUseTranslationT(fn)) continue;
    fn.body.body.unshift(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.objectPattern([t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)]),
          t.callExpression(t.identifier('useTranslation'), []),
        ),
      ]),
    );
  }

  // Rewrite the string nodes.
  for (const { p, key, kind } of hits) {
    const call = t.callExpression(t.identifier('t'), [t.stringLiteral(key)]);
    if (kind === 'text') {
      p.replaceWith(t.jsxExpressionContainer(call));
    } else if (kind === 'attr') {
      p.node.value = t.jsxExpressionContainer(call);
    } else {
      p.node.arguments[0] = call;
    }
  }

  let out = generate(ast, { retainLines: false, comments: true }).code;
  if (!/from ['"]react-i18next['"]/.test(code)) {
    out = `import { useTranslation } from 'react-i18next';\n${out}`;
  }
  fs.writeFileSync(file, out);
  extracted += hits.length;
  report.push(`${rel}: +${hits.length} strings, t() in ${fnsNeedingT.size} scope(s)`);
}

fs.mkdirSync(AUTO_DIR, { recursive: true });
const sorted = Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT_EN,
  `// AUTO-GENERATED by scripts/i18n-extract.mjs — do not edit by hand.\n` +
  `// Rerun the extractor after page edits; new strings are appended.\n` +
  `export default ${JSON.stringify(sorted, null, 2)};\n`);

console.log(report.join('\n'));
console.log(`\nStrings extracted: ${extracted}`);
console.log(`Skipped: mixed-text ${mixedSkips} · module-scope ${moduleScopeSkips} · class ${classSkips}`);
console.log(`English dictionary: ${Object.keys(sorted).length} keys → src/i18n/auto/en.auto.js`);
