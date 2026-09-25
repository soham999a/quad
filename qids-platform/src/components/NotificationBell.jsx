import { useTranslation } from 'react-i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';
import { Bell, ClipboardList, UserPlus, UserCheck, CheckCircle2 } from 'lucide-react';

const TYPE_ICON = {
  assignment: ClipboardList,
  join: UserPlus,
  evaluator: UserCheck,
  attempt: CheckCircle2,
};

const TYPE_COLOR = {
  assignment: 'var(--phase-pre)',
  join: 'var(--status-ok)',
  evaluator: 'var(--status-warn)',
  attempt: 'var(--status-ok)',
};

/**
 * NotificationBell — topbar bell with live unread badge and dropdown feed.
 * Real-time via Firestore onSnapshot; opening the feed doesn't mark things
 * read (explicit action does), so nothing is silently swallowed.
 */
export default function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
    return subscribeNotifications(user.uid, setItems);
  }, [user]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc, true);
    };
  }, [open]);

  const unread = items.filter(n => !n.read).length;

  const openItem = async (n) => {
    if (!n.read) markNotificationRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const markAll = () => markAllNotificationsRead(user?.uid);

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative" data-tour="notifications">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={t('nav.notifications')}
        title={t('nav.notifications')}
        aria-haspopup="true"
        aria-expanded={open}
        className="w-9 h-9 flex-shrink-0 hidden md:inline-flex relative items-center justify-center border border-sidebar-border text-muted-foreground hover:text-gold hover:border-gold/60 transition-colors cursor-pointer bg-transparent"
      >
        <Bell size={14} strokeWidth={1.5} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full text-[9px] font-mono text-on-primary"
            style={{ background: 'var(--status-err, #d64545)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t('nav.notifications')}
          className="absolute right-0 top-full mt-2 w-[340px] max-w-[92vw] border border-sidebar-border bg-surface-container-lowest z-[130]"
          style={{ boxShadow: '0 16px 48px color-mix(in oklab, var(--background) 55%, transparent)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b-[0.5px] border-sidebar-border">
            <span className="text-technical-sm font-technical-sm uppercase tracking-widest text-muted-foreground">
              {t('nav.notifications')}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-[11px] font-mono uppercase tracking-wider text-primary hover:text-gold bg-transparent border-none cursor-pointer"
              >
                {t('notifications.mark_all_read')}
              </button>
            )}
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-body-sm font-body-sm text-surface-variant">
                {t('notifications.nothing_yet')}
              </div>
            ) : (
              items.map(n => {
                const Icon = TYPE_ICON[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openItem(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-none cursor-pointer border-b-[0.5px] border-sidebar-border transition-colors ${n.read ? 'bg-transparent opacity-70' : 'bg-surface-container-low hover:bg-surface-container'}`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `color-mix(in srgb, ${TYPE_COLOR[n.type] || 'var(--gold)'} 15%, transparent)` }}
                    >
                      <Icon size={13} style={{ color: TYPE_COLOR[n.type] || 'var(--gold)' }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-label-sm font-label-sm text-on-background">
                        {n.title}
                        {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full ml-2 align-middle" style={{ background: 'var(--gold)' }} />}
                      </span>
                      {n.body && <span className="block text-body-sm font-body-sm text-on-surface-variant mt-0.5">{n.body}</span>}
                      {n.createdAt?.toDate && (
                        <span className="block text-[10px] font-mono text-surface-variant mt-1">
                          {n.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {' · '}
                          {n.createdAt.toDate().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
