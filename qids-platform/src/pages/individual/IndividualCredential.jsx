import { useTranslation } from 'react-i18next';
import usePageTitle from '../../lib/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { logEvent } from '../../lib/analytics';
import { RadarSvg } from '../../components/charts';
import { ArrowLeft, Printer, Download, Shield } from 'lucide-react';
import { getAssessment, publishCredential } from '../../services/firestoreService';
import { fetchVerification, verificationState } from '../../services/verificationService';
import VerificationBadge from '../../components/VerificationBadge';
import { ErrorState } from '../../components/EmptyState';
import { reportError } from '../../lib/errorReport';
import { Share2, Check } from 'lucide-react';
import { computeQidsPillarScores, getGrade, computeWeightedScore, getSkillShape } from '../../core/engine/qids';
const PILLAR_SHORT = {
  IQ: 'IQ',
  EQ: 'EQ',
  SQ: 'SQ',
  AQ: 'AQ'
};
function MiniRadar({
  pillarScores
}) {
  const data = Object.entries(pillarScores).map(([k, v]) => ({
    subject: PILLAR_SHORT[k] || k,
    A: v
  }));
  return <RadarSvg data={data} max={100} height={220} color="var(--gold)" gridColor="var(--gold-grid)" />;
}
export default function IndividualCredential() {
  const {
    t
  } = useTranslation();
  usePageTitle('My credential');
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const toast = useToast();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [publishState, setPublishState] = useState('idle');
  const [verification, setVerification] = useState(null);
  const load = React.useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    getAssessment(id).then(setAssessment).catch(e => {
      // A failed load is not "no such credential" — say so and offer a retry.
      setLoadError(e);
      reportError(e, { kind: 'credential-load' });
    }).finally(() => setLoading(false));
  }, [id]);
  useEffect(load, [load]);

  // The server's own record, fetched separately: the stored document says what
  // the holder claims, this says what the server computed.
  useEffect(() => {
    let cancelled = false;
    if (!id) return undefined;
    fetchVerification(id, user).then(result => {
      if (!cancelled) setVerification(result);
    });
    return () => { cancelled = true; };
  }, [id, user]);
  if (loading) {
    return <div className="page-pad max-w-[640px] mx-auto animate-fade pb-24 md:pb-16">
        <div className="skeleton h-96" />
      </div>;
  }
  if (loadError) {
    return <div className="page-pad max-w-[640px] mx-auto animate-fade pb-24 md:pb-16">
        <ErrorState
          title={t('IndividualCredential.could_not_load')}
          description={t('IndividualCredential.load_failed_detail')}
          onRetry={load}
        />
      </div>;
  }
  if (!assessment) {
    return <div className="page-pad max-w-[640px] mx-auto animate-fade pb-24 md:pb-16 text-center py-20">
        <div className="text-body-md text-surface-variant mb-4">{t("IndividualCredential.assessment_not_found")}</div>
        <button onClick={() => navigate('/app/dashboard')} className="btn-primary glow">{t("IndividualCredential.back_to_dashboard")}</button>
      </div>;
  }
  // What the stored document says, and what the server computed. When they
  // disagree the badge says so and both numbers are shown; a credential that
  // silently picked one would defeat the point of verifying it.
  const storedPillars = assessment.pillarScores || computeQidsPillarScores(assessment.rawScores || {});
  const storedUnified = assessment.result?.unifiedScore ?? computeWeightedScore(storedPillars) ?? 0;
  const serverRecord = verification?.status === 'found' ? verification.verification : null;
  const badgeState = verificationState(verification, storedUnified, storedPillars);
  const useServerNumbers = Boolean(serverRecord?.attested);
  const pillarScores = useServerNumbers && serverRecord.pillarScores ? serverRecord.pillarScores : storedPillars;
  const unified = useServerNumbers && typeof serverRecord.unifiedScore === 'number' ? serverRecord.unifiedScore : storedUnified;
  const grade = getGrade(unified);
  const skillShape = (useServerNumbers && serverRecord.skillShape) || getSkillShape(pillarScores);
  const name = assessment.intake?.name || 'Candidate';
  const date = assessment.createdAt?.toDate ? assessment.createdAt.toDate().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  return <div className="page-pad max-w-[640px] mx-auto animate-fade pb-24 md:pb-16 print:p-0 print:max-w-none">
      <section className="mb-6 fade-up no-print">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-technical-sm font-technical-sm text-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
          <ArrowLeft size={14} />{t("IndividualCredential.back")}</button>
      </section>

      <div className="bg-surface-container-lowest border-[0.5px] border-outline-variant p-8 md:p-12 print:p-12 print:border-none print:bg-white" id="credential">
        {/* What this score actually is */}
        <div className="mb-8">
          <VerificationBadge state={badgeState} verification={serverRecord} />
          {badgeState === 'mismatch' && serverRecord && (
            <div className="mt-2 px-4 py-3 border-[0.5px] border-error/40 bg-error-container/40">
              <div className="text-technical-sm font-technical-sm text-error">
                {t('Verification.stored_vs_server', {
                  stored: Math.round(storedUnified),
                  server: Math.round(serverRecord.unifiedScore),
                })}
              </div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">
                {t('Verification.fields_disagree', { count: serverRecord.mismatchCount || 0 })}
              </div>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b-[0.5px] border-outline-variant">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield size={16} className="text-primary" />
            <span className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest">{t("IndividualCredential.qids_verified_profile")}</span>
          </div>
          <h1 className="text-headline-lg font-headline-md text-on-background">{name}</h1>
          <p className="text-body-md text-surface-variant mt-2">{date}</p>
        </div>

        {/* Score + Shape */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-8 pb-8 border-b-[0.5px] border-outline-variant">
          <div className="text-center">
            <div className="text-[64px] leading-none font-headline-md text-gradient mb-2">{Math.round(unified)}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant mb-3">{t("IndividualCredential.unified_score_100")}</div>
            {grade && <span className="chip text-lg px-4 py-1.5" style={{
            background: `${grade.color}20`,
            color: grade.color,
            border: `1px solid ${grade.color}40`
          }}>
                Grade {grade.grade} — {grade.label}
              </span>}
          </div>
          <MiniRadar pillarScores={pillarScores} />
        </div>

        {/* Dimensions */}
        <div className="mb-8 pb-8 border-b-[0.5px] border-outline-variant">
          <div className="text-technical-sm font-technical-sm text-primary uppercase tracking-widest mb-4">{t("IndividualCredential.dimensional_scores")}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(pillarScores).map(([id, score]) => <div key={id} className="text-center">
                <div className="text-headline-md font-headline-md text-on-background">{Math.round(score)}</div>
                <div className="text-technical-sm font-technical-sm text-surface-variant">{PILLAR_SHORT[id]}</div>
              </div>)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-technical-sm font-technical-sm text-surface-variant">{t("IndividualCredential.skill_shape")}</div>
            <div className="text-label-md font-label-md text-on-background">{skillShape}-Shaped Profile</div>
          </div>
          <div className="text-right">
            <div className="text-technical-sm font-technical-sm text-surface-variant">{t("IndividualCredential.assessment")}</div>
            <div className="text-label-md font-label-md text-on-background">{t("IndividualCredential.qids_intelligence_blueprint")}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 no-print flex flex-col sm:flex-row gap-4">
        <button onClick={() => window.print()} className="btn-primary glow flex-1">
          <Printer size={14} />{t("IndividualCredential.print_save_pdf")}</button>
        <button onClick={async () => {
        setPublishState('publishing');
        try {
          const {
            hash
          } = await publishCredential(user.uid, assessment);
          const url = `${window.location.origin}/credential/${assessment.id}`;
          await navigator.clipboard?.writeText(url).catch(() => {});
          logEvent(user.uid, 'credential_published', {
            assessmentId: assessment.id
          });
          setPublishState('done');
          toast('Public link copied — anyone can verify this credential.', 'success');
          console.info('credential hash', hash);
        } catch (e) {
          console.warn('publish failed', e);
          setPublishState('idle');
          toast('Could not publish the public credential.', 'error');
        }
      }} disabled={publishState !== 'idle'} className="btn-outline flex-1">
          {publishState === 'idle' && <><Share2 size={14} />{t("IndividualCredential.publish_public_link")}</>}
          {publishState === 'publishing' && 'Publishing…'}
          {publishState === 'done' && <><Check size={14} />{t("IndividualCredential.link_copied")}</>}
        </button>
        {publishState === 'done' && assessment?.id && <button onClick={async () => {
        const url = `${window.location.origin}/credential/${assessment.id}`;
        const share = {
          title: 'My verified QIDS credential',
          text: 'Verify my QIDS intelligence profile.',
          url
        };
        try {
          if (navigator.share) {
            await navigator.share(share);
            return;
          }
          throw new Error('no-web-share');
        } catch (e) {
          if (e?.name === 'AbortError') return; // user closed the sheet
          await navigator.clipboard?.writeText(url).catch(() => {});
          toast('Link copied — paste it anywhere.', 'success');
        }
      }} className="btn-outline flex-1">
            <Share2 size={14} />{t("IndividualCredential.share_link")}</button>}
        <button onClick={() => navigate(-1)} className="btn-outline flex-1">{t("IndividualCredential.back_2")}</button>
      </div>
    </div>;
}