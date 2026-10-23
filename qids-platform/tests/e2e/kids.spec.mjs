import { test, expect } from '@playwright/test';

// Kids 4Q Practice — end-to-end. Uses the app's __TEST_AUTH__ hook, so no
// Firebase account is needed and CI can run it on every push. Each Playwright
// test gets a fresh browser context, so the local-first store starts empty.

// These tests share a dev server that compiles the whole app on demand; running
// them serially keeps the timings honest instead of CPU-starved.
test.describe.configure({ mode: 'serial' });
test.setTimeout(60_000);

const UID = 'kids-test-uid';
const auth = {
  user: { uid: UID, email: 'guardian@example.com', displayName: 'Test Guardian' },
  profile: {
    uid: UID,
    name: 'Test Guardian',
    email: 'guardian@example.com',
    role: 'individual',
    context: 'individual',
  },
};
// OnboardingGate treats prior assessment activity as "already onboarded".
const firestore = { assessments: { [UID]: [{ id: 'seed', phase: 'pre' }] } };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ auth, firestore }) => {
    window.__TEST_AUTH__ = auth;
    window.__FIRESTORE_DATA__ = firestore;
    // Skip the first-run product tour overlay — it intercepts clicks.
    window.localStorage.setItem('qids-tour-done-v1', '1');
  }, { auth, firestore });
});

async function createChild(page, name = 'Aarav') {
  await page.goto('/app/kids');
  await page.getByRole('heading', { name: 'Learn. Wonder. Build.' }).waitFor();
  await page.getByRole('button', { name: 'Add child' }).first().click();
  await page.locator('#kid-name').fill(name);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create profile' }).click();
  await page.getByRole('heading', { name: "Today's mission" }).waitFor();
}

test('guardian creates a child profile and sees the first mission', async ({ page }) => {
  await page.goto('/app/kids');
  await page.getByRole('heading', { name: 'Learn. Wonder. Build.' }).waitFor();
  // The empty state renders only after the profile lookup settles.
  await expect(page.getByText('No child profiles yet')).toBeVisible({ timeout: 20_000 });

  await page.getByRole('button', { name: 'Add child' }).first().click();
  await page.locator('#kid-name').fill('Aarav');

  // Consent is not optional: the button stays disabled until it is given.
  const submit = page.getByRole('button', { name: 'Create profile' });
  await expect(submit).toBeDisabled();
  await page.getByRole('checkbox').check();
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(page.getByRole('heading', { name: "Today's mission" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The New Kid at the Gate' })).toBeVisible();
});

test('child plays a full chapter, advances, and progress survives a reload', async ({ page }) => {
  await createChild(page);

  await page.getByRole('link', { name: /Start today's mission/i }).click();
  await expect(page.getByRole('heading', { name: 'The New Kid at the Gate' })).toBeVisible();

  const script = [
    ['Walk over and offer to share my map.', /You do\. You walk in together/],
    ['Sit nearby without asking questions.', /This is quieter than my old school/],
    ['Tell them quietly that the drawing is really good.', /face up on the desk/],
    ['The quiet stairs and the bench nobody uses.', /This is the good version/],
  ];

  for (const [choice, consequence] of script) {
    await page.getByRole('button', { name: choice }).click();
    await expect(page.getByText(consequence).first()).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }

  await expect(page.getByText('Chapter complete')).toBeVisible();
  await expect(page.getByText('EQ · Feeling')).toBeVisible();

  await page.getByRole('link', { name: 'View map' }).click();
  await expect(page.getByRole('heading', { name: "Today's mission" })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Pattern Forest' })).toBeVisible();
  await expect(page.getByText('Earned').first()).toBeVisible();

  // The map is derived from stored progress, not from an in-memory index.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The Pattern Forest' })).toBeVisible();
  await expect(page.getByText('1/6').first()).toBeVisible();
});

test('keyboard answers play the chapter without a mouse', async ({ page }) => {
  await createChild(page, 'Meera');
  await page.getByRole('link', { name: /Start today's mission/i }).click();
  await expect(page.getByRole('heading', { name: 'The New Kid at the Gate' })).toBeVisible();

  const firstChoices = [
    'Walk over and offer to share my map.',
    'Sit nearby without asking questions.',
    'Tell them quietly that the drawing is really good.',
    'The quiet stairs and the bench nobody uses.',
  ];

  for (const choice of firstChoices) {
    // Wait for the scene to be interactive before pressing a number.
    await expect(page.getByRole('button', { name: choice })).toBeVisible();
    await page.keyboard.press('1');
    await expect(page.getByText('You chose')).toBeVisible();
    await page.keyboard.press('Enter');
  }

  await expect(page.getByText('Chapter complete')).toBeVisible();
});

test('guardian view shows the practice mix, privacy note and data export', async ({ page }) => {
  await createChild(page);
  await page.goto('/app/kids/guardian');

  await expect(page.getByRole('heading', { name: 'Progress, without the surveillance' })).toBeVisible();
  await expect(page.getByText('Practice mix')).toBeVisible();
  await expect(page.getByText('Privacy and data')).toBeVisible();
  await expect(page.getByText(/Guardian consent recorded/)).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export this child's data/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^qids-kids-/);
});
