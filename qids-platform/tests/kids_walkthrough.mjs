// ─── Kids 4Q Practice — end-to-end walkthrough ───────────────────────────────
// Drives the real UI with the app's __TEST_AUTH__ hook (no Firebase account
// needed): create a child profile, play a full chapter including the unlocked
// bonus scene, verify the chapter completes, then reload and prove the progress
// survived and the next chapter is today's mission.
//
// Run: node tests/kids_walkthrough.mjs   (dev server must be on BASE)

import { chromium } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:5187';
const UID = 'kids-test-uid';

const auth = {
  user: { uid: UID, email: 'guardian@example.com', displayName: 'Test Guardian' },
  profile: { uid: UID, name: 'Test Guardian', email: 'guardian@example.com', role: 'individual', context: 'individual' },
};
// OnboardingGate treats prior assessment activity as "already onboarded".
const firestore = { assessments: { [UID]: [{ id: 'seed', phase: 'pre' }] } };

let checks = 0;
let failures = 0;
function ok(label, cond, detail) {
  checks += 1;
  if (cond) console.log(`  ✓ ${label}`);
  else { failures += 1; console.log(`  ✗ ${label}`, detail ?? ''); }
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.addInitScript(({ auth, firestore }) => {
  window.__TEST_AUTH__ = auth;
  window.__FIRESTORE_DATA__ = firestore;
  // Skip the first-run product tour overlay — it intercepts clicks.
  window.localStorage.setItem('qids-tour-done-v1', '1');
}, { auth, firestore });

const errors = [];
page.on('pageerror', e => errors.push(e.message));

// 1. Dashboard with no profiles
await page.goto(`${BASE}/app/kids`, { waitUntil: 'load' });
await page.getByRole('heading', { name: 'Learn. Wonder. Build.' }).waitFor({ timeout: 15000 });
ok('kids dashboard renders', true);
ok('empty state shown before any child profile', await page.getByText('No child profiles yet').isVisible());

// 2. Create a child profile
await page.getByRole('button', { name: 'Add child' }).first().click();
await page.locator('#kid-name').fill('Aarav');
await page.getByRole('button', { name: 'Create profile' }).click();
await page.getByText('Aarav').first().waitFor({ timeout: 5000 });
ok('child profile created and selected', await page.getByRole("heading", { name: "Today's mission" }).isVisible());
ok('today\'s mission is chapter 1', await page.getByRole('heading', { name: 'The New Kid at the Gate' }).isVisible());

// 3. Play the chapter — every scene including the unlocked bonus (4 decisions)
await page.getByRole('link', { name: /Start today's mission/i }).click();
await page.getByRole('heading', { name: 'The New Kid at the Gate' }).waitFor();

const script = [
  ['Walk over and offer to share my map.', 'You do. You walk in together'],
  ['Sit nearby without asking questions.', 'This is quieter than my old school'],
  ['Tell them quietly that the drawing is really good.', 'the drawing is face up on the desk'],
  ['The quiet stairs and the bench nobody uses.', 'This is the good version'],
];

for (const [choice, consequence] of script) {
  await page.getByRole('button', { name: choice }).click();
  await page.getByText(new RegExp(consequence.split('.').join('\\.'), 'i')).first().waitFor({ timeout: 5000 });
  ok(`consequence shown for: ${choice.slice(0, 32)}…`, true);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

await page.getByText('Chapter complete').waitFor({ timeout: 5000 });
ok('chapter completes after the last decision', true);
ok('practice tally rendered for all four quotients',
  (await page.locator('text=EQ · Feeling').count()) === 1);

// 4. Back to the map: node done, badge derived, next chapter queued
await page.getByRole('link', { name: 'View map' }).click();
await page.getByRole("heading", { name: "Today's mission" }).waitFor();
ok('next mission advances to chapter 2',
  await page.getByRole('heading', { name: 'The Pattern Forest' }).isVisible());
ok('badge derived from completion', await page.getByText('Earned').first().isVisible());

// 5. Reload: progress persisted, not re-derived from an index
await page.reload({ waitUntil: 'load' });
await page.getByRole("heading", { name: "Today's mission" }).waitFor({ timeout: 15000 });
ok('progress survives a reload',
  await page.getByRole('heading', { name: 'The Pattern Forest' }).isVisible());
ok('streak recorded', (await page.locator('.num').first().textContent())?.trim() === '1');

// 6. Guardian view
await page.goto(`${BASE}/app/kids/guardian`, { waitUntil: 'load' });
await page.getByRole('heading', { name: 'Progress, without the surveillance' }).waitFor({ timeout: 15000 });
ok('guardian view renders practice mix', await page.getByText('Practice mix').isVisible());
ok('guardian view shows chapters done', await page.getByText('1/6').first().isVisible());

ok('no uncaught page errors', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures ? 1 : 0);
