import { useTranslation } from 'react-i18next';
// ─── Intake & Consent step ────────────────────────────────────────────────────
// Extracted from Assessment.jsx (P2 decomposition).

export default function IntakeStep({
  data,
  onChange,
  evaluators,
  currentEv,
  onAssign,
  onRemove,
  loadingEv
}) {
  const {
    t
  } = useTranslation();
  const inputClass = "w-full h-12 px-4 bg-background border-[0.5px] border-outline-variant text-on-surface placeholder:text-surface-variant font-technical-sm outline-none focus:border-primary";
  const labelClass = "text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest";
  return <div>
      <div className="text-technical-sm font-technical-sm text-primary mb-6">{t("IntakeStep.i_intake_consent")}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[{
        key: 'name',
        label: 'Full Name',
        placeholder: 'Enter full name'
      }, {
        key: 'age',
        label: 'Age',
        placeholder: 'Enter age',
        type: 'number'
      }, {
        key: 'institution',
        label: 'Institution / Organization',
        placeholder: 'Enter institution name'
      }].map(({
        key,
        label,
        placeholder,
        type
      }) => <div key={key} className="flex flex-col gap-2">
            <span className={labelClass}>{label}</span>
            <input className={inputClass} type={type || 'text'} placeholder={placeholder} value={data[key] || ''} onChange={e => onChange(key, e.target.value)} />
          </div>)}
        <div className="flex flex-col gap-2">
          <span className={labelClass}>{t("IntakeStep.evaluator")}</span>
          {currentEv ? <div className="flex items-center gap-2 px-4 py-3 border-[0.5px] border-primary/50 bg-primary/5 h-12 text-technical-sm font-technical-sm text-primary">
              <span className="flex-1">{currentEv.name || currentEv.email || 'Assigned Evaluator'}</span>
              <button onClick={onRemove} disabled={loadingEv} className="px-3 py-1 border-[0.5px] border-error/50 text-error text-technical-sm font-technical-sm hover:bg-error/10 cursor-pointer bg-transparent">{t("IntakeStep.remove")}</button>
            </div> : <select className={inputClass} value="" onChange={e => onAssign(e.target.value)} disabled={loadingEv}>
              <option value="">{loadingEv ? 'Loading...' : evaluators.length === 0 ? 'No evaluators available' : 'Select an evaluator...'}</option>
              {evaluators.map(ev => <option key={ev.uid} value={ev.uid}>{ev.name || ev.email}</option>)}
            </select>}
        </div>
      </div>

      <div className="mb-6">
        <span className={`${labelClass} block mb-2`}>{t("IntakeStep.age_group")}</span>
        <div className="flex gap-3">
          {[{
          id: '11-18',
          label: '11–18 Years',
          desc: 'School / Youth'
        }, {
          id: '19-32',
          label: '19–32 Years',
          desc: 'College / Professional'
        }].map(ag => <button key={ag.id} type="button" onClick={() => onChange('ageGroup', ag.id)} className={`flex-1 py-4 px-4 border-[0.5px] text-left cursor-pointer transition-all bg-transparent ${data.ageGroup === ag.id ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>
              <div className="text-label-md font-label-md">{ag.label}</div>
              <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{ag.desc}</div>
            </button>)}
        </div>
      </div>

      <div className="mb-6">
        <span className={`${labelClass} block mb-2`}>{t("IntakeStep.assessment_purpose")}</span>
        <textarea rows={3} placeholder={t("IntakeStep.describe_the_purpose_of")} value={data.purpose || ''} onChange={e => onChange('purpose', e.target.value)} className="w-full p-4 bg-background border-[0.5px] border-outline-variant text-on-surface placeholder:text-surface-variant font-technical-sm outline-none focus:border-primary resize-y" />
      </div>

      <div className="p-4 border-[0.5px] border-primary/30 bg-primary/5 flex items-start gap-4">
        <input type="checkbox" id="consent" checked={data.consent || false} onChange={e => onChange('consent', e.target.checked)} className="w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer accent-primary" />
        <label htmlFor="consent" className="text-technical-sm font-technical-sm text-on-surface-variant leading-relaxed cursor-pointer">{t("IntakeStep.i_confirm_that_the")}</label>
      </div>
    </div>;
}