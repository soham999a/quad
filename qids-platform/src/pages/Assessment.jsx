import React, { useState } from 'react';
import { PILLARS, DEMO_SCORES, computePillarScore } from '../data/qidsData';
import { useApp } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { saveAssessment } from '../services/firestoreService';
import { Save, RotateCcw, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';

const STEPS = ['Intake & Consent', 'IQ Assessment', 'EQ Assessment', 'SQ Assessment', 'AQ Assessment', 'Review & Submit'];

function IntakeStep({ data, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[
        { key: 'name', label: 'Full Name', placeholder: 'Enter full name' },
        { key: 'age', label: 'Age', placeholder: 'Enter age', type: 'number' },
        { key: 'institution', label: 'Institution / Organization', placeholder: 'Enter institution name' },
        { key: 'evaluator', label: 'Evaluator Name', placeholder: 'Enter evaluator name' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key}>
          <label>{label}</label>
          <input type={type || 'text'} placeholder={placeholder} value={data[key] || ''} onChange={e => onChange(key, e.target.value)} />
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1' }}>
        <label>Assessment Purpose</label>
        <textarea rows={3} placeholder="Describe the purpose of this assessment..." value={data.purpose || ''} onChange={e => onChange('purpose', e.target.value)} />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label>Consent</label>
        <div style={{
          padding: 16, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <input type="checkbox" id="consent" checked={data.consent || false} onChange={e => onChange('consent', e.target.checked)} style={{ width: 'auto', marginTop: 2 }} />
          <label htmlFor="consent" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            I confirm that the individual has provided informed consent for this assessment and understands the purpose, process, and use of results within the QIDS framework.
          </label>
        </div>
      </div>
    </div>
  );
}

function PillarAssessmentStep({ pillarId, scores, onChange, useDemo }) {
  const pillar = PILLARS[pillarId];
  const demoScores = DEMO_SCORES[pillarId];

  return (
    <div>
      <div style={{
        padding: 16, marginBottom: 20,
        background: `${pillar.color}10`, border: `1px solid ${pillar.color}30`,
        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: pillar.color, boxShadow: `0 0 8px ${pillar.color}` }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: pillar.color }}>{pillar.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pillar.framework}</div>
        </div>
        {useDemo && (
          <div style={{ marginLeft: 'auto', padding: '4px 10px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 11, color: '#f59e0b' }}>
            Demo Mode — Sample Data
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pillar.subParams.map(sp => {
          const val = scores[sp.id] ?? (useDemo ? demoScores[sp.id] : 0);
          const pct = Math.round((val / sp.max) * 100);
          return (
            <div key={sp.id} style={{ background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{sp.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sp.desc}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: pillar.color }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ {sp.max}</div>
                </div>
              </div>
              <input
                type="range" min={0} max={sp.max} value={val}
                onChange={e => onChange(sp.id, parseInt(e.target.value))}
                style={{
                  width: '100%', height: 6, borderRadius: 3, outline: 'none',
                  background: `linear-gradient(90deg, ${pillar.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
                  border: 'none', padding: 0, cursor: 'pointer', appearance: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>0</span>
                <span style={{ fontSize: 10, color: pct >= 60 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{pct}%</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sp.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({ intake, rawScores }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {Object.entries(intake).filter(([k]) => k !== 'consent').map(([k, v]) => (
          <div key={k} style={{ padding: '10px 14px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{k}</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{String(v) || '—'}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(PILLARS).map(([id, pillar]) => {
          const score = computePillarScore(id, rawScores[id] || {});
          return (
            <div key={id} style={{
              padding: 16, background: 'var(--navy-4)', border: `1px solid ${pillar.color}30`,
              borderRadius: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: pillar.color, fontWeight: 600, marginBottom: 4 }}>{pillar.short}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: pillar.color, fontFamily: 'Space Grotesk' }}>{score}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ 100</div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${score}%`, background: pillar.gradient }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Assessment() {
  const { setAssessmentData, demoMode } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState({ name: '', age: '', institution: '', evaluator: '', purpose: '', consent: false });
  const [rawScores, setRawScores] = useState({ IQ: {}, EQ: {}, SQ: {}, AQ: {} });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const pillarSteps = ['IQ', 'EQ', 'SQ', 'AQ'];
  const currentPillar = step >= 1 && step <= 4 ? pillarSteps[step - 1] : null;

  const updateIntake = (k, v) => setIntake(prev => ({ ...prev, [k]: v }));
  const updateScore = (pillarId, subId, val) => setRawScores(prev => ({ ...prev, [pillarId]: { ...prev[pillarId], [subId]: val } }));

  const handleSubmit = async () => {
    const pillarScores = {};
    Object.keys(PILLARS).forEach(id => { pillarScores[id] = computePillarScore(id, rawScores[id] || {}); });
    const data = { intake, rawScores, pillarScores, timestamp: new Date().toISOString() };
    setAssessmentData(data);
    setSaving(true);
    try {
      if (user) await saveAssessment(user.uid, data);
    } catch (e) { console.error('Save failed:', e); }
    setSaving(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: 32, maxWidth: 600, margin: '0 auto', textAlign: 'center' }} className="animate-fade">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={28} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Assessment Submitted</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Baseline data has been recorded. Proceed to Pre-Intervention analysis to view scores, grades, and intervention mapping.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => navigate('/pre-intervention')} className="btn btn-primary">View Pre-Intervention Analysis</button>
          <button onClick={() => setSubmitted(false)} className="btn btn-secondary">New Assessment</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }} className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Assessment Engine</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Multi-step baseline assessment across all four quotient dimensions</p>
        </div>
        {false && (
          <div style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12, color: '#f59e0b' }}>
            Demo Mode Active
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, overflowX: 'auto' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div onClick={() => i < step && setStep(i)} style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: i < step ? 'pointer' : 'default',
              padding: '6px 10px', borderRadius: 8, whiteSpace: 'nowrap',
              background: i === step ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: `1px solid ${i === step ? 'var(--indigo)' : 'transparent'}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: i < step ? '#10b981' : i === step ? 'var(--indigo)' : 'var(--navy-5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 12, color: i === step ? 'white' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? '#10b981' : 'var(--border-light)', minWidth: 16 }} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{STEPS[step]}</h3>
        {step === 0 && <IntakeStep data={intake} onChange={updateIntake} />}
        {currentPillar && (
          <PillarAssessmentStep
            pillarId={currentPillar}
            scores={rawScores[currentPillar] || {}}
            onChange={(subId, val) => updateScore(currentPillar, subId, val)}
            useDemo={demoMode}
          />
        )}
        {step === 5 && <ReviewStep intake={intake} rawScores={rawScores} />}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ opacity: step === 0 ? 0.4 : 1 }}>
          <ChevronLeft size={14} /> Previous
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setRawScores({ IQ: {}, EQ: {}, SQ: {}, AQ: {} })}>
            <RotateCcw size={13} /> Reset
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {saving ? 'Saving...' : <><Save size={14} /> Submit Assessment</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
