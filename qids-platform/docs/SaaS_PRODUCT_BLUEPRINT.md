# QIDS SaaS Product Blueprint

**Working title:** QIDS — Quadrant Intelligence Development System
**Goal:** Transform the current feature-complete assessment platform into a premium, defensible, multi-tenant SaaS product.
**Audience for this doc:** Founders, product, design, engineering. This is the operating spec every phase builds against.

---

## 1. North Star & Principles

### North star
> A person understands their capability, and grows it, in a loop that an organization can trust.

The assessment is the **entry**, not the product. The product is the **development loop**:
`Assess → Interpret → Plan → Practice → Reflect → Reassess`.

### Non-negotiables (from the existing design language)
1. **One architecture, many contexts.** Domain logic stays shared across individual / school / interview / enterprise / role. Context changes *application*, never the underlying maths.
2. **Bounded intelligence.** AI synthesises; human judgement stays responsible for meaning.
3. **Status discipline.** Established features vs. proposed vs. research stay visibly distinct.
4. **Evidence triangulation.** Never a single-score certainty; always longitudinal context.
5. **Premium restraint.** Gold is semantic, not decorative. Swiss/editorial density. Aesthetic is a feature.

---

## 2. Product Architecture (the "wings")

The product is organised as **one platform, four audiences, five products**:

| Audience | Product (Shell) | Core value | Primary job |
|---|---|---|---|
| Individual | **Individual** | Personal development loop | Self-reported + evaluator-tagged baseline, roadmap, credential |
| Student / Teacher | **School** | Cohort development | Classes, age-banded instruments, analytics, facilitation |
| Candidate / Talent | **Employer (Talent Console)** | Evidence-based hiring | Deploy QGRA/QPIA/QLIA + role tracks, PIP reports, cohort insight |
| Interviewers | **Interview** | Readiness evidence | Structured interviews, rubric merge, post/live modes |
| Internal | **Admin / Workspace** | Tenancy, billing, users, monitors | The SaaS control plane |

All five share: the **domain engine** (`core/`), the **identity layer** (Firebase Auth), the **workspace/tenant layer** (new), and the **credential/evidence layer**.

---

## 3. Personas & their journeys

### 3.1 Individual (D2C)
- **New user:** Landing → Begin → context=Individual → Auth → **Onboarding wizard** (age, purpose) → Plan choice (Free/Pro) → First assessment → Results → Intervention plan → Reassess loop.
- **Returning user:** Dashboard → Continue current cycle → View all evidence → Export credential.

### 3.2 Student (D2C, invited)
- Teacher creates class → student joins by **class code** (exists) → takes age-banded instrument → teacher/evaluator scores → student sees results + roadmap.

### 3.3 Teacher / Evaluator (B2B inside school)
- Create/manage classes (exists) → assign assessments → cohort analytics (exists) → evaluator scoring (exists).

### 3.4 Employer / Talent (B2B)
- **Create workspace/tenant** (new) → invite candidates or self-serve link → choose tier (QGRA/QPIA/QLIA) + target role → candidate runs enterprise runner (exists) → employer gets PIP + Role Fit + cohort insight (partly exists) → shortlist.

### 3.5 Admin (each tenant)
- Manage org, members, roles, billing, plan limits, analytics.

---

## 4. Identity, Plans & Billing

### 4.1 Identity
- Firebase Auth (email/password + Google) stays. Add:
  - `users.tenantId` / `users.workspaces[]` (multi-tenancy field).
  - Verified claims or a small RBAC: `role` per workspace (`owner | admin | evaluator | member`) distinct from persona (`individual | student | teacher | employer`).
  - **Persona ≠ role.** Persona selects the shell; role governs permissions inside a workspace.

### 4.2 Plans (revenue model)

| Plan | Audience | Price (indicative) | Limits | Differentiators |
|---|---|---|---|---|
| **Free** | Individual | $0 | 1 cycle, individual context, standard report | Baseline assessment as the funnel |
| **Pro** | Individual | $X/mo | Unlimited cycles, all contexts, evidence portfolio, credential export, intervention plans | The longitudinal loop is the paid value |
| **School** | Institution | Licensed | Cohorts, evaluator console, analytics, priority | Seat-based or per-class |
| **Talent** | Employer | Per assessment + workspace | Tier batteries, role fit, PIP, cohort benchmark, API | Pay-to-deploy model, self-serve + enterprise |

**Ordering decision:** `checkout` for consumer plans; for B2B (School/Talent) use **contact / workspace provisioning**, not raw checkout, initially.

