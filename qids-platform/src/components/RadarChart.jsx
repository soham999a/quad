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
        <PolarGrid stroke="color-mix(in srgb, var(--neutral-dark) 10%, transparent)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--slate-muted)', fontSize: 13, fontWeight: 600 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--slate-deep)', fontSize: 10 }} tickCount={5} />
        <Radar name={compare ? 'Pre-Intervention' : 'Score'} dataKey="A" stroke="var(--phase-pre)" fill="var(--phase-pre)" fillOpacity={0.25} strokeWidth={2} dot={{ fill: 'var(--phase-pre)', r: 4 }} />
        {compare && <Radar name="Post-Intervention" dataKey="B" stroke="var(--status-ok)" fill="var(--status-ok)" fillOpacity={0.2} strokeWidth={2} dot={{ fill: 'var(--status-ok)', r: 4 }} />}
        <Tooltip contentStyle={{ background: 'var(--navy-4)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
        {compare && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />}
      </ReRadar>
    </ResponsiveContainer>
  );
}
