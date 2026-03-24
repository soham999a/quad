import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Brain, LayoutDashboard, Map, ClipboardList, Zap, TrendingUp, FileText, Settings,
  ChevronRight, Menu, Activity, LogOut, Home, BookOpen, ListChecks, X } from 'lucide-react';
import { CONTEXTS } from './data/qidsData';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { getLatestAssessment, getLatestPostAssessment } from './services/firestoreService';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import FrameworkMap from './pages/FrameworkMap';
import FourPillars from './pages/FourPillars';
import Assessment from './pages/Assessment';
import PreIntervention from './pages/PreIntervention';
import Intervention from './pages/Intervention';
import PostIntervention from './pages/PostIntervention';
import ReportGenerator from './pages/ReportGenerator';
import AdminConfig from './pages/AdminConfig';
import Questionnaires from './pages/Questionnaires';
import InterventionPlan from './pages/InterventionPlan';

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/', label: 'Overview', icon: LayoutDashboard },
      { path: '/framework', label: 'Framework Map', icon: Map },
      { path: '/pillars', label: 'Four Pillars', icon: Brain },
    ]
  },
  {
    label: 'Assessment Flow',
    items: [
      { path: '/assessment', label: 'Assessment', icon: ClipboardList },
      { path: '/pre-intervention', label: 'Pre-Intervention', icon: Activity },
      { path: '/intervention', label: 'Intervention', icon: Zap },
      { path: '/post-intervention', label: 'Post-Intervention', icon: TrendingUp },
    ]
  },
  {
    label: 'Reports & Config',
    items: [
      { path: '/questionnaires', label: 'Questionnaires', icon: ListChecks },
      { path: '/intervention-plan', label: 'Intervention Plan', icon: BookOpen },
      { path: '/report', label: 'Report Generator', icon: FileText },
      { path: '/admin', label: 'Admin / Config', icon: Settings },
    ]
  },
];

// Bottom nav items (most used, max 5)
const MOBILE_NAV = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/assessment', label: 'Assess', icon: ClipboardList },
  { path: '/pre-intervention', label: 'Pre', icon: Activity },
  { path: '/post-intervention', label: 'Post', icon: TrendingUp },
  { path: '/report', label: 'Report', icon: FileText },
];

const PHASE_COLORS = { '/pre-intervention': '#6366f1', '/intervention': '#a855f7', '/post-intervention': '#14b8a6' };

