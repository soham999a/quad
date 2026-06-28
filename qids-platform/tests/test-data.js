function toMillis(daysAgo) {
  return Date.now() - daysAgo * 86400000;
}

function toDate(daysAgo) {
  return { toMillis: () => toMillis(daysAgo) };
}

const student1Uid = 'student-001';
const student2Uid = 'student-002';
const student3Uid = 'student-003';
const evaluatorUid = 'evaluator-001';
const adminUid = 'admin-001';

const users = [
  {
    id: student1Uid, uid: student1Uid,
    name: 'Alice Johnson', email: 'alice@test.com', role: 'student', context: 'school',
    createdAt: toDate(30),
  },
  {
    id: student2Uid, uid: student2Uid,
    name: 'Bob Martinez', email: 'bob@test.com', role: 'student', context: 'corporate',
    createdAt: toDate(28),
  },
  {
    id: student3Uid, uid: student3Uid,
    name: 'Carol Chen', email: 'carol@test.com', role: 'student', context: 'individual',
    createdAt: toDate(25),
  },
  {
    id: evaluatorUid, uid: evaluatorUid,
    name: 'Dr. Evelyn Reed', email: 'evelyn@test.com', role: 'evaluator',
    createdAt: toDate(60),
  },
  {
    id: adminUid, uid: adminUid,
    name: 'System Admin', email: 'admin@test.com', role: 'admin',
    createdAt: toDate(90),
  },
];

const assign1Id = `${evaluatorUid}_${student1Uid}`;
const assign2Id = `${evaluatorUid}_${student2Uid}`;
const assign3Id = `${evaluatorUid}_${student3Uid}`;

const evaluatorAssignments = {
  [evaluatorUid]: [
    { id: assign1Id, evaluatorUid, studentUid: student1Uid, active: true, createdAt: toDate(20) },
    { id: assign2Id, evaluatorUid, studentUid: student2Uid, active: true, createdAt: toDate(18) },
    { id: assign3Id, evaluatorUid, studentUid: student3Uid, active: true, createdAt: toDate(15) },
  ],
};

const asm1Id = 'asm-pre-001';
const asm1PostId = 'asm-post-001';
const asm2Id = 'asm-pre-002';
const asm3Id = 'asm-pre-003';
const asm3PostId = 'asm-post-003';

const assessments = {
  [student1Uid]: [
    {
      id: asm1Id, uid: student1Uid, phase: 'pre',
      intake: { name: 'QIDS Baseline — Alice' },
      pillarScores: { EQ: 72, SQ: 65, AQ: 80 },
      createdAt: toDate(14),
    },
    {
      id: asm1PostId, uid: student1Uid, phase: 'post',
      linkedAssessmentId: asm1Id,
      intake: { name: 'QIDS Follow-up — Alice' },
      pillarScores: { EQ: 78, SQ: 70, AQ: 85 },
      createdAt: toDate(2),
    },
  ],
  [student2Uid]: [
    {
      id: asm2Id, uid: student2Uid, phase: 'pre',
      intake: { name: 'QIDS Baseline — Bob' },
      pillarScores: { EQ: 55, SQ: 60, AQ: 45 },
      createdAt: toDate(10),
    },
  ],
  [student3Uid]: [
    {
      id: asm3Id, uid: student3Uid, phase: 'pre',
      intake: { name: 'QIDS Baseline — Carol' },
      pillarScores: { EQ: 88, SQ: 82, AQ: 90 },
      createdAt: toDate(7),
    },
    {
      id: asm3PostId, uid: student3Uid, phase: 'post',
      linkedAssessmentId: asm3Id,
      intake: { name: 'QIDS Follow-up — Carol' },
      pillarScores: { EQ: 91, SQ: 85, AQ: 93 },
      createdAt: toDate(1),
    },
  ],
};

const evalEq1 = {
  assessmentId: asm1Id, evaluatorUid, studentUid: student1Uid, pillar: 'EQ',
  status: 'completed',
  scores: {
    EQ: {
      'swot-analysis': { self_awareness: 4, empathy: 3, 'relationship-mgmt': 4 },
      conflict: { 'conflict-resolution': 3, negotiation: 4 },
    },
  },
};

const evalSq1 = {
  assessmentId: asm1Id, evaluatorUid, studentUid: student1Uid, pillar: 'SQ',
  status: 'completed',
  scores: {
    SQ: {
      'ace-ex-1': { 'info-processing': 3, analysis: 4 },
      'ace-ex-2': { reasoning: 3, deduction: 4 },
    },
  },
};

const evaluationsByPillar = {
  [`${asm1Id}_EQ`]: evalEq1,
  [`${asm1Id}_SQ`]: evalSq1,
};

const evaluations = {
  [asm1Id]: [
    { id: `${asm1Id}_EQ`, ...evalEq1 },
    { id: `${asm1Id}_SQ`, ...evalSq1 },
  ],
};

const reports = {
  [student1Uid]: [
    { id: 'report-001', uid: student1Uid, assessmentId: asm1Id, createdAt: toDate(10) },
  ],
};

export const TEST_FIRESTORE_DATA = {
  users,
  evaluatorAssignments,
  assessments,
  evaluations,
  evaluationsByPillar,
  reports,
};

export const TEST_AUTH_ADMIN = {
  user: { uid: adminUid, email: 'admin@test.com', displayName: 'System Admin' },
  profile: { uid: adminUid, name: 'System Admin', email: 'admin@test.com', role: 'admin' },
};

export const TEST_AUTH_EVALUATOR = {
  user: { uid: evaluatorUid, email: 'evelyn@test.com', displayName: 'Dr. Evelyn Reed' },
  profile: { uid: evaluatorUid, name: 'Dr. Evelyn Reed', email: 'evelyn@test.com', role: 'evaluator' },
};

export const TEST_AUTH_STUDENT = {
  user: { uid: student1Uid, email: 'alice@test.com', displayName: 'Alice Johnson' },
  profile: { uid: student1Uid, name: 'Alice Johnson', email: 'alice@test.com', role: 'student' },
};
