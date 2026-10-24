import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PublicShell } from '../components/PublicShell';
import usePageTitle from '../lib/usePageTitle';
import { GRADE_BANDS, WEIGHTS, IQ_MAX_SCORE, MAX_WEIGHT_SUM } from '../data/qidsData';

// ─── How a score is produced ─────────────────────────────────────────────────
// The measurement case, in public. A credential asserts something about a
// person, so the arithmetic behind it, the meaning of its bands, and the limits
// of its evidence all have to be inspectable. Every number below is the one the
// code runs — if this page and shared/scoring/qids.js ever disagree, the code is
// wrong, and tests/scoring-parity.mjs is what keeps them together.
//
// Written for a reader who is deciding whether to trust the credential: a
// school, an employer, or the person who took the assessment.

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-16 scroll-mt-28">
      <h2 className="text-headline-md font-headline-md text-on-background mb-5">{title}</h2>
      <div className="text-body-md text-on-surface-variant leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto border-[0.5px] border-outline-variant">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-container-low">
            {head.map(h => (
              <th key={h} className="px-4 py-3 text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest border-b-[0.5px] border-outline-variant">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-technical-sm font-technical-sm border-b-[0.5px] border-outline-variant last:border-b-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Methodology() {
  const { t } = useTranslation();
  usePageTitle('Methodology');

  const formula = {
    iq: `min(verbal + quantitative + psychometric + performance + AI bonus + visual bonus, ${IQ_MAX_SCORE})`,
    eq: 'round((Σ components) / 50 × 100), component = min(round(likertTotal / 25 × 5) + rubric, 10)',
    sq: 'round((ACE + CSI + PBA) / 50 × 100)',
    aq: `round(Σ (component × weight) / 95 × 100), weights ${Object.entries({ SA: 1.5, PM: 1.0, RR: 1.0, RC: 1.5 }).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    unified: `round((IQ/${IQ_MAX_SCORE} × 100 × ${WEIGHTS.IQ.toFixed(2)} + EQ × ${WEIGHTS.EQ.toFixed(2)} + SQ × ${WEIGHTS.SQ.toFixed(2)} + AQ × ${WEIGHTS.AQ.toFixed(2)}) / ${MAX_WEIGHT_SUM.toFixed(2)})`,
  };

  return (
    <PublicShell>
      <main className="mx-auto max-w-[880px] px-6 lg:px-12 py-16 md:py-24">
        <div className="mb-14">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-gold mb-4">
            {t('Methodology.kicker', 'Measurement')}
          </div>
          <h1 className="text-headline-lg font-headline-md text-on-background mb-5">
            {t('Methodology.title', 'How a QIDS score is produced')}
          </h1>
          <p className="text-body-md text-on-surface-variant leading-relaxed max-w-[62ch] md:text-[17px]">
            {t('Methodology.lead', 'A score is only useful if you can see where it came from. This page states the instrument, the arithmetic, and the limits — the three things a reader needs in order to judge a number.')}
          </p>
        </div>

        <Section id="instrument" title={t('Methodology.instrument_title', 'What the instrument contains')}>
          <p>
            {t('Methodology.instrument_body', 'Four pillars, each scored from its own components. Two age-group variants exist (11–18 and 19–32): the questions differ in wording, the scoring rules do not.')}
          </p>
          <Table
            head={[t('Methodology.col_pillar', 'Pillar'), t('Methodology.col_components', 'Components'), t('Methodology.col_max', 'Maximum')]}
            rows={[
              ['IQ — Cognitive', 'Verbal, Quantitative, Psychometric, Performance', '100 static + 16 AI-generated + 9 visual = 125'],
              ['EQ — Emotional', 'Self-Awareness, Regulation, Motivation, Empathy, Interpersonal', '5 × 10 = 50'],
              ['SQ — Social', 'Assessment Centre Exercise (20), Cognitive Social Intelligence (10), Performance-Based Activities (20)', '50'],
              ['AQ — Adversity', 'Situational Agility, Problem Management, Risk Readiness, Recovery Capacity', '19 each, weighted to a /95 scale'],
            ]}
          />
          <p>
            {t('Methodology.items_note', 'Open-ended items without a published key are scored for a genuine attempt rather than for correctness — that is the instrument\'s design, and it means part of the IQ score measures engagement, not knowledge.')}
          </p>
        </Section>

        <Section id="arithmetic" title={t('Methodology.arithmetic_title', 'The arithmetic')}>
          <p>
            {t('Methodology.arithmetic_body', 'Every section total is derived from the answers themselves by one shared module, server-side. The browser shows the same numbers because it runs the same code — not because it is trusted.')}
          </p>
          <Table
            head={[t('Methodology.col_value', 'Value'), t('Methodology.col_rule', 'Rule')]}
            rows={[
              [t('Methodology.iq', 'IQ pillar'), <code key="iq" className="font-mono text-[12px]">{formula.iq}</code>],
              [t('Methodology.eq', 'EQ pillar'), <code key="eq" className="font-mono text-[12px]">{formula.eq}</code>],
              [t('Methodology.sq', 'SQ pillar'), <code key="sq" className="font-mono text-[12px]">{formula.sq}</code>],
              [t('Methodology.aq', 'AQ pillar'), <code key="aq" className="font-mono text-[12px]">{formula.aq}</code>],
              [t('Methodology.unified', 'Unified score'), <code key="u" className="font-mono text-[12px]">{formula.unified}</code>],
            ]}
          />
          <p>
            {t('Methodology.weights_note', 'The pillar weights are a product decision about what the benchmark should emphasise, not an empirical finding about how the traits relate. They are stated here so that decision stays visible.')}
          </p>
        </Section>

        <Section id="bands" title={t('Methodology.bands_title', 'What the bands mean')}>
          <Table
            head={[t('Methodology.col_band', 'Band'), t('Methodology.col_range', 'Unified score'), t('Methodology.col_meaning', 'Reading')]}
            rows={GRADE_BANDS.map(b => [
              `${b.grade} — ${b.label}`,
              `${b.min}–${b.max}`,
              {
                A: t('Methodology.band_a', 'Consistently strong across all four pillars at this level of task difficulty.'),
                B: t('Methodology.band_b', 'Strong overall, with one pillar noticeably behind the others.'),
                C: t('Methodology.band_c', 'Adequate; the profile is unbalanced enough to be worth reading pillar by pillar.'),
                D: t('Methodology.band_d', 'Below the design target on several pillars; the intervention plan matters more than the number.'),
                E: t('Methodology.band_e', 'Well below the design target. Treat this as a starting point, not a verdict.'),
              }[b.grade],
            ])}
          />
          <p>
            {t('Methodology.bands_caveat', 'These bands are criterion-referenced against the instrument\'s design target. They are not percentiles, and no population norm group is published for this instrument — which means “Grade B” says something about the task set, not about where someone stands among their peers.')}
          </p>
        </Section>

        <Section id="provenance" title={t('Methodology.provenance_title', 'What kind of evidence each mark is')}>
          <p>
            {t('Methodology.provenance_body', 'Not all marks are equally checkable, so every score carries its composition. The credential shows these shares rather than implying the whole result was machine-verified.')}
          </p>
          <Table
            head={[t('Methodology.col_kind', 'Kind'), t('Methodology.col_what', 'What it is')]}
            rows={[
              [t('Methodology.kind_machine', 'Auto-checked'), t('Methodology.kind_machine_body', 'Matched against the instrument key by the scoring service.')],
              [t('Methodology.kind_self', 'Self-report'), t('Methodology.kind_self_body', 'The person\'s own rating on a five-point scale. Checkable, not verifiable — it records self-perception.')],
              [t('Methodology.kind_assessor', 'Assessor-scored'), t('Methodology.kind_assessor_body', 'A human rubric score. Reliable only as far as the rater is trained and consistent.')],
              [t('Methodology.kind_agent', 'Client-graded bonus'), t('Methodology.kind_agent_body', 'AI-generated questions whose key exists only in the session. Capped, and reported separately.')],
            ]}
          />
        </Section>

        <Section id="limits" title={t('Methodology.limits_title', 'What this score does not mean')}>
          <ul className="list-disc pl-5 space-y-2">
            <li>{t('Methodology.limit_1', 'It is not an IQ test. The cognitive pillar is a broad reasoning screen, not a standardised intelligence quotient, and it is not interchangeable with one.')}</li>
            <li>{t('Methodology.limit_2', 'It is not clinically validated. QIDS is a development framework, not a diagnostic instrument, and no score here supports a clinical conclusion.')}</li>
            <li>{t('Methodology.limit_3', 'It carries no population percentile. Without a published norm group, a grade cannot be read as “better than X% of people”.')}</li>
            <li>{t('Methodology.limit_4', 'Self-report measures self-perception. A high emotional pillar means the person rates themselves highly on those behaviours, which is not the same as observers rating them highly.')}</li>
            <li>{t('Methodology.limit_5', 'Assessor marks depend on the assessor. Rubric scores are only as consistent as rater training makes them.')}</li>
            <li>{t('Methodology.limit_6', 'A single administration is a snapshot. One bad session — illness, distraction, an unfamiliar device — moves the result.')}</li>
          </ul>
        </Section>

        <Section id="reliability" title={t('Methodology.reliability_title', 'Reliability, and why no coefficient is quoted here')}>
          <p>
            {t('Methodology.reliability_body_1', 'Internal consistency is estimated with Cronbach\'s alpha per pillar, computed from the stored item-level answers. The scoring service keeps those answers precisely so this can be estimated on real responses rather than asserted.')}
          </p>
          <p>
            {t('Methodology.reliability_body_2', 'No alpha is printed on this page because none has been published on a sample large enough to be meaningful. A coefficient invented for a marketing page would be worse than an absent one. When a sample exists, the estimate is produced by the same repository and printed here with its n.')}
          </p>
          <p className="text-technical-sm font-technical-sm text-surface-variant">
            {t('Methodology.reliability_how', 'Method: α = (k / (k − 1)) × (1 − Σσ²ᵢ / σ²ₜ), over the items of each pillar, listwise on complete responses.')}
          </p>
        </Section>

        <Section id="stored" title={t('Methodology.stored_title', 'What is stored, and who can see it')}>
          <p>
            {t('Methodology.stored_body', 'A submission stores the answer sheet, the derived scores, the engine version and a hash of the input, in a collection the client cannot write to. A public credential exposes only the display name, the grade, the four pillar scores and the skill shape — never the answers.')}
          </p>
          <p>
            {t('Methodology.stored_body_2', 'Differences between the displayed record and the server record are recorded as a mismatch, not smoothed over: if the two disagree, the credential says so and shows both numbers.')}
          </p>
        </Section>

        <div className="border-t-[0.5px] border-outline-variant pt-8 flex flex-wrap gap-4">
          <Link to="/" className="btn-outline no-underline">{t('Methodology.back_home', 'Back to QIDS')}</Link>
          <Link to="/app/assessment" className="btn-primary no-underline">{t('Methodology.take_assessment', 'Take the assessment')}</Link>
        </div>
      </main>
    </PublicShell>
  );
}
