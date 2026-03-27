import React, { useState } from 'react';
import { PILLARS, PRE_INTERVENTION_NODES, computePillarScore, computeWeightedScore, getGrade, isCritical, WEIGHTS, GRADE_BANDS } from '../data/qidsData';
import { useApp } from '../App';
import { useNavigate, useLocation } from 'react-router-dom';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import ScoreCard from '../components/ScoreCard';
import QIDSRadar from '../components/RadarChart';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

function Heatmap({ pillarScores, rawScores }) {
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Sub-Parameter Heatmap</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(PILLARS).map(([pid, pillar]) => (
          <div key={pid}>
            <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 4 }}>{pillar.short}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {pillar.subParams.map(sp => {
                const raw = rawScores[pid]?.[sp.id] || 0;
                const pct = Math.round((raw / sp.max) * 100);
                const bg = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={sp.id} title={`${sp.label}: ${pct}%`} style={{
                    padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    background: `${bg}20`, border: `1px solid ${bg}40`, color: bg,
                    cursor: 'default',
                  }}>
                    {sp.label.split(' ')[0]} {pct}%
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PreIntervention() {
  const { assessmentData: ctxAssessment, demoMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  // Use the assessment passed via route state (clicked from dashboard), else fall back to context
  const assessmentData = location.state?.assessment || ctxAssessment;
  const [activeNode, setActiveNode] = useState(null);
  const [activeStep, setActiveStep] = useState('standardize');

  const rawScores = assessmentData?.rawScores || {};
  const pillarScores = {};
  Object.keys(PILLARS).forEach(id => { pillarScores[id] = computePillarScore(id, rawScores[id] || {}); });
  const unifiedScore = computeWeightedScore(pillarScores);
  const overallGrade = getGrade(unifiedScore);
  const criticalPillars = Object.entries(pillarScores).filter(([, s]) => isCritical(s));

  if (!assessmentData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40, opacity: 0.3 }}>📋</div>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>No Assessment Found</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Complete an assessment first to view pre-intervention analysis.</p>
        <button onClick={() => navigate('/assessment')} className="btn btn-primary">Start Assessment</button>
      </div>
    );
  }

  return (
    <div className="three-panel animate-fade" style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      {/* Mobile summary strip — shown only on mobile */}
      <div className="mobile-panel-summary" style={{ display: 'none' }}>
        {Object.entries(pillarScores).map(([id, score]) => (
          <div key={id} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 8,
            background: `${PILLARS[id].color}15`, border: `1px solid ${PILLARS[id].color}30`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 11, color: PILLARS[id].color, fontWeight: 700 }}>{id}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: isCritical(score) ? '#ef4444' : '#10b981' }}>{score}</span>
          </div>
        ))}
        <div style={{
          flexShrink: 0, padding: '6px 12px', borderRadius: 8,
          background: `${overallGrade.bg}`, border: `1px solid ${overallGrade.color}40`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 11, color: overallGrade.color, fontWeight: 700 }}>QIDS</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: overallGrade.color }}>{unifiedScore}</span>
          <span style={{ fontSize: 10, color: overallGrade.color }}>Grade {overallGrade.grade}</span>
        </div>
      </div>
      {/* Left sidebar */}
      <div className="panel-left" style={{ width: 260, borderRight: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, fontSize: 11, color: '#818cf8', fontWeight: 600, display: 'inline-block', marginBottom: 10 }}>Pre-Intervention</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Standardize & Score</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Normalize raw results to standardized scales and compute subcomponent scores and four quotient vectors</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>KPI</span>
          </div>
          <span style={{ fontSize: 12, color: '#10b981' }}>Scoring accuracy 100%</span>
        </div>

        <div className="divider" />

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Process Nodes</div>
        {PRE_INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} style={{
            padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            background: activeNode?.id === node.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? 'var(--indigo)' : 'transparent'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{node.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{node.desc}</div>
          </div>
        ))}
      </div>

      {/* Main canvas */}
      <div className="panel-main" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {/* Phase swimlane */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: '3px 10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Phase 1</div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Pre-Intervention</span>
          </div>
          <div style={{
            background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 14, padding: 16, overflowX: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content' }}>
              {PRE_INTERVENTION_NODES.map((node, i) => (
                <ProcessNode
                  key={node.id} node={node} color="#6366f1" index={i}
                  isLast={i === PRE_INTERVENTION_NODES.length - 1}
                  onClick={setActiveNode} active={activeNode?.id === node.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scores grid */}
        <div className="score-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {Object.entries(PILLARS).map(([id, pillar]) => (
            <ScoreCard key={id} pillar={pillar} score={pillarScores[id]} showWeight />
          ))}
        </div>

        {/* Unified score + grade */}
        <div className="unified-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{
            background: 'var(--navy-4)', border: '1px solid var(--border)', borderRadius: 14, padding: 20,
            background: `linear-gradient(135deg, ${overallGrade.bg}, rgba(0,0,0,0.2))`,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Unified QIDS Score</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: overallGrade.color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{unifiedScore}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>/ 100 — Grade {overallGrade.grade}: {overallGrade.label}</div>
            <div className="progress-bar" style={{ marginTop: 12 }}>
              <div className="progress-fill" style={{ width: `${unifiedScore}%`, background: `linear-gradient(90deg, ${overallGrade.color}, ${overallGrade.color}80)` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
              Formula: Σ(Score × Weight) / Σ(Weights) = {unifiedScore}
            </div>
          </div>

          <div style={{ background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Dynamic Weightage</div>
            {Object.entries(WEIGHTS).map(([k, w]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PILLARS[k].color }} />
                  <span style={{ fontSize: 13 }}>{k}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>×{w.toFixed(2)}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: PILLARS[k].color }}>{Math.round(pillarScores[k] * w)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical flags */}
        {criticalPillars.length > 0 && (
          <div style={{ marginBottom: 20, padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>Critical Priority Flags</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {criticalPillars.map(([id, score]) => (
                <div key={id} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5' }}>
                  {PILLARS[id].label}: {score}/100 — Intervention Required
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap */}
        <div className="card" style={{ marginBottom: 20 }}>
          <Heatmap pillarScores={pillarScores} rawScores={rawScores} />
        </div>

        {/* Grade bands reference */}
        <div className="card">
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Grade Band Reference</h4>
          <div className="grade-bands">
            <div style={{ display: 'flex', gap: 8 }}>
            {GRADE_BANDS.map(b => (
              <div key={b.grade} style={{
                flex: 1, padding: '10px 8px', borderRadius: 8, textAlign: 'center',
                background: b.bg, border: `1px solid ${b.color}40`,
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: b.color, fontFamily: 'Space Grotesk' }}>{b.grade}</div>
                <div style={{ fontSize: 10, color: b.color, fontWeight: 600 }}>{b.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{b.min}–{b.max}</div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="panel-right" style={{ width: 280, borderLeft: '1px solid var(--border-light)', background: 'var(--navy-2)', padding: 20, overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--navy-4)', padding: 4, borderRadius: 8 }}>
          {['Technical', 'Quotients', 'Modules'].map(t => (
            <button key={t} style={{
              flex: 1, padding: '5px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              background: t === 'Technical' ? 'var(--indigo)' : 'transparent',
              color: t === 'Technical' ? 'white' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Info size={12} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>Unique IQ Measurement Model</span>
          </div>
          {['Four-parameter model: Verbal, Quantitative, Psychometric, Performance IQ', 'Equal weighting (25 marks each) for balanced assessment', 'Integration of standardized tests with performance-based tasks', 'Age and culture-adjusted scoring algorithms'].map(item => (
            <div key={item} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <CheckCircle size={11} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 8 }}>Standardization Algorithm</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            Standardized Score (%) =<br />(Raw Score / Max Score) × 100
          </div>
          {['Unified 0–100 scale across all quotients', 'Conversion factors: IQ=1.0, EQ=2.0, SQ=2.0, AQ=1.28', 'Sub-component weighted aggregation formula', 'Enables cross-quotient comparison and visualization'].map(item => (
            <div key={item} style={{ display: 'flex', gap: 6, marginBottom: 5, marginTop: 6 }}>
              <CheckCircle size={11} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', marginBottom: 8 }}>Dynamic Weightage Algorithm (DWA)</div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Context-sensitive weight computation based on role, culture, and mission parameters. Weights reflect the relative developmental importance of each quotient.</p>
        </div>

        <div className="divider" />

        {/* Radar */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Quotient Profile</div>
          <QIDSRadar data={pillarScores} size={200} />
        </div>

        {location.state?.postAssessment && (
          <>
            <div className="divider" />
            <button
              className="btn btn-primary btn-sm"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/post-intervention', { state: { assessment: assessmentData, postAssessment: location.state.postAssessment } })}
            >
              View Post-Intervention →
            </button>
          </>
        )}
      </div>

      {/* Node detail panel */}
      {activeNode && <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color="#6366f1" />}
    </div>
  );
}
