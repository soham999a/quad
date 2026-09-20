// ─── Page guide registry ──────────────────────────────────────────────────────
// Per-tab manuals, surfaced by the "?" button (PageGuide) and the first-run
// tour. Matched by exact path, then by longest prefix — so /app/school/class/xyz
// inherits the /app/school guide, and /app/individual/results/123 the
// /app/individual one. Unknown routes fall back to `fallback`.

export const FALLBACK_GUIDE = {
  title: 'This page',
  intro: 'Open the sidebar to move between sections — or press Ctrl/⌘+K to search every page and action from anywhere.',
  tips: [
    { title: 'Command palette', body: 'Press Ctrl/⌘+K to jump to any page, start an assessment, or switch the theme without touching the mouse.' },
    { title: 'Your guide button', body: 'The ? button in the top bar opens this manual on every tab — context-aware, no searching the docs.' },
    { title: 'Find your way back', body: 'The palette keeps a Recent list of the pages you visited, so returning is one keystroke away.' },
  ],
};

export const PAGE_GUIDES = {
  '/app/dashboard': {
    title: 'Home',
    intro: 'Your landing point — a live snapshot of where you are in the QIDS cycle and the fastest next action.',
    tips: [
      { title: 'Status cards', body: 'Each card reflects real state: assessment done or pending, evaluator assigned, latest result. Nothing here is decorative.' },
      { title: 'One primary action', body: 'The highlighted call-to-action is always the next step in your cycle — start, continue, or reassess.' },
      { title: 'Deep results', body: 'From here you reach the full breakdown: pillar scores, grade, career profile, and your verifiable credential.' },
    ],
  },
  '/app/individual': {
    title: 'My Assessment',
    intro: 'The full QIDS instrument — IQ, EQ, SQ and AQ, with checkpointing so you can safely pause and resume.',
    tips: [
      { title: 'It saves as you go', body: 'Every answer is checkpointed locally and synced to your account. Close the tab, switch devices — Resume brings you back exactly where you were.' },
      { title: 'Keyboard velocity', body: 'In choice questions, press A–D to pick an option and 1–5 for scales. Faster than clicking for long sections.' },
      { title: 'Honest answering', body: 'Scales have no right answers. Answer for how you actually operate — the development plan is only as good as the input.' },
      { title: 'AI bonus rounds', body: 'Some sections offer optional AI-generated questions. Open answers are rubric-scored — worth attempting, not guessable.' },
    ],
  },
  '/app/assessment': {
    title: 'Assessment',
    intro: 'The guided QIDS run: Intake → IQ → EQ → SQ → AQ → Review. Progress is checkpointed at every step.',
    tips: [
      { title: 'Six steps, one sitting', body: 'Budget 40–60 minutes. You can pause between any two steps and resume later — nothing is lost.' },
      { title: 'Focus mode', body: 'While answering, the surrounding interface fades so the question is the only thing on screen.' },
      { title: 'Review before submit', body: 'The final step shows completeness per section. Submit only when every section is green.' },
    ],
  },
  '/app/progress': {
    title: 'Progress',
    intro: 'Your development timeline across the three phases — Pre, Intervention and Post — plus your growth trend.',
    tips: [
      { title: 'Growth trend', body: 'With two or more assessments, a trajectory chart appears showing how IQ, EQ, SQ and AQ moved over time.' },
      { title: 'Phase workflow', body: 'Pre is your baseline. Intervention tracks the plan you are working. Post re-scores to measure the delta.' },
      { title: 'Score deltas', body: 'After a post-assessment, every pillar shows before → after with the net change highlighted.' },
    ],
  },
  '/app/report': {
    title: 'Reports',
    intro: 'Assemble and print a clean, evidence-based report from your assessment data.',
    tips: [
      { title: 'Print-ready', body: 'The print stylesheet strips all interface chrome — what you preview is exactly what prints or saves as PDF.' },
      { title: 'Evaluator merge', body: 'If an evaluator has scored your EQ or SQ, their assessment is merged in automatically and marked as such.' },
    ],
  },
  '/app/pillars': {
    title: 'Four Pillars',
    intro: 'The model behind the measurement — what IQ, EQ, SQ and AQ each capture and why all four together.',
    tips: [
      { title: 'Why four', body: 'Single-number intelligence misses how people actually operate. The four quotients are read as a shape, not a ranking.' },
      { title: 'Drill in', body: 'Select a pillar to see its components and how each is scored in the instrument.' },
    ],
  },
  '/app/framework': {
    title: 'Framework Guide',
    intro: 'The full QIDS architecture: how assessment, evidence, development and reassessment connect.',
    tips: [
      { title: 'Start anywhere', body: 'The map is non-linear — tap any node to read what it does and what feeds it.' },
      { title: 'The loop matters', body: 'Assess → plan → practice → reflect → reassess. One measurement is a snapshot; the loop is the product.' },
    ],
  },
  '/app/intervention-plan': {
    title: 'Intervention Plan',
    intro: 'Your personalised development plan, generated from your weakest-scoring sub-dimensions.',
    tips: [
      { title: 'Prioritised for you', body: 'Modules are ordered by impact on your profile — the top of the plan moves the needle most.' },
      { title: 'Pro feature', body: 'This page is part of the Pro plan. If it is locked, the upsell screen explains what unlocks it.' },
    ],
  },
  '/app/my-evaluator': {
    title: 'My Evaluator',
    intro: 'The assessor assigned to triangulate your self-assessment with professional observation.',
    tips: [
      { title: 'Why an evaluator', body: 'EQ and SQ are stronger when a second rater is involved. Your evaluator\'s scores are merged into results and clearly attributed.' },
      { title: 'Assignment is admin-managed', body: 'If nobody is listed yet, an admin assigns one — usually your teacher, coach or manager.' },
    ],
  },
  '/app/school': {
    title: 'Classes',
    intro: 'Create classes, share join codes, and track every student through the assessment cycle.',
    tips: [
      { title: 'Join codes', body: 'Students self-enrol with the six-character code — no emails or imports needed. Copy it straight from the class card.' },
      { title: 'Analytics', body: 'Open a class to see completion status, then Analytics for cohort pillar averages, grade distribution and CSV export.' },
      { title: 'New assessments', body: 'Deploy school-context assessments to the whole class in one action from the class page.' },
    ],
  },
  '/app/school/join': {
    title: 'Join a Class',
    intro: 'Enrol in your school\'s QIDS class with the code your facilitator shared.',
    tips: [
      { title: 'One code does it', body: 'Enter the six-character code exactly — it is case-insensitive. You only ever join once.' },
    ],
  },
  '/app/school/reports': {
    title: 'School Reports',
    intro: 'Cohort-level reporting across your classes — built for facilitator reviews and parent meetings.',
    tips: [
      { title: 'Print clean', body: 'Reports are print-optimised: headers, footers and navigation disappear on paper automatically.' },
    ],
  },
  '/app/evaluator': {
    title: 'Evaluator Dashboard',
    intro: 'Your assigned students and the status of each scoring task.',
    tips: [
      { title: 'Scoring flow', body: 'Open an assigned student to score their EQ/SQ activities against the rubric. Scores merge into their results instantly.' },
      { title: 'Assignments come from admins', body: 'You see only students explicitly assigned to you — nothing else is readable.' },
    ],
  },
  '/app/interview': {
    title: 'Interview Studio',
    intro: 'Evidence-based interviews: structured setup, live scoring and post-interview reports.',
    tips: [
      { title: 'Setup first', body: 'Define the candidate, role and rubric weighting before the session — the scorecard is generated from it.' },
      { title: 'Live mode', body: 'During the interview, score dimension-by-dimension; the report computes the moment you finish.' },
      { title: 'Share the report', body: 'Finished reports are printable and can be shared with the hiring panel as-is.' },
    ],
  },
  '/app/talent': {
    title: 'Talent Console',
    intro: 'Read candidates as architectures — role fit and cohort insight beyond a single score.',
    tips: [
      { title: 'Role fit first', body: 'Each candidate maps to an 8-dimension role vector. Compare against the target role, not just totals.' },
      { title: 'Deploy batteries', body: 'Send tiered assessments (QGRA/QPIA/QLIA) to candidates; results land back here automatically.' },
    ],
  },
  '/app/enterprise': {
    title: 'Enterprise Assessment',
    intro: 'Tiered team batteries — QGRA core, QPIA and QLIA add depth — with reproducible, seeded deployments.',
    tips: [
      { title: 'Best-worst modules', body: 'Some modules ask for most/least rather than scores. Answer honestly; ipsative scoring handles the rest.' },
      { title: 'Integrity flags', body: 'Inconsistency and speed indicators are computed per module and surfaced in results — they guard score quality.' },
      { title: 'Resume-safe', body: 'Like the individual assessment, progress is checkpointed locally and to your account.' },
    ],
  },
  '/app/role-fit': {
    title: 'Role Fit',
    intro: 'Map a person against a role track — 8 dimensions, weighted for the role, not generic.',
    tips: [
      { title: 'Pick the track', body: 'Role tracks carry their own dimension weightings. The same profile scores differently for Design vs Sales — by design.' },
    ],
  },
  '/app/admin': {
    title: 'Admin Panel',
    intro: 'User management, evaluator assignment and the product funnel — everything operational.',
    tips: [
      { title: 'Assigning evaluators', body: 'Expand a student, pick an evaluator. Assignment drives both their My Evaluator page and the evaluator\'s queue — and the public directory stays in sync.' },
      { title: 'Funnel view', body: 'The funnel shows signups through credential publication over the last 30 days — the fastest way to spot drop-off.' },
      { title: 'Roles are deliberate', body: 'Role changes propagate everywhere: route guards, directory listings and permissions update immediately.' },
    ],
  },
  '/app/settings': {
    title: 'Settings',
    intro: 'Profile, role, security and plan — the account control room.',
    tips: [
      { title: 'Password', body: 'Email accounts can change password here; Google accounts manage it at Google.' },
      { title: 'Plan visibility', body: 'Your current plan and every entitlement it unlocks are listed transparently — no hidden gates.' },
    ],
  },
};

/** Resolve the guide for a pathname: exact match, then longest prefix. */
export function guideForPath(pathname) {
  if (PAGE_GUIDES[pathname]) return PAGE_GUIDES[pathname];
  const matches = Object.keys(PAGE_GUIDES)
    .filter(p => pathname.startsWith(p + '/'))
    .sort((a, b) => b.length - a.length);
  return matches.length ? PAGE_GUIDES[matches[0]] : FALLBACK_GUIDE;
}
