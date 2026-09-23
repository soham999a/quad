import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOnboarding } from '../services/onboardingService';
import { getUserAssessments } from '../services/firestoreService';

/**
 * Gates the authenticated app shell behind onboarding completion.
 *
 * Users who have explicitly completed onboarding pass through. New users
 * (no onboarding doc AND no prior assessment activity) are routed into the
 * wizard. Existing users with established activity are treated as onboarded
 * (migration path) so the feature never traps a live dashboard user.
 *
 * The onboarding page's "Skip for now" writes completed=true, so nobody is
 * ever hard-trapped.
 */
export default function OnboardingGate({
  children
}) {
  const {
    t
  } = useTranslation();
  const {
    user
  } = useAuth();
  const location = useLocation();
  const [state, setState] = useState({
    loading: true,
    pass: false
  });
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setState({
        loading: false,
        pass: false
      });
      return;
    }
    setState({
      loading: true,
      pass: false
    });
    (async () => {
      const saved = await getOnboarding(user.uid);
      if (cancelled) return;
      if (saved && saved.completed === true) {
        setState({
          loading: false,
          pass: true
        });
        return;
      }
      if (saved && !saved.completed) {
        setState({
          loading: false,
          pass: false
        });
        return;
      }
      // No onboarding doc: distinguish established users from brand-new ones.
      const activity = await getUserAssessments(user.uid);
      if (cancelled) return;
      setState({
        loading: false,
        pass: Array.isArray(activity) && activity.length > 0
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);
  if (state.loading) {
    return <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("OnboardingGate.loading")}</span>
      </div>;
  }
  if (!state.pass) {
    return <Navigate to="/onboarding" replace state={{
      from: location.pathname
    }} />;
  }
  return children;
}