import { useEffect, useState } from 'react';

const TRAJECTORIES = [
  { key: 'iq', path: 'M 30 292 C 100 238, 118 110, 224 132 S 302 222, 392 42' },
  { key: 'eq', path: 'M 12 94 C 104 122, 122 252, 230 218 S 312 112, 424 162' },
  { key: 'sq', path: 'M 54 30 C 138 92, 188 50, 238 120 S 268 286, 406 278' },
  { key: 'aq', path: 'M 18 222 C 92 274, 154 192, 208 164 S 314 62, 438 98' },
];

export default function OpenFieldDiagram({ className = '' }) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setPointer({ x, y });
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return (
    <div
      className={`open-field relative aspect-square w-full max-w-[600px] ${className}`}
      style={{ '--field-x': `${pointer.x * 5}px`, '--field-y': `${pointer.y * 5}px` }}
      role="img"
      aria-label="An open architectural field showing four quotient trajectories converging and separating over time."
    >
      <svg viewBox="0 0 460 320" className="h-full w-full overflow-visible" fill="none" aria-hidden="true">
        <g className="field-axis" stroke="currentColor" strokeWidth="0.5" opacity="0.35">
          <path d="M 0 160 H 460" strokeDasharray="2 11" />
          <path d="M 166 0 L 350 320" strokeDasharray="1 13" />
          <path d="M 64 320 L 250 0" strokeDasharray="1 15" />
        </g>
        <g className="field-trajectories">
          {TRAJECTORIES.map((trajectory, index) => (
            <g key={trajectory.key} className={`field-line field-line-${index + 1}`}>
              <path d={trajectory.path} stroke="var(--gold)" strokeWidth="1.1" opacity="0.68" />
              <path d={trajectory.path} stroke="var(--gold)" strokeWidth="6" opacity="0.04" />
              <circle
                className="field-node"
                cx={[224, 230, 238, 208][index]}
                cy={[132, 218, 120, 164][index]}
                r="3"
                fill="var(--gold)"
              />
            </g>
          ))}
        </g>
        <g fill="currentColor" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="2">
          <text x="22" y="304">IQ</text>
          <text x="417" y="174">EQ</text>
          <text x="402" y="290">SQ</text>
          <text x="20" y="218">AQ</text>
        </g>
        <g fill="currentColor" opacity="0.5" fontFamily="var(--font-mono)" fontSize="8" letterSpacing="1.8">
          <text x="300" y="22">ARCHITECTURAL FIELD / 01</text>
          <text x="282" y="310">STRUCTURE IN MOTION</text>
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-[17%] left-[39%] h-2 w-2 border border-[var(--gold)] bg-background" />
      <div className="pointer-events-none absolute left-0 top-[48%] h-px w-[28%] bg-border" />
      <div className="pointer-events-none absolute bottom-[8%] right-[2%] h-px w-[24%] rotate-[-30deg] bg-border" />
    </div>
  );
}
