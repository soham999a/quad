// ─── Report formatting helpers (pure) ─────────────────────────────────────────
// Shared label/colour mappings for the runner results view and future PIP report.

import type { BandLevel } from '../types';

export const BAND_COLOR: Record<BandLevel, string> = {
  Exceptional: '#10b981',
  Proficient: '#06b6d4',
  Developing: '#f59e0b',
  Emerging: '#ef4444',
};

export const THRESHOLD_META: Record<string, { label: string; color: string; bg: string }> = {
  strong: { label: 'Strong Fit', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  good: { label: 'Good Fit', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  partial: { label: 'Partial Fit', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  stretch: { label: 'Stretch', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  mismatch: { label: 'Role Mismatch', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export function thresholdMeta(level: string) {
  return THRESHOLD_META[level] ?? THRESHOLD_META.mismatch;
}

export const INTEGRITY_META: Record<string, { label: string; color: string }> = {
  Pass: { label: 'No integrity flags', color: '#10b981' },
  Concern: { label: 'Concern — review flagged items', color: '#f59e0b' },
  Flag: { label: 'Flagged — requires human review', color: '#ef4444' },
};

export const AGILITY_META: Record<string, { label: string; desc: string }> = {
  Accelerator: { label: 'Accelerator', desc: 'High learning agility — thrives on novel, complex challenges.' },
  Builder: { label: 'Builder', desc: 'Solid learning agility with growing adaptability.' },
  Consolidator: { label: 'Consolidator', desc: 'Learns steadily; benefits from structured development.' },
  Grounded: { label: 'Grounded', desc: 'Prefers familiar contexts; gains from targeted upskilling.' },
};

export function pctLabel(v: number): string {
  return `${Math.round(v)}%`;
}
