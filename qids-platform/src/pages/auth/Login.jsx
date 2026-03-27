import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) { setError(err.message || 'Google sign-in failed.'); setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--navy)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 60%)' }} />
        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Left panel — branding */}
      <div className="login-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 480 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}>
              <Brain size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em' }}>QIDS</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Intelligence Platform</div>
            </div>
          </div>

          <div style={{ marginBottom: 48 }}>
            <div className="badge badge-indigo" style={{ marginBottom: 20 }}>
              <Sparkles size={10} /> Patented Framework
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
              Unlock your<br />
              <span className="gradient-text">full potential</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380 }}>
              The world's most comprehensive holistic intelligence assessment platform — measuring IQ, EQ, SQ, and AQ.
            </p>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🧠', label: 'Four-pillar intelligence assessment' },
              { icon: '📊', label: 'Dynamic weighted scoring algorithm' },
              { icon: '🎯', label: 'Personalized intervention roadmap' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 10 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right" style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', position: 'relative', zIndex: 1, borderLeft: '1px solid var(--border-light)', background: 'rgba(8,13,26,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="login-right-inner" style={{ width: '100%', maxWidth: 380, animation: 'fadeInUp 0.5s cubic-bezier(0.4,0,0.2,1)' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Sign in to continue your journey</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#fca5a5' }}>
              <AlertCircle size={14} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 38 }} />
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ margin: 0 }}>Password</label>
                <span style={{ fontSize: 12, color: 'var(--indigo)', cursor: 'pointer' }}>Forgot password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingLeft: 38 }} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, borderRadius: 12 }}>
              {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Signing in...</> : <>Sign In <ArrowRight size={14} /></>}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>

          <button onClick={handleGoogle} disabled={loading} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, borderRadius: 12 }}>
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
