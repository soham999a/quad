// Auto-generated role track item bank: Retail (RT).
// Source: QIDS Enterprise Assessment Spec (Part 2, Section 6). Review before production.
import type { EnterpriseItem } from '../../types';

export const ITEMS: EnterpriseItem[] = [
  {
    id: 'RT-001',
    module: 'RIQ' as const,
    stem: "A customer wants to return a product without a receipt. The most customer-centric response:",
    options: ["Refuse — no receipt, no return","Apologise and refer to policy only","Understand their concern, check alternatives (exchange, store credit), and apply policy with empathy","Offer a full cash refund immediately"],
    answer: 2,
    difficulty: 'M',
    timeSec: 40,
    competency: "Retail — Customer Handling",
    discrimination: 'Med',
  },
  {
    id: 'RT-002',
    module: 'RIQ' as const,
    stem: "Planogram compliance means:",
    options: ["Following store opening procedures","Stocking shelves according to the brand or store-defined product layout guidelines","Meeting daily sales targets","Completing staff rosters"],
    answer: 1,
    difficulty: 'M',
    timeSec: 30,
    competency: "Retail — Visual Merchandising",
    discrimination: 'Med',
  },
  {
    id: 'RT-003',
    module: 'RIQ' as const,
    stem: "A stock discrepancy between POS and inventory system may indicate:",
    options: ["A system glitch only","Shrinkage, data entry error, or theft","Supplier overdelivery","Seasonal demand spike"],
    answer: 1,
    difficulty: 'H',
    timeSec: 50,
    competency: "Retail — Stock Control",
    discrimination: 'Med',
  },
  {
    id: 'RT-004',
    module: 'RIQ' as const,
    stem: "Which is an example of suggestive selling?",
    options: ["Discounting the item to close faster","Recommending a complementary product after the customer has committed to the primary purchase","Describing product features","Asking the customer their budget"],
    answer: 1,
    difficulty: 'M',
    timeSec: 35,
    competency: "Retail — Sales Technique",
    discrimination: 'Med',
  },
  {
    id: 'RT-005',
    module: 'RIQ' as const,
    stem: "A high shrinkage rate in a retail store typically results from:",
    options: ["Customer satisfaction issues","Theft, supplier fraud, and administrative errors","Too many product lines","Over-staffing"],
    answer: 1,
    difficulty: 'M',
    timeSec: 35,
    competency: "Retail — Loss Prevention",
    discrimination: 'Med',
  },
  {
    id: 'RT-006',
    module: 'RIQ' as const,
    stem: "During a peak sales period a customer complains loudly about a long wait time. The best response:",
    options: ["Tell them to be patient — everyone is waiting","Ask them to leave and come back later","Acknowledge the wait, apologise genuinely, and offer a specific update on when they will be served","Ignore and serve others first"],
    answer: 2,
    difficulty: 'H',
    timeSec: 50,
    competency: "Retail — Customer Recovery",
    discrimination: 'Med',
  },
];

export const TRACK_META = {
  id: 'RT' as const,
  label: "Retail",
  bank: 6,
  deployed: {"QGRA":8,"QPIA":12,"QLIA":15},
  profileId: undefined,
};
export default ITEMS;