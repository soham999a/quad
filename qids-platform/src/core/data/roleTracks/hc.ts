// Auto-generated role track item bank: Healthcare (HC).
// Source: QIDS Enterprise Assessment Spec (Part 2, Section 6). Review before production.
import type { EnterpriseItem } from '../../types';

export const ITEMS: EnterpriseItem[] = [
  {
    id: 'HC-001',
    module: 'RIQ' as const,
    stem: "Patient confidentiality under HIPAA (or equivalent) means:",
    options: ["Family members can always access records","Patient data can be shared without consent for administrative purposes","Patient health information must be protected and disclosed only with consent or legal basis","Records should be shared freely within the hospital network"],
    answer: 2,
    difficulty: 'H',
    timeSec: 55,
    competency: "Healthcare — Confidentiality",
    discrimination: 'Med',
  },
  {
    id: 'HC-002',
    module: 'RIQ' as const,
    stem: "Triage in an emergency setting prioritises patients based on:",
    options: ["Arrival order","Severity and urgency of need — most critical first","Age and vulnerability","Insurance status"],
    answer: 1,
    difficulty: 'M',
    timeSec: 35,
    competency: "Healthcare — Clinical Judgment",
    discrimination: 'Med',
  },
  {
    id: 'HC-003',
    module: 'RIQ' as const,
    stem: "Informed consent means the patient:",
    options: ["Signs a form","Has been given sufficient information to make a voluntary, understanding decision about their care","Agrees to all procedures automatically","Has been assessed by two clinicians"],
    answer: 1,
    difficulty: 'H',
    timeSec: 50,
    competency: "Healthcare — Ethics",
    discrimination: 'High',
  },
  {
    id: 'HC-004',
    module: 'RIQ' as const,
    stem: "Root cause analysis of a medication error aims to:",
    options: ["Assign blame to the responsible person","Identify systemic failures in the process and prevent recurrence","Document the incident for legal purposes","Dismiss the staff member involved"],
    answer: 1,
    difficulty: 'H',
    timeSec: 50,
    competency: "Healthcare — Patient Safety",
    discrimination: 'Med',
  },
  {
    id: 'HC-005',
    module: 'RIQ' as const,
    stem: "Scope of practice defines:",
    options: ["How many patients a clinician can see per day","The specific procedures and responsibilities a healthcare professional is qualified and authorised to perform","The geography of a clinician's work","Clinical hours per week"],
    answer: 1,
    difficulty: 'M',
    timeSec: 35,
    competency: "Healthcare — Professional Standards",
    discrimination: 'Med',
  },
  {
    id: 'HC-006',
    module: 'RIQ' as const,
    stem: "A patient refuses a recommended treatment. The ethical approach is:",
    options: ["Administer the treatment for their own good","Accept the refusal — patient autonomy is a fundamental principle","Consult the family and proceed","Override if a senior clinician agrees"],
    answer: 1,
    difficulty: 'H',
    timeSec: 55,
    competency: "Healthcare — Autonomy",
    discrimination: 'Med',
  },
];

export const TRACK_META = {
  id: 'HC' as const,
  label: "Healthcare",
  bank: 6,
  deployed: {"QGRA":8,"QPIA":12,"QLIA":15},
  profileId: undefined,
};
export default ITEMS;