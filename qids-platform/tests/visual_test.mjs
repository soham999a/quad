import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import {
  TEST_FIRESTORE_DATA,
  TEST_AUTH_ADMIN,
  TEST_AUTH_EVALUATOR,
  TEST_AUTH_STUDENT,
} from './test-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots');

if (fs.existsSync(screenshotDir)) {
  fs.rmSync(screenshotDir, { recursive: true });
}
fs.mkdirSync(screenshotDir, { recursive: true });

const BASE = 'http://localhost:5173';

function isExpectedFirestoreWarning(text) {
  return text.includes('Firestore') ||
    text.includes('Could not reach') ||
    text.includes('ERR_FAILED') ||
    text.includes('offline mode');
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  let totalRealErrors = 0;

  // ── Role-based test scenarios (desktop, authenticated) ──
  const scenarios = [
    {
      label: 'ADMIN',
      auth: TEST_AUTH_ADMIN,
      viewport: { width: 1920, height: 1080 },
      pages: [
        { path: '/app/admin', name: 'admin-panel', check: 'Admin Panel' },
        { path: '/app/evaluator', name: 'admin-evaluator-dashboard', check: 'assigned student' },
        { path: '/app/dashboard', name: 'admin-dashboard', check: 'Dashboard' },
      ],
    },
    {
      label: 'EVALUATOR',
      auth: TEST_AUTH_EVALUATOR,
      viewport: { width: 1920, height: 1080 },
      pages: [
        { path: '/app/evaluator', name: 'evaluator-dashboard', check: 'assigned student' },
        { path: '/app/evaluator/assess/asm-pre-001', name: 'evaluator-scoring-eq', check: 'Back to' },
      ],
    },
    {
      label: 'STUDENT',
      auth: TEST_AUTH_STUDENT,
      viewport: { width: 1920, height: 1080 },
      pages: [
        { path: '/app/dashboard', name: 'student-dashboard', check: 'Dashboard' },
        { path: '/app/progress', name: 'progress', check: 'Progress' },
        { path: '/app/report', name: 'report', check: 'Report' },
        { path: '/app/my-evaluator', name: 'my-evaluator', check: 'Evaluator' },
      ],
    },
  ];

  // ── Responsive public pages ──
  const responsivePages = [
    { path: '/', name: 'landing' },
    { path: '/login', name: 'login' },
    { path: '/signup', name: 'signup' },
  ];

  const viewports = [
    { label: 'desktop', width: 1920, height: 1080 },
    { label: 'tablet', width: 1024, height: 768 },
    { label: 'mobile', width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedFirestoreWarning(msg.text())) {
        console.error(`  [${vp.label}] UNEXPECTED ERROR: ${msg.text()}`);
        totalRealErrors++;
      }
    });
    page.on('pageerror', err => {
      console.error(`  [${vp.label}] PAGE ERROR: ${err.message}`);
      totalRealErrors++;
    });

    for (const { path: route, name } of responsivePages) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 15000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, `${vp.label}_${name}.png`), fullPage: true });
        console.log(`  ✓ [${vp.label}] ${route}`);
      } catch (e) {
        console.log(`  ✗ [${vp.label}] ${route} — ${e.message.slice(0, 80)}`);
      }
    }

    await context.close();
  }

  // ── Authenticated scenario tests ──
  for (const scenario of scenarios) {
    console.log(`\n=== ${scenario.label} (${scenario.viewport.width}x${scenario.viewport.height}) ===`);
    const context = await browser.newContext({ viewport: scenario.viewport });
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedFirestoreWarning(msg.text())) {
        console.error(`  [${scenario.label}] UNEXPECTED ERROR: ${msg.text()}`);
        totalRealErrors++;
      }
    });
    page.on('pageerror', err => {
      console.error(`  [${scenario.label}] PAGE ERROR: ${err.message}`);
      totalRealErrors++;
    });

    await page.route(/googleapis\.com\//, route => route.abort());

    await page.addInitScript((data) => {
      window.__TEST_AUTH__ = data.auth;
      window.__FIRESTORE_DATA__ = data.firestore;
    }, { auth: scenario.auth, firestore: TEST_FIRESTORE_DATA });

    for (const { path: route, name, check } of scenario.pages) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 20000 });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(screenshotDir, `${scenario.label.toLowerCase()}_${name}.png`), fullPage: true });
        console.log(`  ✓ ${route} (${name})`);

        const bodyText = await page.evaluate(() => document.body.textContent);
        if (!bodyText.includes(check)) {
          console.log(`  ⚠  Expected "${check}" not found in page content`);
        }
      } catch (e) {
        console.log(`  ✗ ${route} — ${e.message.slice(0, 80)}`);
      }
    }

    await context.close();
  }

  await browser.close();

  const totalShots = fs.readdirSync(screenshotDir).length;
  console.log(`\n=== RESULTS ===`);
  console.log(`Screenshots: ${totalShots}`);
  console.log(`Unexpected errors: ${totalRealErrors}`);
  console.log(`Location: ${screenshotDir}`);

  if (totalRealErrors > 0) process.exit(1);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
