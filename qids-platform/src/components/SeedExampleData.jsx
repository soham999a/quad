import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { saveAssessment, savePostAssessment } from '../services/firestoreService';
import { PILLARS, DEMO_SCORES, DEMO_POST_SCORES } from '../data/qidsData';
import { computePillarScore } from '../core/engine/qids';
import { Sparkles, CheckCircle, Loader } from 'lucide-react';
const EXAMPLE_INTAKE = {
  name: 'Arjun Sharma',
  age: '14',
  institution: 'Sunrise Academy, Kolkata',
  evaluator: 'Dr. Priya Banerjee',
  purpose: 'Holistic intelligence baseline assessment for Grade 9 student as part of the QIDS development program.',
  consent: true
};
export default function SeedExampleData({
  onDone
}) {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const {
    setAssessmentData,
    setPostData
  } = useApp();
  const [status, setStatus] = useState('idle'); // idle | loading | done | error

  const handleSeed = async () => {
    if (!user) return;
    setStatus('loading');
    try {
      // Build pre-assessment
      const pillarScores = {};
      Object.keys(PILLARS).forEach(id => {
        pillarScores[id] = computePillarScore(id, DEMO_SCORES[id] || {});
      });
      const preData = {
        intake: EXAMPLE_INTAKE,
        rawScores: DEMO_SCORES,
        pillarScores,
        timestamp: new Date().toISOString()
      };

      // Build post-assessment
      const postPillarScores = {};
      Object.keys(PILLARS).forEach(id => {
        postPillarScores[id] = computePillarScore(id, DEMO_POST_SCORES[id] || {});
      });
      const postData = {
        intake: EXAMPLE_INTAKE,
        rawScores: DEMO_POST_SCORES,
        pillarScores: postPillarScores,
        timestamp: new Date().toISOString()
      };
      const preId = await saveAssessment(user.uid, preData);
      await savePostAssessment(user.uid, preId, postData);

      // Update app context immediately
      setAssessmentData(preData);
      setPostData(postData);
      setStatus('done');
      setTimeout(() => {
        onDone?.();
      }, 1200);
    } catch (e) {
      console.error('Seed failed:', e);
      setStatus('error');
    }
  };
  if (status === 'done') {
    return <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 16px',
      background: 'color-mix(in srgb, var(--status-ok) 10%, transparent)',
      border: '1px solid color-mix(in srgb, var(--status-ok) 30%, transparent)',
      borderRadius: 10,
      fontSize: 13,
      color: 'var(--status-ok)'
    }}>
        <CheckCircle size={14} />{t("SeedExampleData.example_data_loaded_explore")}</div>;
  }
  return <div style={{
    padding: '16px 20px',
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--phase-pre) 10%, transparent), color-mix(in srgb, var(--phase-int) 7%, transparent))',
    border: '1px solid var(--phase-pre-line)',
    borderRadius: 14
  }}>
      <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16
    }}>
        <div>
          <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4
        }}>
            <Sparkles size={13} color="var(--phase-pre-soft)" />
            <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--phase-pre-pale)'
          }}>{t("SeedExampleData.load_example_assessment")}</span>
          </div>
          <p style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: 1.5
        }}>{t("SeedExampleData.populate_your_account_with")}</p>
          {status === 'error' && <p style={{
          fontSize: 11,
          color: 'var(--status-err-soft)',
          marginTop: 6
        }}>{t("SeedExampleData.something_went_wrong_check")}</p>}
        </div>
        <button onClick={handleSeed} disabled={status === 'loading'} className="btn btn-primary btn-sm" style={{
        flexShrink: 0,
        whiteSpace: 'nowrap'
      }}>
          {status === 'loading' ? <><Loader size={12} className="animate-spin" />{t("SeedExampleData.loading")}</> : <><Sparkles size={12} />{t("SeedExampleData.load_example")}</>}
        </button>
      </div>
    </div>;
}