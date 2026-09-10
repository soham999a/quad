import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    timersRef.current[id] = setTimeout(() => {
      delete timersRef.current[id];
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const remove = (id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed', bottom: 80, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const colors = {
            success: { bg: 'color-mix(in srgb, var(--status-ok) 12%, transparent)', border: 'color-mix(in srgb, var(--status-ok) 30%, transparent)', icon: 'var(--status-ok)', text: 'var(--status-ok-soft)' },
            error:   { bg: 'color-mix(in srgb, var(--status-err) 12%, transparent)', border: 'color-mix(in srgb, var(--status-err) 30%, transparent)', icon: 'var(--status-err)', text: 'var(--status-err-soft)' },
            info:    { bg: 'color-mix(in srgb, var(--phase-pre) 12%, transparent)', border: 'color-mix(in srgb, var(--phase-pre) 30%, transparent)', icon: 'var(--phase-pre)', text: 'var(--phase-pre-pale)' },
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
              <button onClick={() => remove(t.id)} aria-label="Dismiss notification" style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, padding: 2, opacity: 0.6 }}>
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
