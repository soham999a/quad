import React from 'react';
import { clampValue, radarPoint, ringPoints, seriesPoints, scaleY } from './chartGeometry';

// ─── Charts, without a charting library ──────────────────────────────────────
// Four fixed-shape charts (a 4-axis radar, a trend line, a grouped bar pair)
// do not justify 86 kB of gzipped JavaScript on the pages that matter most:
// results, credentials and progress. These are plain SVG with the same tokens
// the rest of the app uses.
//
// Accessibility is part of the contract, not an afterthought: every chart is
// role="img" with a text alternative that states the values, because a picture
// of a polygon is not a score a screen reader can read.

/**
 * Radar chart for 3–8 axes.
 *
 * @param {{
 *   data: Array<Record<string, any>>,
 *   max?: number,
 *   height?: number,
 *   color?: string,
 *   compareColor?: string,
 *   labelColor?: string,
 *   gridColor?: string,
 *   series?: Array<{ key: string, color: string, fillOpacity?: number }>,
 *   ariaLabel?: string,
 * }} props
 */
export function RadarSvg({
  data,
  max = 100,
  height = 240,
  color = 'var(--gold)',
  compareColor = 'var(--phase-post)',
  labelColor = 'var(--neutral-mid)',
  gridColor = 'var(--gold-grid)',
  series: seriesProp,
  /** Series keys drawn as a dashed outline with no fill — the PIP Page 2
   *  peer-norm line. Optional; every existing consumer keeps solid fills. */
  dashed,
  ariaLabel,
}) {
  if (!Array.isArray(data) || data.length < 3) return null;

  // Either an explicit series list (enterprise reports compare a candidate to a
  // norm) or the compact A/B pair most pages use.
  const series = seriesProp || [
    ...(data.some(row => row.B !== undefined) ? [{ key: 'B', color: compareColor, fillOpacity: 0.18 }] : []),
    { key: 'A', color, fillOpacity: 0.2 },
  ];

  const width = 320;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width / 2 - 56, height / 2 - 26);
  const count = data.length;
  const rings = [0.25, 0.5, 0.75, 1];

  const clamp = v => clampValue(v, max);
  const pointsFor = key => seriesPoints({ data, key, max, cx, cy, radius });

  const summary = ariaLabel || data
    .map(row => `${row.subject} ${series.map(ser => Math.round(clamp(row[ser.key]))).join(' / ')}`)
    .join(', ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={summary}
      style={{ overflow: 'visible' }}
    >
      {rings.map(fraction => (
        <polygon
          key={fraction}
          points={ringPoints({ cx, cy, radius: radius * fraction, count })}
          fill="none"
          stroke={gridColor}
          strokeWidth={0.75}
          opacity={fraction === 1 ? 0.9 : 0.5}
        />
      ))}

      {data.map((row, i) => {
        const [x, y] = radarPoint({ cx, cy, radius, index: i, count });
        return <line key={row.subject} x1={cx} y1={cy} x2={x} y2={y} stroke={gridColor} strokeWidth={0.5} opacity={0.6} />;
      })}

      {series.map(s => {
        const isDashed = dashed?.includes(s.key);
        return <polygon
          key={`shape-${s.key}`}
          points={pointsFor(s.key)}
          fill={isDashed ? 'none' : s.color}
          fillOpacity={isDashed ? 0 : (s.fillOpacity ?? 0.2)}
          stroke={s.color}
          strokeWidth={isDashed ? 1.5 : 2}
          strokeDasharray={isDashed ? '4 3' : undefined}
          strokeLinejoin="round"
        />;
      })}

      {series.flatMap(s => data.map((row, i) => {
        const [x, y] = radarPoint({ cx, cy, radius: (clamp(row[s.key]) / max) * radius, index: i, count });
        return <circle key={`dot-${s.key}-${row.subject}`} cx={x} cy={y} r={2.5} fill={s.color} />;
      }))}

      {data.map((row, i) => {
        const [x, y] = radarPoint({ cx, cy, radius: radius + 20, index: i, count });
        return (
          <text
            key={`label-${row.subject}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill={labelColor}
          >
            {row.subject}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Multi-series trend over attempts.
 *
 * @param {{
 *   points: Array<Record<string, any>>,
 *   series: Array<{ key: string, color: string, label: string }>,
 *   height?: number,
 *   formatDate?: (v: any) => string,
 * }} props
 */
export function TrendLines({ points, series, height = 200, formatDate = v => String(v) }) {
  if (!Array.isArray(points) || points.length < 2) return null;

  const width = 640;
  const left = 34;
  const right = 12;
  const top = 10;
  const bottom = 26;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const xAt = i => left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = v => scaleY(v, { top, height: plotH });

  const summary = points
    .map(p => `${formatDate(p.date)}: ${series.map(s => `${s.label} ${Math.round(p[s.key] || 0)}`).join(', ')}`)
    .join('; ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={summary} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={left} y1={yAt(v)} x2={width - right} y2={yAt(v)} stroke="var(--outline-variant)" strokeWidth={0.5} />
          <text x={left - 8} y={yAt(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--neutral-ink-500)">
            {v}
          </text>
        </g>
      ))}

      {series.map(s => (
        <g key={s.key}>
          <polyline
            points={points.map((p, i) => `${xAt(i)},${yAt(p[s.key])}`).join(' ')}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <title>{s.label}</title>
          </polyline>
          {points.map((p, i) => (
            <circle key={i} cx={xAt(i)} cy={yAt(p[s.key])} r={2.5} fill={s.color}>
              <title>{`${formatDate(p.date)} · ${s.label} ${Math.round(p[s.key] || 0)}`}</title>
            </circle>
          ))}
        </g>
      ))}

      <text x={left} y={height - 6} fontSize={9} fill="var(--neutral-ink-500)">{formatDate(points[0].date)}</text>
      <text x={width - right} y={height - 6} fontSize={9} textAnchor="end" fill="var(--neutral-ink-500)">
        {formatDate(points[points.length - 1].date)}
      </text>
    </svg>
  );
}

/**
 * Two-series grouped bars (pre vs post).
 *
 * @param {{
 *   data: Array<{ name: string, Pre: number, Post: number }>,
 *   height?: number,
 *   series?: Array<{ key: string, color: string, label: string }>,
 * }} props
 */
export function GroupedBars({
  data,
  height = 240,
  series = [
    { key: 'Pre', color: 'var(--phase-pre)', label: 'Pre' },
    { key: 'Post', color: 'var(--phase-post)', label: 'Post' },
  ],
}) {
  if (!Array.isArray(data) || !data.length) return null;

  const width = 640;
  const left = 34;
  const right = 12;
  const top = 10;
  const bottom = 34;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const groupW = plotW / data.length;
  const barW = Math.min(26, (groupW - 12) / series.length);
  const yAt = v => scaleY(v, { top, height: plotH });

  const summary = data.map(d => `${d.name}: ${series.map(s => `${s.label} ${Math.round(d[s.key] || 0)}`).join(', ')}`).join('; ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={summary} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1={left} y1={yAt(v)} x2={width - right} y2={yAt(v)} stroke="var(--tint-soft)" strokeWidth={0.5} strokeDasharray={v === 0 ? undefined : '3 3'} />
          <text x={left - 8} y={yAt(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--neutral-dim)">
            {v}
          </text>
        </g>
      ))}

      {data.map((row, gi) => {
        const groupX = left + gi * groupW + groupW / 2;
        const startX = groupX - (series.length * barW) / 2;
        return (
          <g key={row.name}>
            {series.map((s, si) => {
              const value = Math.max(0, Math.min(Number(row[s.key]) || 0, 100));
              const y = yAt(value);
              return (
                <rect
                  key={s.key}
                  x={startX + si * barW}
                  y={y}
                  width={Math.max(barW - 3, 1)}
                  height={Math.max(top + plotH - y, 0)}
                  fill={s.color}
                  fillOpacity={0.85}
                >
                  <title>{`${row.name} · ${s.label} ${Math.round(value)}`}</title>
                </rect>
              );
            })}
            <text x={groupX} y={height - 18} textAnchor="middle" fontSize={10} fill="var(--neutral-mid)">
              {row.name}
            </text>
          </g>
        );
      })}

      {series.map((s, i) => (
        <g key={`legend-${s.key}`}>
          <rect x={left + i * 90} y={height - 10} width={8} height={8} fill={s.color} fillOpacity={0.85} />
          <text x={left + i * 90 + 13} y={height - 3} fontSize={9} fill="var(--neutral-mid)">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default RadarSvg;
