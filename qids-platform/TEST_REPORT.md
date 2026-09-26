# QiDS Platform — Full Test Report

**Date:** 2026-09-26 · **Scope:** whole software, user-perspective + automated
**Overall verdict: ✅ PASS — 1 real bug found & fixed during testing**

---

## 1. Automated suites

| Suite | Result | Time |
|---|---|---|
| Production build (`npm run build`) | ✅ clean, 2.1s, no warnings | — |
| Engine unit tests (`npm run test:engine`) | ✅ **107 / 107 passed** | ~5s |
| Public e2e smoke (Playwright) | ✅ **8 / 8 passed** | ~20s |
| Authenticated school-loop e2e (live Firebase) | ✅ **5 / 5 passed** | ~1.2m |

**School-loop coverage (real accounts, real Firestore):** teacher signup → skip onboarding → create class (6-char code verified) → create + assign assessment → student signup → join by code → sees class + assignment → **Start** hands off to assessment with class context → consent screen renders.

---

## 2. 🐛 Bug found & fixed during this pass

**Signup hook-order crash** (`src/pages/auth/Signup.jsx`)
- After a successful signup, `/onboarding` crashed with *"Rendered fewer hooks than expected"* — caught by the e2e, confirmed by a live probe.
- Root cause: the `if (user) return <Navigate/>` guard sat **between** `useState` calls (a `showPassword` hook lived below it). When `user` flipped mid-mount, React counted fewer hooks → crash.
- Fix: moved the hook above the guard + added a comment so it stays that way. Verified live: signup → onboarding, zero console errors.

**Also fixed while testing:** the school-loop e2e needed a `dismissTour()` helper — the per-persona first-run tour (working as designed!) blocks clicks behind its modal on every fresh browser context.

---

## 3. Deep crawl — every public route

| Route | Status |
|---|---|
| `/` Landing | ✅ renders, hero + full sections, no console errors |
| `/mode` | ✅ "Where should development begin?" |
| `/login`, `/signup` | ✅ split-screen auth renders |
| `/architecture`, `/individual`, `/school`, `/interview`, `/pricing`, `/faq`, `/privacy`, `/terms`, `/contact`, `/about`, `/recovery` | ℹ️ correct **404s** — these are landing *sections* (anchor-scrolled), not routes. If any real link points at them as standalone pages, they'd need real routes. |
| `/credential/<bogus-id>` | ✅ graceful "Credential not found" state, no hang, no errors |
| Unknown route | ✅ proper NotFound (smoke test #7) |

---

## 4. Authenticated app crawl (fresh account, live)

| Page | Status |
|---|---|
| Dashboard | ✅ full render (1,373 chars: nav, New Assessment, persona, empty states) |
| Progress, Reports, Settings, Four Pillars, Questionnaires, My Class, Join Class, Assessment | ✅ all render, **zero console errors** |
| Framework Guide | ✅ full render |
| ⌘K Command palette | ✅ opens on Ctrl+K ("Command palette" + search input verified) |

---

## 5. Cross-cutting checks

- **i18n (EN/HI/BN/MR):** perfect parity — `en/hi/bn/mr.json` 21 keys each, `*.auto.js` 639 keys each, 0 missing / 0 extra. Live Hindi switch proven by smoke test #8.
- **Mobile (390×844):** no horizontal overflow on landing / login / mode; auth brand panel correctly hidden; zero console errors.
- **Logo & favicon:** animated traveling-cube confirmed live in both (logo cycles TR→TL→BL→BR; favicon SVG transform animates, HTTP 200).
- **Guards:** deep app links redirect to `/login?next=…` (smoke #6); wrong-role access bounces with a visible banner.

---

## 6. Residual risks / known limitations

1. **Landing section slugs are not routes** — `/architecture`, `/school` etc. 404. Fine today (nav uses anchors); worth real routes before any marketing that deep-links them.
2. **E2E for teacher/evaluator/employer persona pages** (Enterprise, Role-fit, Interview, Evaluator scoring) is still manual-only — the school loop is automated, the rest of the personas rely on the engine tests + crawl.
3. **Dev Firebase is the test database** — e2e creates throwaway accounts per run (`t<runId>@qids-e2e.test`); consider a dedicated test project before CI on the production project.
4. **Animated favicon** — Chrome/Edge animate SVG favicons; some browsers show the first frame only (graceful degradation, static cube still correct).

---

## 7. Verdict

The software is functionally correct end-to-end: public funnel, auth, onboarding, the individual loop, the full school loop (verified with real accounts against live Firebase), i18n across 4 languages, mobile layout, and the command palette all pass. One regression was found during this pass (signup hook order) and fixed immediately. **Ready to commit and push.**
