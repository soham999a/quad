import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import QidsMark from './QidsMark';

const NAV_ITEMS = [
  { href: '#architecture', label: 'Architecture' },
  { to: '/app/dashboard', label: 'Individual' },
  { to: '/app/school', label: 'School' },
  { to: '/app/interview', label: 'Interview' },
];

export function Wordmark({ to = '/' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-3 group no-underline">
      <span className="text-gold flex-shrink-0"><QidsMark size={26} /></span>
      <span className="flex flex-col leading-none">
        <span className="font-display tracking-[0.32em] text-[13px] text-on-surface">QiDS</span>
        <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground mt-1">INTELLIGENCE · DEVELOPMENT · SYSTEM</span>
      </span>
    </Link>
  );
}

export function PublicShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-12">
          <Wordmark />
          <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary navigation">
            {NAV_ITEMS.map((item) => (
              item.to ? (
                <Link key={item.label} to={item.to}
                  className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground hover:text-on-surface transition-colors no-underline">
                  {item.label}
                </Link>
              ) : (
                <a key={item.label} href={item.href}
                  className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground hover:text-on-surface transition-colors no-underline">
                  {item.label}
                </a>
              )
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="hidden sm:inline-flex text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground hover:text-on-surface transition-colors no-underline">
              Sign in
            </Link>
            <Link to="/mode" className="btn-primary hidden sm:inline-flex !py-2.5 !px-4 !text-[11px] font-mono uppercase !tracking-[0.16em] no-underline">
              Begin Assessment <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button type="button"
              className="xl:hidden inline-flex h-10 w-10 items-center justify-center border border-border text-muted-foreground hover:text-on-surface transition-colors cursor-pointer bg-transparent"
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border px-6 py-5 xl:hidden">
            <nav className="mx-auto flex max-w-[1440px] flex-col" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item, index) => {
                const inner = (
                  <>
                    <span>{String(index + 1).padStart(2, '0')} / {item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                );
                const cls = "flex items-center justify-between border-b border-border py-4 text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground hover:text-on-surface transition-colors no-underline";
                return item.to ? (
                  <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className={cls}>{inner}</Link>
                ) : (
                  <a key={item.label} href={item.href} onClick={() => setOpen(false)} className={cls}>{inner}</a>
                );
              })}
              <Link to="/mode" onClick={() => setOpen(false)}
                className="mt-4 inline-flex items-center justify-between bg-gold px-4 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--navy)] no-underline">
                Begin Assessment <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </nav>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="text-gold"><QidsMark size={20} /></span>
          <span>QiDS · Quadrant Intelligence Development System</span>
        </div>
        <span>© {new Date().getFullYear()} · A MATRIX system</span>
      </div>
    </footer>
  );
}

export default PublicShell;
