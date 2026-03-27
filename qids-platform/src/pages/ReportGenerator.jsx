import React, { useState } from 'react';
import { PILLARS, computePillarScore, computeWeightedScore, getGrade, getCareerProfile, getSkillShape, SKILL_SHAPES, WEIGHTS, GRADE_BANDS, CONTEXTS } from '../data/qidsData';
import { useApp } from '../App';
import QIDSRadar from '../components/RadarChart';
import { Download, Printer, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ReportGenerator() {
  const { assessmentData, postData, context, demoMode } = useApp();
  const [reportType, setReportType] = useState('full');

  const preRaw = assessmentData?.rawScores || {};
  const postRaw = postData?.rawScores || {};
  const intake = assessmentData?.intake || { name: 'Alex Johnson', age: '28', institution: 'Demo Organization', evaluator: 'Dr. Smith' };

  const preScores = {};
  const postScores = {};
  Object.keys(PILLARS).forEach(id => {
    preScores[id] = computePillarScore(id, preRaw[id] || {});
    postScores[id] = computePillarScore(id, postRaw[id] || {});
  });

  const preUnified = computeWeightedScore(preScores);
  const postUnified = computeWeightedScore(postScores);
  const overallGrade = getGrade(postUnified);
  const careerProfile = getCareerProfile(postScores);
  const skillShape = getSkillShape(postScores);
  const skillShapeData = SKILL_SHAPES.find(s => s.id === skillShape);
  const ctx = CONTEXTS.find(c => c.id === context) || CONTEXTS[0];

  const handlePrint = () => window.print();

  return (
    <div className="page-pad animate-fade" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Report Generator</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Export-ready QIDS Development Report</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handlePrint}><Printer size={14} /> Print</button>
          <button className="btn btn-primary" onClick={handlePrint}><Download size={14} /> Export PDF</button>
        </div>
      </div>

      {/* Report type selector */}
      <div className="report-type-selector" style={{ marginBottom: 24 }}>
        {[
          { id: 'full', label: 'Full QIDS Report' },
          { id: 'profile', label: 'Individual Quotient Profile' },
          { id: 'progress', label: 'Progress & Intervention Summary' },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setReportType(id)} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: reportType === id ? 'var(--indigo)' : 'var(--navy-4)',
            color: reportType === id ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${reportType === id ? 'var(--indigo)' : 'var(--border-light)'}`,
            fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Report document */}
      <div id="report-content" style={{
        background: 'var(--navy-3)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Report header */}
        <div className="report-header" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15), rgba(20,184,166,0.1))',
          borderBottom: '1px solid var(--border)', padding: '32px 40px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                Quadrant Intelligence Development System
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
                {reportType === 'full' ? 'QIDS Development Report' : reportType === 'profile' ? 'Individual Quotient Profile' : 'Progress & Intervention Summary'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Holistic Intelligence Assessment & Development Analysis</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Context</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#818cf8' }}>{ctx.icon} {ctx.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="report-body" style={{ padding: '32px 40px' }}>
          {/* Subject info */}
          <div className="report-info-grid" style={{ marginBottom: 28 }}>
            {[
              { label: 'Name', val: intake.name || '—' },
              { label: 'Age', val: intake.age || '—' },
              { label: 'Institution', val: intake.institution || '—' },
              { label: 'Evaluator', val: intake.evaluator || '—' },
            ].map(({ label, val }) => (
              <div key={label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Score summary */}
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quotient Score Summary</h3>
          <div className="report-score-grid" style={{ marginBottom: 24 }}>
            {Object.entries(PILLARS).map(([id, pillar]) => {
              const pre = preScores[id];
              const post = postScores[id];
              const grade = getGrade(post);
              return (
                <div key={id} style={{
                  background: 'var(--navy-4)', border: `1px solid ${pillar.color}30`,
                  borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: pillar.gradient }} />
                  <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 4 }}>{pillar.short}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: grade.color, fontFamily: 'Space Grotesk' }}>{post}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>Grade {grade.grade} — {grade.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pre: {pre} | Δ {post - pre > 0 ? '+' : ''}{post - pre}</div>
                  <div className="progress-bar" style={{ marginTop: 8 }}>
                    <div className="progress-fill" style={{ width: `${post}%`, background: pillar.gradient }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Weight: ×{pillar.weight.toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          {/* Unified score */}
          <div className="report-unified-grid" style={{ marginBottom: 28 }}>
            <div style={{
              padding: 20, background: `${overallGrade.bg}`,
              border: `1px solid ${overallGrade.color}40`, borderRadius: 14,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Unified QIDS Score (Post-Intervention)</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: overallGrade.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{postUnified}</div>
              <div style={{ fontSize: 14, color: overallGrade.color, marginTop: 4 }}>Grade {overallGrade.grade}: {overallGrade.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Pre-Intervention: {preUnified} | Improvement: +{postUnified - preUnified} pts
              </div>
            </div>
            <div style={{ padding: 20, background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Weighted Score Computation</div>
              {Object.entries(WEIGHTS).map(([k, w]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: PILLARS[k].color }}>{k} ({postScores[k]}) × {w.toFixed(2)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{Math.round(postScores[k] * w)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 6, marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Unified Score</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: overallGrade.color }}>{postUnified}</span>
              </div>
            </div>
          </div>

          {/* Radar + Heatmap */}
          <div className="report-radar-grid" style={{ marginBottom: 28 }}>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Quotient Radar Profile</h4>
              <QIDSRadar data={preScores} compare={postScores} size={240} />
            </div>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sub-Parameter Heatmap</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(PILLARS).map(([pid, pillar]) => (
                  <div key={pid}>
                    <div style={{ fontSize: 10, color: pillar.color, fontWeight: 600, marginBottom: 4 }}>{pillar.short}</div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {pillar.subParams.map(sp => {
                        const raw = postRaw[pid]?.[sp.id] || 0;
                        const pct = Math.round((raw / sp.max) * 100);
                        const bg = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={sp.id} style={{
                            padding: '3px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                            background: `${bg}20`, border: `1px solid ${bg}40`, color: bg,
                          }}>{pct}%</div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Career & Skill Shape */}
          <div className="report-career-grid" style={{ marginBottom: 28 }}>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Career Guidance</h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28 }}>{careerProfile.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{careerProfile.label}</div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{careerProfile.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {careerProfile.roles.map(r => (
                      <span key={r} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, color: '#818cf8' }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Skill Shape Topology</h4>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: '#818cf8', fontFamily: 'Space Grotesk' }}>{skillShape}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{skillShapeData?.label}</div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{skillShapeData?.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gap analysis */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Gap Analysis & Recommendations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(PILLARS).map(([id, pillar]) => {
                const score = postScores[id];
                const gap = 100 - score;
                const isCrit = score < 60;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pillar.color, minWidth: 30 }}>{id}</span>
                    <div style={{ flex: 1 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${score}%`, background: pillar.gradient }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: isCrit ? '#ef4444' : '#10b981', fontWeight: 600, minWidth: 40 }}>{score}/100</span>
                    {isCrit && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={11} color="#ef4444" />
                        <span style={{ fontSize: 10, color: '#fca5a5' }}>Critical</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final recommendation */}
          <div style={{
            padding: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.08))',
            border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14,
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Final Recommendation Summary</h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Based on the post-intervention QIDS assessment, {intake.name || 'the individual'} demonstrates a <strong style={{ color: overallGrade.color }}>{overallGrade.label}</strong> overall profile (Grade {overallGrade.grade}, Score: {postUnified}/100).
              The profile indicates a <strong style={{ color: '#818cf8' }}>{skillShapeData?.label}</strong> skill topology, best aligned with the <strong style={{ color: '#818cf8' }}>{careerProfile.label}</strong>.
              Continued focus on maintenance activities and periodic reassessment is recommended to sustain and build upon the gains achieved during the intervention phase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
