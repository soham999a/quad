import { useTranslation } from 'react-i18next';
import usePageTitle from '../lib/usePageTitle';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import QidsMark from '../components/QidsMark';
export default function NotFound({
  inline = false
}) {
  const {
    t
  } = useTranslation();
  usePageTitle('Page not found');
  const body = <div className={inline ? 'text-center py-16' : 'text-center'}>
      <div className="section-index mb-6">{t("NotFound.error_404_route_not")}</div>
      <h1 className={`font-display font-light leading-none tracking-[-0.04em] ${inline ? 'text-[48px] md:text-[72px]' : 'text-[72px] md:text-[110px]'}`}>404</h1>
      <p className="mt-6 max-w-md mx-auto text-[14px] leading-[1.75] text-muted-foreground">{t("NotFound.the_path_you_requested")}</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/app/dashboard" className="btn-primary no-underline">{t("NotFound.go_to_dashboard")}<ArrowRight className="h-4 w-4" /></Link>
        <Link to="/" className="btn-outline no-underline">{t("NotFound.home")}</Link>
      </div>
    </div>;
  if (inline) {
    // Rendered inside the app shell for unknown /app/* routes.
    return <div className="page-pad max-w-[720px] mx-auto animate-fade">{body}</div>;
  }
  return <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="flex min-h-20 items-center justify-between border-b border-border px-6 lg:px-12">
        <Link to="/" className="inline-flex items-center gap-3 no-underline">
          <span className="text-gold"><QidsMark size={24} /></span>
          <span className="font-display tracking-[0.32em] text-[13px] text-on-surface">{t("NotFound.qids")}</span>
        </Link>
        <Link to="/mode" className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground hover:text-on-surface no-underline transition-colors">{t("NotFound.begin_assessment")}</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        {body}
      </main>
      <footer className="border-t border-border px-6 py-8 lg:px-12">
        <div className="mx-auto max-w-[1440px] flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
          <span>{t("NotFound.qids_quadrant_intelligence_development")}</span>
          <span>{t("NotFound.structure_clarity_depth")}</span>
        </div>
      </footer>
    </div>;
}