// ─── Question-bank runtime localization ───────────────────────────────────────
// The assessment banks (qidsData.js) hold English strings. scripts/i18n-bank.mjs
// generates per-language dictionaries (qidsData.<lang>.json) keyed by the
// English text. tq(text) returns the translation for the active language, or
// the English original when absent — a partial translation can never corrupt
// an assessment, and untranslated content degrades gracefully.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import hi from './qidsData.hi.json';
import bn from './qidsData.bn.json';
import mr from './qidsData.mr.json';

const DICTS = { hi, bn, mr };

/** Synchronous lookup for a known language code. */
export function bankLookup(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const dict = DICTS[lang];
  return (dict && dict[text]) || text;
}

/**
 * useBankText() → tq(text): translate a bank string in the active language.
 * Falls back to English wherever the dictionary lacks the string.
 */
export function useBankText() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0];
  return (text) => bankLookup(text, lang);
}

/** Optional: report bank coverage per language (for the admin/coverage view). */
export function bankCoverage() {
  const sizes = {};
  for (const [lang, dict] of Object.entries(DICTS)) sizes[lang] = Object.keys(dict).length;
  return sizes;
}
