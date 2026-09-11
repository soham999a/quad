import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { TEST_FIRESTORE_DATA, TEST_AUTH_STUDENT } from './test-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'laptop-shots');
if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
fs.mkdirSync(dir, { recursive: true });

const BASE = process.env.BASE || 'http://localhost:5173';
const viewports = [
  { label: '1366', width: 1366, height: 768 },
  { label: '1440', width: 1440, height: 900 },
  { label: '1536', width: 1536, height: 864 },
];
const routes = [
  { path: '/app/dashboard', name: 'dashboard' },
  { path: '/app/progress', name: 'progress' },
  { path: '/app/pillars', name: 'pillars' },
  { path: '/app/framework', name: 'framework' },
  { path: '/app/assessment', name: 'assessment' },
];

const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  await page.route(/googleapis\.com\//, r => r.abort());
  await page.addInitScript((data) => {
    window.__TEST_AUTH__ = data.auth;
    window.__FIRESTORE_DATA__ = data.firestore;
  }, { auth: TEST_AUTH_STUDENT, firestore: TEST_FIRESTORE_DATA });

  for (const { path: route, name } of routes) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(dir, `${vp.label}_${name}.png`) });
      console.log(`ok ${vp.label} ${name}`);
    } catch (e) {
      console.log(`ERR ${vp.label} ${name}: ${e.message.slice(0, 80)}`);
    }
  }
  await context.close();
}

await browser.close();
console.log('done -> ' + dir);