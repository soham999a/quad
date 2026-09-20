import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import useModalA11y from '../lib/useModalA11y';

/**
 * CommandPalette — ⌘K / Ctrl+K navigation for the whole shell.
 *
 * A flat, keyboard-first index of the user's persona navigation plus global
 * actions. Styled strictly from existing tokens: hairline panel over a blurred
 * scrim, mono labels, gold active state (mirrors the sidebar's active nav).
 *
 * items: [{ group: string, label: string, hint?: string, icon?: component, run: () => void }]
 */

export default function CommandPalette({ open, onClose, items }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const modalRef = useModalA11y({ open, onClose });

  // Reset on open.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus after paint so the transition doesn't swallow the caret.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      it.label.toLowerCase().includes(q) ||
      (it.keywords || '').toLowerCase().includes(q) ||
      (it.group || '').toLowerCase().includes(q),
    );
  }, [items, query]);

  // Keep the active index valid as the filter changes.
  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);

  // Scroll the active row into view.
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const runItem = (item) => {
    onClose();
    // Let the overlay unmount before the action navigates/reloads.
    requestAnimationFrame(() => item.run?.());
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(i => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[active];
      if (item) runItem(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group the filtered list while preserving order.
  const groups = [];
  for (const item of filtered) {
    const g = item.group || 'Actions';
    let bucket = groups.find(x => x.group === g);
    if (!bucket) { bucket = { group: g, items: [] }; groups.push(bucket); }
    bucket.items.push(item);
  }

  // Flat index of the filtered list for arrow-key selection.
  let flatIndex = -1;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[120] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'color-mix(in oklab, var(--background) 72%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-[560px] border border-border bg-surface-container-lowest animate-fade-up overflow-hidden"
        style={{ boxShadow: '0 24px 80px color-mix(in oklab, var(--background) 60%, transparent)' }}
        onKeyDown={onKeyDown}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-border">
          <Search size={15} strokeWidth={1.5} className="text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search pages and actions…"
            aria-label="Search commands"
            spellCheck="false"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-on-surface placeholder:text-outline font-technical-sm tracking-wide"
          />
          <kbd className="chip !py-0.5 !px-1.5 text-[9px]">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[46vh] overflow-y-auto py-2" role="listbox">
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center">
              <div className="section-index mb-2">NO MATCHES</div>
              <p className="text-technical-sm font-technical-sm text-muted-foreground">
                Nothing matches “{query}”. Try a page name or action.
              </p>
            </div>
          )}

          {groups.map(({ group, items: gItems }) => (
            <div key={group} className="mb-2">
              <div className="label-eyebrow px-5 py-2">{group}</div>
              {gItems.map((item) => {
                flatIndex += 1;
                const isActive = flatIndex === active;
                const Icon = item.icon;
                return (
                  <button
                    key={`${item.group}:${item.label}`}
                    data-active={isActive}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => {
                      // Map hover back to the flat index.
                      const idx = filtered.indexOf(item);
                      if (idx >= 0) setActive(idx);
                    }}
                    onClick={() => runItem(item)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left cursor-pointer border-none border-l-2 transition-colors ${
                      isActive
                        ? 'bg-surface-container-low text-on-surface border-[var(--gold)]'
                        : 'bg-transparent text-muted-foreground border-transparent hover:text-on-surface'
                    }`}
                  >
                    {Icon && <Icon size={15} strokeWidth={1.5} className={`flex-shrink-0 ${isActive ? 'text-gold' : ''}`} />}
                    <span className="flex-1 text-[13px] tracking-wide truncate">{item.label}</span>
                    {item.hint && <span className="font-technical-sm text-[10px] tracking-[0.14em] uppercase text-muted-foreground flex-shrink-0">{item.hint}</span>}
                    {isActive && <CornerDownLeft size={12} strokeWidth={1.5} className="text-gold flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-5 h-9 border-t border-border font-technical-sm text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span className="ml-auto">QiDS</span>
        </div>
      </div>
    </div>
  );
}
