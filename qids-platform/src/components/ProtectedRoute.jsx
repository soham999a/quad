import { useTranslation } from 'react-i18next';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({
  children,
  allowedRoles
}) {
  const {
    t
  } = useTranslation();
  const {
    user,
    userProfile,
    loading
  } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bone)'
    }}>
        <div style={{
        textAlign: 'center'
      }}>
          <div style={{
          width: 40,
          height: 40,
          margin: '0 auto 12px',
          border: '1.5px solid var(--neutral-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
            <div style={{
            width: '50%',
            height: '50%',
            background: 'var(--gold)'
          }} />
          </div>
          <div style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--neutral-dim)'
        }}>{t("ProtectedRoute.loading")}</div>
        </div>
      </div>;
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const role = userProfile?.role || 'individual';
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }
  return children;
}