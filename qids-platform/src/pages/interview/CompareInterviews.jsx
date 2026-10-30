import usePageTitle from '../../lib/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEvaluatorSessions } from '../../services/interviewService';
import { RUBRIC_DIMENSIONS } from '../../core/data/interviewRubrics';
import { interviewBand } from '../../core/engine/interviewScoring';
import { Users, Info } from 'lucide-react';

// ─── Candidate Comparison — Appendix B, "Candidate Comparison in Interview" ──
// "Side-by-side comparison of two candidates on the same competency during
// debrief meeting. Supports panel discussion." Two completed sessions from the
// evaluator's own history, compared dimension by dimension with the PIP band
// vocabulary, so the debrief argues from anchors rather than impressions.
export default function CompareInterviews() {
  usePageTitle('Compare candidates');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  useEffect(() => {
    if (!user) return;
    getEvaluatorSessions(user.uid)
      .then(list => setSessions(list.filter(s => s.status === 'completed' && s.mergedScores)))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [user]);

  const a = sessions.find(s => s.id === aId) || null;
  const b = sessions.find(s => s.id === bId) || null;

  const sessionOption = s => {
    const no = (s.sessionNumber || 1) > 1 ? ` · attempt #${s.sessionNumber}` : '';
    return `${s.candidateName || 'Candidate'}${no}${s.role ? ` — ${s.role}` : ''}`;
  };

  const scoreCell = (session, dimId) => {
    if (!session) return { score: null, band: null };
    const score = session.mergedScores?.[dimId] ?? null;
    return { score, band: interviewBand(score) };
  };

  return <div className="page-pad max-w-[1100px] mx-auto animate-fade">
      <section className="mb-10 md:mb-14">
        <div className="kicker mb-3">Interview studio · debrief</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Candidate comparison</h1>
        <p className="text-body-md font-body-md text-on-surface-variant mt-2 max-w-[720px]">
          Side-by-side on every competency — the Appendix B debrief view. Argue from the bands and anchors, not from memory of the room.
        </p>
        <div className="gradient-rule mt-6" />
      </section>

      {loading ? <div className="card p-8"><div className="skeleton h-6 w-56 mb-4" /><div className="skeleton h-64 w-full" /></div>
      : sessions.length < 2 ? (
        <div className="card p-8 md:p-10 text-center">
          <Users size={28} className="text-surface-variant mx-auto mb-4" />
          <div className="text-body-md font-body-md text-on-surface-variant max-w-[480px] mx-auto">
            Two completed interviews are needed for a comparison — score and complete another session first.
          </div>
          <button onClick={() => navigate('/app/interview')} className="btn-outline mt-6">Back to the studio</button>
        </div>
      ) : <>
        {/* Pick the two sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[{
            label: 'Candidate A', id: aId, other: bId, set: setAId,
          }, {
            label: 'Candidate B', id: bId, other: aId, set: setBId,
          }].map(pick => <div key={pick.label} className="card p-5">
              <div className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant mb-2">{pick.label}</div>
              <select
                aria-label={pick.label}
                value={pick.id}
                onChange={e => pick.set(e.target.value)}
                className="input-field w-full"
              >
                <option value="">— select a completed session —</option>
                {sessions.filter(s => s.id !== pick.other).map(s => (
                  <option key={s.id} value={s.id}>{sessionOption(s)}</option>
                ))}
              </select>
            </div>)}
        </div>

        {a && b && <>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[a, b].map(s => <div key={s.id} className="card p-6">
                <div className="text-label-lg font-label-lg text-on-background mb-1">{s.candidateName || 'Candidate'}</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant mb-4">
                  {s.mode === 'live' ? 'Live' : 'Post'} interview{(s.sessionNumber || 1) > 1 ? ` · attempt #${s.sessionNumber}` : ''}{s.role ? ` · ${s.role}` : ''}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-headline-md font-headline-md text-on-background">{Math.round(s.unifiedScore || 0)}</span>
                  <span className="text-body-sm text-surface-variant">/ 100</span>
                  {s.grade && <span className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{ color: s.grade.color }}>{s.grade.grade}</span>}
                </div>
              </div>)}
          </div>

          {/* Dimension-by-dimension table */}
          <div className="card p-4 md:p-6 mb-8 overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '560px' }}>
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3">
                    <span className="text-technical-sm font-technical-sm uppercase tracking-widest text-surface-variant">Competency</span>
                  </th>
                  {[a, b].map(s => <th key={s.id} className="text-right py-2 pl-3">
                      <span className="text-label-sm font-label-sm text-on-background">{s.candidateName || 'Candidate'}</span>
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {RUBRIC_DIMENSIONS.map(d => {
                  const ca = scoreCell(a, d.id);
                  const cb = scoreCell(b, d.id);
                  // Highlight the stronger side only on a real gap, so a 4.0
                  // vs 4.1 rounding artefact never reads as a verdict.
                  const leadA = ca.score != null && cb.score != null && ca.score - cb.score >= 0.5;
                  const leadB = ca.score != null && cb.score != null && cb.score - ca.score >= 0.5;
                  return <tr key={d.id} style={{ borderTop: '0.5px solid var(--outline-variant, var(--color-outline-variant))' }}>
                    <td className="py-2.5 pr-3">
                      <div className="text-body-sm font-body-sm text-on-background">{d.label}</div>
                    </td>
                    {[{ s: ca, lead: leadA }, { s: cb, lead: leadB }].map((cell, i) => <td key={i} className="py-2.5 pl-3 text-right">
                        <div className="text-body-sm font-body-sm tabular-nums" style={{ color: cell.lead ? 'var(--color-success)' : 'var(--on-surface)' }}>
                          {cell.s.score != null ? cell.s.score.toFixed(1) + ' / 5' : '—'}
                        </div>
                        {cell.s.band && <div className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{ color: cell.s.band.color }}>
                          {cell.s.band.label}
                        </div>}
                      </td>)}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          {/* Panel-discussion guardrails from Appendix D — the comparison
              exists to structure the debrief, not to shortcut it. */}
          <div className="flex gap-3 p-4 border-[0.5px] border-outline-variant bg-surface-container-low" style={{ borderRadius: '6px' }}>
            <Info size={15} className="text-surface-variant flex-shrink-0 mt-0.5" />
            <div className="text-body-sm font-body-sm text-on-surface-variant">
              <strong className="text-on-surface">Debrief guidance:</strong> surfaces both candidates on the same competencies for the panel. Where scores diverge from assessment predictions, document the reasoning — neither data point is infallible. Don't share comparisons with co-interviewers until every interview for the role is done.
            </div>
          </div>
        </>}
      </>}
    </div>;
}
