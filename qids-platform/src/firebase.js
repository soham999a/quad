import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache, persistentMultipleTabManager,
} from "firebase/firestore";

// ── Local emulator mode ───────────────────────────────────────────────────
// When VITE_FIREBASE_EMULATOR=1 in a dev build, the app talks to the local
// Firebase emulators instead of the project in .env. This is what lets the
// authed e2e suite (tests/e2e/school-loop.spec.mjs) run without real accounts:
//   npm run test:e2e:emulator
// Production builds can never take this branch (import.meta.env.DEV is false).
const EMULATOR = import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR === '1';

const required = (key) => {
  const val = import.meta.env[key];
  // The emulator accepts any credentials, so a real project is not required.
  if (!val && EMULATOR) return 'demo-qids';
  if (!val) throw new Error(`Missing Firebase config: ${key} in .env`);
  return val;
};

const firebaseConfig = {
  apiKey:            required('VITE_FIREBASE_API_KEY'),
  authDomain:        required('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         required('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     required('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             required('VITE_FIREBASE_APP_ID'),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Firestore with IndexedDB persistence: reads/writes survive reloads and work
// offline. Critical for schools on unreliable connections — a student who
// drops connectivity mid-assessment keeps their answers, and queued writes
// flush when the network returns. The multi-tab manager keeps tabs consistent;
// when persistence can't be claimed (rare browser cases) the SDK falls back
// to in-memory caching automatically.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

// ── App Check (opt-in) ────────────────────────────────────────────────────
// Enabled only when VITE_RECAPTCHA_SITE_KEY is configured, so dev/test/CI are
// unaffected and rollout is a pure env change. With it on, Firebase blocks
// traffic that doesn't come from the genuine web app, and the /api/*
// serverless functions verify the token server-side.
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }).catch(() => { /* App Check must never block app startup */ });
}

export default app;