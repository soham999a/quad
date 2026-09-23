// ─── i18n core ───────────────────────────────────────────────────────────────
// i18next + react-i18next. Detection order: saved choice → saved legacy key →
// browser language (graceful regional fallback e.g. hi-IN→hi) → English.
// The chosen language persists to localStorage and <html lang> stays in sync
// for screen readers.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';

// Machine-extracted page strings (scripts/i18n-extract.mjs). The English
// source of truth lives in auto/en.auto.js; hi/bn/mr mirrors are generated
// by scripts/i18n-translate.mjs (Groq, JSON mode). Importing both lets a
// missing translation fall through to English instead of an empty label.
import enAuto from './auto/en.auto.js';
let hiAuto, bnAuto, mrAuto;
try {
  hiAuto = (await import('./auto/hi.auto.js')).default;
  bnAuto = (await import('./auto/bn.auto.js')).default;
  mrAuto = (await import('./auto/mr.auto.js')).default;
} catch { /* generated files not created yet */ }

export const LANGS = [
  { code: 'en', name: 'English', native: 'English', font: '' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', font: 'var(--font-indic)' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', font: 'var(--font-bengali)' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', font: 'var(--font-indic)' },
];

export const SUPPORTED_LANGS = LANGS.map(l => l.code);

// Map any supported regional variant (hi-IN, bn-BD, mr-IN…) to its base code.
function baseLang(tag) {
  const b = String(tag || '').toLowerCase().split('-')[0];
  return SUPPORTED_LANGS.includes(b) ? b : null;
}

// Legacy key from the Settings prototype (kept for continuity).
const SETTINGS_KEY = 'qids-language';
const I18N_KEY = 'qids-lang';

const LS_KEY = 'i18nextLng'; // written by the detector; synced on change

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...enAuto, ...en } },
      hi: { translation: { ...hi, ...(hiAuto || {}) } },
      bn: { translation: { ...bn, ...(bnAuto || {}) } },
      mr: { translation: { ...mr, ...(mrAuto || {}) } },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true, // accept hi-IN etc. directly
    load: 'languageOnly',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LS_KEY,
      caches: ['localStorage'],
    },
    returnEmptyString: false,
    react: { useSuspense: false },
  });

// Pick up the old Settings key once, then keep the two in sync.
try {
  const legacy = window.localStorage.getItem(SETTINGS_KEY);
  if (legacy && SUPPORTED_LANGS.includes(legacy) && !window.localStorage.getItem(LS_KEY)) {
    i18n.changeLanguage(legacy);
  }
} catch { /* best-effort */ }

function syncDocLang(lng) {
  try {
    const base = baseLang(lng) || 'en';
    window.localStorage.setItem(I18N_KEY, base);
    window.localStorage.setItem(SETTINGS_KEY, base);
    window.localStorage.setItem(LS_KEY, base);
    document.documentElement.setAttribute('lang', base);
    window.dispatchEvent(new CustomEvent('qids:lang-changed', { detail: base }));
  } catch { /* best-effort */ }
}

i18n.on('languageChanged', syncDocLang);
// init()'s own languageChanged can fire before this listener attaches on a
// fresh page load — apply the detected language once, right now, too.
syncDocLang(i18n.language);

export default i18n;
