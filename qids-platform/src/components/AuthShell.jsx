import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QidsMark from './QidsMark';
import HeroDiagram from './HeroDiagram';

// The split-screen brand panel shared by Login and Signup — the "atlas" side
// of the auth screens. Rendered only on lg+; mobile gets the compact header.
const QUOTIENT_LEGEND = [['IQ', 'var(--iq)'], ['EQ', 'var(--eq)'], ['SQ', 'var(--sq)'], ['AQ', 'var(--aq)']];
export default function AuthShell() {
  const {
    t
  } = useTranslation();
  return <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-2 p-10 lg:flex xl:p-14">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" style={{
      maskImage: 'radial-gradient(ellipse 80% 70% at 55% 42%, black 20%, transparent 72%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 55% 42%, black 20%, transparent 72%)'
    }} />
      <div className="pointer-events-none absolute left-10 top-10 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">
        Access portal — 01
      </div>
      <div className="relative">
        <Link to="/" className="inline-flex items-center gap-3 no-underline">
          <span className="text-gold"><QidsMark size={26} /></span>
          <span className="font-mono text-[12px] tracking-[0.28em] text-on-surface">QiDS</span>
        </Link>
        <h2 className="mt-16 max-w-md font-display text-[38px] font-light leading-[1.06] tracking-[-0.03em] xl:text-[46px]">
          {t('auth.brand_line1')}<br />
          <span className="text-muted-foreground">{t('auth.brand_line2')}</span>
        </h2>
        <p className="mt-6 max-w-sm text-[14px] leading-[1.75] text-muted-foreground">
          {t('landing.hero_sub')}
        </p>
      </div>
      <div className="relative mx-auto w-full max-w-[420px]">
        <HeroDiagram />
      </div>
      <div className="relative flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.16em]">
        {QUOTIENT_LEGEND.map(([k, c], i) => <span key={k} className="inline-flex items-center gap-2" style={{
        color: c
      }}>
            <span className="inline-block h-1.5 w-1.5" style={{
          background: c
        }} />
            {k}{i < QUOTIENT_LEGEND.length - 1 && <span className="ml-4 text-muted-foreground">·</span>}
          </span>)}
      </div>
    </aside>;
}
