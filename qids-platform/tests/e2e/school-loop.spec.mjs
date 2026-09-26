import { test, expect } from '@playwright/test';

/**
 * School loop e2e — the real teacher → student journey against live Firebase
 * (dev project config comes from .env via the dev server).
 *
 *   teacher signup → onboarding skip → create class (code captured)
 *   → assignment created + assigned to class
 *   student signup → onboarding skip → join by code → class + assignment
 *   → Start hands off to the assessment with class context
 *
 * Unique emails per run keep it safely re-runnable. Env gate: E2E_RUN=1
 * (Playwright CI runs the public smoke suite only — these tests need real
 * Firebase credentials in the dev server's .env). Run with:
 *   E2E_RUN=1 npx playwright test school-loop
 */

const runId = Date.now().toString(36).slice(-6);
const teacher = { name: `T${runId} Teach`, email: `t${runId}@qids-e2e.test`, pwd: 'e2e-pass-123' };
const student = { name: `S${runId} Student`, email: `s${runId}@qids-e2e.test`, pwd: 'e2e-pass-123' };
const LOGIN = /sign in/i;

/**
 * Dismiss the per-persona first-run tour if it engaged. Each Playwright test
 * gets a fresh context (empty localStorage → qids-tour-done-v1 absent), so the
 * tour re-engages on every login/signup and its modal overlay blocks clicks.
 */
async function dismissTour(page) {
  const tour = page.locator('div[role="dialog"][aria-modal="true"]');
  try {
    await tour.first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.keyboard.press('Escape');
    await tour.first().waitFor({ state: 'hidden', timeout: 5_000 });
  } catch {
    // Tour never engaged (or already finished) — nothing to dismiss.
  }
}

/** Signup with role selection, then skip onboarding → lands on role home. */
async function freshSignup(page, { name, email, pwd, role }) {
  await page.goto('/signup');
  await page.fill('#name', name);
  await page.fill('#email', email);
  await page.fill('#password', pwd);
  await page.fill('#confirm', pwd);
  if (role) {
    await page.getByRole('button', { name: new RegExp(role, 'i') }).first().click();
  }
  await page.getByRole('button', { name: /register/i }).click();
  await page.waitForURL('**/onboarding**', { timeout: 30_000 });
  await page.getByRole('button', { name: /skip/i }).click();
  await page.waitForURL('**/app/**', { timeout: 30_000 });
  await dismissTour(page);
}

/** Log back into an existing account in a fresh context. */
async function login(page, { email, pwd }) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', pwd);
  await page.getByRole('button', { name: LOGIN }).first().click();
  await page.waitForURL('**/app/**', { timeout: 30_000 });
  await dismissTour(page);
}

test.describe.serial('School loop', () => {
  test.skip(() => process.env.E2E_RUN !== '1', 'needs live Firebase; set E2E_RUN=1');
  // Real Firebase auth + Firestore writes are slow (cold starts, network);
  // 30s default is too tight for two sequential write round-trips.
  test.setTimeout(120_000);
  let classCode = null;

  test('teacher signs up, skips, and can open Classes with a New Class button', async ({ page }) => {
    await freshSignup(page, { ...teacher, role: 'teacher' });
    await expect(page).toHaveURL(/\/app\//);
    await page.goto('/app/school');
    await expect(page.getByRole('button', { name: /new class/i })).toBeVisible({ timeout: 20_000 });
  });

  test('teacher creates a class and gets a 6-char join code', async ({ page }) => {
    await login(page, teacher);
    await page.getByRole('button', { name: /new class/i }).click();
    await page.waitForURL('**/app/school/create');
    await page.fill('#class-name', `E2E Class ${runId}`);
    await page.fill('#class-grade', '10');
    await page.getByRole('button', { name: /create class/i }).click();

    await page.waitForURL('**/app/school/class/**', { timeout: 30_000 });
    const codeEl = page.locator('[data-tour="class-code"]');
    await expect(codeEl).toBeVisible({ timeout: 20_000 });
    classCode = (await codeEl.textContent())?.trim();
    expect(classCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  test('teacher creates and assigns an assessment to the class', async ({ page }) => {
    await login(page, teacher);
    await page.goto('/app/school');
    const classCard = page.locator('.card', { has: page.getByText(`E2E Class ${runId}`, { exact: true }) });
    await classCard.click();
    await page.waitForURL('**/app/school/class/**', { timeout: 30_000 });

    // Scope to main: the sidebar has its own "New Assessment" button that
    // would otherwise win the role-name match and navigate away.
    await page.locator('main').getByRole('button', { name: /new assessment/i }).click();
    await page.getByPlaceholder(/mid.?term/i).fill(`E2E Assignment ${runId}`);
    await page.getByRole('button', { name: /^create$/i }).last().click();
    await expect(page.getByText(`E2E Assignment ${runId}`).first()).toBeVisible({ timeout: 30_000 });
  });

  test('student signs up, joins by code, sees the class', async ({ page }) => {
    test.expect(classCode, 'class code captured in the earlier step');
    await freshSignup(page, { ...student, role: 'student' });
    await page.goto('/app/school/join');
    await page.locator('input[maxlength="6"]').fill(classCode);
    await page.getByRole('button', { name: /join class/i }).click();

    await expect(page.getByText(`E2E Class ${runId}`).first()).toBeVisible({ timeout: 30_000 });
  });

  test('student sees the assigned assessment and Start hands off', async ({ page }) => {
    await login(page, student);
    await page.goto('/app/my-class');
    await expect(page.getByText(`E2E Assignment ${runId}`).first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /start/i }).first().click();
    await page.waitForURL('**/app/assessment**classId=**', { timeout: 20_000 });
    await expect(page.getByText(/consent/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
