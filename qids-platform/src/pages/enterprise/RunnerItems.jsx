import { useTranslation } from 'react-i18next';
import React from 'react';
import { Check, Minus, ArrowDown, ArrowUp } from 'lucide-react';
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const MCQ_COLORS = ['text-emerald-500', 'text-cyan-500', 'text-amber-500', 'text-rose-400'];
function isMcqAnswered(value) {
  return typeof value === 'number' && Number.isFinite(value);
}
function isSjtAnswered(value) {
  return Array.isArray(value) && value.length >= 2 && value.every(v => typeof v === 'number');
}
function isWsAnswered(value, n) {
  return Array.isArray(value) && value.length === n && new Set(value).size === n && value.every(v => typeof v === 'number' && v >= 1 && v <= n);
}
function MCQItem({
  item,
  value,
  onChange,
  disabled
}) {
  return <div className="card overflow-hidden">
      <div className="flex items-start gap-4 p-5 md:p-6">
        <span className="text-technical-sm font-technical-sm text-surface-variant mt-0.5 flex-shrink-0">{item.id}</span>
        <p className="text-body-md text-on-background leading-relaxed flex-1">{item.stem}</p>
      </div>
      <div className="flex flex-col border-t-[0.5px] border-outline-variant" role="radiogroup" aria-label={item.id}>
        {item.options.map((opt, i) => {
        const selected = value === i;
        return <button key={i} disabled={disabled} data-opt={i} aria-pressed={selected} onClick={() => onChange(item.id, i)} className={`flex items-center gap-4 px-5 md:px-6 py-4 text-left border-b-[0.5px] border-outline-variant last:border-b-0 transition-colors cursor-pointer bg-transparent touch-target ${selected ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center border flex-shrink-0 text-technical-sm font-technical-sm transition-all duration-150 ${selected ? 'border-primary bg-primary text-on-primary scale-105' : 'border-outline-variant text-surface-variant'}`}>
                {LETTERS[i]}
              </span>
              <span className="text-body-md text-on-surface-variant flex-1">{opt}</span>
              {selected && <Check size={16} className="text-primary flex-shrink-0" />}
            </button>;
      })}
      </div>
    </div>;
}
function SjtItem({
  item,
  value,
  onChange,
  disabled
}) {
  const {
    t
  } = useTranslation();
  const [most, least] = Array.isArray(value) ? [value[0], value[1]] : [undefined, undefined];
  const setMost = i => onChange(item.id, [i, least]);
  const setLeast = i => onChange(item.id, [most, i]);
  return <div className="card overflow-hidden">
      <div className="flex items-start gap-4 p-5 md:p-6">
        <span className="text-technical-sm font-technical-sm text-surface-variant mt-0.5 flex-shrink-0">{item.id}</span>
        <div className="flex-1">
          <p className="text-body-md text-on-background leading-relaxed">{item.stem}</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-technical-sm font-technical-sm text-surface-variant">{t("RunnerItems.mark_your_most_effective")}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col border-t-[0.5px] border-outline-variant">
        <div className="hidden md:flex items-center px-6 py-2 border-b-[0.5px] border-outline-variant">
          <span className="flex-1" />
          <span className="w-16 text-center text-technical-sm font-technical-sm text-surface-variant">{t("RunnerItems.most")}</span>
          <span className="w-16 text-center text-technical-sm font-technical-sm text-surface-variant">{t("RunnerItems.least")}</span>
        </div>
        {item.options.map((opt, i) => {
        
        const isMost = most === i;
        const isLeast = least === i;
        return <div key={i} className={`flex items-center gap-4 px-5 md:px-6 py-4 border-b-[0.5px] border-outline-variant last:border-b-0 ${isMost || isLeast ? 'bg-primary/5' : ''}`}>
              <span className={`w-7 h-7 hidden md:flex items-center justify-center border-[0.5px] rounded-full flex-shrink-0 text-technical-sm font-technical-sm ${isMost || isLeast ? 'border-primary text-primary' : 'border-outline-variant text-surface-variant'}`}>
                {LETTERS[i]}
              </span>
              <span className="text-body-md text-on-surface-variant flex-1">{opt}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button disabled={disabled} onClick={() => setMost(i)} aria-pressed={isMost} title={t("RunnerItems.most_effective")} aria-label={`Mark option ${LETTERS[i]} as most effective`} data-opt-most={i} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md text-technical-sm font-technical-sm border-[0.5px] cursor-pointer touch-target transition-colors ${isMost ? 'bg-emerald-500 text-white border-emerald-500' : 'border-outline-variant text-surface-variant hover:text-emerald-500 hover:border-emerald-500 bg-transparent'}`}>
                  <ArrowUp size={12} />
                  <span className="md:hidden">{t("RunnerItems.most_2")}</span>
                </button>
                <button disabled={disabled} onClick={() => setLeast(i)} aria-pressed={isLeast} title={t("RunnerItems.least_effective")} aria-label={`Mark option ${LETTERS[i]} as least effective`} data-opt-least={i} className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md text-technical-sm font-technical-sm border-[0.5px] cursor-pointer touch-target transition-colors ${isLeast ? 'bg-rose-500 text-white border-rose-500' : 'border-outline-variant text-surface-variant hover:text-rose-500 hover:border-rose-500 bg-transparent'}`}>
                  <ArrowDown size={12} />
                  <span className="md:hidden">{t("RunnerItems.least_2")}</span>
                </button>
              </div>
            </div>;
      })}
      </div>
    </div>;
}
function WsItem({
  item,
  value,
  onChange,
  disabled
}) {
  const {
    t
  } = useTranslation();
  const ranks = Array.isArray(value) ? value : [];
  const setRank = (optIdx, rank) => {
    const next = item.options.map((_, i) => i === optIdx ? rank : ranks[i] === rank ? undefined : ranks[i]);
    onChange(item.id, next);
  };
  return <div className="card overflow-hidden">
      <div className="flex items-start gap-4 p-5 md:p-6">
        <span className="text-technical-sm font-technical-sm text-surface-variant mt-0.5 flex-shrink-0">{item.id}</span>
        <div className="flex-1">
          <p className="text-body-md text-on-background leading-relaxed">{item.stem}</p>
          <div className="mt-3 text-technical-sm font-technical-sm text-surface-variant">{t("RunnerItems.rank_each_statement_4")}</div>
        </div>
      </div>
      <div className="flex flex-col border-t-[0.5px] border-outline-variant">
        <div className="hidden md:flex items-center px-6 py-2 border-b-[0.5px] border-outline-variant">
          <span className="flex-1" />
          {[4, 3, 2, 1].map(r => <span key={r} className="w-12 text-center text-technical-sm font-technical-sm text-surface-variant">{r === 4 ? 'MOST' : r === 1 ? 'LEAST' : r}</span>)}
        </div>
        {item.options.map((opt, i) => <div key={i} className="flex items-center gap-4 px-5 md:px-6 py-4 border-b-[0.5px] border-outline-variant last:border-b-0">
            <span className="text-body-md text-on-surface-variant flex-1">{opt}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {[4, 3, 2, 1].map(r => {
            const selected = ranks[i] === r;
            return <button key={r} disabled={disabled} onClick={() => setRank(i, r)} title={`Rank ${r}`} aria-pressed={selected} aria-label={`Rank option ${LETTERS[i]} as ${r}`} data-rank-opt={i} data-rank={r} className={`w-10 h-10 rounded-md flex items-center justify-center text-technical-sm font-technical-sm border-[0.5px] cursor-pointer touch-target transition-colors ${selected ? 'bg-primary text-on-primary-container border-primary scale-105' : 'border-outline-variant text-surface-variant hover:border-primary hover:text-primary bg-transparent'}`}>
                    {r}
                  </button>;
          })}
            </div>
          </div>)}
      </div>
    </div>;
}
export default function RunnerItems({
  module,
  items,
  answers,
  onChange,
  disabled
}) {
  const { t } = useTranslation();
  return <div className="flex flex-col gap-6 md:gap-8">
      {items.map((item, idx) => {
      
      const value = answers[item.id];
      const isAnswered = module.scoring === 'best_worst' ? isSjtAnswered(value) : module.scoring === 'ipsative' ? isWsAnswered(value, item.options.length) : isMcqAnswered(value);
      return <div key={item.id} data-item={item.id}>
            <div className="flex items-center gap-2.5 mb-2.5 px-1">
              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-technical-sm font-technical-sm flex items-center justify-center flex-shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="chip flex-shrink-0">{module.label}</span>
              <span className="text-technical-sm font-technical-sm text-outline truncate">{item.competency || module.label}</span>
              {isAnswered && <span className="text-technical-sm font-technical-sm text-emerald-500 ml-auto flex items-center gap-1 flex-shrink-0">
                  <Check size={11} />{t("RunnerItems.answered")}</span>}
            </div>
            {module.scoring === 'best_worst' ? <SjtItem item={item} value={value} onChange={onChange} disabled={disabled} /> : module.scoring === 'ipsative' ? <WsItem item={item} value={value} onChange={onChange} disabled={disabled} /> : <MCQItem item={item} value={value} onChange={onChange} disabled={disabled} />}
          </div>;
    })}
    </div>;
}