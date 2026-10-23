import { test, expect } from '@playwright/test';

// Routing guarantees — the things that break quietly in production:
// guards hold on deep links, unknown app URLs render a real 404 inside the
// shell, entitlement locks apply to the URL and not just the sidebar, and a
// navigation lands focus on the new page.
//
// Uses the app's __TEST_AUTH__ / __FIRESTORE_DATA__ hooks, so no Firebase
// account is needed. Runs on every push in CI.

test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

const UID = 'routing-test-uid';

function auth(profile = {}) {
  return {
    user: { uid: UID, email: 'user@example.com', displayName: 'Test User' },
    profile: {
      uid: UID,
      name: 'Test User',
      email: 'user@example.com',
      role: 'individual',
      context: 'individual',
      plan: 'free',
      ...profile,
    },
  };
}

async function signIn(page, profile) {
  await page.addInitScript((auth) => {
    window.__TEST_AUTH__ = auth;
    // Prior assessment activity = already onboarded, so the gate passes
    // straight into the shell.
    window.__FIRESTORE_DATA__ = { assessments: { [auth.user.uid]: [{ id: 'seed', phase: 'pre' }] } };
    window.localStorage.setItem('qids-tour-done-v1', '1');
  }, auth(profile));
}

test('an unknown /app URL renders a 404 inside the shell, not a redirect', async ({ page }) => {
  await signIn(page, {});
  await page.goto('/app/this-does-not-exist');

  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  // Still inside the authenticated shell: the user can navigate away.
  await expect(page.locator('#qids-main')).toBeVisible();
  await expect(page.locator('a[href="/app/dashboard"]').first()).toBeAttached();
});

test('role guard blocks a deep link even when the sidebar never showed it', async ({ page }) => {
  await signIn(page, { role: 'individual' });
  await page.goto('/app/admin');

  await expect(page).toHaveURL(/\/app\/dashboard$/);
});

test('entitlement gate holds on the URL, not just the menu', async ({ page }) => {
  await signIn(page, { role: 'individual', plan: 'talent' });
  await page.goto('/app/kids');

  // Talent has no kids practice: the upsell panel renders instead of the page.
  await expect(page.getByText(/isn't included in your plan/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learn. Wonder. Build.' })).toHaveCount(0);
});

test('the free plan can open kids practice', async ({ page }) => {
  await signIn(page, { role: 'individual', plan: 'free' });
  await page.goto('/app/kids');
  // First paint of a lazy route on a cold dev server is slow.
  await expect(page.getByRole('heading', { name: 'Learn. Wonder. Build.' })).toBeVisible({ timeout: 30_000 });
});

test('a navigation moves focus to the new page and resets its scroll', async ({ page }) => {
  await signIn(page, {});
  await page.goto('/app/kids');
  await page.getByRole('heading', { name: 'Learn. Wonder. Build.' }).waitFor({ timeout: 30_000 });

  // Make the shell's scroll container genuinely scrollable, then park it low.
  await page.evaluate(() => {
    const main = document.getElementById('qids-main');
    const spacer = document.createElement('div');
    spacer.style.height = '2000px';
    main.appendChild(spacer);
    main.scrollTop = 900;
  });
  expect(await page.evaluate(() => document.getElementById('qids-main').scrollTop)).toBeGreaterThan(0);

  await page.locator('a[href="/app/dashboard"]:visible').first().click();
  await expect(page).toHaveURL(/\/app\/dashboard/);

  await expect
    .poll(() => page.evaluate(() => document.getElementById('qids-main').scrollTop))
    .toBe(0);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('qids-main');
});

test('the public credential route needs no account', async ({ page }) => {
  await page.goto('/credential/does-not-exist');
  await expect(page).toHaveURL(/\/credential\/does-not-exist$/);
  await expect(page.locator('h1').first()).toBeVisible();
});
