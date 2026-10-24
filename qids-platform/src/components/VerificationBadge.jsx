import { useTranslation } from 'react-i18next';
import { BadgeCheck, ShieldAlert, ShieldQuestion, ShieldOff } from 'lucide-react';

// ─── Credential verification badge ───────────────────────────────────────────
// Says what is actually true about a score, in this order of strength:
//
//   verified    the server derived it from the answers, and its numbers match
//               the ones on screen
//   mismatch    a server record exists but disagrees with what is displayed —
//               this is the tamper signal, and it must never be quiet
//   unattested  the server scored it but from submitted totals, not answers
//   absent      the server has no record at all
//   unavailable the lookup failed (offline / no API in this deployment)
//
// The provenance line is the second half of the claim: even a fully attested
// score is part self-report and part assessor rubric, and saying so is the
// difference between a credential and a decoration.

const STATE_STYLE = {
  verified: { color: 'var(--status-ok)', background: 'var(--status-ok-fill)', Icon: BadgeCheck },
  mismatch: { color: 'var(--status-err)', background: 'var(--status-err-panel)', Icon: ShieldAlert },
  unattested: { color: 'var(--status-warn)', background: 'var(--status-warn-fill)', Icon: ShieldQuestion },
  absent: { color: 'var(--muted-foreground)', background: 'transparent', Icon: ShieldOff },
  unavailable: { color: 'var(--muted-foreground)', background: 'transparent', Icon: ShieldQuestion },
};

const STATE_KEY = {
  verified: 'verified_server_scored',
  mismatch: 'verification_mismatch',
  unattested: 'not_derived_from_answers',
  absent: 'no_server_record',
  unavailable: 'verification_unavailable',
};

const STATE_DETAIL_KEY = {
  verified: 'verified_detail',
  mismatch: 'mismatch_detail',
  unattested: 'unattested_detail',
  absent: 'absent_detail',
  unavailable: 'unavailable_detail',
};

/**
 * @param {{
 *   state: 'verified' | 'mismatch' | 'unattested' | 'absent' | 'unavailable',
 *   verification?: object,
 *   compact?: boolean,
 * }} props
 */
export default function VerificationBadge({ state, verification, compact = false }) {
  const { t } = useTranslation();
  const style = STATE_STYLE[state] || STATE_STYLE.unavailable;
  const { Icon } = style;
  const shares = verification?.shares;

  return (
    <div
      className="border-[0.5px] border-outline-variant"
      style={{ background: style.background }}
      role={state === 'mismatch' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon size={16} style={{ color: style.color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-technical-sm font-technical-sm uppercase tracking-widest" style={{ color: style.color }}>
            {t(`Verification.${STATE_KEY[state]}`)}
          </div>
          {!compact && (
            <div className="text-technical-sm font-technical-sm text-surface-variant mt-1 leading-relaxed">
              {t(`Verification.${STATE_DETAIL_KEY[state]}`)}
            </div>
          )}
          {state === 'verified' && shares && (
            <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">
              {t('Verification.provenance', {
                machine: Math.round(shares.machine),
                self: Math.round(shares.selfReport),
                assessor: Math.round(shares.assessor),
              })}
            </div>
          )}
        </div>
        {verification?.scoredAt && (
          <span className="ml-auto hidden sm:block text-technical-sm font-technical-sm text-surface-variant whitespace-nowrap">
            {new Date(verification.scoredAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
