import React, { useState } from 'react';

export default function DiagramQuestion({ question, index, selected, onSelect, color = '#6366f1' }) {
  return (
    <div style={{ marginBottom: 20, background: 'var(--navy-4)', border: `1px solid ${color}30`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', background: `${color}10`, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ padding: '2px 8px', borderRadius: 6, background: `${color}20`, border: `1px solid ${color}40`, fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Visual / Diagram
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{question.subParam}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>Q{index + 1}</span>
      </div>

      {/* Diagram */}
      <div style={{
        padding: '20px 24px', background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: 120,
      }}
        dangerouslySetInnerHTML={{ __html: question.diagram }}
      />

      {/* Question */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, marginBottom: 14, color: 'var(--text-primary)' }}>
          {question.q}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            return (
              <button key={i} onClick={() => onSelect(i)} style={{
                padding: '10px 14px', borderRadius: 9, textAlign: 'left', cursor: 'pointer',
                fontSize: 13, border: `1px solid ${isSelected ? color : 'var(--border-light)'}`,
                background: isSelected ? `${color}18` : 'rgba(255,255,255,0.02)',
                color: isSelected ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? color : 'var(--border-light)'}`,
                  background: isSelected ? color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: isSelected ? 'white' : 'var(--text-muted)',
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
