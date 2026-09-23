import { useTranslation } from 'react-i18next';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANGS, SUPPORTED_LANGS } from '../i18n';

function currentBase() {
  const raw = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const b = String(raw || 'en').toLowerCase().split('-')[0];
  return SUPPORTED_LANGS.includes(b) ? b : 'en';
}

export function activeLangCode() {
  try {
    const v = window.localStorage.getItem('i18nextLng');
    const b = String(v || '').toLowerCase().split('-')[0];
    if (SUPPORTED_LANGS.includes(b)) return b;
  } catch { /* fall through */ }
  return currentBase();
}

/**
 * LanguageSwitcher — globe button + native-language dropdown.
 * Desktop: compact globe+code chip in the TopBar. Mobile: the `expanded`
 * variant shows full native names, sized for touch, for the drawer/footer.
 */
export default function LanguageSwitcher({ expanded = false, align = 'right' }) {
  const { t, i18n } = useTranslation();
  
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(activeLangCode);
  const rootRef = useRef(null);

  // Cross-instance sync: switching in the drawer updates the TopBar chip.
  useEffect(() => {
    const onChange = (e) => setLang(e.detail);
    window.addEventListener('qids:lang-changed', onChange);
    return () => window.removeEventListener('qids:lang-changed', onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc, true);
    };
  }, [open]);

  const choose = (code) => {
    setLang(code);
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const active = LANGS.find(l => l.code === lang) || LANGS[0];

  if (expanded) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 py-2.5 px-3 border border-sidebar-border text-muted-foreground hover:text-on-surface hover:border-gold/50 transition-colors cursor-pointer bg-transparent"
        >
          <span className="flex items-center gap-3 min-w-0">
            <Globe size={15} strokeWidth={1.5} className="flex-shrink-0" />
            <span className="text-[13px] tracking-wide truncate">{active.native}</span>
          </span>
          <ChevronDown size={13} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <ul role="listbox" aria-label="Language" className="mt-1 border border-sidebar-border bg-surface-container-lowest z-50 max-h-64 overflow-y-auto">
            {LANGS.map(l => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === lang}
                  onClick={() => choose(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-[13px] cursor-pointer border-none transition-colors ${
                    l.code === lang
                      ? 'bg-surface-container-low text-gold'
                      : 'bg-transparent text-muted-foreground hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <span className={l.font ? 'indic-text' : ''}>{l.native}</span>
                  {l.code === lang && <Check size={13} className="text-gold" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative" data-tour="lang">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        title="Language"
        className="w-9 h-9 flex-shrink-0 hidden md:inline-flex items-center justify-center border border-sidebar-border text-muted-foreground hover:text-gold hover:border-gold/60 transition-colors cursor-pointer bg-transparent font-mono text-[10px] tracking-wider uppercase gap-0.5"
      >
        <Globe size={13} strokeWidth={1.5} />
        <span>{active.code}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className={`absolute top-full mt-2 w-40 border border-sidebar-border bg-surface-container-lowest z-[130] max-h-64 overflow-y-auto ${align === 'right' ? 'right-0' : 'left-0'}`}
          style={{ boxShadow: '0 16px 48px color-mix(in oklab, var(--background) 55%, transparent)' }}
        >
          {LANGS.map(l => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => choose(l.code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-[13px] cursor-pointer border-none transition-colors ${
                  l.code === lang
                    ? 'bg-surface-container-low text-gold'
                    : 'bg-transparent text-muted-foreground hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className={l.font ? 'indic-text' : ''}>{l.native}</span>
                {l.code === lang && <Check size={13} className="text-gold" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
