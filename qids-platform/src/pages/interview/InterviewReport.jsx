import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInterviewSession } from '../../services/interviewService';
import { useAuth } from '../../context/AuthContext';
import { RUBRIC_DIMENSIONS, RUBRIC_MAP } from '../../core/data/interviewRubrics';
import { interviewBand, INTERVIEW_PEER_NORM } from '../../core/engine/interviewScoring';
import { RadarSvg } from '../../components/charts';
import { downloadInterviewReportPdf } from '../../lib/interviewReportPdf';
import { PILLARS } from '../../data/qidsData';

// qidsData exports PILLARS as a keyed map ({ IQ: {...}, EQ: {...}, ... }).
// The report renders pillars as an ordered list (radar positions matter), so
// materialise the canonical IQ → EQ → SQ → AQ order once here.
const PILLAR_LIST = ['IQ', 'EQ', 'SQ', 'AQ'].map(id => PILLARS[id]).filter(Boolean);
import { Brain, Download, ChevronRight, AlertCircle, BarChart3, Target, Users } from 'lucide-react';
const SHAPES = {
  T: {
    label: 'T-Shaped',
    desc: 'Deep in one area, broad across others',
    color: 'var(--color-primary)'
  },
  I: {
    label: 'I-Shaped',
    desc: 'Deep specialist in one domain',
    color: 'var(--color-info)'
  },
  X: {
    label: 'X-Shaped',
    desc: 'Balanced high performance across all areas',
    color: 'var(--color-success)'
  },
  M: {
    label: 'M-Shaped',
    desc: 'Multi-disciplinary strength across 3+ areas',
    color: 'var(--color-warning)'
  }
};
const SCORE_COLORS = ['var(--status-err)', 'var(--gold-bright)', 'var(--phase-pre)', 'var(--status-ok)'];
export default function InterviewReport() {
  const {
    t
  } = useTranslation();
  usePageTitle('Interview report');
  const {
    sessionId
  } = useParams();
  const navigate = useNavigate();
  const {
    user,
    userProfile
  } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Re-interview context: the earlier attempt, for the delta comparison the
  // assessor guidance calls for when the same candidate is interviewed again.
  const [previous, setPrevious] = useState(null);
  // The Download button saves a real PDF file (one click, no print dialog);
  // jsPDF loads on demand inside the generator.
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    if (!session || downloading) return;
    setDownloading(true);
    try {
      await downloadInterviewReportPdf(session, previous);
    } catch (e) {
      console.warn('PDF download failed:', e);
      // Last-resort fallback: the print dialog can still produce a PDF.
      window.print();
    } finally {
      setDownloading(false);
    }
  };
  useEffect(() => {
    setPrevious(null);
    if (!session?.previousSessionId) return;
    getInterviewSession(session.previousSessionId)
      .then(prev => { if (prev?.status === 'completed') setPrevious(prev); })
      .catch(() => {});
  }, [session?.previousSessionId]);
  const role = userProfile?.role || 'individual';
  // Appendix B "searchable post-interview": transcript/notes search filter.
  const [transcriptQuery, setTranscriptQuery] = useState('');
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getInterviewSession(sessionId).then(s => {

      if (!s) {
        setError(t("InterviewReport.session_not_found"));
        return;
      }
      // Candidate personas (individual/student) may open a report only when
      // they are the session's actual candidate — the report is otherwise an
      // evaluator/admin/employer surface.
      const isCandidate = ['individual', 'student'].includes(role) && s.candidateUid === user?.uid;
      const isStaff = ['evaluator', 'employer', 'admin'].includes(role);
      if (!isStaff && !isCandidate) {
        setError(t("InterviewReport.session_not_found"));
        return;
      }
      if (s.status !== 'completed') {
        setError('This report is not final yet.');
        return;
      }
      setSession(s);
    }).catch(() => setError(t("InterviewReport.failed_to_load"))).finally(() => setLoading(false));
  }, [sessionId, role, user?.uid]);
  if (loading) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16">
        <div className="card p-8">
          <div className="skeleton h-6 w-48 mb-4" />
          <div className="skeleton h-64 w-full" />
        </div>
      </div>;
  }
  if (error || !session) {
    return <div className="page-pad max-w-[960px] mx-auto animate-fade py-16 text-center">
        <AlertCircle size={32} className="text-surface-variant mx-auto mb-4" />
        <div className="text-body-md font-body-md text-surface-variant mb-6">{error || 'Session not found'}</div>
        <button onClick={() => navigate('/app/interview')} className="btn-primary">{t("InterviewReport.back_to_dashboard")}</button>
      </div>;
  }
  const {
    mergedScores,
    pillarScores,
    unifiedScore,
    grade,
    skillShape,
    careerProfile,
    evaluatorAssessment,
    mode
  } = session;
  // Hiring Confidence traffic light — PIP Page 1. The spec's thresholds are
  // written on the 145-point PII (Green ≥105, Amber 90–104, Red <90); the
  // interview report scores 0–100, so the same cut ratios apply (≈72 / ≈62)
  // and keep the spec's Green/Amber/Red language and rationale structure.
  const hiringConfidence = unifiedScore == null ? null
    : unifiedScore >= 72 ? {
        label: 'High', color: 'var(--color-success)',
        rationale: 'Interview evidence tracks the strong band across most dimensions — proceed with hiring confidence.',
      }
    : unifiedScore >= 62 ? {
        label: 'Moderate', color: 'var(--gold-strong, var(--color-primary))',
        rationale: 'Capability is present but uneven — probe the flagged areas before a decision.',
      }
    : {
        label: 'Caution', color: 'var(--status-err, #e5484d)',
        rationale: 'Interview evidence stayed thin or weak — treat as a development risk for now.',
      };

  const shape = skillShape ? SHAPES[skillShape] : null;
  const career = careerProfile || null;

  // PIP Page 2 — the dimension radar with the peer-norm dashed line. axes
  // are the nine rubric dimensions rescaled 0–100 from the 1–5 rubric; the
  // peer norm comes from the platform's standing PEER_NORM (see
  // INTERVIEW_PEER_NORM) until the Phase 3 norming study replaces it.
  const radarRows = RUBRIC_DIMENSIONS.map(d => {
    const score = mergedScores?.[d.id] ?? 0;
    return {
      subject: d.shortLabel,
      Candidate: score > 0 ? ((score - 1) / 4) * 100 : 0,
      'Peer Norm': INTERVIEW_PEER_NORM[d.id],
    };
  });
  const radarSeries = [
    { key: 'Peer Norm', color: 'var(--slate-muted, var(--color-outline))', fillOpacity: 0 },
    { key: 'Candidate', color: 'var(--gold-strong, var(--color-primary))', fillOpacity: 0.18 },
  ];
  return <div className="page-pad max-w-[960px] mx-auto animate-fade interview-report">
      {/* Hero */}
      <section className="card-gold p-8 md:p-12 mb-8 text-center">
        <div className="kicker mb-3">{t("InterviewReport.interview_assessment_report")}</div>
        <h1 className="text-headline-lg font-headline-lg text-on-background mb-2">{session.candidateName}</h1>
        {session.role && <div className="text-body-md font-body-md text-surface-variant mb-6">{session.role}</div>}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          <div className="text-body-sm font-body-sm text-surface-variant">
            {mode === 'exam'
              ? `Assigned Exam · ${session.examTier || ''}`
              : mode === 'live' ? 'Live Interview' : 'Post-Interview'} · Scored by {session.evaluatorName}
            {session.completedAt && (() => {
              const d = session.completedAt?.toDate ? session.completedAt.toDate() : new Date(session.completedAt);
              return Number.isFinite(d?.getTime()) ? ` · ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}` : '';
            })()}
          </div>
          {(session.sessionNumber || 1) > 1 && <span className="chip text-[10px]" style={{ background: 'var(--gold-tint)', color: 'var(--color-primary)', borderColor: 'var(--gold-line)' }}>
              Re-interview · Attempt #{session.sessionNumber}
            </span>}
          {previous?.unifiedScore != null && unifiedScore != null && (() => {
            const delta = Math.round(unifiedScore) - Math.round(previous.unifiedScore);
            const up = delta >= 0;
            return <span className="text-technical-sm font-technical-sm uppercase tracking-widest"
                style={{ color: up ? 'var(--color-success)' : 'var(--status-err)' }}>
                {up ? '▲' : '▼'} {up ? '+' : ''}{delta} vs attempt #{previous.sessionNumber || 1}
              </span>;
          })()}
        </div>

        {/* Score Gauge */}
        <div className="flex justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-outline-variant)" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={grade?.color || 'var(--color-primary)'} strokeWidth="8" strokeDasharray={`${unifiedScore / 100 * 314} 314`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[28px] font-technical-sm text-on-background">{Math.round(unifiedScore || 0)}</div>
              <div className="text-technical-sm font-technical-sm" style={{
              color: grade?.color
            }}>{t("inter.grade_upper", { n: grade?.grade })}</div>
            </div>
          </div>
        </div>

        {/* Hiring Confidence — PIP Page 1 traffic light */}
        {hiringConfidence && <div className="inline-flex items-center gap-2 px-3 py-1.5 border-[0.5px] mb-4" style={{
            borderColor: hiringConfidence.color,
            background: `color-mix(in srgb, ${hiringConfidence.color} 8%, transparent)`,
            borderRadius: '6px'
          }}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hiringConfidence.color }} />
            <span className="text-label-sm font-label-sm" style={{ color: hiringConfidence.color }}>{hiringConfidence.label} confidence</span>
            <span className="text-body-sm font-body-sm text-surface-variant hidden sm:inline">— {hiringConfidence.rationale}</span>
          </div>}

        {/* Skill Shape Badge */}
        {shape && <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low border-[0.5px] border-outline-variant">
            <Target size={14} style={{
          color: shape.color
        }} />
            <span className="text-label-md font-label-md" style={{
          color: shape.color
        }}>{shape.label}</span>
            <span className="text-body-sm font-body-sm text-surface-variant">— {shape.desc}</span>
          </div>}
      </section>

      {/* Assigned-exam panel — the battery's own numbers: PII composite, per-
          module T-scores, work style and integrity, straight from the exam
          engine. The rest of this page reuses the interview report layout via
          the exam's mergedScores/pillarScores/unifiedScore fields. */}
      {session.examSummary && <section className="mb-8">
          <div className="kicker mb-4">Exam battery detail · {session.examSummary.tier}</div>
          <div className="gradient-rule mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[{
              label: 'PII composite',
              value: session.examSummary.pii?.score != null ? Math.round(session.examSummary.pii.score) : '—',
              sub: session.examSummary.pii?.band || '',
            }, {
              label: 'Integrity',
              value: session.examSummary.integrity?.band || '—',
              sub: session.examSummary.integrity?.flaggedItems?.length ? `${session.examSummary.integrity.flaggedItems.length} flagged item(s)` : 'no flags',
            }, {
              label: 'Learning agility',
              value: session.examSummary.learningAgility?.label || '—',
              sub: session.examSummary.learningAgility?.score != null ? `index ${session.examSummary.learningAgility.score}` : '',
            }].map(b => <div key={b.label} className="card p-5">
                <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-2">{b.label}</div>
                <div className="text-headline-sm font-headline-sm text-on-background">{b.value}</div>
                {b.sub && <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{b.sub}</div>}
              </div>)}
          </div>
          {session.examSummary.moduleScores && Object.keys(session.examSummary.moduleScores).length > 0 && <div className="card p-6">
              <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-4">Module T-scores</div>
              <div className="space-y-3">
                {Object.entries(session.examSummary.moduleScores).filter(([, s]) => s && s.max > 0).sort((a, b) => (b[1].tScore || 0) - (a[1].tScore || 0)).map(([id, s]) => <div key={id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-label-sm font-label-sm text-on-background">{id}</span>
                      <span className="text-technical-sm font-technical-sm text-surface-variant">{s.band} · P{String(s.percentile ?? '—').padStart(2, '0')} · T{s.tScore}</span>
                    </div>
                    <div className="h-2 bg-surface-container-high overflow-hidden">
                      <div className="h-full transition-all duration-700" style={{ width: `${Math.max(s.tScore || 0, 2)}%`, background: 'var(--color-primary)' }} />
                    </div>
                  </div>)}
              </div>
            </div>}
        </section>}

      {/* Dimension Scores — each carries its band (spec band vocabulary) and,
          for re-interviews, the movement against the previous attempt. */}
      <section className="mb-8">
        <div className="kicker mb-4">{t("InterviewReport.dimension_scores")}</div>
        <div className="gradient-rule mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RUBRIC_DIMENSIONS.map((d, i) => {
          const maxScore = 5;
          const score = mergedScores?.[d.id] ?? 0;
          const pct = score / maxScore * 100;
          const evScore = evaluatorAssessment?.find(e => e.dimensionId === d.id)?.score;
          const band = interviewBand(score || null);
          const prevDim = previous?.mergedScores?.[d.id];
          const delta = (score && prevDim != null) ? Math.round((score - prevDim) * 10) / 10 : null;
          return <div key={d.id} className="card p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-label-sm font-label-sm text-on-background">{d.label}</div>
                  <div className="flex items-center gap-2">
                    {mode === 'post' && evScore != null && <span className="text-technical-sm font-technical-sm text-surface-variant">Ev: {evScore}</span>}
                    <span className="text-[18px] font-technical-sm text-on-background">{score.toFixed(1)}</span>
                    <span className="text-technical-sm font-technical-sm text-surface-variant">/5</span>
                  </div>
                </div>
                <div className="h-2 bg-surface-container-high overflow-hidden">
                  <div className="h-full transition-all duration-700" style={{
                width: `${pct}%`,
                background: SCORE_COLORS[i % SCORE_COLORS.length]
              }} />
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                  <div className="text-technical-sm font-technical-sm text-surface-variant">
                    Maps to {PILLAR_LIST.find(p => p.id === d.pillar)?.short || d.pillar}
                  </div>
                  <div className="flex items-center gap-2">
                    {delta != null && <span className="text-technical-sm font-technical-sm" style={{ color: delta >= 0 ? 'var(--color-success)' : 'var(--status-err)' }}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                    </span>}
                    {band && <span className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{ color: band.color }}>
                      {band.label}
                    </span>}
                  </div>
                </div>
                {band && <div className="text-body-sm font-body-sm text-on-surface-variant mt-1">{band.desc}</div>}
                {evaluatorAssessment?.find(e => e.dimensionId === d.id)?.notes &&
                  <div className="mt-3 pt-3 border-t-[0.5px] border-outline-variant text-body-sm font-body-sm text-on-surface-variant italic">
                    “{evaluatorAssessment.find(e => e.dimensionId === d.id).notes}”
                  </div>}
              </div>;
        })}
        </div>
      </section>

      {/* Strengths & development focus — the interview-mode panel the spec
          defines: top 3 strengths, then the two areas that deserve probing or
          coaching next. Sorted on the merged scores, not the raw ones. */}
      <section className="mb-8">
        <div className="kicker mb-4">Strengths & development focus</div>
        <div className="gradient-rule mb-6" />
        {(() => {
          const ranked = RUBRIC_DIMENSIONS
            .map(d => ({ dim: d, score: mergedScores?.[d.id] }))
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score);
          const strengths = ranked.slice(0, Math.min(3, ranked.length));
          const gaps = ranked.slice().reverse().slice(0, 2).filter(x => !strengths.find(s => s.dim.id === x.dim.id));
          return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={14} style={{ color: 'var(--color-success)' }} />
                <span className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{ color: 'var(--color-success)' }}>Top strengths</span>
              </div>
              <ol className="space-y-3">
                {strengths.map((x, i) => <li key={x.dim.id} className="flex gap-3">
                    <span className="text-technical-sm font-technical-sm text-surface-variant tabular-nums flex-shrink-0">{i + 1}</span>
                    <div>
                      <div className="text-label-sm font-label-sm text-on-background">{x.dim.label}</div>
                      <div className="text-technical-sm font-technical-sm text-surface-variant">{x.score.toFixed(1)}/5 · {interviewBand(x.score)?.label}</div>
                    </div>
                  </li>)}
              </ol>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={14} style={{ color: 'var(--gold-strong, var(--color-primary))' }} />
                <span className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{ color: 'var(--gold-strong, var(--color-primary))' }}>Develop next</span>
              </div>
              <ol className="space-y-3">
                {gaps.length > 0 ? gaps.map((x, i) => <li key={x.dim.id} className="flex gap-3">
                    <span className="text-technical-sm font-technical-sm text-surface-variant tabular-nums flex-shrink-0">{i + 1}</span>
                    <div>
                      <div className="text-label-sm font-label-sm text-on-background">{x.dim.label}</div>
                      <div className="text-technical-sm font-technical-sm text-surface-variant">{x.score.toFixed(1)}/5 · {interviewBand(x.score)?.label}</div>
                    </div>
                  </li>) : <li className="text-body-sm text-on-surface-variant">Nothing flagged — every scored dimension landed in the top half.</li>}
              </ol>
            </div>
          </div>;
        })()}
      </section>

      {/* PIP Page 2: dimension radar (peer norm dashed) + pillar bars */}
      {pillarScores && <section className="mb-8">
          <div className="kicker mb-4">Dimension radar · peer norm — QIDS pillar scores</div>
          <div className="gradient-rule mb-6" />
          <div className="responsive-grid-12 gap-6">
            {/* Dimension radar — PIP Page 2: candidate polygon vs the peer-norm
                dashed line (platform norm until the Phase 3 norming study). */}
            <div className="md:col-span-5 col-span-full card p-6 md:p-8 flex flex-col items-center justify-center">
              <RadarSvg
                data={radarRows}
                series={radarSeries}
                dashed={['Peer Norm']}
                height={260}
                ariaLabel={radarRows.map(r =>
                  `${r.subject} candidate ${Math.round(r.Candidate)} vs peer norm ${r['Peer Norm']}`).join(', ')}
              />
              <div className="flex items-center gap-4 mt-2 text-technical-sm font-technical-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-1.5 rounded" style={{ background: 'var(--gold-strong, var(--color-primary))' }} /> Candidate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: 'var(--slate-muted, var(--color-outline))' }} /> Peer norm
                </span>
              </div>
            </div>

            {/* Pillar Bars */}
            <div className="md:col-span-7 col-span-full space-y-3">
              {PILLAR_LIST.map(p => <div key={p.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-label-sm font-label-sm text-on-background">{p.short}</span>
                    </div>
                    <span className="text-[18px] font-technical-sm text-on-background">{pillarScores[p.id] || 0}</span>
                  </div>
                  <div className="h-2 bg-surface-container-high overflow-hidden">
                    <div className="h-full" style={{
                width: `${pillarScores[p.id] || 0}%`,
                background: p.color
              }} />
                  </div>
                </div>)}
            </div>
          </div>
        </section>}

      {/* Career Profile */}
      {career && <section className="mb-8">
          <div className="kicker mb-4">{t("InterviewReport.career_alignment_profile")}</div>
          <div className="gradient-rule mb-6" />
          <div className="card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-label-lg font-label-lg text-on-background mb-1">{career.label}</div>
                <div className="text-body-sm font-body-sm text-surface-variant">{career.condition}</div>
              </div>
              <span className="chip text-[10px]" style={{
            background: 'var(--gold-tint)',
            color: 'var(--color-primary)',
            borderColor: 'var(--gold-line)'
          }}>{t("InterviewReport.recommended_path")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {career.roles?.map(role => <span key={role} className="px-3 py-1.5 border-[0.5px] border-outline-variant text-technical-sm font-technical-sm text-on-surface">
                  {role}
                </span>)}
            </div>
          </div>
        </section>}

      {/* Session transcript — per-question responses, interviewer notes,
          timestamps and marks. Appendix B wants notes timestamped, linked to
          the competency, and searchable post-interview. */}
      {Array.isArray(session?.liveResponses) && session.liveResponses.length > 0 &&
        session.liveResponses.some(r => (r.response && r.response.trim()) || r.score != null) &&
        <section className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="kicker mb-4">{t("InterviewReport.session_transcript")}</div>
              <div className="gradient-rule mb-0" />
            </div>
            <input
              type="search"
              value={transcriptQuery}
              onChange={e => setTranscriptQuery(e.target.value)}
              placeholder="Search notes, answers, competencies…"
              aria-label="Search the session transcript"
              className="input-field w-full sm:w-[300px]"
            />
          </div>
          <div className="space-y-4">
            {(() => {
              // Question, note text, competency and recorded time are all
              // searchable (Appendix B). Numbering keeps the original
              // position so "Q03" still matches the audit trail.
              const q = transcriptQuery.trim().toLowerCase();
              const matches = session.liveResponses.map((r, i) => ({ r, i })).filter(({ r }) => {
                const dimLabelF = RUBRIC_MAP?.[r.dimension]?.label || r.dimension || '';
                const hasContentF = (r.response && r.response.trim()) || r.score != null;
                if (!hasContentF) return false;
                if (!q) return true;
                return [r.questionText, r.response, dimLabelF, r.answeredAt || ''].join(' ').toLowerCase().includes(q);
              });
              if (matches.length === 0) return <p className="text-body-sm text-on-surface-variant">No transcript entries match “{transcriptQuery}”.</p>;
              return matches.map(({ r, i }) => {
                const dimLabel = RUBRIC_MAP?.[r.dimension]?.label || r.dimension || '';
                const answeredAt = r.answeredAt ? (() => {
                  const d = /^\d+$/.test(r.answeredAt) ? new Date(Number(r.answeredAt)) : new Date(r.answeredAt);
                  return Number.isFinite(d?.getTime()) ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                })() : null;
                return <div key={r.questionId || i} className="card p-5">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="text-technical-sm font-technical-sm text-surface-variant">Q{String(i + 1).padStart(2, '0')}{dimLabel ? ` · ${dimLabel}` : ''}{answeredAt ? ` · ${answeredAt}` : ''}</div>
                    <div className="flex items-center gap-2">
                      {session.guideMarks?.[r.questionId] && <span className="chip text-[10px]" style={{ background: 'var(--gold-tint)', color: 'var(--color-primary)', borderColor: 'var(--gold-line)' }}>{session.guideMarks[r.questionId]}</span>}
                      {r.score != null && <span className="text-technical-sm font-technical-sm text-primary">{r.score}/5</span>}
                    </div>
                  </div>
                  {r.questionText && <div className="text-label-sm font-label-sm text-on-background mb-2">{r.questionText}</div>}
                  {r.response && r.response.trim() && <div className="text-body-sm font-body-sm text-on-surface-variant italic">“{r.response}”</div>}
                </div>;
              });
            })()}
          </div>
        </section>}

      {/* Actions */}
      <div className="flex items-center justify-between mt-12 mb-16">
        <button onClick={() => navigate('/app/interview')} className="btn-outline">{t("InterviewReport.back_to_dashboard_2")}</button>
        <div className="flex gap-3">
          <button onClick={handleDownload} disabled={downloading} className="btn-outline flex items-center gap-2 disabled:opacity-50">
            <Download size={14} />{downloading ? 'Preparing…' : t("InterviewReport.download")}</button>
          <button
            onClick={() => session.candidateUid
              ? navigate(`/app/interview/setup?candidateUid=${session.candidateUid}&candidateName=${encodeURIComponent(session.candidateName || '')}`)
              : navigate('/app/interview/setup')}
            className="btn-primary glow flex items-center gap-2">{t("InterviewReport.new_session")}<ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>;
}