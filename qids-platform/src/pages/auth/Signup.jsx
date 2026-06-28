import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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

  if (user) return <Navigate to="/app/dashboard" replace />;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name, form.role, form.context);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.isNew) {
        setError('Account created. You can now sign in with Google.');
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 px-4 bg-background border-[0.5px] border-outline-variant rounded-xl text-on-surface placeholder:text-surface-variant font-technical-sm transition-all outline-none focus:border-primary focus:shadow-[0_0_0_1px_#ebc073]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-margin-mobile md:p-0 relative">
      {/* Grain texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 256 256%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]"></div>

      <main className="w-full max-w-[480px] flex flex-col space-y-8 relative z-10">
        {/* Branding */}
        <header className="flex flex-col space-y-2">
          <h1 className="text-headline-md font-headline-md text-primary tracking-tight">QIDS</h1>
          <p className="text-[24px] leading-tight font-medium text-on-surface">
            Quadrant Intelligence Diagnostic System
          </p>
        </header>

        {/* Form */}
        <section className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <span className="text-technical-sm font-technical-sm text-outline uppercase tracking-widest">
              § · Registration
            </span>
            <div className="w-full h-[0.5px] bg-outline-variant"></div>
          </div>

          {error && (
            <div className="p-4 border-[0.5px] border-error/50 text-technical-sm font-technical-sm text-error">
              {error}
            </div>
          )}

          <form className="flex flex-col space-y-5 pt-4" onSubmit={handleSignup}>
            <div className="flex flex-col space-y-2">
              <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase" htmlFor="name">Full Name</label>
              <input className={inputClass} id="name" placeholder="Your full name" type="text" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase" htmlFor="email">Email Address</label>
              <input className={inputClass} id="email" placeholder="architect@qids.internal" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase" htmlFor="password">Access Key</label>
                <input className={inputClass} id="password" placeholder="••••••••" type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase" htmlFor="confirm">Confirm Key</label>
                <input className={inputClass} id="confirm" placeholder="••••••••" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase">Classification</label>
              <div className="flex gap-3">
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => set('role', r.id)}
                    className={`flex-1 py-3 px-2 border-[0.5px] text-center text-technical-sm font-technical-sm transition-all cursor-pointer bg-transparent ${form.role === r.id ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
                      }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase">Context</label>
              <select value={form.context} onChange={e => set('context', e.target.value)}
                className="w-full h-12 px-4 bg-background border-[0.5px] border-outline-variant rounded-xl text-on-surface font-technical-sm outline-none focus:border-primary cursor-pointer">
                {CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-widest cursor-pointer border-none disabled:opacity-50">
              {loading ? 'Processing...' : 'Register'}
            </button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t-[0.5px] border-outline-variant"></div>
            <span className="flex-shrink mx-4 text-technical-sm font-technical-sm text-on-surface-variant uppercase">Proxy</span>
            <div className="flex-grow border-t-[0.5px] border-outline-variant"></div>
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full h-12 border-[0.5px] border-outline-variant bg-transparent text-on-surface font-label-md text-label-md rounded-xl hover:bg-surface-container-low transition-all flex items-center justify-center gap-3 uppercase tracking-widest cursor-pointer disabled:opacity-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path>
            </svg>
            Continue with Google
          </button>
        </section>

        <footer className="pt-4 text-center">
          <p className="text-technical-sm font-technical-sm text-on-surface-variant">
            EXISTING PERSONNEL?
            <Link to="/login" className="text-primary ml-2 hover:underline tracking-widest font-medium no-underline">SIGN IN</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
