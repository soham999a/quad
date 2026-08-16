// Item bank registry: aggregates all enterprise item bank modules.
import type { EnterpriseItem, EnterpriseModuleId } from '../../types';

import { ITEMS as CR_ITEMS, MODULE_META as CR_META } from './cr';
import { ITEMS as CT_ITEMS, MODULE_META as CT_META } from './ct';
import { ITEMS as SJT_ITEMS, MODULE_META as SJT_META } from './sjt';
import { ITEMS as EI_ITEMS, MODULE_META as EI_META } from './ei';
import { ITEMS as AQ_ITEMS, MODULE_META as AQ_META } from './aq';
import { ITEMS as WS_ITEMS, MODULE_META as WS_META } from './ws';
import { ITEMS as INT_ITEMS, MODULE_META as INT_META } from './int';
import { ITEMS as DQ_ITEMS, MODULE_META as DQ_META } from './dq';
import { ITEMS as LR_ITEMS, MODULE_META as LR_META } from './lr';
import { ITEMS as ST_ITEMS, MODULE_META as ST_META } from './st';
import { ITEMS as PL_ITEMS, MODULE_META as PL_META } from './pl';
import { ITEMS as OI_ITEMS, MODULE_META as OI_META } from './oi';

export interface ItemBankModuleMeta {
  id: EnterpriseModuleId;
  label: string;
  qi: string;
  bank: number;
  deployed: number;
  timeMin: number;
  weight: number;
  scoring: 'mcq' | 'best_worst' | 'ipsative' | 'ranking';
  tiers: string[];
}

export interface ItemBankEntry {
  meta: ItemBankModuleMeta;
  items: EnterpriseItem[];
}

const METAS = {
  CR: CR_META, CT: CT_META, SJT: SJT_META, EI: EI_META, AQ: AQ_META,
  WS: WS_META, INT: INT_META, DQ: DQ_META, LR: LR_META, ST: ST_META,
  PL: PL_META, OI: OI_META,
} as const;

const ITEM_SETS = {
  CR: CR_ITEMS, CT: CT_ITEMS, SJT: SJT_ITEMS, EI: EI_ITEMS, AQ: AQ_ITEMS,
  WS: WS_ITEMS, INT: INT_ITEMS, DQ: DQ_ITEMS, LR: LR_ITEMS, ST: ST_ITEMS,
  PL: PL_ITEMS, OI: OI_ITEMS,
} as const;

type BankId = keyof typeof METAS;

const BANK_IDS = Object.keys(METAS) as BankId[];

export const ITEM_BANKS: ItemBankEntry[] = BANK_IDS.map((id) => ({
  meta: METAS[id] as unknown as ItemBankModuleMeta,
  items: ITEM_SETS[id] as unknown as EnterpriseItem[],
}));

export function getItemBank(module: EnterpriseModuleId): ItemBankEntry | undefined {
  return ITEM_BANKS.find((b) => b.meta.id === module);
}

export function getItemsForModules(modules: EnterpriseModuleId[]): EnterpriseItem[] {
  return modules.flatMap((m) => getItemBank(m)?.items ?? []);
}

export function itemCountForModule(module: EnterpriseModuleId): number {
  return getItemBank(module)?.items.length ?? 0;
}
