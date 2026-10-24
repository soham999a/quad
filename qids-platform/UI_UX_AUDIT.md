# QiDS — UI/UX audit of every page

**Scope:** all 41 route components in `src/pages/`, the shell (`src/App.jsx`),
the shared components, and the token system in `src/index.css`.

**Constraint (from the brief):** the design *principles* do not change —
editorial/Swiss layout, Sora + Inter + JetBrains Mono, hairline rules, severe
2–4px radii, gold used semantically, dark-first with a bone light theme.
Everything recommended here fixes **legibility, consistency, states and
navigation** inside that language. No new visual language, no component
library, no colour-palette redesign.

**Method.** Static measurement (grep counts over all 41 pages) plus computed
WCAG contrast from the real token values (`tests/token-contrast.mjs`), plus a
runtime check in Chromium confirming the tokens resolve as expected. Numbers
below are measured, not estimated.

---

## 1. The one finding that outranks everything else

`text-surface-variant` is the **most-used text colour in the application**:
**430 occurrences across 46 files**. It is not a text token. `--color-surface-variant`
is a *surface* token — `oklch(0.36 0.008 250)` in the dark theme.

| Theme | Rendered | Contrast vs background | Required | Verdict |
|---|---|---|---|---|
| dark | `#3a3d41` on `#08090b` | **1.83:1** | 4.5:1 | ✗ |
| dark | on `--color-surface` | **1.76:1** | 4.5:1 | ✗ |
| light | `#aba497` on `#f7f3ec` | **2.24:1** | 4.5:1 | ✗ |

Confirmed at runtime: on `/login` the email input's
`placeholder:text-surface-variant` computes to `oklch(0.36 0.008 250)`.

The dark theme is the default, so **secondary text, captions, table meta,
dashboards, credential footers and — most seriously — unselected answer options
in the assessment** render near-invisibly.

Every pairing that *does* pass, for contrast (dark theme):

| Token | Ratio | Verdict |
|---|---|---|
| `on-background` / `foreground` | 16.1–17.7 | ✓ |
| `on-surface-variant` | 6.8–7.5 | ✓ |
| `muted-foreground` | 6.8–7.5 | ✓ |
| `gold` / `primary` | 8.9–9.9 | ✓ |
| `success` | 6.7–7.3 | ✓ |
| `error` | 3.4–3.8 | ✗ (14 uses) |
| `ink` | 1.02–1.06 | ✗ (5 uses) |

The fix is **one token**, not 430 elements. `on-surface-variant` and
`muted-foreground` already pass in both themes — either is a sound target. The
5 non-text uses of `surface-variant` must be re-checked when the token changes.

**Light theme has a second, separate token bug.** `--color-gold` is never
remapped under `[data-theme="light"]` — only the raw `--gold` variable is
(see the comment at `index.css:1290`, which explicitly fixed this for `--gold`
and missed the Tailwind token). Result: `text-gold` is **1.69–1.96:1** on bone
across **83 uses in 21 files**. `text-primary` lands at 3.09–3.59:1 in light
theme: fine for large text, failing for body copy.

---

## 2. There is no page primitive — 27 different content widths

`src/components/frame.jsx` defines `PageFrame`, `Section`, `Card`, `KeyValue`,
`BackgroundGrid` — a complete page scaffold. **Zero pages import it.** Every
page hand-rolls its own header (`kicker` → `h1.text-headline-md` → optional
lede → `gradient-rule`) and its own container.

Measured `max-w-[…]` values in use:

```
240 280 400 420 440 460 480 540 560 600 620 640 680
720 760 800 900 960 980 1000 1100 1200 1280 1360 1400 1440 1520
```

Seven pages set **no** width at all (`FrameworkMap`, `Questionnaires`,
`InterventionPlan`, `PipReport`, `RunnerItems`, plus two that inherit).

