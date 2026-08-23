import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import QidsMark from '../components/QidsMark';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="flex min-h-20 items-center justify-between border-b border-border px-6 lg:px-12">
        <Link to="/" className="inline-flex items-center gap-3 no-underline">
          <span className="text-gold"><QidsMark size={24} /></span>
          <span className="font-display tracking-[0.32em] text-[13px] text-on-surface">QiDS</span>
        </Link>
        <Link to="/mode"
          className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-on-surface no-underline transition-colors">
          Begin Assessment →
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-24 text-center">
        <div>
          <div className="section-index mb-6">ERROR 404 — ROUTE NOT FOUND</div>
          <h1 className="font-display text-[72px] md:text-[110px] font-light leading-none tracking-[-0.04em]">404</h1>
          <p className="mt-6 max-w-md mx-auto text-[14px] leading-[1.75] text-muted-foreground">
            The path you requested does not exist in this system. Return to a known coordinate.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary no-underline">Home <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/app/dashboard" className="btn-outline no-underline">Open app</Link>
          </div>
        </div>
      </main>
      <footer className="border-t border-border px-6 py-8 lg:px-12">
        <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          <span>QiDS · Quadrant Intelligence Development System</span>
          <span>STRUCTURE · CLARITY · DEPTH</span>
        </div>
      </footer>
    </div>
  );
}
