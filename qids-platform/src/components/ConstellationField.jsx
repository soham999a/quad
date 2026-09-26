import { useEffect, useRef } from 'react';

// ─── ConstellationField — the living background of the hero ─────────────────
// A slow-drifting network of hairline-connected nodes, like a capability map
// being plotted in real time. A handful of "seeds" carry the four quotient
// colors; connections near the pointer brighten so the field feels aware of
// you. Density adapts to viewport area and halves for pointer-coarse devices.
// Under prefers-reduced-motion the canvas is not started at all — the parent
// section's masked grid stays as the static fallback.
export default function ConstellationField({ className = '' }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const SEED_COLORS = ['var(--iq)', 'var(--eq)', 'var(--sq)', 'var(--aq)'];
    const SEED_RGB = [
      [212, 175, 55],
      [94, 168, 180],
      [146, 122, 200],
      [204, 122, 100],
    ];
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes = [];
    const pointer = { x: -9999, y: -9999 };
    const LINK_DIST = 130;
    const SENSE_DIST = 170;
    const rand = (a, b) => a + Math.random() * (b - a);
    const build = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.floor((w * h) / 16000));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.09, 0.09),
        r: rand(0.7, 1.6),
        seed: i % 9 === 0 ? i / 9 % 4 : -1,
      }));
    };
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = w + 10;
        if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10;
        if (n.y > h + 10) n.y = -10;
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const pdx = mx - pointer.x;
          const pdy = my - pointer.y;
          const pd = Math.sqrt(pdx * pdx + pdy * pdy);
          const aware = pd < SENSE_DIST ? 1 - pd / SENSE_DIST : 0;
          const base = 0.1 * (1 - Math.sqrt(d2) / LINK_DIST);
          const alpha = base + aware * 0.5;
          ctx.strokeStyle = aware > 0.02
            ? `rgba(212, 175, 55, ${alpha})`
            : `rgba(160, 160, 150, ${alpha})`;
          ctx.lineWidth = aware > 0.02 ? 0.8 : 0.4;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const n of nodes) {
        const dx = n.x - pointer.x;
        const dy = n.y - pointer.y;
        const aware = dx * dx + dy * dy < SENSE_DIST * SENSE_DIST;
        if (n.seed >= 0) {
          const [r, g, b] = SEED_RGB[n.seed];
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
        } else {
          ctx.fillStyle = aware ? 'rgba(212, 175, 55, 0.9)' : 'rgba(170, 170, 160, 0.45)';
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (aware ? 0.8 : 0), 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };
    const onMove = e => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    build();
    raf = requestAnimationFrame(step);
    const ro = new ResizeObserver(build);
    ro.observe(canvas.parentElement);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true" />;
}