### 4.3 Billing primitives (later phase)
- Stripe Billing (subscriptions + usage). Gate logic isolated behind a `plans.ts` entitlement module — UI never hard-codes plan gates.

---

## 5. Information Architecture & Routing

Routing becomes **journey-based**. Top-level segments:

```
/                         → Marketing landing
/mode                     → Context selection (first-run only)
/onboarding               → NEW: personalized wizard (context→role→goal→plan→first-run)
/auth/*                   → login, signup, callback, magic/invite, verify

/app                       → Protected shell root (adapts to persona)
  (nothing more here — resolved by backdrop)

/spaces/:workspaceId       → NEW: tenant root (B2B). All B2B pages live under the tenant.

/credential/:id            → Public shared credential (NEW, verifiable)
/invite/:token             → NEW: B2B invite landing (anonymous → auth → join)
```

### 5.1 Persona shells (replacing the single shared sidebar)

| Persona | Shell base path | Left nav (primary) | Home/redirect |
|---|---|---|---|
| Individual/Student | `/app` | Home, Assess, Progress, Reports, Roadmap, Credential, Settings | `/app/home` |
| Teacher | `/app` (school nav) | Dashboard, Classes, Analytics, Reports, Settings | `/app/home` |
| Employer | `/spaces/:id` | Console, Deploy, Candidates, PIPs, Cohorts, Settings | `/spaces/:id/console` |
| Evaluator | `/app` (eval nav) | Dashboard, Assigned, Scoring, Interview, Settings | `/app/home` |
| Admin (tenant) | `/spaces/:id/admin` | Members, Roles, Plans, Billing, Invitations, Monitors | `/spaces/:id/admin` |

### 5.2 Explicit route map (target state)

```
// Marketing & entry
/  /mode  /onboarding
/auth/login  /auth/signup  /auth/callback  /auth/invite  /auth/reset
/credential/:id  /invite/:token

// Individual / School (personal shell)
/app/home
/app/assess (fetch latest cycle; resume if in progress)
/app/assess/:cycleId
/app/progress
/app/report
/app/roadmap
/app/credential
/app/settings

// Interview (reuses personal shell, eval nav)
/app/interview  /app/interview/setup  /app/interview/session/:id   /app/interview/scoring/:id  /app/interview/report/:id

// Employer (tenant shell)
/spaces/:wid/console
/spaces/:wid/deploy
/spaces/:wid/deploy/:deployId
/spaces/:wid/candidates    /spaces/:wid/candidates/:id
/spaces/:wid/pip/:candidateId
/spaces/:wid/cohorts
/spaces/:wid/settings

// Admin (tenant control plane)
/spaces/:wid/admin/members
/spaces/:wid/admin/roles
/spaces/:wid/admin/plans
/spaces/:wid/admin/billing
/spaces/:wid/admin/invitations
/spaces/:wid/admin/monitors
```

### 5.3 Routing guards
- `PublicShell` for marketing + auth.
- `OnboardingGate`: if user exists but hasn't completed onboarding → force `/onboarding`.
- `TenantGuard`: for `/spaces/:wid/*`, assert membership via RBAC; else redirect.
- `CredentialGuard` for `/credential/:id`: public-by-design but with token/hash for privacy.

---

## 6. Onboarding Journey (Phase 1 detail)

Goal: convert "a form" into "an experience" and set the person up for a successful first cycle.

### Wizard steps (state machine)
1. **Context** — Which context? (Individual / School / Interview / Enterprise). Pre-fills from `/mode`.
2. **Role / Persona** — who am I (individual, student, teacher, evaluator, employer)? For B2B → create/join workspace + role.
3. **Goal** — what brings you here (career clarity, personal growth, academic, hiring, teaching).
4. **Age / purpose** (for individual/student) — reuse existing age groups + purposes.
5. **Plan** — Free vs. Pro (the revenue moment). Show value of Pro via longitudinal loop, not price.
6. **First-run brief** — what happens next, time estimate, section map, ability to resume. Then elegantly launch `/app/assess` or context equivalent.

### Key principles
- **Progressive disclosure:** ask the minimum needed to route; backfill later.
- **Every step teaches** the framework (why IQ/EQ/SQ/AQ matter) — onboarding is also product education.
- **B2B branch is separate:** employer/teacher flows collect workspace + invite logic, not personal goals.
- **Persist state** to Firestore so a partially-completed onboarding resumes (refresh-safe).