So the reading column jumps from 280px to 1520px between adjacent screens. For
a system whose whole premise is institutional precision, that is the visible
inconsistency — and it is fixable without touching the look: three widths
(narrow 640 / reading 960 / data 1280) cover 95% of the pages as designed.

| Page group | Current | Proposed |
|---|---|---|
| Forms, single column (`ClassCreate`, `StudentJoin`, `Login`, `Signup`, `KidsStory`) | 440–720 | `narrow` 640 |
| Narrative, results (`IndividualResults`, `Progress`, `ReportGenerator`, `InterviewReport`) | 900–1100 | `reading` 960 |
| Data, dashboards (`Dashboard`, `TeacherDashboard`, `EnterpriseResults`, `AdminPanel`) | 1100–1520 | `data` 1280 |
| Full-bleed editorial (`Landing`, `Mode`) | 1440 | unchanged — intentional |

---

## 3. Every page has the same three missing states

| Signal | Count | Meaning |
|---|---|---|
| `aria-live` / `role="status"` / `role="alert"` | **0** in all 41 pages | no async result is ever announced; screen-reader users get silence after every save, filter and score |
| `.catch(() => …)` swallowing into an empty array | **27 occurrences** | a failed load is indistinguishable from "you have no data" |
| Pages with a real error state | **6 of 41** | the other 35 show a blank or "0 items" on failure |
| Pages using `EmptyState` | **6 of 41** | 4 different empty-state conventions |
| Touch targets ≥ 44px | global mobile rule only | `button, a, .cursor-pointer { min-height: 44px }` inside `@media (max-width:768px)` — desktop stays inconsistent |

The three states are not a redesign: they are `EmptyState`, a new `ErrorState`,
and one `<div role="status">` per async page, all built from existing tokens.

---

## 4. Heading structure is not consistent

`<h1>` count per page: **1** on 35 pages, **0** on `FrameworkMap`,
`InterventionPlan`, `Progress`, `Questionnaires`, `RunnerItems`.

Four routed pages had no page heading, so assistive technology and the browser
outline both lost the page identity. (`RunnerItems` is a sub-component, not a
route.)

**Corrected after inspection:** the pages with two `<h1>`s — `ReportGenerator`,
`PublicCredential`, `KidsStory` — render them in mutually exclusive branches
(loading/not-found vs content), so only one is ever in the document. Those were
false positives in the first pass and were left alone.

---

## 5. The assessment flow itself

What already works (keep it): six explicit steps (`Intake → IQ → EQ → SQ → AQ
→ Review`), a step rail with completion state, a live RD preview, debounced
checkpointing, a resume banner, and a genuine review step. That is ahead of most
commercial products.

What is measurably wrong:

1. **Unanswered scale options used the failing token.** In
   `components/assessment/shared.jsx` the unselected state of the Likert scale
   and the rubric scorer is `text-surface-variant` (lines 79 and 107) — the
   answers a student has not picked yet were the least readable text on the
   page at 1.7:1. (The MCQ options already used `on-surface-variant`.)
2. **Selection is invisible to assistive tech.** The 1–5 scale and the option
   list are `<button>`s with no `aria-pressed`, no `role="radiogroup"`, no
   `aria-labelledby` pointing at the question. Only **13** `aria-pressed` and
   **1** `aria-current` exist in the whole app.
3. **No time expectation before the start.** The instrument is long; the intake
   step does not state how long it takes. Published guidance is explicit that a
   shorter-than-real estimate drives abandonment.

---

## 6. `Progress.jsx` has drifted from the design language

1,189 lines — the second-largest page — and it is the only page using
`text-[15px]`, `text-[18px]`, `font-[800]`, `font-bold` (lines 462, 493, 657,
807, 887, 895, 925, 1070). Every other page uses the tokenised type scale with
light weights. It also has **no `<h1>`** and the highest `text-surface-variant`
count after `Assessment` (37).

