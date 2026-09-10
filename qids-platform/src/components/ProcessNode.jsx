import React, { useState } from 'react';
import { ChevronRight, X, User, Package, Target } from 'lucide-react';

const alpha = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function ProcessNode({ node, color = 'var(--phase-pre)', index, isLast, onClick, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <div
        onClick={() => onClick && onClick(node)}
        style={{
          background: active ? alpha(color, 20) : 'var(--navy-4)',
          border: `1px solid ${active ? color : 'rgba(10,10,10,0.08)'}`,
          borderRadius: 10,
          padding: '10px 14px',
          cursor: 'pointer',
          minWidth: 140,
          maxWidth: 160,
          transition: 'all 0.2s',
          boxShadow: active ? `0 0 12px ${alpha(color, 40)}` : 'none',
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, marginBottom: 6,
          boxShadow: `0 0 6px ${color}`,
        }} />
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>{node.label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{node.desc}</div>
      </div>
      {!isLast && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
          <div style={{ width: 20, height: 2, background: `linear-gradient(90deg, ${alpha(color, 80)}, ${alpha(color, 20)})` }} />
          <ChevronRight size={10} color={color} style={{ opacity: 0.6 }} />
        </div>
      )}
    </div>
  );
}

export function NodeDetailPanel({ node, onClose, color = 'var(--phase-pre)' }) {
  if (!node) return null;
  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 320,
      background: 'var(--navy-2)', borderLeft: '1px solid var(--border)',
      zIndex: 50, padding: 24, overflowY: 'auto',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginBottom: 8, boxShadow: `0 0 8px ${color}` }} />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{node.label}</h3>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><X size={14} /></button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>{node.desc}</p>

      {node.owner && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <User size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{node.owner}</span>
        </div>
      )}

      {node.kpi && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Target size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KPI</span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--status-ok)' }}>{node.kpi}</span>
        </div>
      )}

      {node.artifacts && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Package size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artifacts</span>
          </div>
          {node.artifacts.map(a => (
            <div key={a} style={{
              padding: '6px 10px', background: 'rgba(10,10,10,0.04)',
              border: '1px solid var(--border-light)', borderRadius: 6,
              fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4,
            }}>{a}</div>
          ))}
        </div>
      )}
    </div>
  );
}
