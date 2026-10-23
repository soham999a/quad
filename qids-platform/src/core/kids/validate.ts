// ─── Kids 4Q Practice — story validation ─────────────────────────────────────
// Content is data, which means content bugs are silent until a child hits them.
// This module turns the content rules into assertions that run in development
// and in the test suite, so a chapter cannot ship with a dead end, a missing
// quotient, or a choice that awards 40 points.

import type { KidsChapter } from './types';

export interface StoryIssue {
  chapterId: string;
  sceneId?: string;
  message: string;
}

const QUOTIENTS = ['IQ', 'EQ', 'SQ', 'AQ'] as const;

export function validateChapters(chapters: KidsChapter[]): StoryIssue[] {
  const issues: StoryIssue[] = [];
  const push = (chapterId: string, message: string, sceneId?: string) =>
    issues.push({ chapterId, sceneId, message });

  if (!chapters.length) push('', 'no chapters defined');
  if (new Set(chapters.map(c => c.id)).size !== chapters.length) {
    push('', 'chapter ids are not unique');
  }

  chapters.forEach((chapter, index) => {
    if (chapter.index !== index + 1) {
      push(chapter.id, `index ${chapter.index} does not match position ${index + 1}`);
    }
    if (!chapter.title?.trim()) push(chapter.id, 'missing title');
    if (!chapter.node?.trim()) push(chapter.id, 'missing path node label');
    if (!QUOTIENTS.includes(chapter.quotient)) push(chapter.id, `invalid quotient ${chapter.quotient}`);
    if (!(chapter.minutes > 0)) push(chapter.id, 'minutes must be positive');
    if (chapter.scenes.length < 1) push(chapter.id, 'chapter has no scenes');

    const sceneIds = new Set<string>();
    const allScenes = [...chapter.scenes, ...(chapter.bonus ? [chapter.bonus] : [])];

    for (const scene of allScenes) {
      if (sceneIds.has(scene.id)) push(chapter.id, `duplicate scene id ${scene.id}`, scene.id);
      sceneIds.add(scene.id);

      if (!scene.narration?.trim()) push(chapter.id, 'scene has no narration', scene.id);
      if (!scene.prompt?.trim()) push(chapter.id, 'scene has no prompt', scene.id);
      if (scene.choices.length < 2) push(chapter.id, 'scene needs at least two choices', scene.id);
      if (scene.choices.length > 3) {
        push(chapter.id, `scene has ${scene.choices.length} choices (max 3 for this age band)`, scene.id);
      }

      const choiceIds = new Set<string>();
      for (const choice of scene.choices) {
        if (choiceIds.has(choice.id)) push(chapter.id, `duplicate choice id ${choice.id}`, scene.id);
        choiceIds.add(choice.id);
        if (!QUOTIENTS.includes(choice.quotient)) push(chapter.id, `choice ${choice.id} has invalid quotient`, scene.id);
        if (!Number.isInteger(choice.weight) || choice.weight < 0 || choice.weight > 3) {
          push(chapter.id, `choice ${choice.id} weight ${choice.weight} outside 0–3`, scene.id);
        }
        if (!choice.consequence?.trim()) push(chapter.id, `choice ${choice.id} has no consequence`, scene.id);
      }
    }

    // A chapter's bonus is only reachable if some choice unlocks it.
    if (chapter.bonus && !allScenes.some(s => s.choices.some(c => c.unlockBonus))) {
      push(chapter.id, 'bonus scene exists but nothing unlocks it');
    }
    if (!chapter.bonus && allScenes.some(s => s.choices.some(c => c.unlockBonus))) {
      push(chapter.id, 'a choice unlocks a bonus, but the chapter has none');
    }
  });

  const covered = new Set(chapters.map(c => c.quotient));
  for (const q of QUOTIENTS) {
    if (!covered.has(q)) push('', `no chapter practises ${q}`);
  }

  return issues;
}

/**
 * Guard: loud in the console, never fatal. Content is validated in the test
 * suite too, so a clean story keeps this silent in production.
 */
export function assertStoryValid(chapters: KidsChapter[]): void {
  const issues = validateChapters(chapters);
  if (!issues.length) return;
  console.error(
    `[kids] story validation found ${issues.length} issue(s):`,
    issues.map(i => `${i.chapterId}${i.sceneId ? '/' + i.sceneId : ''}: ${i.message}`),
  );
}
