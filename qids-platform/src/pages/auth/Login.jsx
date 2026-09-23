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
  return <div className="min-h-screen flex items-center justify-center bg-background p-margin-mobile md:p-0 relative">
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 256 256%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>')]\"></div>

      {/* Login Container */}
      <main className="w-full max-w-[480px] flex flex-col space-y-12 relative z-10">
        {/* Branding */}
        <header className="flex flex-col space-y-3">
          <div className="flex items-center gap-3">
            <QidsMark size={26} className="text-gold" />
            <span className="font-mono text-[12px] tracking-[0.28em] text-on-surface">{t("Login.qids")}</span>
          </div>
          <p className="text-[24px] leading-tight font-light text-on-surface tracking-tight">
            {t('auth.brand_line1')}<br />{t('auth.brand_line2')}
          </p>
        </header>

        {/* Form */}
        <section className="flex flex-col space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <span className="text-technical-sm font-technical-sm text-outline uppercase tracking-widest">
                {t('auth.sign_in')}
              </span>
              <div className="w-full h-[0.5px] bg-outline-variant"></div>
            </div>

            {error && <div className="p-4 border-[0.5px] border-error/50 text-technical-sm font-technical-sm text-error">
                {error}
              </div>}

            <form className="flex flex-col space-y-6 pt-4" onSubmit={handleLogin}>
              <div className="flex flex-col space-y-2">
                <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase" htmlFor="email">{t('auth.email')}</label>
                <input className="w-full h-12 px-4 bg-surface border border-outline-variant rounded-sm text-on-surface placeholder:text-surface-variant font-technical-sm transition-all outline-none focus:border-primary" id="email" placeholder={t('auth.email_ph')} type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-technical-sm font-technical-sm text-on-surface-variant uppercase" htmlFor="password">{t('auth.access_key')}</label>
                  <button type="button" onClick={handleForgotPassword} className="text-technical-sm font-technical-sm text-primary hover:underline transition-all cursor-pointer bg-transparent border-none">
                    {t('auth.recovery')}
                  </button>
                </div>
                <div className="relative">
                  <input className="w-full h-12 px-4 pr-12 bg-surface border border-outline-variant rounded-sm text-on-surface placeholder:text-surface-variant font-technical-sm transition-all outline-none focus:border-primary" id="password" placeholder="••••••••••••" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent border-none cursor-pointer text-surface-variant hover:text-on-surface transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full h-12 bg-on-surface text-background font-label-md text-label-md rounded-sm hover:bg-gold hover:text-ink active:scale-[0.99] transition-colors flex items-center justify-center uppercase tracking-widest cursor-pointer border-none disabled:opacity-40">
                {loading ? t('auth.signing_in') : t('auth.sign_in')}
              </button>
            </form>
          </div>

          {/* Social */}
          <div className="flex flex-col space-y-4">
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t-[0.5px] border-outline-variant"></div>
              <span className="flex-shrink mx-4 text-technical-sm font-technical-sm text-on-surface-variant uppercase">{t('auth.auth_proxy')}</span>
              <div className="flex-grow border-t-[0.5px] border-outline-variant"></div>
            </div>
            <button onClick={handleGoogle} disabled={loading} className="w-full h-12 border border-outline-variant bg-transparent text-on-surface font-label-md text-label-md rounded-sm hover:bg-surface-container-low transition-colors flex items-center justify-center gap-3 uppercase tracking-widest cursor-pointer disabled:opacity-40">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path>
              </svg>
              {t('auth.continue_google')}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 text-center">
          <p className="text-technical-sm font-technical-sm text-on-surface-variant">
            {t('auth.new_here')}
            <Link to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} className="text-primary ml-2 inline-block -my-2 py-2 hover:underline tracking-widest font-medium no-underline">{t('auth.request_access')}</Link>
          </p>
          <div className="mt-6 max-w-[240px] mx-auto"><LanguageSwitcher expanded /></div>
        </footer>
      </main>

      {/* Reset sent toast */}
      {resetSent && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-surface-container-low border-[0.5px] border-primary/50 flex items-center gap-3 animate-fade-up">
          <Check size={16} className="text-primary" />
          <span className="text-technical-sm font-technical-sm text-on-surface">{t('auth.reset_sent')}</span>
        </div>}

      {/* Role picker modal */}
      {showRolePicker && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="bg-surface border-[0.5px] border-outline-variant p-8 w-[90%] max-w-[400px] animate-fade-up">
            <h3 className="text-headline-md font-headline-md text-on-surface mb-2">{t('auth.choose_role')}</h3>
            <p className="text-technical-sm font-technical-sm text-on-surface-variant mb-6">{t('auth.choose_role_desc')}</p>
            <div className="flex flex-col gap-3 mb-6">
              {ROLE_IDS.map(id => <button key={id} type="button" onClick={() => setSelectedRole(id)} className={`flex items-center gap-3 p-4 border-[0.5px] text-left w-full cursor-pointer transition-all bg-transparent ${selectedRole === id ? 'border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'}`}>
                  <div className="flex-1">
                    <div className="text-label-md font-label-md">{t(`auth.roles.${id}.label`)}</div>
                    <div className="text-technical-sm font-technical-sm text-on-surface-variant">{t(`auth.roles.${id}.desc`)}</div>
                  </div>
                  {selectedRole === id && <Check size={16} className="text-primary" />}
                </button>)}
            </div>
            <button onClick={handleGoogleRoleConfirm} disabled={loading} className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-all flex items-center justify-center uppercase tracking-widest cursor-pointer border-none disabled:opacity-50">
              {loading ? t('auth.setting_up') : t('auth.continue')}
            </button>
          </div>
        </div>}
    </div>;
}