// ─── Assessment shared UI atoms ───────────────────────────────────────────────
// Extracted from Assessment.jsx (P2 decomposition). Pure presentational atoms
// used across the intake/IQ/EQ/SQ/AQ steps. All styling tokens stay inline.

export function SectionHeader({ title, subtitle, color }) {
  return (
    <div className="flex items-center gap-3 p-4 mb-5 border-l-2 border-primary bg-surface-container-low hairline-b hairline-t hairline-r">
      <div>
        <div className="text-label-md font-label-md" style={{ color: color || 'var(--gold)' }}>{title}</div>
        {subtitle && <div className="text-technical-sm font-technical-sm text-surface-variant mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

export function MCQQuestion({ q, index, selected, onSelect, color }) {
  return (
    <div className="mb-4 p-3 md:p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-3 leading-relaxed">
        <span className="text-surface-variant mr-2">Q{index + 1}.</span>{q.q}
      </div>
      <div className="flex flex-col gap-2">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button key={i} onClick={() => onSelect(i)}
              className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-3 text-left text-technical-sm font-technical-sm transition-all cursor-pointer border-[0.5px] touch-target ${isSelected ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary'
                }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-on-primary"></div>}
              </div>
              <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OpenQuestion({ q, index, value, onChange }) {
  return (
    <div className="mb-4 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-3 leading-relaxed">
        <span className="text-surface-variant mr-2">Q{index + 1}.</span>{q.q}
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Write your answer here..."
        rows={3}
        className="w-full p-3 bg-background border-[0.5px] border-outline-variant text-on-surface text-technical-sm font-technical-sm outline-none focus:border-primary resize-y"
      />
    </div>
  );
}

export function LikertQuestion({ q, index, value, onChange, color }) {
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  return (
    <div className="mb-4 p-3 md:p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="text-technical-sm font-technical-sm text-on-surface mb-4 leading-relaxed">
        <span className="text-surface-variant mr-2">{index + 1}.</span>{q}
      </div>
      <div className="flex gap-1.5 md:gap-2 items-stretch">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`flex-1 px-1 md:px-2 py-3 md:py-4 cursor-pointer transition-all border-[0.5px] flex flex-col items-center gap-1 touch-target ${value === n ? 'border-primary bg-primary/15 text-primary' : 'border-outline-variant bg-transparent text-surface-variant hover:border-primary hover:text-primary'
              }`}>
            <span className="text-sm md:text-base font-bold">{n}</span>
            <span className="text-[8px] md:text-[9px] font-normal text-center leading-tight">{labels[n - 1]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function RubricScorer({ criterion, marks, desc, value, onChange, color }) {
  return (
    <div className="mb-3 p-4 bg-surface-container-low border-[0.5px] border-outline-variant">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="text-technical-sm font-technical-sm text-on-surface">{criterion}</div>
          <div className="text-[11px] text-surface-variant leading-relaxed mt-1">{desc}</div>
        </div>
        <div className="text-[11px] text-surface-variant flex-shrink-0 ml-3">Max: {marks}</div>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: marks + 1 }, (_, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={`w-9 h-9 cursor-pointer transition-all border-[0.5px] text-sm font-bold ${value === i ? 'border-primary bg-primary/20 text-primary' : 'border-outline-variant bg-transparent text-surface-variant hover:border-primary hover:text-primary'
              }`}>{i}</button>
        ))}
      </div>
    </div>
  );
}
