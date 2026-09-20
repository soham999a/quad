import usePageTitle from '../../lib/usePageTitle';
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QidsMark from '../../components/QidsMark';
import { BadgeCheck, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { getPublicCredential } from '../../services/firestoreService';
import { getGrade, computeWeightedScore } from '../../core/engine/qids';

const PILLAR_SHORT = { IQ: 'IQ', EQ: 'EQ', SQ: 'SQ', AQ: 'AQ' };

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Public credential — the blueprint's viral loop.
 * No auth: employers and anyone with the link can verify a profile.
 * The payload is re-hashed in the browser and compared to the issuance hash.
 */
export default function PublicCredential() {
  usePageTitle('Verified credential');
  const { id } = useParams();
  const [cred, setCred] = useState(undefined); // undefined = loading
  const [verify, setVerify] = useState('pending'); // pending | valid | invalid

  useEffect(() => {
    if (!id) { setCred(null); return; }
    getPublicCredential(id).then(setCred).catch(() => setCred(null));
  }, [id]);

  useEffect(() => {
    if (!cred) return;
    const { hash, issuedAt, ...payload } = cred;
    sha256Hex(JSON.stringify(payload)).then(h => setVerify(h === hash ? 'valid' : 'invalid'));
  }, [cred]);

  const unified = cred?.unifiedScore ?? (cred?.pillarScores ? computeWeightedScore(cred.pillarScores) : 0);
  const grade = cred?.grade ?? (unified ? getGrade(unified) : null);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="flex min-h-20 items-center justify-between border-b border-border px-6 lg:px-12">
        <Link to="/" className="inline-flex items-center gap-3 no-underline">
          <span className="text-gold"><QidsMark size={24} /></span>
          <span className="font-display tracking-[0.32em] text-[13px] text-on-surface">QiDS</span>
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">Verified Profile</span>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-[680px]">
          {cred === undefined && (
            <div className="skeleton h-96" aria-label="Loading credential" />
          )}

          {cred === null && (
            <div className="border-[0.5px] border-outline-variant bg-surface-container-lowest p-12 text-center">
              <ShieldQuestion size={28} className="text-muted-foreground mx-auto mb-4" />
              <h1 className="text-headline-md font-headline-md text-on-background mb-3">Credential not found</h1>
              <p className="text-body-md text-muted-foreground mb-8">
                This credential link is invalid, or the owner has removed public access.
              </p>
              <Link to="/" className="btn-primary no-underline">Learn about QIDS</Link>
            </div>
          )}

          {cred && (
            <div className="border-[0.5px] border-outline-variant bg-surface-container-lowest animate-fade">
              {/* Verification strip */}
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-b-[0.5px] border-outline-variant"
                style={{
                  background: verify === 'valid' ? 'var(--status-ok-fill)'
                    : verify === 'invalid' ? 'var(--status-err-panel)' : 'transparent',
                }}>
                <span className="flex items-center gap-2 text-technical-sm font-technical-sm"
                  style={{ color: verify === 'valid' ? 'var(--status-ok)' : verify === 'invalid' ? 'var(--status-err)' : 'var(--muted-foreground)' }}>
                  {verify === 'valid' && <><BadgeCheck size={15} /> Verified — record matches its issuance hash</>}
                  {verify === 'invalid' && <><ShieldAlert size={15} /> Verification failed — record does not match</>}
                  {verify === 'pending' && 'Verifying…'}
                </span>
                <span className="font-technical-sm text-[9px] tracking-[0.14em] uppercase text-muted-foreground hidden sm:block">
                  {cred.id.slice(0, 8)}…
                </span>
              </div>

              <div className="p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8 pb-8 border-b-[0.5px] border-outline-variant">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <ShieldCheck size={16} className="text-primary" />
                    <span className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest">QIDS Verified Profile</span>
                  </div>
                  <h1 className="text-headline-lg font-headline-md text-on-background">{cred.name}</h1>
                  <p className="text-body-md text-surface-variant mt-2">
                    Issued {cred.issuedAt?.toDate?.()
                      ? cred.issuedAt.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </p>
                </div>

                {/* Score */}
                <div className="text-center mb-8 pb-8 border-b-[0.5px] border-outline-variant">
                  <div className="text-[64px] leading-none font-headline-md text-gradient mb-2">{Math.round(unified)}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant mb-3">Unified Score / 100</div>
                  {grade && (
                    <span className="chip text-lg px-4 py-1.5" style={{ background: `${grade.color}20`, color: grade.color, border: `1px solid ${grade.color}40` }}>
                      Grade {grade.grade} — {grade.label}
                    </span>
                  )}
                </div>

                {/* Dimensions */}
                <div className="mb-8 pb-8 border-b-[0.5px] border-outline-variant">
                  <div className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest mb-4">Dimensional Scores</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(cred.pillarScores || {}).map(([pid, score]) => (
                      <div key={pid} className="text-center">
                        <div className="text-headline-md font-headline-md text-on-background">{Math.round(score)}</div>
                        <div className="text-technical-sm font-technical-sm text-surface-variant">{PILLAR_SHORT[pid] || pid}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant">Skill Shape</div>
                    <div className="text-label-md font-label-md text-on-background">{cred.skillShape || '—'}-Shaped Profile</div>
                  </div>
                  <div className="text-right">
                    <div className="text-technical-sm font-technical-sm text-surface-variant">Assessment</div>
                    <div className="text-label-md font-label-md text-on-background">QIDS Intelligence Blueprint</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-technical-sm font-technical-sm text-muted-foreground mt-8 leading-relaxed">
            Credentials are issued by the QIDS Quadrant Intelligence Development System.<br />
            Run your own assessment at qids.app to earn a verifiable profile.
          </p>
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
