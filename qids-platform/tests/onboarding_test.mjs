import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import {
  TEST_FIRESTORE_DATA,
  TEST_AUTH_STUDENT,
  TEST_AUTH_NEW,
} from './test-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5173';

let failures = 0;

function check(cond, label) {
  console.log(`  ${cond ? '✓' : '✗'} ${label}`);
  if (!cond) failures++;
}

function isExpectedFirestoreWarning(text) {
  return text.includes('Firestore') ||
    text.includes('Could not reach') ||
    text.includes('ERR_FAILED') ||
    text.includes('offline mode') ||
    text.includes('Could not update profile') ||
    text.includes('saveOnboarding failed') ||
    text.includes('getOnboarding failed');
}

async function newPage(browser, auth) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', err => { console.error('  PAGE ERROR:', err.message); failures++; });
  page.on('console', msg => {
    if (msg.type() === 'error' && !isExpectedFirestoreWarning(msg.text())) {
      console.error('  CONSOLE ERROR:', msg.text());
      failures++;
    }
  });
  await page.route(/googleapis\.com\//, r => r.abort());
  await page.addInitScript((data) => {
    window.__TEST_AUTH__ = data.auth;
    window.__FIRESTORE_DATA__ = data.firestore;
  }, { auth, firestore: TEST_FIRESTORE_DATA });
  return { context, page };
}

async function finalPath(page) {
  return page.evaluate(() => window.location.pathname);
}

async function gotoAwait(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(1800);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  console.log('\n=== A · Existing user passes gate → persona home ===');
  {
    const { context, page } = await newPage(browser, TEST_AUTH_STUDENT); // student-001 has assessments
    // Direct route: gate must pass (no redirect to /onboarding).
    await gotoAwait(page, '/app/dashboard');
    check(await finalPath(page) === '/app/dashboard', 'direct /app/dashboard renders (gate passes)');
    // Index: persona-home redirect should land an individual on their assessment hub.
    await gotoAwait(page, '/app');
    const p = await finalPath(page);
    check(p === '/app/individual', `index → persona home (/app/individual), got ${p}`);
    const body = await page.evaluate(() => document.body.textContent);
    check(/onboarding/i.test(body) === false, 'not redirected to /onboarding');
    await page.screenshot({ path: `${__dirname}\\screenshots\\onboard_established.png`, fullPage: true });
    await context.close();
  }

  console.log('\n=== B · Brand-new user blocked → onboarding wizard ===');
  {
    const { context, page } = await newPage(browser, TEST_AUTH_NEW); // no assessments
    await gotoAwait(page, '/app/dashboard');
    const p = await finalPath(page);
    check(p === '/onboarding', `redirected to /onboarding, got ${p}`);
    const body = await page.evaluate(() => document.body.textContent);
    check(/Where should development/.test(body), 'wizard step 1 rendered');
    await page.screenshot({ path: `${__dirname}\\screenshots\\onboard_new_user.png`, fullPage: true });
    await context.close();
  }

  console.log('\n=== C · Wizard step-enable wiring (new user) ===');
  {
    const { context, page } = await newPage(browser, TEST_AUTH_NEW);
    await gotoAwait(page, '/onboarding');
    const stepLabel = await page.evaluate(() => document.body.textContent);
    check(/CONTEXT/.test(stepLabel), 'step 01 · CONTEXT active');

    // Continue is disabled until a context is selected.
    const disabledBefore = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Continue/.test(b.textContent));
      return btn ? btn.disabled : null;
    });
    check(disabledBefore === true, 'Continue disabled before choice');

    // Select the first context card then Continue should enable.
    const clicked = await page.evaluate(() => {
      const card = document.querySelector('button.card');
      if (card) { card.click(); return true; }
      return false;
    });
    check(clicked, 'first context card clickable');

    const disabledAfter = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Continue/.test(b.textContent));
      return btn ? btn.disabled : null;
    });
    check(disabledAfter === false, 'Continue enabled after choice');
    await page.screenshot({ path: `${__dirname}\\screenshots\\onboard_step1_selected.png`, fullPage: true });

    // Advance to step 02 · ROLE.
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /Continue/.test(b.textContent));
      if (btn) btn.click();
    });
    await page.waitForTimeout(600);
    const roleLabel = await page.evaluate(() => document.body.textContent);
    check(/ROLE/.test(roleLabel), 'advanced to step 02 · ROLE');
    await context.close();
  }

  await browser.close();

  console.log(`\n=== RESULTS ===`);
  console.log(failures === 0 ? 'ONBOARDING FLOW OK' : `FAILURES: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
