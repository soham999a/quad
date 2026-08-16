// Auto-generated item bank: Work Style (WS).
// Source: QIDS Enterprise Assessment Spec (Parts 1 & 3). Review before production.
// NOTE: source PDFs contain 6 of the 18 spec'd items.
import type { EnterpriseItem, EnterpriseModuleId } from '../../types';

export const ITEMS: EnterpriseItem[] = [
  {
    id: 'WS-001',
    module: 'WS' as EnterpriseModuleId,
    stem: "Rank from MOST to LEAST like you when starting a new project:",
    options: ["I immediately begin researching what's been done before","I define the goal clearly before touching anything","I gather the team and get everyone's input first","I create a detailed plan and timeline before acting"],
    answer: 1,
    difficulty: 'E',
    timeSec: 50,
    competency: "Execution vs Collaboration",
    discrimination: 'Med',
  },
  {
    id: 'WS-002',
    module: 'WS' as EnterpriseModuleId,
    stem: "Rank from MOST to LEAST like you when you disagree with a decision:",
    options: ["I raise my concern clearly with evidence","I reflect privately and decide whether it's worth challenging","I find allies who agree with me first","I accept the decision and implement it professionally"],
    answer: 0,
    difficulty: 'E',
    timeSec: 50,
    competency: "Assertiveness",
    discrimination: 'Med',
  },
  {
    id: 'WS-003',
    module: 'WS' as EnterpriseModuleId,
    stem: "Rank: When learning something new, I prefer to:",
    options: ["Read a comprehensive guide first","Jump in and learn from mistakes","Watch an expert demonstrate","Discuss the concept with colleagues"],
    answer: 0,
    difficulty: 'E',
    timeSec: 50,
    competency: "Learning Style",
    discrimination: 'Med',
  },
  {
    id: 'WS-004',
    module: 'WS' as EnterpriseModuleId,
    stem: "Rank: When under deadline pressure, I am most likely to:",
    options: ["Focus intensely and cut all non-essentials","Communicate the pressure to my team","Prioritise ruthlessly and drop low-value tasks","Push through by working longer hours"],
    answer: 2,
    difficulty: 'E',
    timeSec: 50,
    competency: "Pressure Response",
    discrimination: 'Med',
  },
  {
    id: 'WS-005',
    module: 'WS' as EnterpriseModuleId,
    stem: "Rank: My strongest professional motivator is:",
    options: ["Recognition for results","Learning and mastering something difficult","Making a tangible impact","Building strong relationships"],
    answer: 1,
    difficulty: 'E',
    timeSec: 50,
    competency: "Motivation Profile",
    discrimination: 'Med',
  },
  {
    id: 'WS-006',
    module: 'WS' as EnterpriseModuleId,
    stem: "Rank: When communicating complex information, I prefer:",
    options: ["A clear written summary","An in-person or video discussion","A visual diagram or chart","A short verbal summary with follow-up questions"],
    answer: 2,
    difficulty: 'E',
    timeSec: 50,
    competency: "Communication Style",
    discrimination: 'Med',
  },
];

export const MODULE_META = {
  id: 'WS',
  label: "Work Style",
  qi: "WorkStyle",
  bank: 18,
  deployed: 6,
  timeMin: 4,
  weight: 0,
  scoring: 'ipsative',
  tiers: ["QGRA","QPIA","QLIA"],
};
export default ITEMS;