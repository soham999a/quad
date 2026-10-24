import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Award, Check, Clock, Download, Lock } from 'lucide-react';
import usePageTitle from '../../lib/usePageTitle';
import useKidsChild from '../../lib/useKidsChild';
import { logEvent } from '../../lib/analytics';
import { CHAPTERS } from '../../data/kids/story';
import { QUOTIENT_LABEL, deriveState } from '../../core/kids/progress';

const QUOTIENT_COLOR = { IQ: 'var(--iq)', EQ: 'var(--eq)', SQ: 'var(--sq)', AQ: 'var(--aq)' };

export default function KidsGuardian() {
  const { t } = useTranslation();
  usePageTitle('Kids progress');
  const {
    uid, profiles, child, childId, setChildId, progress, progressReady,
    loading, exportChild, removeChild,
  } = useKidsChild();

  const derived = useMemo(() => (progress ? deriveState(progress) : null), [progress]);
  const maxTally = derived ? Math.max(1, ...Object.values(derived.tally)) : 1;

  const downloadExport = async () => {
    if (!child) return;
    const data = await exportChild(child.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qids-kids-${child.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    link.click();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logEvent(uid, 'kids_data_exported', { childId: child.id });
  };

  if (loading || (profiles.length > 0 && !progressReady)) {
    return (
      <div className="page-pad max-w-[960px] mx-auto" aria-busy="true">
        <div className="skeleton h-3 w-36 mb-4" />
        <div className="skeleton h-8 w-72 max-w-full mb-8" />
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <Link
        to="/app/kids"
        className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-on-surface no-underline mb-6"
      >
        <ArrowLeft size={13} /> {t('kids.back_to_map')}
      </Link>

      <div className="label-eyebrow-gold mb-3">{t('kids.guardian_eyebrow')}</div>
      <h1 className="text-headline-md font-extrabold mb-2">{t('kids.guardian_title')}</h1>
      <p className="text-label-md text-surface-variant mb-6 max-w-[620px]">{t('kids.guardian_subtitle')}</p>

      {profiles.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {profiles.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setChildId(p.id)}
              aria-pressed={p.id === childId}
              className={`inline-flex items-center gap-2 px-3 py-1.5 border cursor-pointer bg-transparent text-[12px] transition-colors ${
                p.id === childId ? 'border-gold text-on-surface' : 'border-border text-muted-foreground hover:text-on-surface'
              }`}
            >
              <span className="text-[15px] leading-none">{p.avatar}</span>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {!child || !derived ? (
        <div className="card p-8 text-center">
          <p className="text-body-md text-surface-variant mb-5">{t('kids.no_child_body')}</p>
          <Link to="/app/kids" className="btn-primary inline-flex items-center gap-2 no-underline">
            {t('kids.add_child')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: t('kids.chapters_done'), value: `${derived.chaptersComplete}/${derived.totalChapters}` },
              { label: t('kids.day_streak'), value: derived.streakDays },
              { label: t('kids.decisions'), value: derived.totalChoices },
              { label: t('kids.badges_earned'), value: derived.badges.filter(b => b.earned).length },
            ].map(stat => (
              <div key={stat.label} className="card p-4">
                <div className="num text-[24px] text-on-surface leading-none mb-1.5">{stat.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <section className="mb-8">
            <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('kids.practice_mix')}
            </h2>
            <div className="card p-5 md:p-6 flex flex-col gap-4">
              {['IQ', 'EQ', 'SQ', 'AQ'].map(q => (
                <div key={q}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                      {q} · {QUOTIENT_LABEL[q]}
                    </span>
                    <span className="text-[11px] font-mono text-on-surface">{derived.tally[q]}</span>
                  </div>
                  <div className="h-1.5 w-full bg-border overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.round((derived.tally[q] / maxTally) * 100)}%`,
                        background: QUOTIENT_COLOR[q],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{t('kids.practice_mix_note')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('kids.path')}
            </h2>
            <div className="card divide-y divide-border">
              {CHAPTERS.map(chapter => {
                const done = derived.completedChapterIds.includes(chapter.id);
                const current = derived.currentChapter?.id === chapter.id;
                return (
                  <div key={chapter.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        done ? 'border-gold bg-gold/15 text-gold' : current ? 'border-gold text-gold' : 'border-border-strong text-muted-foreground'
                      }`}
                    >
                      {done ? <Check size={11} /> : current ? <Clock size={11} /> : <Lock size={10} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[13px] ${done || current ? 'text-on-surface' : 'text-muted-foreground'}`}>
                        {chapter.title}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground">
                        {chapter.quotient} · {chapter.minutes} {t('kids.minutes')}
                      </div>
                    </div>
                    <Link
                      to={`/app/kids/story/${chapter.id}`}
                      className="text-[10px] font-mono uppercase tracking-[0.1em] text-gold no-underline hover:underline flex-shrink-0"
                    >
                      {done ? t('kids.review') : current ? t('kids.continue_short') : t('kids.open')}
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>

          {derived.currentChapter && (
            <section className="mb-8">
              <div className="card card-gold p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-gold mb-2">
                    {t('kids.recommended_next')}
                  </div>
                  <div className="text-[15px] font-bold text-on-surface">{derived.currentChapter.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{derived.currentChapter.subtitle}</div>
                </div>
                <Link
                  to={`/app/kids/story/${derived.currentChapter.id}`}
                  className="btn-primary inline-flex items-center gap-2 no-underline"
                >
                  {t('kids.start_mission')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('kids.badges')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {derived.badges.filter(b => b.earned).length === 0 ? (
                <p className="text-[12px] text-muted-foreground">{t('kids.no_badges')}</p>
              ) : (
                derived.badges.filter(b => b.earned).map(b => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-2 border border-gold px-3 py-1.5 text-[11px] text-on-surface"
                  >
                    <Award size={12} className="text-gold" /> {b.label}
                  </span>
                ))
              )}
            </div>
          </section>

          <div className="border border-border p-5 mb-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {t('kids.not_a_test_title')}
            </div>
            <p className="text-[12px] leading-relaxed text-surface-variant">{t('kids.not_a_test_body')}</p>
          </div>

          <div className="border border-border p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {t('kids.privacy_title')}
            </div>
            <p className="text-[12px] leading-relaxed text-surface-variant mb-3">{t('kids.privacy_body')}</p>
            {child.consent?.attestedAt && (
              <p className="text-[11px] text-muted-foreground mb-4">
                {t('kids.consent_recorded', {
                  date: new Date(child.consent.attestedAt).toLocaleDateString(),
                  version: child.consent.version || '',
                })}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadExport}
                className="btn-outline inline-flex items-center gap-2"
              >
                <Download size={13} /> {t('kids.export_data')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('kids.remove_confirm'))) {
                    removeChild(child.id).then(() => window.location.assign('/app/kids'));
                  }
                }}
                className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground hover:text-status-err bg-transparent border-none cursor-pointer"
              >
                {t('kids.remove_child')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
