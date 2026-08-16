// Role track registry (RIQ) — Section 6 item banks, one file per track.
// Auto-generated; regenerate with: node scripts/parse-role-tracks.mjs
import type { EnterpriseItem, RoleTrackId } from '../../types';

import { ITEMS as SE_ITEMS, TRACK_META as SE_META } from './se';
import { ITEMS as DS_ITEMS, TRACK_META as DS_META } from './ds';
import { ITEMS as BF_ITEMS, TRACK_META as BF_META } from './bf';
import { ITEMS as HR_ITEMS, TRACK_META as HR_META } from './hr';
import { ITEMS as MK_ITEMS, TRACK_META as MK_META } from './mk';
import { ITEMS as SA_ITEMS, TRACK_META as SA_META } from './sa';
import { ITEMS as OL_ITEMS, TRACK_META as OL_META } from './ol';
import { ITEMS as CS_ITEMS, TRACK_META as CS_META } from './cs';
import { ITEMS as MF_ITEMS, TRACK_META as MF_META } from './mf';
import { ITEMS as RT_ITEMS, TRACK_META as RT_META } from './rt';
import { ITEMS as GG_ITEMS, TRACK_META as GG_META } from './gg';
import { ITEMS as FI_ITEMS, TRACK_META as FI_META } from './fi';
import { ITEMS as HC_ITEMS, TRACK_META as HC_META } from './hc';
import { ITEMS as ED_ITEMS, TRACK_META as ED_META } from './ed';

export interface RoleTrackMeta {
  id: RoleTrackId;
  label: string;
  bank: number;
  deployed: Record<'QGRA' | 'QPIA' | 'QLIA', number>;
  profileId?: string;
}

export interface RoleTrackEntry {
  meta: RoleTrackMeta;
  items: EnterpriseItem[];
}

const META: Record<RoleTrackId, RoleTrackMeta> = {
  SE: SE_META,
  DS: DS_META,
  BF: BF_META,
  HR: HR_META,
  MK: MK_META,
  SA: SA_META,
  OL: OL_META,
  CS: CS_META,
  MF: MF_META,
  RT: RT_META,
  GG: GG_META,
  FI: FI_META,
  HC: HC_META,
  ED: ED_META,
};

const ITEMS: Record<RoleTrackId, EnterpriseItem[]> = {
  SE: SE_ITEMS,
  DS: DS_ITEMS,
  BF: BF_ITEMS,
  HR: HR_ITEMS,
  MK: MK_ITEMS,
  SA: SA_ITEMS,
  OL: OL_ITEMS,
  CS: CS_ITEMS,
  MF: MF_ITEMS,
  RT: RT_ITEMS,
  GG: GG_ITEMS,
  FI: FI_ITEMS,
  HC: HC_ITEMS,
  ED: ED_ITEMS,
};

export const ROLE_TRACKS: RoleTrackEntry[] = (Object.keys(META) as RoleTrackId[]).map(id => ({ meta: META[id], items: ITEMS[id] }));

export function getRoleTrack(trackId: RoleTrackId): RoleTrackEntry | undefined {
  return ROLE_TRACKS.find(t => t.meta.id === trackId);
}

export function getTrackForProfile(profileId: string): RoleTrackEntry | undefined {
  return ROLE_TRACKS.find(t => t.meta.profileId === profileId);
}

export const ROLE_TRACK_IDS: RoleTrackId[] = Object.keys(META) as RoleTrackId[];