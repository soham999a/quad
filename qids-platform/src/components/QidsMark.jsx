import React, { useEffect, useState } from 'react';

/**
 * QidsMark — the QiDS mark, alive.
 *
 * A 2×2 quadrant (IQ / EQ / SQ / AQ) with hairline cross-dividers. The gold
 * cube rests in one quadrant, lifts, crosses the center — the hairlines pulse
 * gold as it passes — and settles into the next, tracing the ring
 * TR → TL → BL → BR. One hop per cycle; each cycle it sits in a different
 * box, exactly like the four quotients taking turns. The departed cell keeps
 * a faint afterglow. Pure CSS keyframes do the movement; this component only
 * advances the origin/target coordinates once per period and remounts the
 * cube so the keyframes restart cleanly. Reduced-motion users get the
 * original static mark (cube parked top-right).
 *
 * Props mirror the old API exactly — every consumer keeps working unchanged.
 */

// Quadrant seat coordinates for an 11×11 cube inside the 28×28 viewBox.
// Ordered clockwise around the ring starting from the original TR seat.
const SEATS = [
  { x: 15, y: 2 },   // TR — original brand position
  { x: 2,  y: 2 },   // TL
  { x: 2,  y: 15 },  // BL
  { x: 15, y: 15 },  // BR
];

const PERIOD_MS = 4200;
const RING_MS = PERIOD_MS * SEATS.length;

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

export default function QidsMark({ className = '', size = 28 }) {
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Respect reduced motion: freeze at the static brand mark.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // One hop per period: advance along the ring. A single mid-animation tick
  // remounts the cube (new origin → target), so keyframes restart seamlessly.
  useEffect(() => {
    if (reduced) return undefined;
    const id = setInterval(() => setStep((s) => (s + 1) % SEATS.length), PERIOD_MS);
    return () => clearInterval(id);
  }, [reduced]);

  if (reduced) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="26" height="26" stroke="currentColor" strokeWidth="1.5" />
        <line x1="14" y1="1" x2="14" y2="27" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <line x1="1" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <rect x="15" y="2" width="11" height="11" fill="var(--gold)" />
      </svg>
    );
  }

  const from = step;
  const to = (step + 1) % SEATS.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`qids-logo ${className}`}
      aria-hidden="true"
    >
      {/* Frame + cross-dividers (pulse gold as the cube crosses the center) */}
      <rect x="1" y="1" width="26" height="26" stroke="currentColor" strokeWidth="1.5" />
      <line className="qids-cross-v" x1="14" y1="1" x2="14" y2="27" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line className="qids-cross-h" x1="1" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.45" />

      {/* Afterglow of the cell the cube just departed */}
      <rect
        key={`ghost-${step}`}
        className="qids-ghost"
        x={SEATS[from].x}
        y={SEATS[from].y}
        width="11"
        height="11"
        fill="var(--gold)"
      />

      {/* The traveling cube: from → to. Keyed remount restarts the keyframes. */}
      <rect
        key={`cube-${step}`}
        className="qids-cube"
        style={{
          '--px': `${SEATS[from].x}px`,
          '--py': `${SEATS[from].y}px`,
          '--lx': `${SEATS[to].x}px`,
          '--ly': `${SEATS[to].y}px`,
        }}
        x="0"
        y="0"
        width="11"
        height="11"
        fill="var(--gold)"
      />
    </svg>
  );
}
