// ─── Kids 4Q Practice — progress engine ──────────────────────────────────────
// Pure functions over the stored record. Nothing here is persisted as truth:
// nodes, badges, tallies and streaks are all DERIVED, so the UI can never drift
// out of sync with what the child actually did (the failure mode of the mock,
// where "3 badges" was an array index).
//
// One session per chapter is counted for the tally — the most recent one — so
// replaying a chapter cannot farm practice points.

import { CHAPTERS, getChapter } from '../../data/kids/story';
import type {
  BadgeView,
  DerivedState,
  KidsChapter,
  KidsChoice,
  KidsProgress,
  KidsScene,
  KidsSession,
  PathNode,
  PracticeEvent,
  PracticeEvidence,
  Quotient,
} from './types';

export const QUOTIENT_LIST: Quotient[] = ['IQ', 'EQ', 'SQ', 'AQ'];

export const QUOTIENT_LABEL: Record<Quotient, string> = {
  IQ: 'Thinking',
  EQ: 'Feeling',
  SQ: 'Together',
  AQ: 'Bravery',
};

export function emptyProgress(childId: string): KidsProgress {
  return { childId, sessions: [], updatedAt: null };
}

/** Defensive read: tolerates a legacy/malformed document from Firestore. */
export function normalizeProgress(raw: unknown, childId: string): KidsProgress {
  const p = (raw || {}) as Partial<KidsProgress>;
  const sessions = Array.isArray(p.sessions)
    ? p.sessions
        .filter(s => s && typeof s.chapterId === 'string' && getChapter(s.chapterId))
        .map(s => ({
          id: String(s.id || `${s.chapterId}-${s.startedAt || 'x'}`),
          chapterId: s.chapterId,
          startedAt: String(s.startedAt || new Date(0).toISOString()),
          completedAt: s.completedAt ? String(s.completedAt) : null,
          choices: Array.isArray(s.choices) ? s.choices : [],
          bonusUnlocked: !!s.bonusUnlocked,
        }))
    : [];
  return {
    childId,
    sessions,
    events: Array.isArray(p.events) ? p.events : [],
    updatedAt: p.updatedAt ? String(p.updatedAt) : null,
  };
}

/** The signal a completed session emits for the report layer. */
export function practiceEventFor(session: KidsSession, completedAt: string): PracticeEvent {
  const quotients: Record<Quotient, number> = { IQ: 0, EQ: 0, SQ: 0, AQ: 0 };
  for (const c of session.choices) {
    if (QUOTIENT_LIST.includes(c.quotient)) {
      quotients[c.quotient] += Math.max(0, Number(c.weight) || 0);
    }
  }
  return { chapterId: session.chapterId, completedAt, quotients };
}

function latestByChapter(progress: KidsProgress): Map<string, KidsSession> {
  const map = new Map<string, KidsSession>();
  for (const s of progress.sessions || []) {
    const prev = map.get(s.chapterId);
    if (!prev || new Date(s.startedAt).getTime() >= new Date(prev.startedAt).getTime()) {
      map.set(s.chapterId, s);
    }
  }
  return map;
}

export function sessionFor(progress: KidsProgress, chapterId: string): KidsSession | null {
  return latestByChapter(progress).get(chapterId) || null;
}

/** Begin (or restart) a chapter. Restarting archives the old session. */
export function startSession(
  progress: KidsProgress,
  chapterId: string,
  now: string = new Date().toISOString(),
): KidsProgress {
  const existing = sessionFor(progress, chapterId);
  if (existing && !existing.completedAt) return progress;
  const session: KidsSession = {
    id: `${chapterId}-${now}`,
    chapterId,
    startedAt: now,
    completedAt: null,
    choices: [],
    bonusUnlocked: false,
  };
  return { ...progress, sessions: [...progress.sessions, session], updatedAt: now };
}

/** Record one decision against the chapter's open session. */
export function recordChoice(
  progress: KidsProgress,
  chapterId: string,
  sceneId: string,
  choice: KidsChoice,
  now: string = new Date().toISOString(),
): KidsProgress {
  let next = progress;
  const open = sessionFor(progress, chapterId);
  if (!open || open.completedAt) next = startSession(progress, chapterId, now);

  const session = sessionFor(next, chapterId)!;
  const recorded = {
    sceneId,
    choiceId: choice.id,
    quotient: choice.quotient,
    weight: choice.weight,
    at: now,
  };
  const updated: KidsSession = {
    ...session,
    choices: [...session.choices, recorded],
    bonusUnlocked: session.bonusUnlocked || !!choice.unlockBonus,
  };
  return {
    ...next,
    sessions: next.sessions.map(s => (s.id === session.id ? updated : s)),
    updatedAt: now,
  };
}

export function completeSession(
  progress: KidsProgress,
  chapterId: string,
  now: string = new Date().toISOString(),
): KidsProgress {
  const session = sessionFor(progress, chapterId);
  if (!session || session.completedAt) return progress;
  return {
    ...progress,
    sessions: progress.sessions.map(s =>
      s.id === session.id ? { ...s, completedAt: now } : s,
    ),
    updatedAt: now,
  };
}

/** The ordered scene list for a chapter, including the bonus when unlocked. */
export function scenePath(chapter: KidsChapter, session: KidsSession | null): KidsScene[] {
  const path = [...chapter.scenes];
  if (session?.bonusUnlocked && chapter.bonus) path.push(chapter.bonus);
  return path;
}

/** Where the child is inside a chapter: scene, index, and total path length. */
export function currentScene(
  chapter: KidsChapter,
  session: KidsSession | null,
): { scene: KidsScene | null; index: number; total: number } {
  const path = scenePath(chapter, session);
  const index = session ? session.choices.length : 0;
  return { scene: path[index] || null, index, total: path.length };
}

