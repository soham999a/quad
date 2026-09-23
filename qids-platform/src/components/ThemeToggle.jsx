import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/theme';

/**
 * Dark/light toggle — a small switch with a sliding gold thumb.
 * Bone = light base; navy premium = dark. Fits the Swiss/editorial style.
 */
export default function ThemeToggle({ className = '' }) {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? t('theme.to_dark') : t('theme.to_light')}
      title={isLight ? t('theme.to_dark') : t('theme.to_light')}
      className={`inline-flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer group ${className}`}
    >
      <Sun size={13} strokeWidth={1.5} className={isLight ? 'text-gold' : 'text-muted-foreground group-hover:text-gold'} />
      <span
        className={`flex w-9 h-[18px] rounded-full border px-[2px] border-border-strong transition-colors ${
          isLight ? 'justify-end border-gold bg-gold/10' : 'justify-start'
        }`}
        style={{ alignItems: 'center' }}
      >
        <span className="w-[12px] h-[12px] rounded-full bg-gold transition-all" />
      </span>
      <Moon size={13} strokeWidth={1.5} className={!isLight ? 'text-gold' : 'text-muted-foreground group-hover:text-gold'} />
    </button>
  );
}
