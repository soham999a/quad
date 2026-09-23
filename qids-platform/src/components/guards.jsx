import { useTranslation } from 'react-i18next';
import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlan, can } from '../core/plans';

/**
 * RoleRoute — route-level RBAC.
 *
 * The persona sidebar only *hides* links; this guard makes deep links
 * actually enforced. Always include 'admin' in the roles array where
 * admins should retain access.
 */
export function RoleRoute({
  roles,
  children
}) {
  const {
    userProfile
  } = useAuth();
  const location = useLocation();
  const role = userProfile?.role || 'individual';
  if (!roles?.length || roles.includes(role)) return children;
  return <Navigate to="/app/dashboard" replace state={{
    denied: location.pathname
  }} />;
}

/**
 * EntitlementRoute — gates a route behind a plan entitlement (plans.ts).
 * Renders a styled upsell panel instead of the page when the plan lacks it,
 * so the lock is enforced for deep links too, not just sidebar labels.
 */
export function EntitlementRoute({
  entitlement,
  feature,
  children
}) {
  const {
    userProfile
  } = useAuth();
  const plan = getPlan(userProfile?.plan);
  if (can(plan, entitlement)) return children;
  return <LockedPanel feature={feature} plan={plan} />;
}
function LockedPanel({
  feature,
  plan
}) {
  const {
    t
  } = useTranslation();
  return <div className="page-pad max-w-[560px] mx-auto animate-fade">
      <div className="border-[0.5px] border-outline-variant bg-surface-container-low p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
          <Lock size={18} strokeWidth={1.5} />
        </div>
        <div className="text-technical-sm font-technical-sm text-muted-foreground uppercase tracking-[0.2em] mb-3">{t("guards.plan_upgrade_required")}</div>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-4">
          {feature} isn't included in your plan
        </h2>
        <p className="text-body-md text-surface-variant leading-relaxed mb-8">
          You're currently on the <span className="text-on-surface">{plan.name}</span> plan.
          Upgrade to unlock {feature} and the rest of the toolkit that comes with it.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/mode" className="btn-primary">{t("guards.view_plans")}</Link>
          <button onClick={() => window.history.back()} className="btn-outline">{t("guards.go_back")}</button>
        </div>
      </div>
    </div>;
}