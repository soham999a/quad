import { defineConfig, devices } from '@playwright/test';

// ─── Authed e2e against the Firebase emulator ───────────────────────────────
// The school-loop suite needs real sign-in, real Firestore writes and the real
// security rules. The emulator provides all three locally with no credentials
// and no risk to production data.
//
// Start everything with:
//   npm run test:e2e:emulator
//
// That command wraps this config in `firebase emulators:exec`, which starts
// Auth + Firestore, runs the suite, and shuts them down. Running
// `playwright test --config playwright.emulator.config.mjs` directly will fail
// unless the emulators are already up on 9099/8080.
//
// Requires Java on PATH (the Firestore emulator is a JVM process).

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  // Auth + Firestore writes are serialised by design in this spec: a class code
  // created in one test is used by the next.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      // Turns on src/firebase.js emulator wiring; the demo project id makes the
      // emulator ignore credentials entirely.
      VITE_FIREBASE_EMULATOR: '1',
      VITE_FIREBASE_PROJECT_ID: 'demo-qids',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
