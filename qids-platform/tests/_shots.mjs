import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { TEST_AUTH_STUDENT } from './test-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'screenshots', 'ui-check');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.addInitScript((data) => { window.__TEST_AUTH__ = data.auth; }, { auth: TEST_AUTH_STUDENT });
const pages = [
  ['dashboard', '/app/dashboard'],
  ['enterprise-setup', '/app/enterprise'],
  ['role-fit', '/app/role-fit'],
  ['talent', '/app/talent'],
];
for (const [name, url] of pages) {
  await page.goto('http://localhost:5173' + url, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, name + '.png'), fullPage: false });
  console.log('shot', name);
}
await browser.close();
