import { defineConfig } from '@playwright/test';

// QiDS e2e smoke — public surfaces only (no Firebase dependency), so CI runs
// green without project credentials. Authenticated flows are covered by the
// engine suite + manual checklist for now.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // Must match the webServer below: when E2E_BASE_URL is unset we start the
    // app on 5199, so that is where the tests have to look.
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5199',
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
