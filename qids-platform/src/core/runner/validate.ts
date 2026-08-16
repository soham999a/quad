// ─── Runner answer validation ─────────────────────────────────────────────────
// Completeness checks per item format. Kept pure so tests can assert the exact
// contract the UI must satisfy before submit.

import type { AnswerValue, AnswerSheet, EnterpriseItem, EnterpriseModule } from '../types';

export function isItemAnswered(item: EnterpriseItem, value: AnswerValue | undefined): boolean {
  switch (item.module) {
    case 'SJT':
      return Array.isArray(value) && value.length >= 2 && value.every(v => typeof v === 'number');
    case 'WS':
      return (
        Array.isArray(value) &&
        value.length === item.options.length &&
        value.every(v => typeof v === 'number') &&
        new Set(value as number[]).size === item.options.length &&
        (value as number[]).every(v => v >= 1 && v <= item.options.length)
      );
    default:
      return typeof value === 'number' && Number.isFinite(value);
  }
}

export function moduleComplete(module: EnterpriseModule, items: EnterpriseItem[], answers: AnswerSheet): boolean {
  return items.every(item => isItemAnswered(item, answers[item.id]));
}

export function moduleAnsweredCount(items: EnterpriseItem[], answers: AnswerSheet): number {
  return items.filter(item => isItemAnswered(item, answers[item.id])).length;
}

/** True when every deployed item across all modules is answered. */
export function assessmentComplete(
  modules: EnterpriseModule[],
  deployed: Record<string, EnterpriseItem[]>,
  answers: AnswerSheet,
): boolean {
  return modules.every(m => {
    const items = deployed[m.id] ?? [];
    return items.length === 0 || moduleComplete(m, items, answers);
  });
}
