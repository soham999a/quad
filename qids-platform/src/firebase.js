import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache, persistentMultipleTabManager,
} from "firebase/firestore";

const required = (key) => {
  const val = import.meta.env[key];
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