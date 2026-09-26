// ─── HeroDiagram — the brand blueprint ───────────────────────────────────────
// A quadrant "star chart": QiDS at the center, four quotient axes (IQ/EQ/SQ/AQ)
// coloring the field, and the development loop orbiting as stations. Hairlines
// only — no fills heavier than a whisper — so it reads as an instrument panel.
// Motion: hairlines draw themselves in, stations pop, labels fade (all CSS,
// staggered via --draw-delay/--pop-delay custom props; fully neutralized under
// prefers-reduced-motion). The dashed orbit rings rotate slowly on
// pointer-fine devices; everything is static for touch users.
const STATIONS = [
  { label: 'Assessment', angle: -90 },
  { label: 'Evidence', angle: -45 },
  { label: 'Development', angle: 0 },
  { label: 'Growth', angle: 45 },
  { label: 'Reflection', angle: 90 },
  { label: 'Reassessment', angle: 135 },
  { label: 'Practice', angle: 180 },
  { label: 'Intervention', angle: -135 },
];
const QUADRANTS = [
  { key: 'IQ', color: 'var(--iq)', angle: -90 },
  { key: 'EQ', color: 'var(--eq)', angle: 0 },
  { key: 'SQ', color: 'var(--sq)', angle: 90 },
  { key: 'AQ', color: 'var(--aq)', angle: 180 },
];
const R_ORBIT = 196;
const R_LABEL = 236;
const C = 260;
const pt = (angle, r) => {
  const a = (angle * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
// Quarter-wedge path from the center out to r, between angle-45° and angle+45°.
const wedge = (angle, r) => {
  const [x1, y1] = pt(angle - 45, r);
  const [x2, y2] = pt(angle + 45, r);
  return `M ${C} ${C} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
};
export default function HeroDiagram({ className = '' }) {
  return (
    <div className={`relative aspect-square w-full ${className}`} aria-hidden="true">
      <svg viewBox="0 0 520 520" className="hero-draw-svg h-full w-full overflow-visible" fill="none">
        {/* quadrant tints — 3% whispers of the four quotient colors */}
        {QUADRANTS.map(q => (
          <path key={q.key} d={wedge(q.angle, R_ORBIT)} fill={q.color} opacity="0.05" />
        ))}
        {/* rotating orbit rings */}
        <g className="hero-orbit">
          <circle cx={C} cy={C} r={R_ORBIT} stroke="var(--gold)" strokeWidth="0.6" strokeDasharray="2 10" opacity="0.5" />
          <circle cx={C} cy={C} r={R_ORBIT - 56} stroke="var(--border-strong)" strokeWidth="0.5" strokeDasharray="1 8" opacity="0.6" />
        </g>
        {/* quadrant cross + outer frame — the draw-in strokes */}
        <line x1={C} y1={C - R_LABEL - 8} x2={C} y2={C + R_LABEL + 8} stroke="var(--border)" strokeWidth="0.5" style={{ '--draw-delay': '0.05s' }} />
        <line x1={C - R_LABEL - 8} y1={C} x2={C + R_LABEL + 8} y2={C} stroke="var(--border)" strokeWidth="0.5" style={{ '--draw-delay': '0.2s' }} />
        <circle cx={C} cy={C} r={R_LABEL + 8} stroke="var(--border)" strokeWidth="0.5" opacity="0.7" className="hero-pop" style={{ '--pop-delay': '0.15s' }} />
        {/* center node */}
        <circle cx={C} cy={C} r="30" fill="var(--gold)" opacity="0.07" className="hero-pop" style={{ '--pop-delay': '0.3s' }} />
        <rect x={C - 6} y={C - 6} width="12" height="12" fill="var(--gold)" className="hero-pop" style={{ '--pop-delay': '0.45s' }} />
        <text x={C} y={C + 46} textAnchor="middle" fill="var(--foreground)" stroke="var(--background)" strokeWidth="5" paintOrder="stroke" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="3" className="hero-fade" style={{ '--pop-delay': '0.6s' }}>QIDS</text>
        {/* spokes + stations — spokes draw outward, stations pop in sequence */}
        {STATIONS.map((s, i) => {
          const [x, y] = pt(s.angle, R_ORBIT);
          const delay = `${0.5 + i * 0.09}s`;
          return (
            <g key={s.label}>
              <line x1={C} y1={C} x2={x} y2={y} stroke="var(--gold)" strokeWidth="0.5" opacity="0.3" style={{ '--draw-delay': delay }} />
              <circle cx={x} cy={y} r="3.2" fill="var(--gold)" className="hero-pop" style={{ '--pop-delay': `${0.9 + i * 0.09}s` }} />
              <circle cx={x} cy={y} r="7.5" stroke="var(--gold)" strokeWidth="0.5" opacity="0.4" className="hero-pop" style={{ '--pop-delay': `${0.95 + i * 0.09}s` }} />
            </g>
          );
        })}
        {/* station labels — upright, just outside the orbit. Horizontal-axis
            stations (Development/Practice) drop BELOW the axis: the wide
            middle-anchored text otherwise parks under the station dot, and
            lifting up instead would land on the AQ/EQ quotient labels. */}
        {STATIONS.map((s, i) => {
          const onHorizontalAxis = s.angle % 180 === 0;
          const [x, y] = pt(s.angle, R_ORBIT + 22);
          return (
            <text key={s.label} x={x} y={y + (onHorizontalAxis ? 18 : 3)} textAnchor="middle" fill="var(--muted-foreground)" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.5" style={{ textTransform: 'uppercase' }} className="hero-fade" >
              {s.label.toUpperCase()}
            </text>
          );
        })}
        {/* quotient labels on the axes. Horizontal-axis quotients (EQ/AQ) are
            lifted perpendicular to their axis: at this radius they'd land
            inline with the Development/Practice station labels (both are
            middle-anchored on the same line → the AQ×PRACTICE / EQ×DEVELOPMENT
            collision). Vertical quotients (IQ/SQ) already stack outward. */}
        {QUADRANTS.map((q, i) => {
          const onHorizontalAxis = q.angle % 180 === 0;
          const [x, y] = pt(q.angle, R_LABEL - 4);
          return (
            <text key={q.key} x={x} y={y + (onHorizontalAxis ? -13 : 4)} textAnchor="middle" fill={q.color} fontFamily="var(--font-mono)" fontSize="13" fontWeight="600" letterSpacing="2" className="hero-fade" style={{ '--pop-delay': `${1.3 + i * 0.08}s` }}>
              {q.key}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
