#!/usr/bin/env node
// ─── Rules-of-Hooks repair ───────────────────────────────────────────────────
// The i18n codemod injected `const { t } = useTranslation();` inside render
// callbacks (.map/IIFE), event handlers, and conditional blocks — all illegal.
// This script: (1) deletes each illegal call, (2) ensures the nearest legal
// owning component has exactly one top-level `const { t } = useTranslation();`,
// (3) adds the react-i18next import if a file needs one. AST-driven, idempotent.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const req = createRequire(process.cwd() + '/package.json');
const parser = req('@babel/parser');

const LEGAL = (n) => !!n && (/^[A-Z]/.test(n) || /^use[A-Z]/.test(n) || n === 'useAuth' || n === 'useToast');

const files = [];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') scan(p); }
    else if (/\.[jt]sx?$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
})('src');

let fixedCount = 0, fileCount = 0;
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try { ast = parser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); }
  catch (e) { console.log('PARSE-FAIL', file, e.message.slice(0, 60)); continue; }

  const edits = []; // { start, end, text }
  const ownersDone = new Set();
  const manual = [];

  function walk(n, fnStack, curVD) {
    if (!n || typeof n !== 'object' || typeof n.type !== 'string') return;

    if (n.type === 'VariableDeclaration') {
      for (const d of n.declarations) walk(d, fnStack, n);
      walkRest(n, ['declarations'], fnStack, curVD);
      return;
    }

    let pushed = null;
    if (n.type === 'FunctionDeclaration') {
      pushed = { node: n, name: n.id ? n.id.name : null };
      fnStack.push(pushed);
    } else if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init &&
      (n.init.type === 'ArrowFunctionExpression' || n.init.type === 'FunctionExpression')) {
      pushed = { node: n.init, name: n.id.name };
      fnStack.push(pushed);
      walk(n.init, fnStack, curVD);
      fnStack.pop();
      walkRest(n, ['init'], fnStack, curVD);
      return;
    } else if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && n.right &&
      (n.right.type === 'ArrowFunctionExpression' || n.right.type === 'FunctionExpression')) {
      pushed = { node: n.right, name: n.left.name };
      fnStack.push(pushed);
      walk(n.right, fnStack, curVD);
      fnStack.pop();
      walkRest(n, ['right'], fnStack, curVD);
      return;
    }

    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === 'useTranslation') {
      const near = fnStack[fnStack.length - 1] || null;
      const legal = near && LEGAL(near.name) && curVD &&
        near.node.body && near.node.body.type === 'BlockStatement' &&
        near.node.body.body.includes(curVD) && curVD.declarations.length === 1 &&
        curVD.declarations[0].id.type === 'ObjectPattern' &&
        curVD.declarations[0].id.properties.some(p => p.type === 'ObjectProperty' &&
          ((p.key.type === 'Identifier' && p.key.name === 't') || (p.key.type === 'StringLiteral' && p.key.value === 't')));

      if (!legal) {
        // owner = nearest legal named function up the stack
        let owner = null;
        for (let i = fnStack.length - 1; i >= 0; i--) {
          if (LEGAL(fnStack[i].name)) { owner = fnStack[i]; break; }
        }
        if (!owner || !curVD) { manual.push(n.loc.start.line); }
        else if (!owner.node.body || owner.node.body.type !== 'BlockStatement') {
          manual.push(n.loc.start.line + ' (concise-arrow owner)');
        }
        else {
          // delete the illegal declaration (only safe for single-declarator statements)
          if (curVD.declarations.length === 1) {
            edits.push({ start: curVD.start, end: curVD.end, text: '' });
          } else {
            manual.push(n.loc.start.line + ' (multi-declarator)');
          }
          // ensure top-level hook in owner
          const body = owner.node.body;
          const hasTop = body.body.some(st =>
            st.type === 'VariableDeclaration' &&
            st.declarations.some(d =>
              d.id.type === 'ObjectPattern' &&
              d.id.properties.some(p => p.type === 'ObjectProperty' &&
                ((p.key.type === 'Identifier' && p.key.name === 't') || (p.key.type === 'StringLiteral' && p.key.value === 't'))) &&
              d.init && d.init.type === 'CallExpression' && d.init.callee.name === 'useTranslation'));
          if (!hasTop && !ownersDone.has(owner.node)) {
            ownersDone.add(owner.node);
            edits.push({ start: body.start + 1, end: body.start + 1, text: '\n  const { t } = useTranslation();' });
          }
          fixedCount++;
        }
      }
    }

    walkRest(n, pushed && n.type === 'FunctionDeclaration' ? ['id', 'params'] : (pushed ? ['id', 'params', 'body'] : null), fnStack, curVD);
    if (pushed) fnStack.pop();
  }

  function walkRest(n, skipKeys, fnStack, curVD) {
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments') continue;
      if (skipKeys && skipKeys.includes(k)) continue;
      const v = n[k];
      if (Array.isArray(v)) { for (const c of v) walk(c, fnStack, curVD); }
      else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v, fnStack, curVD);
    }
  }

  walk(ast, [], null);

  if (manual.length) console.log('MANUAL', file, manual.join(','));
  if (!edits.length) continue;

  // import check
  if (!/from ['"]react-i18next['"]/.test(code)) {
    edits.push({ start: 0, end: 0, text: "import { useTranslation } from 'react-i18next';\n" });
  }
  edits.sort((a, b) => b.start - a.start);
  let out = code;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  fs.writeFileSync(file, out);
  fileCount++;
  console.log('FIXED', file, `(${edits.length} edits)`);
}
console.log(`\n${fixedCount} violations repaired across ${fileCount} files`);
