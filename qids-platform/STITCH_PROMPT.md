# Stitch prompts — QiDS landing + auth pages

Every word below is lifted from the real product (locale files + pages), so what Stitch
renders will match the app. Paste one prompt per screen at https://stitch.withgoogle.com.

**Tip:** Stitch works best when the style block comes first and the content after —
that's how these are written. Generate the landing first, then start the login and
signup as *new screens in the same project* so the theme carries over. Iterate with
short follow-ups ("make the hero diagram larger", "tighten the spacing in section 4").
When you're happy, use "Copy for Figma" to get it into Figma, and bring the chosen
design back here — I'll rebuild it in `Landing.jsx` / `Login.jsx` / `Signup.jsx` with
the existing tokens so routing, i18n, dark/light and the language switcher keep working.

---

## 0. Brand block (prepend to any prompt if you generate screens separately)

> STYLE: Dark editorial "architectural atlas" aesthetic for an assessment platform
> called QiDS. Deep near-black ink background (#0B0B09), warm off-white text, ONE
> accent color: muted gold (#C9A45C-ish) used for numerals, eyebrows, active states
> and the primary button hover. Everything is separated by 1px hairline borders in
> low-contrast warm gray — grids are cells divided by hairlines, not shadowed cards.
> Completely flat, no drop shadows, no gradients. Typography: a grotesque display
> font (Space Grotesk style) for very large light headlines with tight negative
> letter-spacing; a monospace (JetBrains Mono style) for small UPPERCASE labels,
> roman-numeral section indexes ("II — METHOD") and data. Roman-numeral gold mono
> eyebrows open each section. Huge vertical padding between sections, 1440px max
> content width, 12-column grid. Feels like a printed engineering atlas, not a
> SaaS template. Mobile: single column, sections stack, pipeline scrolls horizontally.

---

## 1. Landing page prompt

> Design a premium dark landing page for "QiDS — Quadrant Intelligence Diagnostic
> System", a human-capability assessment platform. [PASTE BRAND BLOCK]
>
> NAV: hairline bottom border. Left — small gold geometric quadrant logo mark +
> "QiDS" in mono. Center-right links: Method · Architecture · Profile · FAQ. Right —
> a small language selector "EN" and a gold-outlined button "Begin Assessment".
>
> HERO (two columns): Left — gold mono eyebrow "I · 01 — INTELLIGENCE · ARCHITECTURE ·
> IMPACT". Huge two-line light headline: "Human development," then "structured." in
> gray. Paragraph: "QiDS is infrastructure for human capability — connecting
> assessment, evidence, development, and longitudinal growth across people and
> institutions." Buttons: filled gold "Begin Assessment →" and hairline-outlined
> "Explore Architecture ↗". Below, a mono uppercase micro-row: "ONE ARCHITECTURE ·
> FOUR QUOTIENTS · MULTIPLE CONTEXTS". Right — an abstract blueprint diagram: a
> central node with four radiating quadrant axes labeled IQ, EQ, SQ, AQ, connected by
> hairlines to orbiting nodes named Assessment, Evidence, Development, Growth — like
> a star chart drawn in thin gold and gray lines.
>
> STAT STRIP — four hairline-divided cells, big gold numerals over small labels:
> "IV — Quotients measured — IQ · EQ · SQ · AQ" / "03 — Product wings — Individual ·
> School · Interview" / "∞ — Evidence over time — Assessment is the entry" /
> "08–60 — Designed age range — Child to professional".
>
> METHOD section, eyebrow "II — METHOD": Left — headline "Four quotients. / One
> coherent system." and paragraph "Each quotient is a lens into capability. Together
> they create a structured view that can move from measurement into deliberate
> development." Right — a 2×2 hairline grid of quotient cells, each with a small
> index, an oversized colored two-letter glyph, a title and one line:
> 01 · IQ (soft blue) · Cognitive intelligence — "Reasoning, analysis, structured
> problem-solving, and synthesis."
> 02 · EQ (warm coral) · Emotional intelligence — "Self-awareness, empathy,
> regulation, and relational depth."
> 03 · SQ (teal) · Social intelligence — "Collaboration, citizenship, communication,
> and contextual judgment."
> 04 · AQ (violet) · Adaptive intelligence — "Resilience, learning agility, and
> response to ambiguity and change."
>
> ARCHITECTURE section, eyebrow "III — ARCHITECTURE": Left rail — "Assessment is the
> entry point." Main — large gray display sentence: "Outputs become development
> inputs. Evidence accumulates. The system returns to the person with a clearer next
> action." Then a horizontal pipeline of ten hairline boxes joined by small gold
> arrows: Human → Assessment → Capability mapping → Evidence → AI analysis →
> Development plan → Growth missions → Portfolio → Reassessment → Impact. Below, three
> text columns: "Evidence — observable work, reflection and artifacts." /
> "Human judgement — AI is an internal capability bounded by human interpretation and
> responsibility." / "Longitudinal synthesis — Progress is read across cycles rather
> than reduced to a single score."
>
> PRODUCT WINGS section, eyebrow "IV — PRODUCT WINGS": headline "One architecture. /
> Three primary contexts." with a small link "Read the atlas →". Three tall hairline
> cells, each with an index top-left and ↗ arrow top-right:
> 01 Individual — "Personal human development and longitudinal capability growth." —
> mono footnote "PROFILE · EVIDENCE · PRACTICE · ROADMAP"
> 02 School — "Cohorts, classes, and facilitation organized for age-banded learning
> journeys." — mono footnote "COHORTS · CURRICULUM · FACILITATION"
> 03 Interview — "Professional readiness and evidence-based interview intelligence." —
> mono footnote "CONTEXT · BEHAVIOUR · CAPABILITY"
>
> EXTENSIONS section, eyebrow "V — EXTENSIONS": headline "Development meets the
> organization." paragraph "The same architecture extends into teams and hiring —
> where capability becomes organizational evidence." Two hairline cells:
> "ENTERPRISE · QGRA+ / Teams, leaders, and organizational intelligence. / Apply the
> four-quotient architecture across teams and leadership with tiered enterprise
> assessment. / Open console →"
> "TALENT CONSOLE · EVIDENCE-BASED HIRING / Capability, made legible. / Read
> candidates as architectures — role fit and cohort insight beyond a single score. /
> View console →"
>
> OUTPUT section, eyebrow "THE OUTPUT": headline "Not a score. / An architecture of
> you." side paragraph "Every cycle produces a four-quotient profile, a grade, and a
> development plan — and a credential you can seal and share, verifiable by anyone
> with the link." Two cells: left — a radar/spider chart with four axes labeled
> IQ 78, EQ 64, SQ 71, AQ 58 and a translucent gold polygon; right — a sample
> credential card: "QiDS" mono mark with "● VERIFIED" in gold, title "Sample
> Profile", mono subline "GRADE A · EXCEPTIONAL", four thin horizontal bars for
> IQ/EQ/SQ/AQ with their values, and a mono footer "SHA-256 · 9F2C41…8E1A" +
> "qids.app/credential/8F3K2M".
>
> CONTEXTS section, eyebrow "VI — CONTEXTS": headline "A parameterized system."
> paragraph "The architecture stays coherent while language, defaults, and modules
> adapt to context." A hairline-divided list with columns index / name /
> description / status chip:
> 01 Individual — Personal development and self-directed growth. — CURRENT (gold)
> 02 School — Student, cohort, and facilitator context. — CURRENT
> 03 Interview — Evidence-based professional readiness. — CURRENT
> 04 Enterprise — Teams, leaders, and L&D contexts. — CURRENT
> 05 College — Higher-education capability development. — IN DEVELOPMENT (gray)
> 06 Custom — A parameterized institutional configuration. — IN DEVELOPMENT (gray)
>
> DEVELOPMENT LOOP section, eyebrow "VII — DEVELOPMENT LOOP": huge headline
> "Measurement is the beginning. / Development is the system." Seven hairline cells
> in a row: 01 Assessment · 02 Evidence · 03 Intervention · 04 Practice ·
> 05 Reflection · 06 Reassessment · 07 Growth.
>
> DIFFERENTIATORS section, eyebrow "VIII — DIFFERENTIATORS": headline "Architecture
> before features." Four divided rows, title left / description right:
> "One architecture — Parameterized across contexts, instead of unrelated products."
> "Evidence triangulation — Development is anchored in more than a single assessment
> moment."
> "Bounded intelligence — AI supports synthesis while human judgement remains
> responsible for meaning."
> "Status discipline — Established architecture stays distinct from proposed concepts
> and future research."
>
> ACCESS section, eyebrow "IX — ACCESS": headline "Simple entry. / Scaled when you
> are." paragraph "The core assessment is free. Paid tiers for power users and
> institutions are in development." Three pricing cells:
> Free — $0 — CURRENT — features: One assessment cycle · Individual context · IQP
> summary report — gold filled button "Begin Assessment"
> Pro — TBA — IN DEVELOPMENT — features: Unlimited cycles · All contexts · Evidence
> portfolio · Credential export — disabled button "Coming soon"
> Institution — TBA — IN DEVELOPMENT — features: Cohorts & classes · Evaluator
> console · School analytics · Priority support — disabled button "Coming soon"
>
> FAQ section, eyebrow "FAQ": headline "Questions, / answered plainly." Six accordion
> rows with a rotating "+" icon:
> "How long does the assessment take?" → "The core cycle takes about 20 minutes; the
> complete battery runs 40–60. Progress is checkpointed at every step — pause and
> resume exactly where you left off, on any device."
> "Is this a clinical diagnosis?" → "No. QiDS is a developmental instrument. It
> measures four capability quotients to inform learning and growth decisions — it is
> not a medical or psychological diagnostic device."
> "Who can see my results?" → "You do. A designated evaluator sees only what they
> need to score — nothing else. Publishing a public credential is opt-in, and even
> then it exposes only the profile you choose to seal."
> "What are the four quotients?" → "IQ (cognitive), EQ (emotional), SQ (social) and
> AQ (adaptive). They are read together as a shape rather than a single number — and
> that shape drives your development plan."
> "What age range is supported?" → "Instruments are age-banded from 8 to 60 — child
> through professional — so the same architecture serves classrooms and hiring panels
> alike."
> "How much does it cost?" → "The core assessment is free. Pro and Institution tiers —
> unlimited cycles, evidence portfolios, cohort analytics — are in active
> development."
>
> FINAL CTA: centered eyebrow "X — BEGIN", huge headline "Start with a measure. /
> Build toward impact." two centered buttons "Begin Assessment →" and "Explore
> Architecture".
>
> FOOTER: hairline top border. Columns: brand mark + "Quadrant Intelligence
> Diagnostic System"; link groups Product (Method, Architecture, Profile), Contexts
> (Individual, School, Interview), Legal (Privacy, Terms). Bottom mono line: "© QiDS —
> Quadrant Intelligence Diagnostic System".

---

## 2. Login page prompt

> Design a dark, minimal sign-in screen for "QiDS — Quadrant Intelligence Diagnostic
> System". [PASTE BRAND BLOCK] Layout: a single centered column, max 480px, lots of
> empty dark space around it; a barely-visible film-grain texture over the whole
> background.
>
> Top — brand header: small gold quadrant logo mark beside the mono wordmark "QiDS",
> and below it in light display type, two lines: "Quadrant Intelligence" /
> "Diagnostic System".
>
> Section label: mono uppercase "SIGN IN" above a 1px hairline rule.
>
> Form: label "EMAIL ADDRESS" in mono uppercase with input placeholder
> "architect@qids.internal"; label "ACCESS KEY" with a right-aligned gold text-button
> "Recovery"; dark inputs with hairline borders that turn gold on focus; the password
> field has a small eye toggle to show/hide. Show one example error state box:
> hairline border in dim red with a short mono error line inside.
>
> Primary button: full-width, off-white background with near-black uppercase mono
> label "SIGN IN" (hover state: turns gold). Below, a divider with mono uppercase
> text "AUTH PROXY" between two hairlines, then a full-width hairline-outlined button
> "Continue with Google" with the Google G in the brand color.
>
> Footer, centered: "NEW PERSONNEL?" followed by a gold uppercase link "REQUEST
> ACCESS". Under it a compact language switcher row: EN · हिंदी · বাংলা · मराठी.
>
> Also show a mobile variant of the same screen: same stack, full-width inputs,
> 24px side margins.

---

## 3. Signup page prompt

> Design a dark registration screen for "QiDS — Quadrant Intelligence Diagnostic
> System", visually identical to its sign-in screen (same brand header, grain
> texture, hairline form styling) but taller. [PASTE BRAND BLOCK] Single centered
> column, max 480px.
>
> Brand header: gold quadrant mark + mono "QiDS", headline "Quadrant Intelligence
> Diagnostic System".
>
> Section label: mono uppercase "REGISTRATION" above a hairline rule.
>
> Fields, mono uppercase labels, hairline dark inputs with gold focus:
> "FULL NAME" (placeholder "Your full name") · "EMAIL ADDRESS" (placeholder
> "architect@qids.internal") · a two-column row: "ACCESS KEY" and "CONFIRM KEY",
> both password inputs, the first with an eye toggle.
>
> "CLASSIFICATION" — a picker of five selectable tiles in a responsive grid (2–3 per
> row). Each tile: hairline border, name in small type and a one-line gray
> description; the selected tile gets a gold border, gold text and a small gold
> check mark. The five options:
> Individual — "Personal development journey"
> Student — "School or institutional learner"
> Teacher — "Manage classes and assessments"
> Evaluator / Counselor — "Assess and guide others"
> Employer — "Hiring and talent intelligence"
> (show "Individual" selected)
>
> "CONTEXT" — a dark hairline dropdown select with options: Individual · School ·
> Interview · Enterprise · College · Custom.
>
> Primary button: full-width off-white with near-black uppercase mono label
> "REGISTER" (gold on hover). Divider with mono uppercase "PROXY", then a
> hairline-outlined "Continue with Google" button.
>
> Footer, centered: "EXISTING PERSONNEL?" + gold uppercase link "SIGN IN", and the
> compact language row EN · हिंदी · বাংলা · मराठी.
