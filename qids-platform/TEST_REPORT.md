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

## 7. 2026-10-23 — deployed rules + routing pass

**Rules are verified against the live project, not just the file.** No Java means
no emulator, so `npm run test:rules:live` (`tests/rules-live.mjs`) drives the
deployed ruleset through the Firebase Auth + Firestore REST APIs with two
throwaway accounts, then deletes every document and both accounts.

| Check group | Result |
|---|---|
| Anonymous + cross-account read/write denial | ✅ |
| Child profile rejected without guardian consent | ✅ |
| Progress doc id pinned to `<uid>_<childId>` | ✅ |
| Finished session append-only (create ok, update denied) | ✅ |
| Erasure still allowed (session, progress, profile delete) | ✅ |
| Cannot self-grant `admin` role or a paid plan | ✅ |
| **Total** | ✅ **17 / 17**, project `quad-3c3b9` |

**Routing e2e** (`tests/e2e/routing.spec.mjs`, 6 tests): unknown `/app/*`
renders a 404 inside the shell, role guard blocks deep links, entitlement gate
holds on the URL, free plan opens kids practice, navigation resets the shell's
scroll container and moves focus to `#qids-main`, public credential route needs
no account.

**Current totals:** engine 134/134 · Playwright 18 passed, 5 skipped (live-
Firebase school loop) · production build clean.

**Fixed in this pass:** route scroll reset (the shell scrolls `<main>`, so
`window.scrollTo` never did it), focus management on navigation, one-shot
chunk reload after a deploy invalidates a tab's lazy imports, onboarding now
returns to the deep link it interrupted, and kids sessions stranded by a failed
summary write are re-appended on the next load.

---

## 8. 2026-10-23 — trust layer, slice 1 (server-side scoring, shadow)

Scoring moved to a single dependency-free module, `shared/scoring/qids.js`,
loaded by both the browser (via `src/core/engine/scoring.ts` wrappers) and the
new endpoint. Golden fixtures captured **before** the move lock the numbers.

| Check | Result |
|---|---|
| Golden parity (605 answer sheets × 6 fields) | ✅ **3,637 checks**, 0 failed |
| Engine suite (incl. client-path golden check) | ✅ **135 passed** |
| Submission core (validation, forged scores, hashing) | ✅ **24 checks** |
| Live rules (incl. shadow collection denied to clients) | ✅ **19/19** |
| Full Playwright suite | ✅ **18 passed, 5 skipped** |
| Production build | ✅ clean |

**What was added**

- `shared/scoring/qids.js` — the canonical QIDS maths, plus instrument bounds
  and `validateRawScores`.
- `tests/fixtures/qids-golden.json` — 605 cases from the pre-move engine
  (`npm run test:scoring:golden` regenerates; every changed expectation is a
  changed user score, so review the diff).
- `api/submit-assessment.js` + `api/_lib/submitCore.js` — authenticated,
  rate-limited, idempotent (`submissionId` is the document id) and validates
  the sheet before scoring. Writes to `scoringShadow`, **server-only** by rule.
- `src/services/scoringService.js` — fire-and-forget shadow post; failures are
  silent and never block submission.
- `firestore.rules` — `scoringShadow` denied to all clients.
- Playwright workers capped at 2: six workers cold-compiling the dev server
  caused 60s timeouts that had nothing to do with the code.

**Deliberately not done yet (slice 2)**

`rawScores` is still computed in the browser, so this slice makes the
*derivation* server-authoritative but not the *answers*. The shadow record is
written with `shadow: true` and nothing reads it. Switching the app's source of
truth, locking `assessments` to server-only writes and gating credentials on
`scoredBy: 'server'` all wait for the parity number from real traffic.

## 9. Verdict

The software is functionally correct end-to-end: public funnel, auth, onboarding, the individual loop, the full school loop (verified with real accounts against live Firebase), i18n across 4 languages, mobile layout, and the command palette all pass. One regression was found during this pass (signup hook order) and fixed immediately. **Ready to commit and push.**