### Exit criteria
- New-user → assessment **completion rate** rises (measure from onboarding drop-off vs. current form).
- Time-to-first-assessment < 2 minutes from signup.

---

## 7. Assessment UX Upgrades (Phase 3 detail)

The engine + validation already guarantee correctness; the UX must match.

- **Checkpointing & resume:** persist `answers` + `stepIndex` + `phase` on every answer (debounced) to Firestore; show "Resume" from Dashboard/home.
- **Focus mode:** one section at a time, calm, no chrome, progress rail with per-section **time estimate + elapsed**, "continue where you left off".
- **Auto-save** with explicit "Last saved" indicator + offline-tolerant local buffer.
- **Section transitions** with context (what the section measures, why it matters) — turns a test into a development experience.
- **Decompose** the 1300-line `Assessment.jsx` and `EnterpriseRunner.jsx` into: `runner/` (stepper, rail, save engine), `items/` (MCQ, Likert, SJT, Open, Rubric, Diagram, AI), `stages/` (intake, review). Shared with the enterprise runner.
- **Completion → results** transition is a "reveal", not a redirect — reward the completion.

---

## 8. Design System Component Library (Phase 4 detail)

The tokens already exist (`index.css` @theme). Operationalize into a component library so UI work scales.

| Layer | Contents |
|---|---|
| **Foundations** | Color, type (`display/headline/body/label/technical`), radius (severe/tiny), spacing unit, easing |
| **Primitives** | `Button`, `Input`, `Select`, `Checkbox`, `Toggle`, `Tag/Chip`, `Card`, `Modal`, `Field`, `Tooltip`, `Stepper`, `Progress` |
| **Domain** | `QidsMark`, `RadarChart`, `ScoreCard`, `PillarCard`, `BandBadge`, `ResultReveal`, `RunnerStepper`, `PipRadar`, `Heatmap` |
| **Patterns** | `EmptyState`, `CoachMark`, `OnboardingStep`, `SectionRail`, `Toast`, `Loading/Skeleton`, `InlineNotice` |

**Rules**
- Every component consumes only design tokens (no raw hex).
- Accessibility (focus states, contrast, keyboard) is a definition-of-done.
- New pages compose from the library; no new bespoke styling without approval.
- Radix/Headless anchors where interaction complexity warrants it (keep current aesthetic).

---

## 9. SaaS Foundations (later phase — architectural placeholder)

Design the seams now, build later:
- **Tenancy:** `organizations` / `workspaces` collection; membership map; `users.tenantId`.
- **RBAC:** `assignable roles` per workspace; UI gating via a `can(permission)` helper backed by claims; never trust client role strings alone.
- **Entitlements:** `plans.ts` returns booleans (`canRunCycle`, `canExportCredential`, `maxSeats`…). UI reads entropy, never hard-codes plan names.
- **Invites:** signed token → invite record → auth → claim.
- **Integrations/API (future):** webhooks + a public API for enterprises; audit log.

---

## 10. Credential & Evidence Layer (viral loop)

The PIP and IndividualCredential are the under-leveraged assets.
- **Shareable, verifiable credential** at `/credential/:id` — a polished, print/PDF/A2 share artifact (gated to Pro).
- **Claim-based verification** (hash + issued-at + issuer) so employers can trust it — this is a genuine differentiator vs. self-reported resumes.
- Ties the individual loop to the employer loop: an employer sees a credential → wants to run their own QGRA → new B2B customer.

---

## 11. Phased Roadmap

| Phase | Scope | Outcomes |
|---|---|---|
| **P0 (now)** | Blueprint + agreement | This doc; shared target |
| **P1** | Onboarding journey + persona shells + routing restructure | "Feels like a product"; new-user completion ↑; distinct IA per audience |
| **P2** | Assessment UX upgrade | Resume/checkpoint/focus mode; decomposed runner |
| **P3** | Component library | Consistent, fast, accessible UI |
| **P4** | SaaS foundations + billing | Plans, tenants, RBAC, Stripe, invitations |
| **P5** | Credential/share layer + API | Viral loop, trust layer, integrations |

Each phase ships independently; the domain engine stays untouched through P1–P3.

---

## 12. Definition of Done (every phase)

- Runs `npm run build` cleanly; no new type errors.
- No drift between UI and scoring (deployment + validation contracts respected).
- All new UI uses design tokens only.
- Accessibility + responsive checked on at least 3 breakpoints.
- E2E smoke (`npm run test:e2e`) still passes / extended where touched.