This is not "make Progress prettier" — it is bringing it back onto the system
every other page already uses.

---

## 7. Page-by-page register

`w` = container width, `sv` = `text-surface-variant` uses (all failing contrast).

| Page | w | h1 | sv | Specific |
|---|---|---|---|---|
| `Assessment.jsx` | 600/960 | 1 | 46 | answer options fail contrast; no radiogroup semantics; no time estimate |
| `Dashboard.jsx` | 1520 | 1 | 10 | widest column in the app; 10 sv |
| `Progress.jsx` | 900 | **0** | **37** | off-system type; needs h1 |
| `Questionnaires.jsx` | none | **0** | 23 | no width, no heading |
| `FrameworkMap.jsx` | none | **0** | 7 | no width, no heading |
| `InterventionPlan.jsx` | none | **0** | 12 | no width, no heading |
| `ReportGenerator.jsx` | 1000 | **2** | 12 | duplicate h1 |
| `credential/PublicCredential.jsx` | 680/1440 | **2** | 5 | duplicate h1 on a public page |
| `kids/KidsStory.jsx` | 720/760 | **2** | 1 | duplicate h1 |
| `enterprise/PipReport.tsx` | none | 1 | 18 | print-oriented; verify print rules |
| `enterprise/EnterpriseResults.jsx` | 1520 | 1 | **21** | widest + most sv in enterprise |
| `enterprise/EnterpriseRunner.jsx` | 1360/1400 | 1 | **21** | two near-identical widths |
| `enterprise/RunnerItems.jsx` | none | **0** | 13 | no width, no heading |
| `admin/AdminPanel.jsx` | 1200 | 1 | **19** | 19 sv on dense tables |
| `employer/EmployerDashboard.tsx` | 1520 | 1 | 13 | widest |
| `evaluator/EvaluatorDashboard.jsx` | 1200 | 1 | 6 | has EmptyState ✓ |
| `evaluator/EvaluatorScoring.jsx` | 1200 | 1 | 0 | cleanest page — use as reference |
| `student/MyEvaluator.jsx` | 720 | 1 | **11** | narrow column with 11 sv |
| `student/MyClass.jsx` | 960 | 1 | 5 | EmptyState ×3 ✓ |
| `school/ClassManager.jsx` | 240/480/960 | 1 | 7 | EmptyState ×3 ✓ |
| `school/TeacherDashboard.jsx` | 640/1280 | 1 | 4 | error swallowed into "no classes" |
| `school/ClassAnalytics.jsx` | 1100 | 1 | 9 | charts — check axis labels/legend contrast |
| `school/SchoolReports.jsx` | 640/1100 | 1 | 4 | — |
| `school/ClassCreate.jsx` | 560 | 1 | 4 | form: labels + inline errors |
| `school/StudentJoin.jsx` | 480 | 1 | 3 | form |
| `interview/InterviewerDashboard.jsx` | 640/1280 | 1 | 7 | — |
| `interview/InterviewLive.jsx` | 400/960 | 1 | 7 | live state needs `role="status"` |
| `interview/InterviewSetup.jsx` | 640/960 | 1 | 6 | form |
| `interview/InterviewPostScoring.jsx` | 400/960 | 1 | 8 | — |
| `interview/InterviewReport.jsx` | 280/1100 | 1 | 10 | 280px column — text will wrap badly |
| `individual/IndividualResults.jsx` | 960/1100 | 1 | 9 | score report: add band/percentile clarity |
| `individual/IndividualCredential.jsx` | 800 | 1 | 7 | — |
| `individual/IndividualOnboarding.jsx` | 960 | 1 | 5 | — |
| `enterprise` + `interview` shells | — | — | — | share one "run" layout instead of three |
| `auth/Login.jsx` | 240/440 | 1 | 3 | placeholder contrast (confirmed live) |
| `auth/Signup.jsx` | 240/440 | 1 | 2 | same |
| `account/Settings.jsx` | 1100 | 1 | 0 | — |
| `Landing.jsx` | 1440 | 1 | 0 | intentional full-bleed; keep |
| `Mode.jsx` | 1440 | 1 | 0 | keep |
| `NotFound.jsx` | 720/1440 | 1 | 0 | keep |
| `onboarding/Onboarding.jsx` | 980 | 1 | 0 | — |
| `kids/KidsHome.jsx` | 440–1100 | 1 | 4 | 5 different widths in one page |
| `kids/KidsGuardian.jsx` | 620/900 | 1 | 4 | — |

