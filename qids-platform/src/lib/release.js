// ─── Release identity ───────────────────────────────────────────────────────
// Injected at build time by vite.config.js (`__APP_VERSION__`). Every error
// report and analytics event carries it, so "this broke" can be answered with
// "it broke in v1.4.2+3f9c1ab, not before".

export const RELEASE = (() => {
  try {
    // Replaced by Vite's define at build time; undefined in a bare dev script.
    if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) return String(__APP_VERSION__);
  } catch { /* not defined in this runtime */ }
  try {
    return import.meta.env?.VITE_RELEASE || 'dev';
  } catch {
    return 'dev';
  }
})();

/** Coarse device class — enough to answer "is mobile worse?", no fingerprinting. */
export function deviceClass() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet';
  if (/Macintosh/.test(ua) && touchPoints > 1) return 'tablet'; // iPadOS reports as Mac
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
}
