import React from 'react';
import { RadarChart as ReRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function QIDSRadar({ data, compare = null, size = 300 }) {
  const chartData = [
    { subject: 'IQ', A: data.IQ, B: compare?.IQ, fullMark: 100 },
    { subject: 'EQ', A: data.EQ, B: compare?.EQ, fullMark: 100 },
    { subject: 'SQ', A: data.SQ, B: compare?.SQ, fullMark: 100 },
    { subject: 'AQ', A: data.AQ, B: compare?.AQ, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={size}>
      <ReRadar data={chartData}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} tickCount={5} />
        <Radar name={compare ? 'Pre-Intervention' : 'Score'} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
        {compare && <Radar name="Post-Intervention" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />}
        <Tooltip contentStyle={{ background: 'var(--navy-4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
        {compare && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />}
      </ReRadar>
    </ResponsiveContainer>
  );
}
