import React from 'react';
import { getGrade, isCritical } from '../data/qidsData';
import { AlertTriangle } from 'lucide-react';

export default function ScoreCard({ pillar, score, showWeight = false }) {
  const grade = getGrade(score);
  const critical = isCritical(score);

  return (
    <div style={{
      background: 'var(--navy-4)',
      border: `1px solid ${critical ? 'rgba(239,68,68,0.3)' : 'var(--border-light)'}`,
      borderRadius: 12,
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: pillar.gradient,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{pillar.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: grade.color }}>{score}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: grade.bg, border: `1px solid ${grade.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: grade.color, fontFamily: 'Space Grotesk',
          }}>{grade.grade}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{grade.label}</div>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</span>
          <span style={{ fontSize: 11, color: grade.color }}>{score}/100</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${score}%`, background: pillar.gradient }} />
        </div>
      </div>

      {showWeight && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Weight: ×{pillar.weight.toFixed(2)}
        </div>
      )}

      {critical && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '4px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={11} color="#ef4444" />
          <span style={{ fontSize: 10, color: '#fca5a5', fontWeight: 600 }}>CRITICAL PRIORITY</span>
        </div>
      )}
    </div>
  );
}
