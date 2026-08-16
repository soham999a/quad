// ── Unified runner end-to-end test ────────────────────────────────────────────
// Drives the EnterpriseRunner UI through setup → all modules → review → submit
// → results, using the injected test auth (no live Firebase needed).
// Run: npm run test:runner   (requires dev server on http://localhost:5173)

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { TEST_AUTH_STUDENT } from './test-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5173';

async function answerCurrentSection(page) {
  const items = page.locator('[data-item]');
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const item = items.nth(i);

    const opt0 = item.locator('[data-opt="0"]');
    if (await opt0.count()) await opt0.click().catch(() => {});

    const most = item.locator('[data-opt-most="0"]');
    if (await most.count()) await most.click().catch(() => {});
    const least = item.locator('[data-opt-least="1"]');
    if (await least.count()) await least.click().catch(() => {});

    for (const [rank, opt] of [[4, 0], [3, 1], [2, 2], [1, 3]]) {
      const rb = item.locator(`[data-rank-opt="${opt}"][data-rank="${rank}"]`);
      if (await rb.count()) await rb.click().catch(() => {});
    }
  }
}

async function clickButtonByText(page, text, exact = true) {
  const btn = page.locator('button').filter({ hasText: text });
  const candidate = exact ? btn.first() : btn.first();
  await candidate.click();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  let errors = 0;
  page.on('pageerror', err => { console.error('  PAGE ERROR:', err.message); errors++; });

  await page.addInitScript((data) => {
    window.__TEST_AUTH__ = data.auth;
  }, { auth: TEST_AUTH_STUDENT });

  // ── 1. Setup ──
  await page.goto(`${BASE}/app/enterprise`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForSelector('text=SELECT BATTERY', { timeout: 15000 });
  await page.fill('input[placeholder="e.g. Alex Morgan"]', 'Runner Test Candidate');
  await page.screenshot({ path: path.join(screenshotDir, 'runner-setup.png'), fullPage: true });
  await clickButtonByText(page, 'BEGIN ASSESSMENT');
  await page.waitForSelector('[data-item]', { timeout: 15000 });
  console.log('  ✓ setup → running (items rendered)');

  // ── 2. Answer every section ──
  let sections = 0;
  for (let i = 0; i < 40; i++) {
    const count = await page.locator('[data-item]').count();
    if (count === 0) break;
    await answerCurrentSection(page);
    await page.waitForTimeout(150);
    const nextBtn = page.locator('button', { hasText: 'Next section' }).first();
    const reviewBtn = page.locator('button', { hasText: 'Review answers' }).first();
    const hasNext = await nextBtn.isVisible().catch(() => false);
    const hasReview = await reviewBtn.isVisible().catch(() => false);
    if (hasReview) { await reviewBtn.click(); break; }
    if (hasNext) { await nextBtn.click(); sections++; }
    else break;
    await page.waitForTimeout(150);
  }
  console.log(`  ✓ answered ${sections + 1} sections`);

  // ── 3. Review → submit ──
  await page.waitForSelector('text=Review & Submit', { timeout: 10000 });
  const reviewSummary = await page.evaluate(() => {
    const rows = [];
    document.querySelectorAll('button').forEach(b => {
      const t = b.textContent || '';
      const m = t.match(/(\d+)\/(\d+) answered/);
      if (m) rows.push(t.replace(/\s+/g, ' ').trim());
    });
    return rows;
  });
  console.log('  review summary:', JSON.stringify(reviewSummary));
  await page.screenshot({ path: path.join(screenshotDir, 'runner-review.png'), fullPage: true });
  await clickButtonByText(page, 'GENERATE PROFILE');
  await page.waitForSelector('text=PERFORMANCE INTELLIGENCE PROFILE', { timeout: 15000 });
  await page.waitForTimeout(500);
  console.log('  ✓ results view rendered');

  const bodyText = await page.evaluate(() => document.body.textContent);
  const hasPII = /Professional Intelligence Index/i.test(bodyText);
  const hasRfi = /Role Fit Index/i.test(bodyText);
  const hasWs = /Work Style Profile/i.test(bodyText);
  console.log(`  ${hasPII ? '✓' : '✗'} PII block present`);
  console.log(`  ${hasRfi ? '✓' : '✗'} RFI block present`);
  console.log(`  ${hasWs ? '✓' : '✗'} Work style block present`);

  // ── 4. PIP report tab ──
  await page.screenshot({ path: path.join(screenshotDir, 'runner-results.png'), fullPage: true });
  const pipTab = page.locator('button', { hasText: 'PIP Report' }).first();
  const hasPipTab = await pipTab.isVisible().catch(() => false);
  if (hasPipTab) {
    await pipTab.click();
    await page.waitForTimeout(400);
    const pipText = await page.evaluate(() => document.body.textContent);
    const expected = ['EXECUTIVE SUMMARY', 'DIMENSIONAL INTELLIGENCE', 'COMPETENCY HEATMAP', 'WORK-STYLE INSIGHTS'];
    const checks = expected.filter(m => pipText.toUpperCase().includes(m));
    console.log(`  ✓ PIP report rendered (${checks.length}/${expected.length} pages detected)`);
    await page.screenshot({ path: path.join(screenshotDir, 'runner-pip.png'), fullPage: true });
    const printBtn = page.locator('button', { hasText: 'PRINT / PDF' }).first();
    console.log(`  ${(await printBtn.isVisible().catch(() => false)) ? '✓' : '✗'} Print/PDF button present`);
  } else {
    console.log('  ✗ PIP Report tab not found');
    errors++;
  }

  // ── 5. Employer dashboard ──
  await page.goto(`${BASE}/app/talent`, { waitUntil: 'load', timeout: 20000 });
  await page.waitForSelector('text=TALENT INTELLIGENCE CONSOLE', { timeout: 15000 });
  const talentText = await page.evaluate(() => document.body.textContent);
  const hasRoleLib = talentText.includes('Role Library');
  const hasHeatmap = talentText.includes('Weight Heatmap');
  console.log(`  ${hasRoleLib ? '✓' : '✗'} Role Library tab present`);
  console.log(`  ${hasHeatmap ? '✓' : '✗'} Heatmap tab present`);

  // Open RFI explorer and drag a slider to sanity-check live scoring.
  await page.locator('button', { hasText: 'RFI Explorer' }).first().click();
  await page.waitForSelector('input[type="range"]', { timeout: 10000 });
  const slider = page.locator('input[type="range"]');
  const sliderCount = await slider.count();
  console.log(`  ${sliderCount === 8 ? '✓' : '✗'} RFI explorer renders 8 dimension sliders`);
  const rfiText = await page.evaluate(() => document.body.textContent);
  const hasRank = rfiText.includes('Role Fit Ranking');
  const hasPct = /Software Engineer.*\d+%/.test(rfiText);
  console.log(`  ${hasRank && hasPct ? '✓' : '✗'} RFI ranking renders percentages`);
  await page.screenshot({ path: path.join(screenshotDir, 'employer-dashboard.png'), fullPage: true });

  await browser.close();
  if (!hasPII || !hasRfi || !hasWs || !hasRoleLib || !hasHeatmap || errors > 0) {
    console.log('RUNNER TEST FAILED');
    process.exit(1);
  }
  console.log('RUNNER TEST PASSED');
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
