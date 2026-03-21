import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { CONTEXTS } from '../../data/qidsData';

const ROLES = [
  { id: 'individual', label: 'Individual', desc: 'Personal development journey' },
  { id: 'evaluator', label: 'Evaluator / Counselor', desc: 'Assess and guide others' },
  { id: 'admin', label: 'Institution Admin', desc: 'Manage an organization' },
];

export default function Signup() {
  const { signup, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'individual', context: 'individual' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — go straight to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.role, form.context);
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err.code, err.message);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // redirect-based — page reloads automatically
    } catch (err) {
      console.error('Google signup error:', err.code, err.message);
      setError(err.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--navy)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.1) 0%, transparent 60%)',
      padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          }}>
            <Brain size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start your QIDS development journey</p>
        </div>

        <div style={{ background: 'var(--navy-3)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#fca5a5',
            }}>
              <AlertCircle size={14} color="#ef4444" /> {error}
            </div>
          )}

          <form onSubmit={handleSignup}>
            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="text" placeholder="Your full name" value={form.name} onChange={e => set('name', e.target.value)} required style={{ paddingLeft: 34 }} />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required style={{ paddingLeft: 34 }} />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required style={{ paddingLeft: 34 }} />
                </div>
              </div>
              <div>
                <label>Confirm</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type="password" placeholder="••••••••" value={form.confirm} onChange={e => set('confirm', e.target.value)} required style={{ paddingLeft: 34 }} />
                </div>
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: 14 }}>
              <label>I am a...</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => set('role', r.id)} style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                    background: form.role === r.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.role === r.id ? 'var(--indigo)' : 'var(--border-light)'}`,
                    color: form.role === r.id ? 'white' : 'var(--text-secondary)',
                    fontSize: 11, fontWeight: 500, transition: 'all 0.15s',
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div style={{ marginBottom: 20 }}>
              <label>Application Context</label>
              <select value={form.context} onChange={e => set('context', e.target.value)}>
                {CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>

          <button onClick={handleGoogle} disabled={loading} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


