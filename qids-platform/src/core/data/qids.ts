// ─── Typed bridge to the canonical QIDS instrument data ───────────────────────
// Re-exports the legacy data files with typed contracts so new TypeScript code
// can consume them while the migration proceeds. The underlying data remains
// the single source of truth until fully ported.

import type { AgeGroup, PillarId } from '../types';

import {
  CONTEXTS as _CONTEXTS,
  PILLARS as _PILLARS,
  GRADE_BANDS as _GRADE_BANDS,
  EQ_QUESTIONS as _EQ_QUESTIONS,
  SQ_QUESTIONS as _SQ_QUESTIONS,
  AQ_QUESTIONS as _AQ_QUESTIONS,
  IQ_QUESTIONS as _IQ_QUESTIONS,
  PRE_INTERVENTION_NODES as _PRE,
  INTERVENTION_NODES as _INTERV,
  POST_INTERVENTION_NODES as _POST,
  INTERVENTION_MODULES as _MODULES,
  DEMO_SCORES as _DEMO,
  DEMO_POST_SCORES as _DEMO_POST,
} from '../../data/qidsData';

export interface IqQuestion {
  q: string;
  options?: string[];
  answer?: number | string;
  type?: 'mcq' | 'open';
}

export interface IqSection {
  title: string;
  instruction?: string;
  type: 'mcq' | 'open' | 'mixed';
  questions: IqQuestion[];
}

export interface IqSubSection {
  label: string;
  maxScore: number;
  sections: IqSection[];
}

export interface EqPartAComponent {
  label: string;
  subParams: string;
  questions: Record<AgeGroup, string[]>;
}

export interface EqRubric {
  criterion: string;
  marks: number;
  desc: string;
}

export interface EqPartBActivity {
  id: string;
  code: string;
  label: string;
  component: string;
  maxScore: number;
  desc: string;
  ageNote: Partial<Record<AgeGroup, string>>;
  rubric: EqRubric[];
}

export interface CsiOption { text: string; marks: number }
export interface CsiQuestion {
  id: string;
  subParam: string;
  scenario: string;
  question: string;
  options: CsiOption[];
  assessorNote: string;
}

export interface AqComponent {
  id: string;
  label: string;
  weight: number;
  subParams: string;
  desc: string;
  questions: Record<AgeGroup, { subParam: string; q: string }[]>;
  activity: {
    id: string;
    label: string;
    method: string;
    maxScore: number;
    desc11_18: string;
    desc19_32: string;
    rubric: EqRubric[];
  };
}

export const CONTEXTS = _CONTEXTS as { id: string; label: string; icon: string; desc: string }[];
export const PILLARS = _PILLARS as Record<PillarId, import('../types').PillarDef>;
export const GRADE_BANDS = _GRADE_BANDS as { grade: string; label: string; min: number; max: number; color: string; bg: string }[];
export const EQ_QUESTIONS = _EQ_QUESTIONS as {
  partA: Record<string, EqPartAComponent>;
  partB: EqPartBActivity[];
};
export const SQ_QUESTIONS = _SQ_QUESTIONS as {
  component1_ACE: { label: string; totalMarks: number; instructions: string; exercises: { id: string; label: string; subParam: string; marks: number; desc: string; rubric: EqRubric[] }[] };
  component2_CSI: { label: string; totalMarks: number; instructions: string; questions: CsiQuestion[] };
  component3_PBA: { label: string; totalMarks: number; instructions: string; activities: { id: string; label: string; bestFor: string; time: string; marks: number; desc: string; rubric: EqRubric[] }[] };
};
export const AQ_QUESTIONS = _AQ_QUESTIONS as {
  scoringKey: Record<number, number>;
  components: Record<string, AqComponent>;
  levels: { label: string; min: number; max: number; color: string; desc: string; action: string }[];
};
export const IQ_QUESTIONS = _IQ_QUESTIONS as Record<'verbal' | 'quantitative' | 'psychometric' | 'performance', IqSubSection>;
export const PRE_INTERVENTION_NODES = _PRE;
export const INTERVENTION_NODES = _INTERV;
export const POST_INTERVENTION_NODES = _POST;
export const INTERVENTION_MODULES = _MODULES;
export const DEMO_SCORES = _DEMO;
export const DEMO_POST_SCORES = _DEMO_POST;