const BADGE_DEFS: Array<{ id: string; label: string; description: string; chapterId?: string }> = [
  { id: 'first_light', label: 'First Light', description: 'Finished your first chapter.' },
  { id: 'empathy', label: 'Kind Compass', description: 'Completed Empathy.', chapterId: 'empathy' },
  { id: 'logic', label: 'Pattern Finder', description: 'Completed Logic.', chapterId: 'logic' },
  { id: 'teamwork', label: 'Bridge Builder', description: 'Completed Teamwork.', chapterId: 'teamwork' },
  { id: 'courage', label: 'Storm Walker', description: 'Completed Courage.', chapterId: 'courage' },
  { id: 'curiosity', label: 'Question Machine', description: 'Completed Curiosity.', chapterId: 'curiosity' },
  { id: 'mastery', label: 'Fair Machine', description: 'Completed Mastery.', chapterId: 'mastery' },
  { id: 'balanced', label: 'Four Corners', description: 'Practised all four quotients.' },
  { id: 'full_path', label: 'Whole Map', description: 'Completed every chapter.' },
];

function deriveBadges(completed: string[], tally: Record<Quotient, number>): BadgeView[] {
  const set = new Set(completed);
  const allQuotientsPractised = QUOTIENT_LIST.every(q => (tally[q] || 0) > 0);
  return BADGE_DEFS.map(def => {
    let earned = false;
    if (def.chapterId) earned = set.has(def.chapterId);
    else if (def.id === 'first_light') earned = completed.length >= 1;
    else if (def.id === 'balanced') earned = allQuotientsPractised && completed.length >= 2;
    else if (def.id === 'full_path') earned = completed.length === CHAPTERS.length;
    return { id: def.id, label: def.label, description: def.description, earned };
  });
}

/** Days with a completed chapter, counting back from the most recent day. */
function deriveStreak(sessions: KidsSession[]): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.completedAt) days.add(s.completedAt.slice(0, 10));
  }
  if (!days.size) return 0;
  const dayMs = 86400000;
  let cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  // A streak still counts if the last completed day was yesterday.
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor = new Date(cursor.getTime() - dayMs);
    if (!days.has(cursor.toISOString().slice(0, 10))) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - dayMs);
  }
  return streak;
}

export function deriveState(progress: KidsProgress): DerivedState {
  const sessions = progress.sessions || [];
  const latest = latestByChapter(progress);

  const completedChapterIds: string[] = [];
  for (const chapter of CHAPTERS) {
    if (sessions.some(s => s.chapterId === chapter.id && s.completedAt)) {
      completedChapterIds.push(chapter.id);
    }
  }

  // Tally: one session per chapter (its most recent), so replays don't farm.
  const tally: Record<Quotient, number> = { IQ: 0, EQ: 0, SQ: 0, AQ: 0 };
  let totalChoices = 0;
  for (const session of latest.values()) {
    for (const c of session.choices) {
      if (!QUOTIENT_LIST.includes(c.quotient)) continue;
      tally[c.quotient] += Math.max(0, Number(c.weight) || 0);
      totalChoices += 1;
    }
  }

  const completedSet = new Set(completedChapterIds);
  const currentChapter = CHAPTERS.find(c => !completedSet.has(c.id)) || null;

  let inProgress: DerivedState['inProgress'] = null;
  if (currentChapter) {
    const session = latest.get(currentChapter.id);
    if (session && !session.completedAt) inProgress = { chapter: currentChapter, session };
  }

  // "Start" is where the path begins: it is the current node until the child
  // begins their first chapter, then it is done for good.
  const nodes: PathNode[] = [
    { id: 'start', label: 'Start', state: sessions.length ? 'done' : 'current' },
    ...CHAPTERS.map(c => ({
      id: c.id,
      label: c.node,
      chapterId: c.id,
      state: completedSet.has(c.id)
        ? ('done' as const)
        : c.id === currentChapter?.id
          ? ('current' as const)
          : ('locked' as const),
    })),
  ];

  return {
    completedChapterIds,
    tally,
    nodes,
    badges: deriveBadges(completedChapterIds, tally),
    currentChapter,
    inProgress,
    streakDays: deriveStreak(sessions),
    totalChoices,
    chaptersComplete: completedChapterIds.length,
    totalChapters: CHAPTERS.length,
  };
}

/** The chapter a child should play today (first unfinished), or null when done. */
export function nextChapter(progress: KidsProgress): KidsChapter | null {
  return deriveState(progress).currentChapter;
}

/** The single in-progress session, if the child left a chapter mid-way. */
export function activeSession(progress: KidsProgress): KidsSession | null {
  return progress.sessions.find(s => !s.completedAt) || null;
}

/**
 * The report-facing contract. Deliberately weak: activity counts, clearly
 * marked self-reported, so no report can mistake practice for a measurement.
 */
export function practiceEvidence(progress: KidsProgress): PracticeEvidence {
  const state = deriveState(progress);
  const completed = progress.sessions
    .filter(s => s.completedAt)
    .map(s => s.completedAt as string)
    .sort();
  return {
    selfReported: true,
    chaptersCompleted: state.chaptersComplete,
    totalChapters: state.totalChapters,
    practiceMix: state.tally,
    streakDays: state.streakDays,
    lastActivityAt: completed.length ? completed[completed.length - 1] : null,
  };
}

/** Completion ratio 0–1, used by the path header. */
export function completionRatio(progress: KidsProgress): number {
  const { chaptersComplete, totalChapters } = deriveState(progress);
  return totalChapters ? chaptersComplete / totalChapters : 0;
}
