import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CONTEXTS } from '../../data/qidsData';
import { PLANS, PLAN_ORDER, getPlan } from '../../core/plans';

const ROLE_OPTIONS = ['individual', 'student', 'teacher', 'evaluator', 'employer', 'admin'];

const inputClass = "w-full h-11 px-3 bg-transparent border border-border text-on-surface font-technical-sm outline-none focus:border-gold transition-colors";

export default function Settings() {
  const { user, userProfile, updateUserFields, updateUserRole, changePassword, logout } = useAuth();
  const [name, setName] = useState(userProfile?.name || user?.displayName || '');
  const [context, setContext] = useState(userProfile?.context || 'individual');
  const [profileState, setProfileState] = useState({ saved: false, error: '', saving: false });
  const [roleError, setRoleError] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwState, setPwState] = useState({ saved: false, error: '', saving: false });

  const isEmailProvider = (user?.providerData || []).some(p => p.providerId === 'password');

  const currentPlanId = getPlan(userProfile?.plan).id;

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileState({ saved: false, error: '', saving: true });
    try {
      await updateUserFields(user.uid, { name: name.trim(), context });
      setProfileState({ saved: true, error: '', saving: false });
    } catch (err) {
      setProfileState({ saved: false, error: err.message || 'Could not save.', saving: false });
    }
  };

  const switchRole = async (role) => {
    setRoleError('');
    try {
      await updateUserRole(user.uid, role);
    } catch (err) {
      setRoleError(err.message || 'Could not switch role.');
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwState({ saved: false, error: '', saving: true });
    if (pwForm.next.length < 6) {
      setPwState({ saved: false, error: 'New password must be at least 6 characters.', saving: false });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwState({ saved: false, error: 'New passwords do not match.', saving: false });
      return;
    }
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwState({ saved: true, error: '', saving: false });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : err?.code === 'auth/requires-recent-login'
          ? 'Please sign out and back in, then retry.'
          : err.message || 'Could not update password.';
      setPwState({ saved: false, error: msg, saving: false });
    }
  };

  return (
    <div className="page-pad max-w-[1100px] mx-auto animate-fade">
      <section className="mb-10">
        <div className="kicker mb-3">Account</div>
        <h1 className="text-headline-md font-headline-md text-on-background page-headline">Settings.</h1>
        <div className="gradient-rule mt-6" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <section className="card p-6">
          <div className="label-eyebrow mb-5">PROFILE</div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="settings-name">Full name</label>
              <input id="settings-name" className={inputClass} value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="settings-email">Email</label>
              <input id="settings-email" className={`${inputClass} opacity-50`} value={user?.email || ''} disabled readOnly />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="settings-context">Context</label>
              <select id="settings-context" className={inputClass} value={context} onChange={e => setContext(e.target.value)}>
                {CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            {profileState.error && <p className="text-[12px] font-mono text-error">{profileState.error}</p>}
            {profileState.saved && (
              <p className="text-[12px] font-mono text-band-green flex items-center gap-2"><Check size={13} /> Profile saved.</p>
            )}
            <button type="submit" disabled={profileState.saving} className="btn-primary !py-2.5 !px-6 !text-[13px]">
              {profileState.saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="card p-6">
          <div className="label-eyebrow mb-5">ROLE</div>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
            Your role decides which console you land in and which tools are available.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROLE_OPTIONS.map(r => (
              <button key={r} type="button" onClick={() => switchRole(r)}
                className={`py-2.5 px-3 border text-left font-mono text-[11px] uppercase tracking-[0.1em] cursor-pointer transition-colors ${
                  (userProfile?.role || 'individual') === r
                    ? 'border-gold text-gold bg-gold-soft'
                    : 'border-border text-muted-foreground hover:text-on-surface hover:border-border-strong'
                }`}>
                {r}
              </button>
            ))}
          </div>
          {roleError && <p className="mt-3 text-[12px] font-mono text-error">{roleError}</p>}
        </section>

        <section className="card p-6">
          <div className="label-eyebrow mb-5">SECURITY</div>
          {isEmailProvider ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="pw-current">Current password</label>
                <input id="pw-current" type="password" className={inputClass} value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required autoComplete="current-password" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="pw-next">New password</label>
                  <input id="pw-next" type="password" className={inputClass} value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} required autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground mb-2" htmlFor="pw-confirm">Confirm new password</label>
                  <input id="pw-confirm" type="password" className={inputClass} value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required autoComplete="new-password" />
                </div>
              </div>
              {pwState.error && <p className="text-[12px] font-mono text-error">{pwState.error}</p>}
              {pwState.saved && (
                <p className="text-[12px] font-mono text-band-green flex items-center gap-2"><Check size={13} /> Password updated.</p>
              )}
              <button type="submit" disabled={pwState.saving} className="btn-outline !py-2.5 !px-6 !text-[13px]">
                {pwState.saving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          ) : (
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              This account signs in through Google. Password management is handled by your Google account.
            </p>
          )}
        </section>

        <section className="card card-gold p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="label-eyebrow-gold">PLAN</div>
            <span className="chip capitalize">{getPlan(userProfile?.plan).name} · {getPlan(userProfile?.plan).status === 'current' ? 'active' : 'pending'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
            {PLAN_ORDER.map(id => {
              const plan = PLANS[id];
              const isCurrent = id === currentPlanId;
              return (
                <div key={plan.id} className={`p-4 flex flex-col ${isCurrent ? 'bg-surface-2' : 'bg-background'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[17px]">{plan.name}</span>
                    <span className={plan.status === 'current' ? 'status-current text-gold' : 'status-proposed'}>
                      {plan.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="num text-[22px] mt-2">{plan.priceLabel}</div>
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <span className="text-gold mt-0.5">·</span>{f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <span className="chip mt-4 justify-center">Active plan</span>
                  ) : (
                    <button type="button" disabled className="btn-outline mt-4 !py-2 !text-[11px] w-full cursor-not-allowed">
                      {plan.status === 'proposed' ? 'Coming soon' : 'Not subscribed'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="card p-6 mt-4 md:mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="label-eyebrow mb-2">SESSION</div>
          <p className="text-[13px] text-muted-foreground">Signed in as {user?.email || '—'}</p>
        </div>
        <button onClick={() => logout()} className="btn-outline !py-2.5 !px-6 !text-[13px]">Sign out</button>
      </section>
    </div>
  );
}
