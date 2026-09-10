import React from 'react';

export function PageFrame({ part, kicker, title, lede, children, actions }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-rule bg-surface/40">
        <div className="max-w-[1200px] mx-auto px-10 lg:px-16 py-14 lg:py-20">
          <div className="flex items-center gap-3 mb-8">
            {part && (
              <>
                <span className="font-mono text-[11px] tracking-[0.22em] text-gold">PART {part}</span>
                <span className="h-px w-12 bg-gold" />
              </>
            )}
            <span className="kicker !text-[11px]">{kicker}</span>
          </div>
          <div className="flex items-start justify-between gap-10">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight max-w-3xl leading-[1.05] text-ink" style={{ fontFamily: 'Sora, sans-serif' }}>
              {title}
            </h1>
            {actions}
          </div>
          {lede && (
            <p className="mt-8 max-w-2xl text-base lg:text-lg text-slate leading-relaxed font-light">
              {lede}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-10 lg:px-16 py-16">{children}</div>
    </div>
  );
}

export function Section({ number, title, description, children }) {
  return (
    <section className="grid grid-cols-12 gap-8 py-12 border-t border-rule first:border-t-0 first:pt-0">
      <div className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          {number && (
            <div className="font-mono text-[11px] tracking-[0.22em] text-gold mb-3">§ {number}</div>
          )}
          <h2 className="text-2xl font-light tracking-tight leading-tight text-ink">{title}</h2>
          {description && (
            <p className="mt-3 text-sm text-slate leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8">{children}</div>
    </section>
  );
}

export function Card({ title, meta, children, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border p-6 transition-colors ${active ? 'border-gold' : 'border-rule'} ${onClick ? 'cursor-pointer hover:border-gold/60' : ''}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {(title || meta) && (
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-base font-medium tracking-tight text-ink">{title}</h3>
          {meta && <span className="font-mono text-[10px] text-slate/70">{meta}</span>}
        </div>
      )}
      {children && (
        <div className={`${title ? 'mt-3' : ''} text-sm text-slate leading-relaxed`}>{children}</div>
      )}
    </div>
  );
}

export function KeyValue({ items }) {
  return (
    <dl className="divide-y divide-rule border-y border-rule">
      {items.map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-4 py-3">
          <dt className="kicker col-span-1">{k}</dt>
          <dd className="col-span-2 text-sm text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 opacity-40 pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(to right, var(--rule) 1px, transparent 1px), linear-gradient(to bottom, var(--rule) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 70%)',
      }}
    />
  );
}
