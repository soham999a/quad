import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const colors = {
            success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '#10b981', text: '#34d399' },
            error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: '#ef4444', text: '#fca5a5' },
            info:    { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  icon: '#6366f1', text: '#a5b4fc' },
          }[t.type] || {};
          const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertCircle : Info;
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 12, minWidth: 260, maxWidth: 360,
              background: colors.bg, border: `1px solid ${colors.border}`,
              backdropFilter: 'blur(12px)', pointerEvents: 'all',
              animation: 'fadeInUp 0.25s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <Icon size={15} color={colors.icon} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.text, flex: 1 }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, padding: 2, opacity: 0.6 }}>
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