function Sidebar({ collapsed, setCollapsed }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <aside className="desktop-sidebar" style={{
      width: collapsed ? 60 : 228,
      minHeight: '100vh',
      background: 'var(--navy-2)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      overflow: 'hidden', zIndex: 20,
    }}>
      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 60 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}>
          <Brain size={17} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>QIDS</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Intelligence Platform</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '8px 10px 4px' }}>
                {group.label}
              </div>
            )}
            {group.items.map(({ path, label, icon: Icon }) => {
              const phaseColor = PHASE_COLORS[path];
              return (
                <NavLink key={path} to={path} end={path === '/' || path === '/dashboard'} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: collapsed ? '9px' : '8px 10px',
                  borderRadius: 9, marginBottom: 1,
                  textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive
                    ? phaseColor ? `linear-gradient(135deg, ${phaseColor}25, ${phaseColor}10)` : 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))'
                    : 'transparent',
                  borderLeft: isActive ? `2px solid ${phaseColor || 'var(--indigo)'}` : '2px solid transparent',
                  transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                })}>
                  <Icon size={14} style={{ flexShrink: 0, opacity: 0.9 }} />
                  {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
                </NavLink>
              );
            })}
            {!collapsed && <div style={{ height: 1, background: 'var(--border-light)', margin: '6px 4px' }} />}
          </div>
        ))}
      </nav>

      {user && (
        <div style={{ padding: '8px', borderTop: '1px solid var(--border-light)' }}>
          {!collapsed && (
            <div style={{ padding: '8px 10px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid var(--border-light)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>
                  {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userProfile?.name || user.displayName || 'User'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userProfile?.role || 'individual'}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start',
            padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', fontSize: 12, transition: 'all 0.15s', fontFamily: 'Inter',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={13} style={{ flexShrink: 0 }} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      )}

      <button onClick={() => setCollapsed(!collapsed)} style={{
        margin: '6px 8px 8px', padding: '7px', borderRadius: 8,
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
        color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = 'var(--indigo)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        {collapsed ? <ChevronRight size={13} /> : <Menu size={13} />}
      </button>
    </aside>
  );
}

function MobileNav({ onMenuOpen }) {
  const location = useLocation();
  return (
    <nav className="mobile-nav">
      {MOBILE_NAV.map(({ path, label, icon: Icon }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return (
          <NavLink key={path} to={path} end={path === '/'} className={`mobile-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        );
      })}
      <button className="mobile-nav-item" onClick={onMenuOpen}>
        <Menu size={18} />
        <span>More</span>
      </button>
    </nav>
  );
}

function MobileMenuDrawer({ onClose }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); onClose(); navigate('/login'); };

  return (
    <div className="mobile-menu-drawer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={15} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'Space Grotesk' }}>QIDS</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Intelligence Platform</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      {user && (
        <div style={{ padding: '10px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>
              {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{userProfile?.name || user.displayName || 'User'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{userProfile?.role || 'individual'}</div>
          </div>
        </div>
      )}

      {NAV_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6, paddingLeft: 4 }}>
            {group.label}
          </div>
          {group.items.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/' || path === '/dashboard'}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none', fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))' : 'transparent',
                borderLeft: isActive ? '2px solid var(--indigo)' : '2px solid transparent',
              })}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
        <button onClick={handleLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: 14, fontFamily: 'Inter', fontWeight: 500,
        }}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function TopBar({ context, setContext }) {
  return (
    <header style={{
      height: 52, background: 'rgba(8,13,26,0.9)', borderBottom: '1px solid var(--border-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', position: 'sticky', top: 0, zIndex: 10,
      backdropFilter: 'blur(12px)',
    }}>
      {/* Mobile: show logo */}
      <div className="mobile-topbar-logo">
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={13} color="white" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Space Grotesk' }}>QIDS</span>
      </div>

      {/* Desktop: phase buttons */}
      <div className="topbar-phases" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {['All Phases', 'Pre-Intervention', 'Intervention', 'Post-Intervention'].map(p => (
          <button key={p} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>{p}</button>
        ))}
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select value={context} onChange={e => setContext(e.target.value)} style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}>
          {CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <NavLink to="/report" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary btn-sm">
            <FileText size={12} /> <span className="topbar-export-label">Export</span>
          </button>
        </NavLink>
      </div>
    </header>
  );
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [context, setContext] = useState('individual');
  const [assessmentData, setAssessmentData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    getLatestAssessment(user.uid).then(a => { if (a) setAssessmentData(a); });
    getLatestPostAssessment(user.uid).then(p => { if (p) setPostData(p); });
  }, [user]);

  return (
    <AppContext.Provider value={{ context, setContext, assessmentData, setAssessmentData, postData, setPostData, demoMode: false }}>
      <div className="app-shell-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar context={context} setContext={setContext} />
          <main style={{ flex: 1, overflow: 'auto', background: 'var(--navy)' }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Overview />} />
              <Route path="/framework" element={<FrameworkMap />} />
              <Route path="/pillars" element={<FourPillars />} />
              <Route path="/pillars/:pillarId" element={<FourPillars />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/pre-intervention" element={<PreIntervention />} />
              <Route path="/intervention" element={<Intervention />} />
              <Route path="/post-intervention" element={<PostIntervention />} />
              <Route path="/report" element={<ReportGenerator />} />
              <Route path="/admin" element={<AdminConfig />} />
              <Route path="/questionnaires" element={<Questionnaires />} />
              <Route path="/intervention-plan" element={<InterventionPlan />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <MobileNav onMenuOpen={() => setMobileMenuOpen(true)} />
        {mobileMenuOpen && <MobileMenuDrawer onClose={() => setMobileMenuOpen(false)} />}
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            } />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
