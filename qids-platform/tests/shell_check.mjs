import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { TEST_AUTH_STUDENT, TEST_FIRESTORE_DATA } from './test-data.js';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(([auth, data]) => {
  window.__TEST_AUTH__ = auth;
  window.__FIRESTORE_DATA__ = data;
}, [TEST_AUTH_STUDENT, TEST_FIRESTORE_DATA]);

const page = await ctx.newPage();
await page.route(/googleapis\.com\//, r => r.abort());
await page.goto(`${BASE}/app/dashboard`, { waitUntil: 'load', timeout: 20000 });
await page.waitForSelector('.desktop-sidebar', { timeout: 15000 });
await page.waitForTimeout(800);

const checks = await page.evaluate(() => {
  const bb = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
  const topbar = bb(document.querySelector('.topbar'));
  const sidebar = bb(document.querySelector('.desktop-sidebar'));
  const content = bb(document.querySelector('.app-content'));
  const hamburger = bb(document.querySelector('.topbar-nav button[aria-label]'));
  const mode = bb(document.querySelector('.topbar .status-dot-pulse')?.closest('div'));
  const brand = bb(document.querySelector('.topbar-nav [aria-label]'));
  const main = bb(document.querySelector('main'));
  const btn = document.querySelector('.topbar-nav button[aria-label]');
  return {
    topbar, sidebar, content, hamburger, mode,
    topbarHasOnlyOneNavButton: document.querySelectorAll('.topbar-nav button').length === 1,
    buttonTitle: btn?.getAttribute('title'),
    noOldCollapseBtn: !document.querySelector('.desktop-sidebar button[aria-label="Collapse sidebar"]') &&
      !document.querySelector('.desktop-sidebar button[aria-label="Expand sidebar"]'),
    hamburgerInsideTopbarLeftBand: hamburger.x >= content.x && hamburger.y === topbar.y + (topbar.h - hamburger.h) / 2,
    hamburgerVerticallyCentered: hamburger.y === topbar.y + Math.round((topbar.h - hamburger.h) / 2),
    sidebarRightAtContentLeft: sidebar.x + sidebar.w === content.x,
    contentDoesNotOverflowViewport: content.x + content.w <= window.innerWidth,
  };
});

console.log(JSON.stringify({ checks }, null, 2));

await page.click('.topbar-nav button[aria-label]');
await page.waitForTimeout(500);
const collapsed = await page.evaluate(() => {
  const sidebar = document.querySelector('.desktop-sidebar').getBoundingClientRect();
  const content = document.querySelector('.app-content').getBoundingClientRect();
  return {
    sidebarWidth: Math.round(sidebar.width),
    contentMarginLeft: Math.round(content.left),
    shellHasClass: document.querySelector('.flex.min-h-screen').classList.contains('shell-collapsed'),
  };
});
console.log('collapsed ->', JSON.stringify(collapsed));

await page.click('.topbar-nav button[aria-label]');
await page.waitForTimeout(500);
const expanded = await page.evaluate(() => {
  const sidebar = document.querySelector('.desktop-sidebar').getBoundingClientRect();
  const content = document.querySelector('.app-content').getBoundingClientRect();
  return {
    sidebarWidth: Math.round(sidebar.width),
    contentMarginLeft: Math.round(content.left),
    shellHasClass: document.querySelector('.flex.min-h-screen').classList.contains('shell-collapsed'),
  };
});
console.log('expanded  ->', JSON.stringify(expanded));

await browser.close();