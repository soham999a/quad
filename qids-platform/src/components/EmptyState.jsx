import React from 'react';

/**
 * EmptyState — one quiet, editorial placeholder for "nothing here yet".
 * Used wherever a page renders an empty collection, so absence always
 * looks intentional (and always offers the next action).
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-16'} animate-fade`}>
      {Icon && (
        <div className="w-11 h-11 rounded-full bg-surface-container-high text-muted-foreground flex items-center justify-center mx-auto mb-5">
          <Icon size={17} strokeWidth={1.5} />
        </div>
      )}
      <div className="text-label-md font-label-md text-on-surface mb-2">{title}</div>
      {description && (
        <p className="text-body-md text-muted-foreground leading-relaxed max-w-sm mx-auto mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-outline !py-2.5 !text-[13px]">{actionLabel}</button>
      )}
    </div>
  );
}
