// Auto-generated role track item bank: Teacher / Education (ED).
// Source: QIDS Enterprise Assessment Spec (Part 2, Section 6). Review before production.
import type { EnterpriseItem } from '../../types';

export const ITEMS: EnterpriseItem[] = [
  {
    id: 'ED-001',
    module: 'RIQ' as const,
    stem: "Bloom's Taxonomy arranges learning objectives from:",
    options: ["Simple to complex cognitive demands","Most to least engaging","Easiest to hardest to grade","Most to least important"],
    answer: 0,
    difficulty: 'M',
    timeSec: 35,
    competency: "Education — Curriculum Design",
    discrimination: 'Med',
  },
  {
    id: 'ED-002',
    module: 'RIQ' as const,
    stem: "Differentiated instruction means:",
    options: ["Teaching the same content to all students","Adapting content, process, and product to individual student readiness and learning styles","Grouping students by ability only","Providing extra support to failing students only"],
    answer: 1,
    difficulty: 'H',
    timeSec: 50,
    competency: "Education — Pedagogy",
    discrimination: 'Med',
  },
  {
    id: 'ED-003',
    module: 'RIQ' as const,
    stem: "A student consistently disengages during group work but performs well individually. The most insightful educator response:",
    options: ["Penalise the group work performance","Explore whether social anxiety, group dynamics, or learning style is a factor — adapt accordingly","Remove them from group tasks entirely","Ignore — individual performance is what matters"],
    answer: 1,
    difficulty: 'H',
    timeSec: 55,
    competency: "Education — Learner-Centred Practice",
    discrimination: 'Med',
  },
  {
    id: 'ED-004',
    module: 'RIQ' as const,
    stem: "Formative assessment is designed to:",
    options: ["Assign a grade to a completed unit","Provide ongoing feedback that guides learning while it is still in progress","Replace summative assessment","Rank students against each other"],
    answer: 1,
    difficulty: 'M',
    timeSec: 35,
    competency: "Education — Assessment",
    discrimination: 'Med',
  },
  {
    id: 'ED-005',
    module: 'RIQ' as const,
    stem: "The Zone of Proximal Development (Vygotsky) refers to:",
    options: ["The physical space for learning","What a student can do independently","The gap between what a student can do alone and with skilled support — the optimal learning zone","The curriculum beyond grade level"],
    answer: 2,
    difficulty: 'H',
    timeSec: 45,
    competency: "Education — Learning Theory",
    discrimination: 'Med',
  },
  {
    id: 'ED-006',
    module: 'RIQ' as const,
    stem: "A parent disagrees strongly with a grade their child received. The most professional response:",
    options: ["Immediately change the grade","Defend the grade without listening","Listen to the concern fully, explain the assessment criteria transparently, and review if there is substantive new evidence","Escalate to the principal without discussing"],
    answer: 2,
    difficulty: 'H',
    timeSec: 55,
    competency: "Education — Stakeholder Communication",
    discrimination: 'Med',
  },
];

export const TRACK_META = {
  id: 'ED' as const,
  label: "Teacher / Education",
  bank: 6,
  deployed: {"QGRA":8,"QPIA":12,"QLIA":15},
  profileId: undefined,
};
export default ITEMS;