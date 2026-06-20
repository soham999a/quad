import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--navy)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.5s infinite',
          }}>
            <span style={{ color: 'white', fontSize: 18 }}>Q</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && allowedRoles.length > 0) {
    const role = userProfile?.role || 'individual';
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return children;
}