import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Award, Check, Clock, Sparkles } from 'lucide-react';
import usePageTitle from '../../lib/usePageTitle';
import useKidsChild from '../../lib/useKidsChild';
import { CHAPTERS, getChapter } from '../../data/kids/story';
import {
  QUOTIENT_LABEL,
  completeSession,
  currentScene,
  deriveState,
  practiceEventFor,
  recordChoice,
  scenePath,
  startSession,
} from '../../core/kids/progress';

const QUOTIENT_COLOR = { IQ: 'var(--iq)', EQ: 'var(--eq)', SQ: 'var(--sq)', AQ: 'var(--aq)' };

export default function KidsStory() {
  const { t } = useTranslation();
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const chapter = useMemo(() => getChapter(chapterId), [chapterId]);
  usePageTitle(chapter ? chapter.title : 'Kids practice');

  const { progress, commit, child, loading } = useKidsChild();
  const [picked, setPicked] = useState(null);
  const completingRef = useRef(false);

  const openSession = useMemo(() => {
    if (!progress || !chapter) return null;
    return progress.sessions.find(s => s.chapterId === chapter.id && !s.completedAt) || null;
  }, [progress, chapter]);

  const alreadyCompleted = useMemo(() => {
    if (!progress || !chapter) return false;
    return progress.sessions.some(s => s.chapterId === chapter.id && s.completedAt);
  }, [progress, chapter]);

  const sceneState = useMemo(
    () => (chapter ? currentScene(chapter, openSession) : { scene: null, index: 0, total: 0 }),
    [chapter, openSession],
  );

  // A chapter is done when its ordered scene path runs out. Complete it once,
  // and emit the practice event the report layer can read later.
  useEffect(() => {
    if (!chapter || !progress || !openSession) return;
    // Wait until the consequence of the final choice has been read.
    if (picked) return;
    const { scene } = currentScene(chapter, openSession);
    if (scene) return;
    if (completingRef.current) return;
    completingRef.current = true;
    const now = new Date().toISOString();
    const completed = completeSession(progress, chapter.id, now);
    const finished = completed.sessions.find(s => s.id === openSession.id);
    const next = finished
      ? { ...completed, events: [...(completed.events || []), practiceEventFor(finished, now)] }
      : completed;
    commit(next);
  }, [chapter, progress, openSession, commit, picked]);

  // Reset the completion guard when the chapter changes (route param swap).
  useEffect(() => { completingRef.current = false; setPicked(null); }, [chapterId]);

  if (!chapter) {
    return (
      <div className="page-pad max-w-[720px] mx-auto">
        <h1 className="text-headline-md font-extrabold mb-3">{t('kids.chapter_missing')}</h1>
        <Link to="/app/kids" className="text-gold text-[12px] font-mono uppercase tracking-[0.12em] no-underline">
          ← {t('kids.back_to_map')}
        </Link>
      </div>
    );
  }

  if (loading || !progress) {
    return (
      <div className="page-pad max-w-[720px] mx-auto" aria-busy="true">
        <div className="skeleton h-3 w-32 mb-4" />
        <div className="skeleton h-8 w-72 mb-6" />
        <div className="skeleton h-56 w-full" />
      </div>
    );
  }

  const derived = deriveState(progress);
  const path = scenePath(chapter, openSession);
  const done = !openSession && alreadyCompleted;

  const choose = (choice) => {
    if (!sceneState.scene) return;
    const next = recordChoice(progress, chapter.id, sceneState.scene.id, choice);
    commit(next);
    setPicked(choice);
  };

  const replay = () => {
    completingRef.current = false;
    commit(startSession(progress, chapter.id));
  };

  const nextChapter = CHAPTERS.find(c => !derived.completedChapterIds.includes(c.id)) || null;

  return (
    <div className="page-pad max-w-[760px] mx-auto animate-fade">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/app/kids"
          className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-on-surface no-underline"
        >
          <ArrowLeft size={13} /> {t('kids.back_to_map')}
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground inline-flex items-center gap-2">
          {child && <span className="text-[14px] leading-none">{child.avatar}</span>}
          {child?.name}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="chip !border-0"
          style={{
            color: QUOTIENT_COLOR[chapter.quotient],
            background: `color-mix(in srgb, ${QUOTIENT_COLOR[chapter.quotient]} 12%, transparent)`,
          }}
        >
          {t('kids.chapter')} {String(chapter.index).padStart(2, '0')} · {chapter.quotient}
        </span>
        <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground inline-flex items-center gap-1.5">
          <Clock size={12} /> {chapter.minutes} {t('kids.minutes')}
        </span>
      </div>
      <h1 className="text-[26px] font-bold leading-tight mb-6">{chapter.title}</h1>

      {/* Scene progress — count reflects the bonus scene only once unlocked. */}
      {!done && path.length > 0 && (
        <div className="flex items-center gap-1.5 mb-6" aria-hidden="true">
          {path.map((s, i) => (
            <span
              key={s.id}
              className="h-1 flex-1 transition-colors"
              style={{
                background: i < sceneState.index ? 'var(--gold)' : i === sceneState.index ? 'var(--gold-bright)' : 'var(--border)',
                opacity: i > sceneState.index ? 0.5 : 1,
              }}
            />
          ))}
        </div>
      )}

      {done && (
        <div className="card card-gold p-7 md:p-9">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-gold" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-gold">
              {t('kids.chapter_complete')}
            </span>
          </div>
          <h2 className="text-[20px] font-bold mb-2">{chapter.title}</h2>
          <p className="text-body-md text-surface-variant mb-6">{t('kids.chapter_complete_body')}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            {['IQ', 'EQ', 'SQ', 'AQ'].map(q => (
              <div key={q} className="border border-border p-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mb-1">
                  {q} · {QUOTIENT_LABEL[q]}
                </div>
                <div className="num text-[20px]" style={{ color: QUOTIENT_COLOR[q] }}>{derived.tally[q]}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {nextChapter && nextChapter.id !== chapter.id ? (
              <button
                type="button"
                onClick={() => navigate(`/app/kids/story/${nextChapter.id}`)}
                className="btn-primary inline-flex items-center gap-2"
              >
                {t('kids.next_chapter')} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <Link to="/app/kids" className="btn-primary inline-flex items-center gap-2 no-underline">
                {t('kids.back_to_map')} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <button type="button" onClick={replay} className="btn-outline">
              {t('kids.play_again')}
            </button>
            <Link to="/app/kids" className="text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground hover:text-on-surface no-underline">
              {t('kids.view_map')}
            </Link>
          </div>
        </div>
      )}

      {!done && picked && (
        <div className="card p-6 md:p-7">
          <div className="flex items-center gap-2 mb-3">
            <Check size={14} className="text-gold" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {t('kids.you_chose')}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-on-surface mb-5">{picked.consequence}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPicked(null)} className="btn-primary inline-flex items-center gap-2">
              {t('kids.continue')} <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              +{picked.weight} {picked.quotient}
            </span>
          </div>
        </div>
      )}

      {!done && !picked && sceneState.scene && (
        <div className="card p-6 md:p-8">
          <p className="text-[16px] leading-[1.75] text-on-surface mb-6">{sceneState.scene.narration}</p>
          <p className="text-[13px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-4">
            {sceneState.scene.prompt}
          </p>
          <div className="flex flex-col gap-2.5">
            {sceneState.scene.choices.map(choice => (
              <button
                key={choice.id}
                type="button"
                onClick={() => choose(choice)}
                className="group w-full text-left border border-border hover:border-gold bg-transparent px-4 py-3.5 text-[14px] leading-snug text-on-surface cursor-pointer transition-colors flex items-center gap-3"
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: QUOTIENT_COLOR[choice.quotient] }} />
                <span className="flex-1">{choice.text}</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-60 transition-opacity text-gold flex-shrink-0" />
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground mt-4">
            {t('kids.scene_of', { n: sceneState.index + 1, total: sceneState.total })}
          </p>
        </div>
      )}

      {!done && !picked && !sceneState.scene && (
        <div className="card p-8 flex items-center gap-3">
          <Sparkles size={16} className="text-gold" />
          <span className="text-[13px] text-muted-foreground">{t('kids.finishing')}</span>
        </div>
      )}
    </div>
  );
}