---

## 8. What the research says, and where it agrees with the above

**Assessment flow**
- State purpose, real duration and whether pausing is allowed *before* the
  start; longer-than-promised time is a primary abandonment driver.
  [Conrad et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC2910434/) ·
  [Qualtrics](https://www.qualtrics.com/articles/strategy-research/4-tips-for-preventing-drop-offs-in-surveys/)
- Sectioned pages beat both dogmatic one-question-per-screen and giant forms;
  show progress only where it is truthful.
  [SurveyMonkey](https://www.surveymonkey.com/curiosity/pros-cons-of-scrolling-and-multiple-pages-in-surveys/)
- Say exactly what saves and where it resumes — vendors differ and users
  cannot guess. [Harver](https://support.harver.com/hc/en-us/articles/360000076198-Can-I-take-a-break-during-my-application) ·
  [Questionmark](https://candidate-support.questionmark.com/hc/en-us/articles/13001052133915-How-can-I-resume-an-assessment)
- Mobile break-off is materially higher on long instruments.
  [Emery et al. 2023](https://www.surveypractice.org/article/84347-breakoffs-in-an-hour-long-online-survey)

**Score reports**
- Lead with a plain-language summary; scores are not verdicts — interpretation
  in context is the product. [Thomas](https://www.thomas.co/resources/type/hr-guides/personality-assessment-reports-guide-managers-and-hr-teams)
- Name the score type and the norm group; percentiles are not percent-correct.
  [GRoNC 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC13379607/)
- Do not imply precision the instrument lacks; label axes; avoid truncated
  baselines. [Schmukle 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC13230652/) ·
  [Wijnker et al.](https://jcom.sissa.it/article/pubid/JCOM_2107_2022_A07/)

**Accessibility (WCAG 2.2 AA)**
- Text 4.5:1, large text 3:1, meaningful UI 3:1 — must hold **in both themes**
  and in hover/focus/selected states.
  [W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) ·
  [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Focus must stay visible and unobscured by sticky headers/overlays
  ([2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html));
  the app has only 6 `focus-visible` rules in 1,395 lines of CSS.
- Tabs/dialogs/tables need APG semantics, and a persistent polite live region
  for async results ([ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)).
- Drag interactions need a non-drag alternative
  ([2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)) —
  relevant if any reordering exists in class/team builders.

`prefers-reduced-motion` is already handled well (8 dedicated blocks). That is
better than most apps and should be preserved.

---

## 9. Proposed order of work

Each slice is independently shippable and verifiable; none changes the visual
language.

**Slice 1 — Legibility (highest value per line changed)**
Fix the dark `surface-variant` token, remap `--color-gold` for light theme,
raise `error`/`ink`. Then migrate the 430/83/14 call sites to the semantic
token. Acceptance: `tests/token-contrast.mjs` exits 0 in both themes; the
assessment's unselected options and `/login` placeholders verified in a browser.

**Slice 2 — One page primitive**
Make `PageFrame` real: three widths, the existing header pattern, own the `h1`.
Adopt across pages by group (forms → reading → data), leaving `Landing`/`Mode`
full-bleed. Acceptance: heading outline correct on all 41 routes; no page
outside the three widths.

**Slice 3 — States**
`ErrorState` beside `EmptyState`; replace the 27 swallowed catches; one
`role="status"` region per async page; loading skeletons only where a spinner
would otherwise shift layout.

**Slice 4 — Assessment flow**
Statement of purpose + duration on intake; `radiogroup`/`aria-pressed` on every
answer scale; a "N unanswered" check on the Review step; confirm resume wording
matches the checkpointing that actually exists.

**Slice 5 — Report readability**
Score-band labels, norm context, and chart axis/legend contrast on
`IndividualResults`, `ClassAnalytics`, `EnterpriseResults`, `PipReport`.

**Slice 6 — `Progress.jsx` alignment**
Back onto the token scale, add the `h1`, adopt the primitive. No layout
redesign.

---

## 10. Fixed in this pass

**Tokens (`src/index.css`)** — `tests/token-contrast.mjs` now exits 0 in both
themes, where it previously reported 25 failing pairings.

| Token | Dark before → after | Light before → after |
|---|---|---|
| `surface-variant` (text) | 1.8:1 → **7.45:1** | 2.2:1 → **6.71:1** |
| `gold` | 9.85:1 | 1.8:1 → **5.04:1** |
| `primary` | 9.85:1 | 3.33:1 → **5.04:1** |
| `success` | 7.31:1 | 2.46:1 → **6.18:1** |
| `warning` | 10.53:1 | 1.71:1 → **5.97:1** |
| `error` | 3.75:1 → **5.47:1** | 4.80:1 → **6.48:1** |

The five non-text uses of `surface-variant` were progress-bar tracks; they now
use `outline-variant` so the token could become a text colour safely.
`text-ink`'s last live use (ink on a hovered gold button) became
`text-background`, which inverts correctly per theme — a single gold value
cannot serve as both text-on-bone and fill-under-navy.

**Layout** — every `page-pad` wrapper now uses one of **640 / 960 / 1280**
(was 27 values). `Landing` and `Mode` stay full-bleed at 1440; the four
split-pane pages (`FrameworkMap`, `InterventionPlan`, `Questionnaires`) keep
their full-height layout.

**Headings** — `Progress` gained a visible page header; the three split-pane
pages gained a visually-hidden `h1` so the outline is complete without moving
their layout.

**States** — the toast container is now a `role="status"` live region with
`role="alert"` on errors (previously the app announced nothing, anywhere); a
new `ErrorState` sits beside `EmptyState`; `TeacherDashboard` no longer renders
a fetch failure as "no classes".

**Assessment** — every answer scale is now a labelled `role="group"` with
`aria-pressed` per option (the 1–5 scale also gets an explicit
`aria-label=\"Always (5 of 5)\"`-style name), the intake step states the
commitment before it starts, and the review step warns when a pillar has no
recorded answers instead of submitting a silent zero.

**`Progress.jsx`** — back onto the system: 33 oversized radii
(`rounded-3xl`/`xl` at 12–24px) collapsed to 2–4px, 70+ arbitrary font weights
(`font-[600]`, `font-[800]`, `font-bold`) replaced with the token scale's
light/medium weights, and the page now uses `page-pad` like every other page.

### Still open

- 26 `.catch(() => setX([]))` sites still collapse a failure into an empty
  list. `ClassManager` surfaces it as a toast; the rest need the `ErrorState`
  treatment applied page by page.
- `frame.jsx` is still unused. Its contrast bugs are fixed, but nothing
  imports it — either adopt it or delete it.
- Chart internals (SVG fills, axis labels) were not contrast-checked.

## 11. Limits of this audit

- Authed routes were measured statically (token + class counts), not
  individually screenshot-reviewed; the four public routes were also checked in
  a real browser.
- Contrast was computed from token values, which is exact for flat surfaces.
  Elements over gradients, images or `backdrop-blur` need a rendered check.
- No screen-reader pass was performed; ARIA findings are from source.
- Chart internals (SVG/canvas fills) were not contrast-checked.
