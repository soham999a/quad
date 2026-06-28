import React, { useState } from 'react';
import { PILLARS, POST_INTERVENTION_NODES, DEMO_POST_SCORES, computePillarScore, computeWeightedScore, getGrade, getCareerProfile, getSkillShape, SKILL_SHAPES, CAREER_PROFILES } from '../data/qidsData';
import { useApp } from '../App';
import { useAuth } from '../context/AuthContext';
import { savePostAssessment } from '../services/firestoreService';
import ProcessNode, { NodeDetailPanel } from '../components/ProcessNode';
import QIDSRadar from '../components/RadarChart';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Download, Save, CheckCircle, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useToast } from '../components/Toast';

function PostAssessmentForm({ assessmentData, onSubmit }) {
  const [rawScores, setRawScores] = useState(() => {
    const pre = assessmentData?.rawScores || {};
    const init = {};
    Object.keys(PILLARS).forEach(pid => {
      init[pid] = {};
      PILLARS[pid].subParams.forEach(sp => {
        init[pid][sp.id] = pre[pid]?.[sp.id] ?? 0;
      });
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const updateScore = (pid, subId, val) =>
    setRawScores(prev => ({ ...prev, [pid]: { ...prev[pid], [subId]: val } }));

  const handleSubmit = async () => {
    setSaving(true);
    const pillarScores = {};
    Object.keys(PILLARS).forEach(id => {
      pillarScores[id] = computePillarScore(id, rawScores[id] || {});
    });
    await onSubmit({ rawScores, pillarScores, intake: assessmentData?.intake, timestamp: new Date().toISOString() });
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <ClipboardList size={18} color="#14b8a6" />
        <h2 className="text-headline-md font-extrabold m-0">Post-Intervention Assessment</h2>
        <div className="ml-auto px-3 py-1 rounded-full text-[11px] font-semibold text-[#2dd4bf]" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>Phase 3</div>
      </div>
      <p className="text-technical-sm text-surface-variant mb-6">
        Re-assess all four pillars after the intervention period. Adjust the sliders to reflect the student's current performance.
      </p>

      {Object.entries(PILLARS).map(([pid, pillar]) => (
        <div key={pid} className="mb-5 bg-surface-container-low p-5 rounded-[14px]" style={{ border: `1px solid ${pillar.color}25` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: pillar.color }} />
            <span className="text-label-md font-bold" style={{ color: pillar.color }}>{pillar.label}</span>
            <span className="text-technical-sm text-surface-variant">— {pillar.framework}</span>
          </div>
          <div className="grid-2 gap-3.5">
            {pillar.subParams.map(sp => {
              const val = rawScores[pid]?.[sp.id] ?? 0;
              const preVal = assessmentData?.rawScores?.[pid]?.[sp.id] ?? 0;
              const pct = Math.round((val / sp.max) * 100);
              return (
                <div key={sp.id} className="p-3.5 rounded-[10px] border border-outline-variant" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex justify-between mb-1.5">
                    <div>
                      <div className="text-technical-sm font-semibold">{sp.label}</div>
                      <div className="text-[11px] text-surface-variant">Pre: {preVal}/{sp.max}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: pillar.color }}>{val}</div>
                      <div className="text-[10px] text-surface-variant">/ {sp.max}</div>
                    </div>
                  </div>
                  <input type="range" min={0} max={sp.max} value={val}
                    onChange={e => updateScore(pid, sp.id, parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-[3px] outline-none border-none p-0 cursor-pointer appearance-none"
                    style={{
                      background: `linear-gradient(90deg, ${pillar.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-surface-variant">0</span>
                    <span className="text-[10px] font-semibold" style={{ color: pct >= 60 ? '#10b981' : '#ef4444' }}>{pct}%</span>
                    <span className="text-[10px] text-surface-variant">{sp.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={saving} className="btn btn-primary w-full justify-center p-3.5 text-sm rounded-xl bg-[#14b8a6]">
        {saving ? 'Saving...' : <><Save size={14} /> Submit Post-Assessment</>}
      </button>
    </div>
  );
}

export default function PostIntervention() {
  const { assessmentData: ctxAssessment, postData: ctxPostData, setPostData } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const assessmentData = location.state?.assessment || ctxAssessment;
  const [activeNode, setActiveNode] = useState(null);
  const [activeTab, setActiveTab] = useState('comparison');
  const [submitted, setSubmitted] = useState(false);

  const [localPostData, setLocalPostData] = useState(location.state?.postAssessment || null);
  const postData = localPostData || ctxPostData;

  const handlePostSubmit = async (data) => {
    try {
      if (user && assessmentData?.id) {
        await savePostAssessment(user.uid, assessmentData.id, data);
      }
      setPostData(data);
      setLocalPostData(data);
      setSubmitted(true);
      toast('Post-assessment saved successfully!', 'success');
    } catch (e) {
      console.error('Save failed:', e);
      toast('Saved locally — sync failed. Check connection.', 'error');
      setPostData(data);
      setLocalPostData(data);
      setSubmitted(true);
    }
  };

  if (!postData && !submitted) {
    if (!assessmentData) {
      return (
        <div className="flex items-center justify-center h-[calc(100vh-52px)] flex-col gap-4">
          <div className="opacity-30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <h3 className="text-lg font-bold">No Assessment Found</h3>
          <p className="text-sm text-surface-variant">Complete a pre-assessment first before doing post-intervention.</p>
          <button onClick={() => navigate('/app/assessment')} className="btn btn-primary">Start Assessment</button>
        </div>
      );
    }
    return (
      <div className="overflow-y-auto h-[calc(100vh-52px)] animate-fade">
        <PostAssessmentForm assessmentData={assessmentData} onSubmit={handlePostSubmit} />
      </div>
    );
  }

  if (submitted && !postData) return null;

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
    <div className="three-panel animate-fade flex h-[calc(100vh-52px)]">
      <div className="mobile-panel-summary hidden">
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const d = postScores[id] - preScores[id];
          return (
            <div key={id} className="shrink-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: `${pillar.color}15`, border: `1px solid ${pillar.color}30` }}>
              <span className="text-[11px] font-bold" style={{ color: pillar.color }}>{id}</span>
              <span className="text-sm font-extrabold" style={{ color: pillar.color }}>{postScores[id]}</span>
              <span className="text-[10px] font-semibold" style={{ color: d >= 0 ? '#10b981' : '#ef4444' }}>{d >= 0 ? `+${d}` : d}</span>
            </div>
          );
        })}
      </div>
      <div className="panel-left w-60 border-r border-outline-variant bg-surface overflow-y-auto shrink-0 p-5">
        <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#2dd4bf] inline-block mb-3" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>Phase 3</div>
        <h3 className="text-[15px] font-bold mb-2">Post-Intervention</h3>
        <p className="text-technical-sm text-surface-variant leading-normal mb-4">Progress evaluation, outcome synthesis, and final development roadmap.</p>

        <div className="divider" />

        <div className="text-[11px] text-surface-variant uppercase tracking-[0.5px] mb-2.5">Score Delta</div>
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const d = postScores[id] - preScores[id];
          return (
            <div key={id} className="flex justify-between items-center mb-2">
              <span className="text-technical-sm" style={{ color: pillar.color }}>{id}</span>
              <div className="flex items-center gap-1">
                <span className="text-technical-sm text-surface-variant">{preScores[id]} →</span>
                <span className="text-technical-sm font-bold" style={{ color: pillar.color }}>{postScores[id]}</span>
                <span className="text-[11px] font-semibold" style={{ color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : 'var(--text-muted)' }}>
                  {d > 0 ? `+${d}` : d}
                </span>
              </div>
            </div>
          );
        })}

        <div className="divider" />

        <div className="text-[11px] text-surface-variant uppercase tracking-[0.5px] mb-2.5">Process Nodes</div>
        {POST_INTERVENTION_NODES.map(node => (
          <div key={node.id} onClick={() => setActiveNode(node)} className="px-2.5 py-2 rounded-lg cursor-pointer mb-1" style={{
            background: activeNode?.id === node.id ? 'rgba(20,184,166,0.15)' : 'transparent',
            border: `1px solid ${activeNode?.id === node.id ? '#14b8a6' : 'transparent'}`,
          }}>
            <div className="text-technical-sm font-medium">{node.label}</div>
          </div>
        ))}
      </div>

      <div className="panel-main flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="px-2.5 py-[3px] rounded-full text-[11px] font-semibold text-[#2dd4bf]" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>Phase 3</div>
            <span className="text-label-md font-bold">Post-Intervention Evaluation</span>
          </div>
          <div className="p-4 rounded-[14px] overflow-x-auto" style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.15)' }}>
            <div className="flex items-center gap-0 min-w-max">
              {POST_INTERVENTION_NODES.map((node, i) => (
                <ProcessNode key={node.id} node={node} color="#14b8a6" index={i} isLast={i === POST_INTERVENTION_NODES.length - 1} onClick={setActiveNode} active={activeNode?.id === node.id} />
              ))}
            </div>
          </div>
        </div>

        <div className="score-grid-4 grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Pre-Intervention Score', val: preUnified, color: '#6366f1', grade: getGrade(preUnified) },
            { label: 'Post-Intervention Score', val: postUnified, color: '#14b8a6', grade: getGrade(postUnified) },
            { label: 'Overall Improvement', val: delta, color: delta >= 0 ? '#10b981' : '#ef4444', isPercent: false, isDelta: true },
          ].map(({ label, val, color, grade, isDelta }) => (
            <div key={label} className="bg-surface-container-low p-5 text-center rounded-[14px]" style={{ border: `1px solid ${color}30` }}>
              <div className="text-[11px] text-surface-variant mb-1">{label}</div>
              <div className="text-[40px] font-extrabold leading-none" style={{ color }}>
                {isDelta ? (delta >= 0 ? `+${delta}` : delta) : val}
              </div>
              {grade && <div className="text-technical-sm mt-1" style={{ color: grade.color }}>Grade {grade.grade}: {grade.label}</div>}
              {isDelta && <div className="text-technical-sm text-surface-variant mt-1">points gained</div>}
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-5 bg-surface-container-low p-1 rounded-[10px] w-fit">
          {['comparison', 'radar', 'career', 'idp'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg cursor-pointer border-none text-sm font-medium capitalize ${activeTab === t ? 'bg-[#14b8a6] text-white' : 'bg-transparent text-on-surface-variant'}`}
            >{t}</button>
          ))}
        </div>

        {activeTab === 'comparison' && (
          <div>
            <h3 className="text-[15px] font-bold mb-4">Before vs After Comparison</h3>
            <div className="bg-surface-container-low border border-outline-variant rounded-[14px] p-5 mb-4">
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

            <div className="post-compare-grid grid grid-cols-4 gap-2.5">
              {Object.entries(PILLARS).map(([id, pillar]) => {
                const d = postScores[id] - preScores[id];
                const pct = preScores[id] > 0 ? Math.round((d / preScores[id]) * 100) : 0;
                return (
                  <div key={id} className="bg-surface-container-low p-3.5 rounded-xl" style={{ border: `1px solid ${pillar.color}25` }}>
                    <div className="text-[11px] font-semibold mb-1.5" style={{ color: pillar.color }}>{pillar.short}</div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-technical-sm text-surface-variant">{preScores[id]}</span>
                      <ArrowRight size={12} className="stroke-surface-variant" />
                      <span className="text-label-md font-bold" style={{ color: pillar.color }}>{postScores[id]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {d > 0 ? <TrendingUp size={12} color="#10b981" /> : d < 0 ? <TrendingDown size={12} color="#ef4444" /> : <Minus size={12} className="stroke-surface-variant" />}
                      <span className="text-technical-sm font-semibold" style={{ color: d > 0 ? '#10b981' : d < 0 ? '#ef4444' : 'var(--text-muted)' }}>
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
          <div className="grid grid-cols-2 gap-5">
            <div className="card">
              <h4 className="text-technical-sm font-semibold mb-3">Pre vs Post Radar</h4>
              <QIDSRadar data={preScores} compare={postScores} size={280} />
            </div>
            <div className="card">
              <h4 className="text-technical-sm font-semibold mb-3">Skill Shape Topology</h4>
              <div className="text-center p-5">
                <div className="text-[72px] font-black mb-3 text-[#6366f1]">{skillShape}</div>
                <div className="text-base font-bold mb-2">{skillShapeData?.label}</div>
                <p className="text-technical-sm text-on-surface-variant leading-relaxed">{skillShapeData?.desc}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'career' && (
          <div>
            <h3 className="text-[15px] font-bold mb-4">Career Guidance & Recommendations</h3>
            <div className="p-6 rounded-2xl mb-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <div className="flex items-start gap-4">
                <div>
                  <div className="text-[11px] text-surface-variant mb-1">Recommended Track</div>
                  <h3 className="text-lg font-extrabold mb-1.5">{careerProfile.label}</h3>
                  <div className="text-technical-sm text-[#818cf8] mb-2">Condition: {careerProfile.condition}</div>
                  <p className="text-technical-sm text-on-surface-variant leading-relaxed mb-3">{careerProfile.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {careerProfile.roles.map(r => (
                      <span key={r} className="px-2.5 py-1 rounded-full text-technical-sm text-[#818cf8]" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <h4 className="text-technical-sm font-semibold mb-3">All Career Profiles</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {CAREER_PROFILES.map(cp => (
                <div key={cp.id} className={`p-3.5 rounded-[10px] border ${cp.id === careerProfile.id ? 'bg-[#6366f1]/10 border-[#6366f1]/40' : 'bg-surface-container-low border-outline-variant'}`}>
                  <div className="flex gap-2 items-start">
                    <div>
                      <div className="text-technical-sm font-semibold mb-0.5">{cp.label}</div>
                      <div className="text-[11px] text-surface-variant">{cp.condition}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'idp' && (
          <div>
            <h3 className="text-[15px] font-bold mb-4">Individual Development Plan (IDP)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <h4 className="text-technical-sm font-semibold text-[#14b8a6] mb-3">Achieved Milestones</h4>
                {Object.entries(PILLARS).filter(([id]) => postScores[id] > preScores[id]).map(([id, p]) => (
                  <div key={id} className="flex gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981' }}>
                      <span className="text-[9px] text-[#10b981]">✓</span>
                    </div>
                    <span className="text-technical-sm text-on-surface-variant">{p.label}: {preScores[id]} → {postScores[id]} (+{postScores[id] - preScores[id]})</span>
                  </div>
                ))}
              </div>
              <div className="card">
                <h4 className="text-technical-sm font-semibold text-[#f59e0b] mb-3">Maintenance Roadmap</h4>
                {['Monthly self-assessment check-ins', 'Quarterly facilitator review sessions', 'Annual full QIDS reassessment', 'Ongoing EQ practice (Stop-Think-Act)', 'Peer accountability partnerships'].map(item => (
                  <div key={item} className="flex gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] mt-[5px] shrink-0" />
                    <span className="text-technical-sm text-on-surface-variant">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel-right w-[260px] border-l border-outline-variant bg-surface overflow-y-auto shrink-0 p-5">
        <div className="text-technical-sm font-semibold text-[#2dd4bf] mb-3">Outcome Summary</div>
        <div className="p-3.5 rounded-[10px] mb-4" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
          <div className="text-[11px] text-surface-variant mb-1">Unified Score Change</div>
          <div className="text-[28px] font-extrabold text-[#14b8a6]">{preUnified} → {postUnified}</div>
          <div className="text-technical-sm font-semibold" style={{ color: delta >= 0 ? '#10b981' : '#ef4444' }}>{delta >= 0 ? `+${delta}` : delta} points ({Math.round((delta / preUnified) * 100)}%)</div>
        </div>

        <div className="divider" />

        <div className="text-technical-sm font-semibold mb-2.5">Skill Shape</div>
        <div className="p-3 rounded-[10px] mb-4 text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="text-[36px] font-black text-[#818cf8]">{skillShape}</div>
          <div className="text-technical-sm text-on-surface-variant">{skillShapeData?.label}</div>
        </div>

        <div className="divider" />

        <QIDSRadar data={preScores} compare={postScores} size={200} />

        <div className="divider" />

        <button className="btn btn-primary btn-sm w-full justify-center" onClick={() => navigate('/app/report')}>
          <Download size={12} /> Generate Full Report
        </button>
      </div>

      {activeNode && <NodeDetailPanel node={activeNode} onClose={() => setActiveNode(null)} color="#14b8a6" />}
    </div>
  );
}
