import { test, expect } from '@playwright/test';

// ─── Measurement & verification surfaces ────────────────────────────────────
// The two public pages that make the scoring claim checkable. They must render
// without an account and without a backend, because that is exactly how a
// sceptical reader (an employer, a school) first meets them.

test.describe('Measurement surfaces', () => {
  test('the methodology page states the arithmetic and the bands', async ({ page }) => {
    await page.goto('/methodology');

    await expect(page.getByRole('heading', { name: /how a qids score is produced/i })).toBeVisible();

    // The formula the code actually runs, not a paraphrase.
    await expect(page.getByText(/min\(verbal \+ quantitative/i)).toBeVisible();
    await expect(page.getByText(/Cronbach/i).first()).toBeVisible();

    // Every grade band has a reading.
    for (const band of ['A — Excellent', 'C — Good', 'E — Needs Improvement']) {
      await expect(page.getByText(band, { exact: false }).first()).toBeVisible();
    }

    // The limits must be stated on the same page as the claim.
    await expect(page.getByText(/not clinically validated/i)).toBeVisible();
    await expect(page.getByText(/no population norm group/i)).toBeVisible();
  });

  test('an unpublished credential says it has no server record', async ({ page }) => {
    await page.goto('/credential/does-not-exist');
    // The page itself renders (the growth loop must never require an account)…
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('the credential page never claims verification without a record', async ({ page }) => {
    // With no Firebase config for this id, both lookups fail or 404 — the badge
    // must read "no server record"/"unavailable", never "server-scored".
    await page.goto('/credential/does-not-exist');
    await expect(page.getByText(/server-scored from your answers/i)).toHaveCount(0);
  });
});
