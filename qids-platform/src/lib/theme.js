// ─── Theme (dark / light) ─────────────────────────────────────────────────────
// The app is dark by default. Light mode uses the bone/matrix base surface.
// Persisted in localStorage; falls back to the OS preference on first load.
// The applied theme is surfaced as `data-theme` on <html>, and all tokens in
// index.css are overridden under `[data-theme="light"]` — no JSX changes needed.

import { useEffect, useState, useCallback } from 'react';

export const THEME_STORAGE_KEY = 'qids-theme';
export const THEMES = ['dark', 'light'];

export function getStoredTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' ? 'light' : v === 'dark' ? 'dark' : null;
  } catch {
    return null;
  }
}

export function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function resolveTheme() {
  return getStoredTheme() || systemTheme();
}

/** Apply the theme to the document root (safe to call before React mounts). */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

/**
 * React hook for reading/toggling the theme. Call <ThemeSync/> once at the
 * app root (or applyTheme at startup) and use this in the toggle control.
 */
export function useTheme() {
  const [theme, setTheme] = useState(resolveTheme);

  useEffect(() => {
    applyTheme(theme);
    // Persist so the pre-paint script in index.html restores it on reload.
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* best-effort */ }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const set = useCallback((t) => {
    setTheme(t === 'light' || t === 'dark' ? t : 'dark');
  }, []);

  return { theme, toggle, set };
}
