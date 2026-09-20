// ─── Credential share metadata (Vercel serverless function) ───────────────────
// Serves the SPA's index.html but with og:/twitter: meta tags injected from the
// publicCredentials doc — so shared /credential/:id links preview with the
// person's name, grade and pillars on LinkedIn / WhatsApp / X instead of a bare URL.
//
// Rewritten from vercel.json:  /credential/:id  ->  /credential-meta?id=:id
// Human visitors get the same injected HTML; the SPA hydrates normally and
// fetches the doc client-side as before. Crawlers that never run JS still see
// real content.

import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

function fbAdmin() {
  if (getApps().length === 0) {
    initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  return getApp();
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadIndexHtml() {
  // Vercel builds the SPA into the repo root's dist/ (outputDirectory in vercel.json).
  try {
    return readFileSync(join(__dirname, '..', 'dist', 'index.html'), 'utf8');
  } catch {
    try {
      return readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
    } catch {
      return null;
    }
  }
}

function esc(s) {
  return String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

const GRADE_LABEL = { A: 'A · Exceptional', B: 'B · Advanced', C: 'C · Proficient', D: 'D · Developing', E: 'E · Emerging' };

export default async function handler(req, res) {
  const html = loadIndexHtml();
  if (!html) return res.status(200).send('<!doctype html><title>QIDS</title>');

  const id = String(req.query.id || '');
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  if (!safeId) return res.status(200).send(html);

  let cred = null;
  try {
    const snap = await getFirestore(fbAdmin()).collection('publicCredentials').doc(safeId).get();
    if (snap.exists) cred = snap.data();
  } catch (e) {
    console.error('credential-meta lookup failed:', e.message);
  }

  if (!cred) return res.status(200).send(html);

  const name = cred.displayName || 'A QIDS member';
  const grade = GRADE_LABEL[cred.grade] || (cred.grade ? `Grade ${cred.grade}` : null);
  const pillars = cred.pillarScores
    ? Object.entries(cred.pillarScores).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v)}`).join(' · ')
    : null;
  const bits = [grade, pillars].filter(Boolean).join(' — ');
  const title = `${esc(name)} — Verified QIDS Profile${cred.grade ? ` (Grade ${esc(cred.grade)})` : ''}`;
  const description = bits
    ? `${esc(name)} scored ${bits} on the QIDS Quadrant Intelligence assessment. Verify this credential.`
    : `${esc(name)} holds a verified QIDS Quadrant Intelligence credential. Verify it here.`;
  const url = `https://${(req.headers.host || 'qids.app').replace(/^https?:\/\//, '')}/credential/${safeId}`;

  const meta = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="QIDS" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />`;

  // Inject right before </head> so our tags win over the static defaults.
  const injected = html.includes('</head>') ? html.replace('</head>', `${meta}\n  </head>`) : html;
  res.status(200).send(injected);
}
