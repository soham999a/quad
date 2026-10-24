import React from 'react';
import { RadarSvg } from './charts';

// ─── Four-pillar radar ──────────────────────────────────────────────────────
// Kept as a named component because several pages use this exact shape, but it
// no longer needs a charting library: RadarSvg draws it in ~120 lines of SVG,
// which is a fraction of the 86 kB gzipped that recharts cost every result page.
//
// Pre/post comparison is the only variant: pass `compare` and both polygons are
// drawn, so a reader can see the change without reading two tables.

const ORDER = ['IQ', 'EQ', 'SQ', 'AQ'];

/**
 * @param {{
 *   data: Record<string, number>,
 *   compare?: Record<string, number> | null,
 *   size?: number,
 * }} props
 */
export default function QIDSRadar({ data, compare = null, size = 300 }) {
  const rows = ORDER.map(key => ({
    subject: key,
    A: Number(data?.[key]) || 0,
    ...(compare ? { B: Number(compare[key]) || 0 } : {}),
  }));

  return (
    <RadarSvg
      data={rows}
      max={100}
      height={size}
      color="var(--phase-pre)"
      compareColor="var(--status-ok)"
      labelColor="var(--slate-muted)"
      gridColor="color-mix(in srgb, var(--neutral-dark) 10%, transparent)"
      ariaLabel={rows
        .map(r => `${r.subject} ${Math.round(r.A)}${compare ? ` (post ${Math.round(r.B)})` : ''}`)
        .join(', ')}
    />
  );
}
