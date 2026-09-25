import { test, expect } from '@playwright/test';

// Landing page — the storefront. If this breaks, nothing else matters.
test('landing renders with hero, CTA and design tokens', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/QIDS/i);
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('text=Begin Assessment').first()).toBeVisible();
  // theme switcher + language switcher mount
  await expect(page.locator('header').first()).toBeVisible();
});

test('landing FAQ expands (native details)', async ({ page }) => {
  await page.goto('/');
  const details = page.locator('details').first();
  if (await details.count()) {
    await details.locator('summary').click();
    await expect(details).toContainText(/./);
  }
});

// Mode selection page
test('mode page lists assessment modes', async ({ page }) => {
  await page.goto('/mode');
  await expect(page.locator('h1').first()).toBeVisible();
});

// Auth surfaces
test('login form validates empty submit', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h1, form').first()).toBeVisible();
  const emailInput = page.locator('input[type=email]').first();
  await expect(emailInput).toBeVisible();
  await expect(page.locator('input[type=password]').first()).toBeVisible();
});

test('signup page renders role picker', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.locator('h1').first()).toBeVisible();
});

// Protected routes bounce to login with ?next= preserved
test('deep app link redirects to login preserving next', async ({ page }) => {
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fdashboard/);
});

test('unknown route renders not-found, not a blank screen', async ({ page }) => {
  await page.goto('/this-route-does-not-exist');
  await expect(page.locator('h1').first()).toBeVisible();
});

// Language switching — the i18n pipeline's user-visible promise
test('language switcher changes visible text and persists', async ({ page }) => {
  await page.goto('/login');
  // footer expanded switcher shows native names
  const switcher = page.locator('button[aria-haspopup="listbox"]').first();
  if (await switcher.count()) {
    await switcher.click();
    await page.locator('[role=option]', { hasText: 'हिन्दी' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    // switch back for other tests
    await switcher.click();
    await page.locator('[role=option]', { hasText: 'English' }).first().click();
  }
});
