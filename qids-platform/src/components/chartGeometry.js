// ─── Chart geometry (pure) ──────────────────────────────────────────────────
// The maths behind the SVG charts, separated from the JSX so it can be tested
// in Node. A wrong radius or a NaN coordinate does not throw — it silently
// draws nothing — which is exactly the kind of bug a render test catches and
// the eye does not.

/** Clamp a value into [0, max]; NaN and non-numbers become 0. */
export function clampValue(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, max));
}

/**
 * A point on the radar's k-th axis.
 * Axis 0 points straight up, then clockwise, so a four-axis radar reads
 * IQ (top), EQ (right), SQ (bottom), AQ (left).
 */
export function radarPoint({ cx, cy, radius, index, count }) {
  const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

/** Closed polygon for a full ring of `count` axes at `radius`. */
export function ringPoints({ cx, cy, radius, count }) {
  return Array.from({ length: count }, (_, i) =>
    radarPoint({ cx, cy, radius, index: i, count }).map(n => round(n)).join(','),
  ).join(' ');
}

/** Polygon for one data series, scaled into the radar. */
export function seriesPoints({ data, key, max, cx, cy, radius }) {
  const count = data.length;
  return data
    .map((row, i) => {
      const value = clampValue(row[key], max);
      const [x, y] = radarPoint({ cx, cy, radius: (value / max) * radius, index: i, count });
      return `${round(x)},${round(y)}`;
    })
    .join(' ');
}

/** Y coordinate for a 0–100 scale mapped onto a plot box. */
export function scaleY(value, { top, height }) {
  const clamped = clampValue(value, 100);
  return round(top + height - (clamped / 100) * height);
}

function round(n) {
  return Math.round(n * 100) / 100;
}
