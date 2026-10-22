// ─── Kids 4Q Practice — domain types ─────────────────────────────────────────
// The "practice" half of the QiDS development loop, kept independent of the
// assessment engine: a child plays a story chapter, every choice exercises one
// quotient and is recorded, and progression (nodes, badges, streak) is DERIVED
// from that record — never stored as an index.

export type Quotient = 'IQ' | 'EQ' | 'SQ' | 'AQ';

/** One branch of one scene. Choices are character decisions, not quiz items. */
export interface KidsChoice {
  id: string;
  text: string;
  /** Which quotient this choice actually exercises. */
  quotient: Quotient;
  /** Practice points 0–3. Not a grade — a record of what was practised. */
  weight: number;
  /** What the story does next, in the child's language. */
  consequence: string;
  /** Choice unlocks the chapter's optional bonus scene. */
  unlockBonus?: boolean;
}

export interface KidsScene {
  id: string;
  narration: string;
  prompt: string;
  choices: KidsChoice[];
}

export interface KidsChapter {
  id: string;
  /** 1-based position on the learning path. */
  index: number;
  title: string;
  subtitle: string;
  quotient: Quotient;
  minutes: number;
  /** Learning-path node label. */
  node: string;
  scenes: KidsScene[];
  bonus?: KidsScene;
}

export interface RecordedChoice {
  sceneId: string;
  choiceId: string;
  quotient: Quotient;
  weight: number;
  /** ISO timestamp. */
  at: string;
}

export interface KidsSession {
  id: string;
  chapterId: string;
  startedAt: string;
  /** null while the chapter is still being played. */
  completedAt: string | null;
  choices: RecordedChoice[];
  bonusUnlocked: boolean;
}

/**
 * Denormalised completion signal. The practice module never scores itself;
 * it emits what happened so a report can read it later without replaying the
 * whole session log.
 */
export interface PracticeEvent {
  chapterId: string;
  completedAt: string;
  quotients: Record<Quotient, number>;
}

/** Stored state. Deliberately thin — everything visible is derived from it. */
export interface KidsProgress {
  uid?: string;
  childId: string;
  sessions: KidsSession[];
  events?: PracticeEvent[];
  updatedAt: string | null;
}

export type AgeBand = '8-10' | '11-14';

export interface KidsProfile {
  id: string;
  uid?: string;
  name: string;
  avatar: string;
  ageBand: AgeBand;
  createdAt?: string;
}

export type NodeState = 'done' | 'current' | 'locked';

export interface PathNode {
  id: string;
  label: string;
  state: NodeState;
  chapterId?: string;
}

export interface BadgeView {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface DerivedState {
  completedChapterIds: string[];
  tally: Record<Quotient, number>;
  nodes: PathNode[];
  badges: BadgeView[];
  currentChapter: KidsChapter | null;
  inProgress: { chapter: KidsChapter; session: KidsSession } | null;
  streakDays: number;
  totalChoices: number;
  chaptersComplete: number;
  totalChapters: number;
}
