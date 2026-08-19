import type { PillarScores, PillarId, ClassAnalytics } from '../types';
import { PILLARS } from '../../data/qidsData';
import { getSkillShape } from './scoring';

interface AssessmentRecord {
  pillarScores?: PillarScores;
  unifiedScore?: number;
  grade?: { grade: string };
  intake?: { name?: string };
}

/**
 * Compute class-level analytics from a set of student assessments.
 */
export function computeClassAnalytics(
  classId: string,
  assessments: AssessmentRecord[],
): ClassAnalytics {
  const count = assessments.length;
  if (count === 0) {
    return {
      classId,
      studentCount: 0,
      assessmentCount: 0,
      avgUnifiedScore: 0,
      avgPillarScores: { IQ: 0, EQ: 0, SQ: 0, AQ: 0 },
      gradeDistribution: {},
      topPerformers: [],
      shapeDistribution: {},
    };
  }

  // Average pillar scores
  const avgPillarScores: PillarScores = { IQ: 0, EQ: 0, SQ: 0, AQ: 0 };
  let totalUnified = 0;
  const gradeDistribution: Record<string, number> = {};
  const shapeDistribution: Record<string, number> = {};
  const performers: { name: string; score: number }[] = [];

  for (const a of assessments) {
    const ps = a.pillarScores || { IQ: 0, EQ: 0, SQ: 0, AQ: 0 };
    for (const p of PILLARS) {
      avgPillarScores[p.id] += ps[p.id] || 0;
    }
    const score = a.unifiedScore || 0;
    totalUnified += score;

    if (a.grade?.grade) {
      gradeDistribution[a.grade.grade] = (gradeDistribution[a.grade.grade] || 0) + 1;
    }

    const shape = getSkillShape(ps);
    shapeDistribution[shape] = (shapeDistribution[shape] || 0) + 1;

    performers.push({
      name: a.intake?.name || 'Student',
      score,
    });
  }

  for (const p of PILLARS) {
    avgPillarScores[p.id] = Math.round(avgPillarScores[p.id] / count);
  }

  performers.sort((a, b) => b.score - a.score);

  return {
    classId,
    studentCount: count,
    assessmentCount: count,
    avgUnifiedScore: Math.round(totalUnified / count),
    avgPillarScores,
    gradeDistribution,
    topPerformers: performers.slice(0, 10),
    shapeDistribution,
  };
}
