import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ─── LiveRadar — drag your own capability shape ──────────────────────────────
// The landing page's thesis, made playable: a four-axis radar where every
// visitor drags IQ/EQ/SQ/AQ to compose a profile shape and watches it morph
// with a spring. No data is collected — it is a mirror, not a form. The gold
// polygon animates between states; values and a live shape label update as
// you drag. Keyboard: focus + arrow keys move the active axis by 5.
const AXES = [
  { key: 'IQ', color: 'var(--iq)', angle: -90 },
  { key: 'EQ', color: 'var(--eq)', angle: 0 },
  { key: 'SQ', color: 'var(--sq)', angle: 90 },
  { key: 'AQ', color: 'var(--aq)', angle: 180 },
];
const R = 96;
const C = 130;
const pt = (angle, frac) => {
  const a = (angle * Math.PI) / 180;
  const r = (frac / 100) * R;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const poly = vals => AXES.map((ax, i) => pt(ax.angle, vals[i]).join(',')).join(' ');
function shapeLabel(vals) {
  const [iq, eq, sq, aq] = vals;
  const max = Math.max(...vals);
  if (max - Math.min(...vals) <= 12) return 'THE BALANCE — evenly drawn';
  if (iq === max) return 'THE ARCHITECT — cognition leading';
  if (eq === max) return 'THE EMPATH — emotional depth leading';
  if (sq === max) return 'THE DIPLOMAT — social range leading';
  return 'THE ADAPTER — resilience leading';
}
export default function LiveRadar() {
  const { t } = useTranslation();
  const [vals, setVals] = useState([78, 64, 71, 58]);
  const [display, setDisplay] = useState([78, 64, 71, 58]);
  const raf = useRef(0);
  const svgRef = useRef(null);
  const dragIdx = useRef(-1);

  // Spring the rendered polygon toward the target values — gold morph.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(vals);
      return undefined;
    }
    const tick = () => {
      setDisplay(prev => {
        let settled = true;
        const next = prev.map((v, i) => {
          const d = vals[i] - v;
          if (Math.abs(d) < 0.1) return vals[i];
          settled = false;
          return v + d * 0.14;
        });
        return settled ? prev : next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [vals]);
  const setFromPointer = (clientX, clientY) => {
    if (dragIdx.current < 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 260 / rect.width;
    const x = (clientX - rect.left) * scale - C;
    const y = (clientY - rect.top) * scale - C;
    const angle = AXES[dragIdx.current].angle;
    const a = (angle * Math.PI) / 180;
    const proj = x * Math.cos(a) + y * Math.sin(a);
    const frac = Math.max(12, Math.min(100, (proj / R) * 100));
    setVals(prev => prev.map((v, i) => (i === dragIdx.current ? Math.round(frac) : v)));
  };
  const onPointerDown = i => e => {
    e.preventDefault();
    svgRef.current.setPointerCapture?.(e.pointerId);
    dragIdx.current = i;
    setFromPointer(e.clientX, e.clientY);
  };
  const onPointerMove = e => {
    if (dragIdx.current >= 0) setFromPointer(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragIdx.current = -1;
  };
  const onKeyDown = i => e => {
    const step = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5 }[e.key];
    if (!step) return;
    e.preventDefault();
    setVals(prev => prev.map((v, j) => (i === j ? Math.max(12, Math.min(100, v + step)) : v)));
  };
  const label = useMemo(() => shapeLabel(vals), [vals]);
  const rings = [25, 50, 75, 100];
  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} viewBox="0 0 260 260" width="100%" className="radar-live max-w-[300px]" role="application" aria-label={t('Landing.live_radar_aria', 'Interactive four-quotient radar — drag the points or use arrow keys to compose a shape.')} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
        {rings.map(v => <polygon key={v} points={poly(AXES.map(() => v))} fill="none" stroke="var(--border)" strokeWidth="0.5" />)}
        {AXES.map(ax => {
          const [x, y] = pt(ax.angle, 100);
          return <line key={ax.key} x1={C} y1={C} x2={x} y2={y} stroke="var(--border)" strokeWidth="0.5" />;
        })}
        {/* the shape — gold morphing polygon */}
        <polygon points={poly(display)} fill="var(--gold)" fillOpacity="0.14" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" style={{ transition: 'fill-opacity 0.3s ease' }} />
        {/* draggable handles */}
        {AXES.map((ax, i) => {
          const [x, y] = pt(ax.angle, display[i]);
          return (
            <g key={ax.key} onPointerDown={onPointerDown(i)} style={{ cursor: 'grab' }}>
              <circle cx={x} cy={y} r="12" fill="transparent" />
              <circle cx={x} cy={y} r="6" fill="var(--background)" stroke={ax.color} strokeWidth="1.5" />
              <circle cx={x} cy={y} r="2.2" fill={ax.color} />
              <circle cx={x} cy={y} r="12" fill="transparent" tabIndex={0} role="slider" aria-label={`${ax.key} value`} aria-valuemin={12} aria-valuemax={100} aria-valuenow={vals[i]} onKeyDown={onKeyDown(i)} onFocus={() => {}} style={{ outline: 'none' }} />
            </g>
          );
        })}
        {/* axis labels + live values */}
        {AXES.map((ax, i) => {
          const lx = C + (R + 22) * Math.cos((ax.angle * Math.PI) / 180);
          const ly = C + (R + 22) * Math.sin((ax.angle * Math.PI) / 180);
          return (
            <text key={ax.key} x={lx} y={ly + 4} textAnchor="middle" fill={ax.color} style={{ font: '600 12px "Space Grotesk", sans-serif', letterSpacing: '0.06em' }}>
              {ax.key}
              <tspan fill="var(--muted-foreground)" style={{ font: '500 10px "JetBrains Mono", monospace' }}> {vals[i]}</tspan>
            </text>
          );
        })}
      </svg>
      <div className="mt-2 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{label.split(' — ')[0]}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">{label.split(' — ')[1]}</div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button type="button" onClick={() => setVals([78, 64, 71, 58])} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-gold cursor-pointer bg-transparent border-none">
          ↺ Reset shape
        </button>
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground/60">
          drag the points
        </span>
      </div>
    </div>
  );
}
