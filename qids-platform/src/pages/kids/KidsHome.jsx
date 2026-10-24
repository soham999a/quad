import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Award, Brain, Check, Clock, Heart, Lock, Plus, Sparkles, Users, Zap, X,
} from 'lucide-react';
import usePageTitle from '../../lib/usePageTitle';
import useKidsChild from '../../lib/useKidsChild';
import { logEvent } from '../../lib/analytics';
import { chaptersByQuotient } from '../../data/kids/story';
import { QUOTIENT_LABEL, currentScene, deriveState } from '../../core/kids/progress';

const QUOTIENT_ICON = { IQ: Brain, EQ: Heart, SQ: Users, AQ: Zap };
const QUOTIENT_COLOR = {
  IQ: 'var(--iq)',
  EQ: 'var(--eq)',
  SQ: 'var(--sq)',
  AQ: 'var(--aq)',
};

function ChapterCTA({ chapter, progress, t }) {
  if (!chapter) return null;
  const session = progress?.sessions?.find(s => s.chapterId === chapter.id && !s.completedAt) || null;
  const scene = currentScene(chapter, session);
  const started = !!session && session.choices.length > 0;
  return (
    <Link
      to={`/app/kids/story/${chapter.id}`}
      className="btn-primary inline-flex items-center gap-2 !text-[12px] font-mono uppercase !tracking-[0.14em] no-underline"
    >
      {started ? t('kids.continue_story') : t('kids.start_mission')}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function AddChildForm({ onAdd, onCancel, avatars, t }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(avatars[0]);
  const [ageBand, setAgeBand] = useState('11-14');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim() && consent && !saving;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try { await onAdd({ name, avatar, ageBand, consent }); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="label-eyebrow-gold">{t('kids.add_child')}</div>
        <button type="button" onClick={onCancel} className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-on-surface" aria-label={t('kids.cancel')}>
          <X size={15} />
        </button>
      </div>

      <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="kid-name">
        {t('kids.child_name')}
      </label>
      <input
        id="kid-name"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={40}
        placeholder={t('kids.child_name_placeholder')}
        className="w-full bg-transparent border border-border-strong px-3 py-2 text-[14px] text-on-surface mb-4"
      />

      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">{t('kids.choose_avatar')}</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {avatars.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            aria-pressed={avatar === a}
            className={`w-9 h-9 text-[17px] leading-none border cursor-pointer bg-transparent transition-colors ${
              avatar === a ? 'border-gold bg-gold/10' : 'border-border hover:border-border-strong'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2">{t('kids.age_band')}</div>
      <div className="flex gap-2 mb-5">
        {[
          { id: '8-10', label: t('kids.age_8_10') },
          { id: '11-14', label: t('kids.age_11_14') },
        ].map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => setAgeBand(b.id)}
            aria-pressed={ageBand === b.id}
            className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] border cursor-pointer bg-transparent transition-colors ${
              ageBand === b.id ? 'border-gold text-gold' : 'border-border text-muted-foreground hover:text-on-surface'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          className="mt-[3px] accent-[var(--gold)] flex-shrink-0"
        />
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          {t('kids.consent_label')}
        </span>
      </label>

      <button type="submit" disabled={!canSave} className="btn-primary inline-flex items-center gap-2">
        {t('kids.save_child')} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}

export default function KidsHome() {
  const { t } = useTranslation();
  usePageTitle('Kids practice');
  const {
    uid, profiles, child, childId, setChildId, progress, progressReady, addChild, removeChild, loading, avatars,
  } = useKidsChild();
  const [adding, setAdding] = useState(false);

  const derived = useMemo(() => (progress ? deriveState(progress) : null), [progress]);
  const weekly = useMemo(() => chaptersByQuotient(), []);

  // Nothing is known until the profiles (and the active child's progress) are
  // in hand — rendering earlier would show an empty path and a false
  // "map complete" state.
  if (loading || (profiles.length > 0 && !progressReady)) {
    return (
      <div className="page-pad max-w-[960px] mx-auto" aria-busy="true">
        <div className="skeleton h-3 w-40 mb-4" />
        <div className="skeleton h-9 w-80 max-w-full mb-8" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade">
      <div className="label-eyebrow-gold mb-3">MODULE · KIDS 4Q PRACTICE · AGES 8–14</div>
      <h1 className="text-headline-md font-extrabold mb-2">{t('kids.title')}</h1>
      <p className="text-label-md text-surface-variant mb-6 max-w-[620px]">{t('kids.subtitle')}</p>

      {/* Child profiles — the module is a sub-profile of this guardian account. */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {profiles.map(p => {
          const active = p.id === childId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setChildId(p.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 px-3 py-1.5 border cursor-pointer bg-transparent text-[12px] transition-colors ${
                active ? 'border-gold text-on-surface' : 'border-border text-muted-foreground hover:text-on-surface'
              }`}
            >
              <span className="text-[15px] leading-none">{p.avatar}</span>
              {p.name}
              {active && <Check size={12} className="text-gold" />}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAdding(v => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground hover:text-on-surface text-[11px] font-mono uppercase tracking-[0.12em] cursor-pointer bg-transparent"
        >
          <Plus size={13} /> {t('kids.add_child')}
        </button>
        {child && progress && (
          <Link to="/app/kids/guardian" className="ml-auto text-[11px] font-mono uppercase tracking-[0.12em] text-gold no-underline hover:underline">
            {t('kids.guardian_view')}
          </Link>
        )}
      </div>

      {adding && (
        <div className="mb-8">
          <AddChildForm
            onAdd={async (data) => {
              const profile = await addChild(data);
              logEvent(uid, 'kids_profile_created', { ageBand: data.ageBand, hasAvatar: !!data.avatar });
              setAdding(false);
              return profile;
            }}
            onCancel={() => setAdding(false)}
            avatars={avatars}
            t={t}
          />
        </div>
      )}

      {!profiles.length ? (
        <div className="card p-8 md:p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
            <Sparkles size={18} strokeWidth={1.5} />
          </div>
          <h2 className="text-[17px] font-bold mb-2">{t('kids.no_child_title')}</h2>
          <p className="text-body-md text-surface-variant max-w-[460px] mx-auto mb-6">{t('kids.no_child_body')}</p>
          <button type="button" onClick={() => setAdding(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('kids.add_child')}
          </button>
        </div>
      ) : (
        <>
          {/* Today's mission — derived from progress, not an array index. */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground">
                {t('kids.todays_mission')}
              </h2>
              {derived && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  {derived.chaptersComplete}/{derived.totalChapters} {t('kids.done')}
                </span>
              )}
            </div>

            {!derived ? null : derived.currentChapter ? (
              <div className="card card-gold p-6 md:p-8 relative overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-[560px]">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="chip !border-0"
                        style={{
                          color: QUOTIENT_COLOR[derived.currentChapter.quotient],
                          background: `color-mix(in srgb, ${QUOTIENT_COLOR[derived.currentChapter.quotient]} 12%, transparent)`,
                        }}
                      >
                        {t('kids.chapter')} {String(derived.currentChapter.index).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground inline-flex items-center gap-1.5">
                        <Clock size={12} /> {derived.currentChapter.minutes} {t('kids.minutes')}
                      </span>
                    </div>
                    <h3 className="text-[22px] font-bold leading-tight mb-2">{derived.currentChapter.title}</h3>
                    <p className="text-body-md text-surface-variant leading-relaxed mb-5">{derived.currentChapter.subtitle}</p>
                    <ChapterCTA chapter={derived.currentChapter} progress={progress} t={t} />
                  </div>

                  <div className="flex flex-col items-start gap-1 min-w-[132px]">
                    <div className="num text-[34px] text-gold leading-none">
                      {derived.streakDays}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
                      {t('kids.day_streak')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-3">
                      {derived.totalChoices} {t('kids.decisions')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card card-gold p-8 text-center">
                <Award className="text-gold mx-auto mb-3" size={22} />
                <h3 className="text-[18px] font-bold mb-2">{t('kids.complete_all')}</h3>
                <p className="text-body-md text-surface-variant max-w-[440px] mx-auto">
                  {t('kids.complete_all_body')}
                </p>
              </div>
            )}
          </section>

          {/* One mission per quotient. */}
          <section className="mb-10">
            <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('kids.weekly_missions')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {['IQ', 'EQ', 'SQ', 'AQ'].map(q => {
                const Icon = QUOTIENT_ICON[q];
                const chapter = weekly[q]?.[0];
                if (!chapter) return null;
                const done = derived?.completedChapterIds.includes(chapter.id);
                return (
                  <Link
                    key={chapter.id}
                    to={`/app/kids/story/${chapter.id}`}
                    className="card card-hover p-4 no-underline text-left transition-colors"
                    style={{ borderColor: done ? 'color-mix(in srgb, var(--gold) 45%, transparent)' : undefined }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `color-mix(in srgb, ${QUOTIENT_COLOR[q]} 14%, transparent)` }}
                      >
                        <Icon size={13} style={{ color: QUOTIENT_COLOR[q] }} />
                      </span>
                      {done
                        ? <Check size={13} className="text-gold" />
                        : <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">{QUOTIENT_LABEL[q]}</span>}
                    </div>
                    <div className="text-[13px] font-bold text-on-surface mb-1 leading-snug">{chapter.title}</div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
                      {chapter.minutes} {t('kids.minutes')} · {q}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Learning path — nodes derived from completed chapters. */}
          <section className="mb-10">
            <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground mb-4">
              {t('kids.path')}
            </h2>
            <div className="card p-5 md:p-6 overflow-x-auto">
              <div className="flex items-start min-w-[640px]">
                {(derived?.nodes || []).map((node, i, arr) => (
                  <div key={node.id} className="flex items-start flex-1">
                    <div className="flex flex-col items-center gap-2 w-full">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono border transition-colors ${
                          node.state === 'done'
                            ? 'border-gold bg-gold/15 text-gold'
                            : node.state === 'current'
                              ? 'border-gold text-gold'
                              : 'border-border-strong text-muted-foreground'
                        }`}
                      >
                        {node.state === 'done' ? <Check size={12} /> : node.state === 'locked' ? <Lock size={10} /> : i}
                      </span>
                      <span className={`text-[10px] font-mono uppercase tracking-[0.1em] text-center leading-tight ${
                        node.state === 'locked' ? 'text-muted-foreground/60' : 'text-on-surface'
                      }`}>
                        {node.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="h-px flex-1 mt-3.5 mx-1"
                        style={{ background: node.state === 'done' ? 'var(--gold)' : 'var(--border)' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Badges — derived, never stored. */}
          <section className="mb-4">
            <h2 className="text-technical-sm font-technical-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t('kids.badges')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(derived?.badges || []).map(badge => (
                <div
                  key={badge.id}
                  className={`card p-4 ${badge.earned ? '' : 'opacity-45'}`}
                  title={badge.description}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={14} className={badge.earned ? 'text-gold' : 'text-muted-foreground'} />
                    <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                      {badge.earned ? t('kids.earned') : t('kids.locked')}
                    </span>
                  </div>
                  <div className="text-[12px] font-bold leading-tight text-on-surface mb-1">{badge.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-snug">{badge.description}</div>
                </div>
              ))}
            </div>
          </section>

          {child && (
            <div className="flex items-center gap-3 mt-8 pt-5 border-t border-border">
              <span className="text-[11px] text-muted-foreground">
                {t('kids.playing_as')} <span className="text-on-surface">{child.name}</span> · {child.ageBand}
              </span>
              <button
                type="button"
                onClick={() => { if (window.confirm(t('kids.remove_confirm'))) removeChild(child.id); }}
                className="ml-auto text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground hover:text-status-err bg-transparent border-none cursor-pointer"
              >
                {t('kids.remove_child')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
