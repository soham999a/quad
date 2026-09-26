import usePageTitle from '../../lib/usePageTitle';
import React, { useState } from 'react';
import { useNavigate, Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { destinationFor, sanitizeNext } from '../../lib/flow';
import friendlyAuthError from '../../lib/authErrors';
import { logEvent } from '../../lib/analytics';
import { auth } from '../../firebase';
import { Check, Eye, EyeOff } from 'lucide-react';
import QidsMark from '../../components/QidsMark';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import AuthShell from '../../components/AuthShell';

// NOTE: 'admin' is intentionally not self-selectable — it is a privileged role
// granted by an existing admin (Firebase console until workspace RBAC ships).
const ROLE_IDS = ['individual', 'student', 'teacher', 'evaluator', 'employer'];
export default function Login() {
  usePageTitle('Sign in');
  const {
    t
  } = useTranslation();
  const {
    login,
    loginWithGoogle,
    resetPassword,
    updateUserRole,
    refreshProfile,
    user,
    userProfile
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = sanitizeNext(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('individual');
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingGoogleFlow, setPendingGoogleFlow] = useState(false);
  if (user && !pendingGoogleFlow) return <Navigate to={next || destinationFor(userProfile?.role)} replace />;
  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const {
        profile
      } = await login(email, password);
      logEvent(auth.currentUser?.uid, 'signed_in', {
        method: 'email'
      });
      navigate(next || destinationFor(profile?.role));
    } catch (err) {
      setError(friendlyAuthError(err, t('auth.login_failed')));
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    setPendingGoogleFlow(true);
    try {
      const result = await loginWithGoogle();
      if (result.isNew) {
        setPendingGoogleUser(result.user);
        setShowRolePicker(true);
      } else {
        setPendingGoogleFlow(false);
        navigate(next || '/app/dashboard');
      }
    } catch (err) {
      setError(friendlyAuthError(err, t('auth.google_failed')));
      setPendingGoogleFlow(false);
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleRoleConfirm = async () => {
    setLoading(true);
    try {
      await updateUserRole(pendingGoogleUser.uid, selectedRole);
      await refreshProfile();
      setPendingGoogleFlow(false);
      navigate(next || destinationFor(selectedRole));
    } catch (err) {
      setError(friendlyAuthError(err, t('auth.role_failed')));
    } finally {
      setShowRolePicker(false);
      setLoading(false);
      setPendingGoogleUser(null);
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      setError(t('auth.enter_email_first'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(friendlyAuthError(err, t('auth.reset_failed')));
    } finally {
      setLoading(false);
    }
  };
  return <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* ── Brand panel — the atlas (desktop only) ───────────────────────── */}
      <AuthShell />

      {/* ── Form panel ───────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center p-margin-mobile md:p-0">
        {/* Grain texture overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 256 256%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]"></div>

        <main className="z-10 flex w-full max-w-[440px] flex-col space-y-10 py-12">
          {/* The single document heading — visible brand block stays presentational */}
          <h1 className="sr-only">{t('auth.brand_line1')} {t('auth.brand_line2')}</h1>
          <header className="flex flex-col space-y-3 lg:hidden">
            <div className="flex items-center gap-3">
              <QidsMark size={26} className="text-gold" />
              <span className="font-mono text-[12px] tracking-[0.28em] text-on-surface">QiDS</span>
            </div>
            <p className="text-[24px] font-light leading-tight tracking-tight text-on-surface">
              {t('auth.brand_line1')}<br />{t('auth.brand_line2')}
            </p>
          </header>

          {/* Form */}
          <section className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <span className="font-technical-sm text-technical-sm uppercase tracking-widest text-outline">
                {t('auth.sign_in')}
              </span>
              <div className="h-[0.5px] w-full bg-outline-variant"></div>
            </div>

            {error && <div className="border-[0.5px] border-error/50 p-4 font-technical-sm text-technical-sm text-error">
                {error}
              </div>}

            <form className="flex flex-col space-y-6 pt-2" onSubmit={handleLogin}>
              <div className="flex flex-col space-y-2">
                <label className="font-technical-sm text-technical-sm uppercase text-on-surface-variant" htmlFor="email">{t('auth.email')}</label>
                <input className="h-12 w-full rounded-sm border border-outline-variant bg-surface px-4 font-technical-sm text-technical-sm text-on-surface outline-none transition-all placeholder:text-surface-variant focus:border-primary" id="email" placeholder={t('auth.email_ph')} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-technical-sm text-technical-sm uppercase text-on-surface-variant" htmlFor="password">{t('auth.access_key')}</label>
                  <button type="button" onClick={handleForgotPassword} className="cursor-pointer border-none bg-transparent font-technical-sm text-technical-sm text-primary transition-all hover:underline">
                    {t('auth.recovery')}
                  </button>
                </div>
                <div className="relative">
                  <input className="h-12 w-full rounded-sm border border-outline-variant bg-surface px-4 pr-12 font-technical-sm text-technical-sm text-on-surface outline-none transition-all placeholder:text-surface-variant focus:border-primary" id="password" placeholder="••••••••••••" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent p-1 text-surface-variant transition-colors hover:text-on-surface">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="flex h-12 w-full cursor-pointer items-center justify-center rounded-sm border-none bg-on-surface font-label-md text-label-md uppercase tracking-widest text-background transition-colors hover:bg-gold hover:text-ink active:scale-[0.99] disabled:opacity-40">
                {loading ? t('auth.signing_in') : t('auth.sign_in')}
              </button>
            </form>
          </section>

          {/* Social */}
          <div className="flex flex-col space-y-4">
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t-[0.5px] border-outline-variant"></div>
              <span className="mx-4 flex-shrink font-technical-sm text-technical-sm uppercase text-on-surface-variant">{t('auth.auth_proxy')}</span>
              <div className="flex-grow border-t-[0.5px] border-outline-variant"></div>
            </div>
            <button onClick={handleGoogle} disabled={loading} className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-sm border border-outline-variant bg-transparent font-label-md text-label-md uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-40">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path>
              </svg>
              {t('auth.continue_google')}
            </button>
          </div>

          {/* Footer */}
          <footer className="pt-6 text-center">
            <p className="font-technical-sm text-technical-sm text-on-surface-variant">
              {t('auth.new_here')}
              <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} className="ml-2 inline-block -my-2 py-2 font-medium tracking-widest text-primary no-underline hover:underline">{t('auth.request_access')}</Link>
            </p>
            <div className="mx-auto mt-6 max-w-[240px]"><LanguageSwitcher expanded /></div>
          </footer>
        </main>

        {/* Reset sent toast */}
        {resetSent && <div className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-3 border-[0.5px] border-primary/50 bg-surface-container-low px-6 py-4 fade-up">
            <Check size={16} className="text-primary" />
            <span className="font-technical-sm text-technical-sm text-on-surface">{t('auth.reset_sent')}</span>
          </div>}

        {/* Role picker modal */}
        {showRolePicker && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
            <div className="w-[90%] max-w-[400px] border-[0.5px] border-outline-variant bg-surface p-8 fade-up">
              <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">{t('auth.choose_role')}</h3>
              <p className="mb-6 font-technical-sm text-technical-sm text-on-surface-variant">{t('auth.choose_role_desc')}</p>
              <div className="mb-6 flex flex-col gap-3">
                {ROLE_IDS.map(id => <button key={id} type="button" onClick={() => setSelectedRole(id)} className={`flex w-full cursor-pointer items-center gap-3 border-[0.5px] bg-transparent p-4 text-left transition-all ${selectedRole === id ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'}`}>
                    <div className="flex-1">
                      <div className="font-label-md text-label-md">{t(`auth.roles.${id}.label`)}</div>
                      <div className="font-technical-sm text-technical-sm text-on-surface-variant">{t(`auth.roles.${id}.desc`)}</div>
                    </div>
                    {selectedRole === id && <Check size={16} className="text-primary" />}
                  </button>)}
              </div>
              <button onClick={handleGoogleRoleConfirm} disabled={loading} className="flex h-12 w-full cursor-pointer items-center justify-center border-none bg-primary font-label-md text-label-md uppercase tracking-widest text-on-primary transition-all hover:opacity-90 disabled:opacity-50">
                {loading ? t('auth.setting_up') : t('auth.continue')}
              </button>
            </div>
          </div>}
      </div>
    </div>;
}
