// Auto-generated role track item bank: Manufacturing (MF).
// Source: QIDS Enterprise Assessment Spec (Part 2, Section 6). Review before production.
import type { EnterpriseItem } from '../../types';

export const ITEMS: EnterpriseItem[] = [
  {
    id: 'MF-001',
    module: 'RIQ' as const,
    stem: "OEE (Overall Equipment Effectiveness) combines:",
    options: ["Cost, Quality, Speed","Availability, Performance, Quality","Output, Efficiency, Efficiency","Uptime, Defects, Maintenance"],
    answer: 1,
    difficulty: 'M',
    timeSec: 35,
    competency: "Manufacturing — OEE",
    discrimination: 'Med',
  },
  {
    id: 'MF-002',
    module: 'RIQ' as const,
    stem: "A Poka-Yoke device is designed to:",
    options: ["Increase machine speed","Prevent errors by making incorrect actions impossible or immediately obvious","Measure production output","Train operators"],
    answer: 1,
    difficulty: 'M',
    timeSec: 30,
    competency: "Manufacturing — Error Proofing",
    discrimination: 'Med',
  },
  {
    id: 'MF-003',
    module: 'RIQ' as const,
    stem: "A control chart shows multiple data points beyond the upper control limit. This indicates:",
    options: ["Normal process variation","An out-of-control process requiring investigation","Excellent performance","The chart is miscalibrated"],
    answer: 1,
    difficulty: 'H',
    timeSec: 50,
    competency: "Manufacturing — SPC",
    discrimination: 'Med',
  },
  {
    id: 'MF-004',
    module: 'RIQ' as const,
    stem: "Kaizen means:",
    options: ["Large-scale process redesign","Continuous incremental improvement driven by all employees","Quality inspection only","Automation of manual processes"],
    answer: 1,
    difficulty: 'M',
    timeSec: 30,
    competency: "Manufacturing — Lean Philosophy",
    discrimination: 'Med',
  },
  {
    id: 'MF-005',
    module: 'RIQ' as const,
    stem: "FIFO (First In First Out) in manufacturing inventory means:",
    options: ["Most recent materials used first","Oldest materials consumed first to prevent expiry/deterioration","Fastest-moving items processed first","First shift workers have inventory priority"],
    answer: 1,
    difficulty: 'E',
    timeSec: 25,
    competency: "Manufacturing — Inventory",
    discrimination: 'Med',
  },
  {
    id: 'MF-006',
    module: 'RIQ' as const,
    stem: "A worker notices an unsafe condition on the production floor. The correct action per ISO 45001 is:",
    options: ["Continue working and report at the end of the shift","Immediately stop work if necessary and report to safety personnel","Inform a colleague and return to work","Ignore if the risk is low"],
    answer: 2,
    difficulty: 'H',
    timeSec: 50,
    competency: "Manufacturing — Safety",
    discrimination: 'Med',
  },
];

export const TRACK_META = {
  id: 'MF' as const,
  label: "Manufacturing",
  bank: 6,
  deployed: {"QGRA":8,"QPIA":12,"QLIA":15},
  profileId: undefined,
};
export default ITEMS;