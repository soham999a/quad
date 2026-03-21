import React, { useState } from 'react';
import { PILLARS, POST_INTERVENTION_NODES, computePillarScore, computeWeightedScore, getGrade, getCareerProfile, getSkillShape, SKILL_SHAPES, CAREER_PROFILES } from '../data/qidsData';
import { useApp } from '../App';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import QIDSRadar from '../components/RadarChart';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function PostIntervention() {
  const { assessmentData, postData, demoMode } = useApp();
  const [activeNode, setActiveNode] = useState(null);
  const [activeTab, setActiveTab] = useState('comparison');

  const preRaw = assessmentData?.rawScores || {};
  const postRaw = postData?.rawScores || {};

  const preScores = {};
  const postScores = {};
  Object.keys(PILLARS).forEach(id => {
    preScores[id] = computePillarScore(id, preRaw[id] || {});
    postScores[id] = computePillarScore(id, postRaw[id] || {});
  });

  const preUnified = computeWeightedScore(preScores);
  const postUnified = computeWeightedScore(postScores);
  const delta = postUnified - preUnified;

  const careerProfile = getCareerProfile(postScores);
  const skillShape = getSkillShape(postScores);
  const skillShapeData = SKILL_SHAPES.find(s => s.id === skillShape);

  const comparisonData = Object.entries(PILLARS).map(([id, p]) => ({
    name: id,
    Pre: preScores[id],
    Post: postScores[id],
    Delta: postScores[id] - preScores[id],
  }));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }} className="animate-fade">
      {/* Left sidebar */}
      <div style={{ width: 240, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '4px 10px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 20, fontSize: 11, color: '#2dd4bf', fontWeight: 600, display: 'inline-block', marginBottom: 12 }}>Phase 3</div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Post-Intervention</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>Progress evaluation, outcome synthesis, and final development roadmap.</p>

        <div className="divider" />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Score Delta</div>
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const d = postScores[id] - preScores[id];
          return (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: pillar.color }}>{id}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{preScores[id]} →</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: pillar.color }}>{postScores[id]}</span>
                <span style={{ fontSize: 11, color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                  {d > 0 ? `+${d}` : d}
                </span>
              </div>
            </div>
          );
        })}

        <div className="divider" />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Process Nodes</div>
        {POST_INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            background: activeNode?.id === node.id ? 'rgba(20,184,166,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#14b8a6' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{node.label}</div>
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Phase swimlane */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: '3px 10px', background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 20, fontSize: 11, color: '#2dd4bf', fontWeight: 600 }}>Phase 3</div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Post-Intervention Evaluation</span>
          </div>
          <div style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: 14, padding: 16, overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
              {POST_INTERVENTION_NODES.map((node, i) => (
                <ProcessNode key={node.id} node={node} color="#14b8a6" index={i} isLast={i === POST_INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
              ))}
            </div>
          </div>
        </div>

        {/* Unified score comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Pre-Intervention Score', val: preUnified, color: '#6366f1', grade: getGrade(preUnified) },
            { label: 'Post-Intervention Score', val: postUnified, color: '#14b8a6', grade: getGrade(postUnified) },
            { label: 'Overall Improvement', val: delta, color: delta >= 0 ? '#10b981' : '#ef4444', isPercent: false, isDelta: true },
          ].map(({ label, val, color, grade, isDelta }) => (
            <div key={label} style={{
              background: 'var(--navy-4)', border: `1px solid ${color}30`,
              borderRadius: 14, padding: 20, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 40, fontWeight: 800, color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>
                {isDelta ? (delta >= 0 ? `+${delta}` : delta) : val}
              </div>
              {grade && <div style={{ fontSize: 12, color: grade.color, marginTop: 4 }}>Grade {grade.grade}: {grade.label}</div>}
              {isDelta && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>points gained</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--navy-4)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {['comparison', 'radar', 'career', 'idp'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
              background: activeTab === t ? '#14b8a6' : 'transparent',
              color: activeTab === t ? 'white' : 'var(--text-secondary)',
              border: 'none', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        {activeTab === 'comparison' && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Before vs After Comparison</h3>
            <div style={{ background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comparisonData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--navy-4)', border: '1px solid var(--border)', borderRadius: 8, color: 'white', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                  <Bar dataKey="Pre" fill="#6366f1" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Post" fill="#14b8a6" fillOpacity={0.9} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {Object.entries(PILLARS).map(([id, pillar]) => {
                const d = postScores[id] - preScores[id];
                const pct = preScores[id] > 0 ? Math.round((d / preScores[id]) * 100) : 0;
                return (
                  <div key={id} style={{ background: 'var(--navy-4)', border: `1px solid ${pillar.color}25`, borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 6 }}>{pillar.short}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{preScores[id]}</span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: pillar.color }}>{postScores[id]}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {d > 0 ? <TrendingUp size={12} color="#10b981" /> : d < 0 ? <TrendingDown size={12} color="#ef4444" /> : <Minus size={12} color="var(--text-muted)" />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {d > 0 ? `+${d}` : d} pts ({pct > 0 ? '+' : ''}{pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'radar' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Pre vs Post Radar</h4>
              <QIDSRadar data={preScores} compare={postScores} size={280} />
            </div>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Skill Shape Topology</h4>
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{
                  fontSize: 72, fontWeight: 900, fontFamily: 'Space Grotesk',
                  background: 'linear-gradient(135deg, #6366f1, #14b8a6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: 12,
                }}>{skillShape}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{skillShapeData?.label}</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{skillShapeData?.desc}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Career Guidance & Recommendations</h3>
            <div style={{
              padding: 24, background: `${careerProfile.icon ? 'rgba(99,102,241,0.08)' : 'var(--navy-4)'}`,
              border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ fontSize: 40 }}>{careerProfile.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Recommended Track</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{careerProfile.label}</h3>
                  <div style={{ fontSize: 12, color: '#818cf8', marginBottom: 8 }}>Condition: {careerProfile.condition}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{careerProfile.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {careerProfile.roles.map(r => (
                      <span key={r} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 12, color: '#818cf8' }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>All Career Profiles</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CAREER_PROFILES.map(cp => (
                <div key={cp.id} style={{
                  padding: 14, background: cp.id === careerProfile.id ? 'rgba(99,102,241,0.1)' : 'var(--navy-4)',
                  border: `1px solid ${cp.id === careerProfile.id ? 'rgba(99,102,241,0.4)' : 'var(--border-light)'}`,
                  borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20 }}>{cp.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{cp.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cp.condition}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'idp' && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Individual Development Plan (IDP)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#14b8a6', marginBottom: 12 }}>Achieved Milestones</h4>
                {Object.entries(PILLARS).filter(([id]) => postScores[id] > preScores[id]).map(([id, p]) => (
                  <div key={id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: '#10b981' }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.label}: {preScores[id]} → {postScores[id]} (+{postScores[id] - preScores[id]})</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 12 }}>Maintenance Roadmap</h4>
                {['Monthly self-assessment check-ins', 'Quarterly facilitator review sessions', 'Annual full QIDS reassessment', 'Ongoing EQ practice (Stop-Think-Act)', 'Peer accountability partnerships'].map(item => (
                  <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', marginTop: 5, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div style={{ width: 260, borderLeft: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2dd4bf', marginBottom: 12 }}>Outcome Summary</div>
        <div style={{ padding: 14, background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Unified Score Change</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#14b8a6', fontFamily: 'Space Grotesk' }}>{preUnified} → {postUnified}</div>
          <div style={{ fontSize: 12, color: delta >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{delta >= 0 ? `+${delta}` : delta} points ({Math.round((delta / preUnified) * 100)}%)</div>
        </div>

        <div className="divider" />

        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Skill Shape</div>
        <div style={{ padding: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#818cf8', fontFamily: 'Space Grotesk' }}>{skillShape}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{skillShapeData?.label}</div>
        </div>

        <div className="divider" />

        <QIDSRadar data={preScores} compare={postScores} size={200} />

        <div className="divider" />

        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.location.href = '/report'}>
          <Download size={12} /> Generate Full Report
        </button>
      </div>

      {activeNode && <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color="#14b8a6" />}
    </div>
  );
}
