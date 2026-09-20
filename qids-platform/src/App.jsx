import React, { useState, createContext, useContext, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useLocation, Outlet } from 'react-router-dom';
import {
  Brain, Map, ClipboardList, TrendingUp, FileText, UserCheck,
  ChevronRight, Menu, LogOut, Home, BookOpen, X, Shield, Users, Sparkles, Building2, Target, Lock,
  PanelLeftClose, PanelLeftOpen,
  Settings as SettingsIcon,
  Search, Sun, Moon, LayoutGrid, History,
} from 'lucide-react';
import { PILLARS, mergeEvaluationScores } from './data/qidsData';
import QidsMark from './components/QidsMark';
import CommandPalette from './components/CommandPalette';
import EmptyState from './components/EmptyState';
import { computePillarScore } from './core/engine/qids';
import { getPlan, can } from './core/plans';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './lib/theme';
import useModalA11y from './lib/useModalA11y';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGate from './components/OnboardingGate';
import { RoleRoute, EntitlementRoute } from './components/guards';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle';
import { ToastProvider } from './components/Toast';
import { getLatestAssessment, getLatestPostAssessment, getAllEvaluations } from './services/firestoreService';

// eagerly loaded (always on the critical path)
import Landing from './pages/Landing';
import Mode from './pages/Mode';
import Login from './pages/auth/Login';

// lazily loaded — each persona/page splits into its own chunk
const Onboarding = lazy(() => import('./pages/onboarding/Onboarding'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Settings = lazy(() => import('./pages/account/Settings'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FrameworkMap = lazy(() => import('./pages/FrameworkMap'));
const FourPillars = lazy(() => import('./pages/FourPillars'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Progress = lazy(() => import('./pages/Progress'));
const ReportGenerator = lazy(() => import('./pages/ReportGenerator'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const EvaluatorDashboard = lazy(() => import('./pages/evaluator/EvaluatorDashboard'));
const EvaluatorScoring = lazy(() => import('./pages/evaluator/EvaluatorScoring'));
const MyEvaluator = lazy(() => import('./pages/student/MyEvaluator'));
const Questionnaires = lazy(() => import('./pages/Questionnaires'));
const InterventionPlan = lazy(() => import('./pages/InterventionPlan'));
const EnterpriseRunner = lazy(() => import('./pages/enterprise/EnterpriseRunner'));
const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard'));
const IndividualOnboarding = lazy(() => import('./pages/individual/IndividualOnboarding'));
const IndividualResults = lazy(() => import('./pages/individual/IndividualResults'));
const IndividualCredential = lazy(() => import('./pages/individual/IndividualCredential'));
const InterviewerDashboard = lazy(() => import('./pages/interview/InterviewerDashboard'));
const InterviewSetup = lazy(() => import('./pages/interview/InterviewSetup'));
const InterviewPostScoring = lazy(() => import('./pages/interview/InterviewPostScoring'));
const InterviewLive = lazy(() => import('./pages/interview/InterviewLive'));
const InterviewReport = lazy(() => import('./pages/interview/InterviewReport'));
const TeacherDashboard = lazy(() => import('./pages/school/TeacherDashboard'));
const ClassManager = lazy(() => import('./pages/school/ClassManager'));
const ClassAnalytics = lazy(() => import('./pages/school/ClassAnalytics'));
const StudentJoin = lazy(() => import('./pages/school/StudentJoin'));
const SchoolReports = lazy(() => import('./pages/school/SchoolReports'));
const PublicCredential = lazy(() => import('./pages/credential/PublicCredential'));

function PageSuspense({ children }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
  );
}

/** Thin gold route-transition bar under the topbar while a chunk loads. */
function RouteTransitionBar() {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(true);
    const t = setTimeout(() => setActive(false), 450);
    return () => clearTimeout(t);
  }, [pathname]);
  return (
    <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: active ? '100%' : '0%',
          opacity: active ? 1 : 0,
          background: 'linear-gradient(90deg, var(--gold-bright), var(--gold))',
        }}
      />
    </div>
  );
}

/** Editorial page-shaped loading skeleton (uses the shared shimmer utility). */
function PageSkeleton() {
  return (
    <div className="page-pad max-w-[960px] mx-auto animate-fade" aria-busy="true" aria-label="Loading page">
      <div className="skeleton h-3 w-28 mb-4" />
      <div className="skeleton h-8 w-72 max-w-full mb-3" />
      <div className="skeleton h-px w-full mb-10" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-24" style={{ animationDelay: `${i * 120}ms` }} />)}
      </div>
      <div className="skeleton h-32 w-full" />
    </div>
  );
}

/** Scrolls to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

// ─── Persona-aware navigation ────────────────────────────────────────────────
// Each audience sees its own information architecture under one shared shell.
// Routes unchanged; how they're surfaced adapts to persona. (Blueprint §5.1)

export function personaFor(role) {
  if (role === 'teacher') return 'teacher';
  if (role === 'evaluator') return 'evaluator';
  if (role === 'employer') return 'employer';
  if (role === 'admin') return 'admin';
  return 'individual';
}

function nav(id, groups) {
  return { id, groups };
}

const PERSONA_NAV = {
  individual: nav('individual', [
    {
      label: 'PLATFORM',
      items: [
        { path: '/app/dashboard', label: 'Home', icon: Home },
        { path: '/app/individual', label: 'My Assessment', icon: Sparkles },
        { path: '/app/progress', label: 'Progress', icon: TrendingUp },
        { path: '/app/report', label: 'Reports', icon: FileText },
      ],
    },
    {
      label: 'KNOWLEDGE',
      items: [
        { path: '/app/pillars', label: 'Four Pillars', icon: Brain },
        { path: '/app/framework', label: 'Framework Guide', icon: Map },
        { path: '/app/intervention-plan', label: 'Intervention Plan', icon: BookOpen, entitlement: 'interventionPlans' },
        { path: '/app/my-evaluator', label: 'My Evaluator', icon: UserCheck },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { path: '/app/settings', label: 'Settings', icon: SettingsIcon },
      ],
    },
  ]),
  student: nav('student', [
    {
      label: 'PLATFORM',
      items: [
        { path: '/app/dashboard', label: 'Home', icon: Home },
        { path: '/app/individual', label: 'My Assessment', icon: Sparkles },
        { path: '/app/progress', label: 'Progress', icon: TrendingUp },
        { path: '/app/report', label: 'Reports', icon: FileText },
      ],
    },
    {
      label: 'SCHOOL',
      items: [
        { path: '/app/school/join', label: 'Join Class', icon: BookOpen },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [{ path: '/app/settings', label: 'Settings', icon: SettingsIcon }],
    },
  ]),
  teacher: nav('teacher', [
    {
      label: 'SCHOOL',
      items: [
        { path: '/app/dashboard', label: 'Dashboard', icon: Home },
        { path: '/app/school', label: 'Classes', icon: BookOpen },
        { path: '/app/school/reports', label: 'Reports', icon: FileText },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [{ path: '/app/settings', label: 'Settings', icon: SettingsIcon }],
    },
  ]),
  evaluator: nav('evaluator', [
    {
      label: 'EVALUATION',
      items: [
        { path: '/app/dashboard', label: 'Dashboard', icon: Home },
        { path: '/app/evaluator', label: 'Evaluator Dashboard', icon: Users },
        { path: '/app/interview', label: 'Interview Studio', icon: UserCheck },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [{ path: '/app/settings', label: 'Settings', icon: SettingsIcon }],
    },
  ]),
  employer: nav('employer', [
    {
      label: 'TALENT',
      items: [
        { path: '/app/talent', label: 'Talent Console', icon: Users },
        { path: '/app/enterprise', label: 'Deploy (QGRA+)', icon: Building2, entitlement: 'deployedBatteries' },
        { path: '/app/role-fit', label: 'Role Fit', icon: Target, entitlement: 'roleFit' },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [{ path: '/app/settings', label: 'Settings', icon: SettingsIcon }],
    },
  ]),
  admin: nav('admin', [
    {
      label: 'ADMIN',
      items: [
        { path: '/app/dashboard', label: 'Dashboard', icon: Home },
        { path: '/app/admin', label: 'Admin Panel', icon: Shield },
        { path: '/app/school', label: 'School', icon: BookOpen },
        { path: '/app/evaluator', label: 'Evaluator', icon: Users },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [{ path: '/app/settings', label: 'Settings', icon: SettingsIcon }],
    },
  ]),
};

const MOBILE_NAV = [
  { path: '/app/dashboard', label: 'Home', icon: Home },
  { path: '/app/assessment', label: 'Assess', icon: ClipboardList },
  { path: '/app/progress', label: 'Progress', icon: TrendingUp },
  { path: '/app/report', label: 'Report', icon: FileText },
  { path: '/app/pillars', label: 'Pillars', icon: Brain },
];

const PALETTE_RECENTS_KEY = 'qids-palette-recents';

function recordPaletteVisit(path, label) {
  try {
    const prev = JSON.parse(window.localStorage.getItem(PALETTE_RECENTS_KEY) || '[]')
      .filter(r => r.path !== path);
    prev.unshift({ path, label });
    window.localStorage.setItem(PALETTE_RECENTS_KEY, JSON.stringify(prev.slice(0, 5)));
  } catch { /* best-effort */ }
}

function readPaletteRecents() {
  try { return JSON.parse(window.localStorage.getItem(PALETTE_RECENTS_KEY) || '[]'); } catch { return []; }
}

/**
 * Command-palette index: the persona's own nav plus global actions.
 * Built per-open so role/theme changes are always reflected.
 */
function paletteItems(navigate, persona, { setTheme, theme }) {
  const navConfig = PERSONA_NAV[persona] || PERSONA_NAV.individual;
  const items = [];
  // Recents first — the fastest way back to where you were.
  const recents = readPaletteRecents();
  for (const r of recents) {
    items.push({
      group: 'Recent',
      label: r.label,
      icon: History,
      keywords: 'recent ' + r.path,
      run: () => navigate(r.path),
    });
  }
  for (const group of navConfig.groups) {
    for (const item of group.items) {
      items.push({
        group: 'Navigate',
        label: item.label,
        icon: item.icon,
        keywords: group.label.toLowerCase(),
        run: () => { recordPaletteVisit(item.path, item.label); navigate(item.path); },
      });
    }
  }
  items.push(
    { group: 'Actions', label: 'New assessment', icon: ClipboardList, hint: 'Start', keywords: 'assess begin run qids', run: () => navigate('/app/assessment') },
    { group: 'Actions', label: 'Switch context', icon: LayoutGrid, hint: 'Mode', keywords: 'individual school enterprise role mode', run: () => navigate('/mode') },
    { group: 'Actions', label: theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme', icon: theme === 'light' ? Moon : Sun, hint: 'Theme', keywords: 'dark light appearance appearance toggle', run: () => setTheme(theme === 'light' ? 'dark' : 'light') },
    { group: 'Actions', label: 'Toggle sidebar rail', icon: PanelLeftClose, hint: 'View', keywords: 'collapse expand rail width', run: () => window.dispatchEvent(new CustomEvent('qids:toggle-sidebar')) },
  );
  return items;
}

// Where each persona lands when they enter the shell (Blueprint §5.1).
const PERSONA_HOME = {
  individual: '/app/individual',
  student: '/app/individual',
  teacher: '/app/school',
  evaluator: '/app/evaluator',
  employer: '/app/talent',
  admin: '/app/admin',
};

function PersonaHome() {
  const { userProfile } = useAuth();
  const role = userProfile?.role || 'individual';
  return <Navigate to={PERSONA_HOME[personaFor(role)] || '/app/dashboard'} replace />;
}

function Sidebar({ collapsed }) {
  const { user, userProfile, logout, updateUserRole } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const role = userProfile?.role || 'student';
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  // Role switching is a development tool; it must not ship to prod.
  const roleSwitcherEnabled = import.meta.env.DEV;

  const ROLE_OPTIONS = ['student', 'individual', 'teacher', 'evaluator', 'admin', 'employer'];

  const persona = personaFor(role);
  const navConfig = PERSONA_NAV[persona] || PERSONA_NAV.individual;
  const plan = getPlan(userProfile?.plan);

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 mx-1 text-[13px] border-l-2 transition-colors ${
      isActive
        ? 'bg-sidebar-accent text-on-surface border-[var(--gold)]'
        : 'border-transparent text-muted-foreground hover:text-on-surface hover:bg-sidebar-accent/60'
    }`;

  return (
    <aside className="desktop-sidebar sidebar-shell fixed left-0 top-0 h-screen flex-col z-40 bg-sidebar text-sidebar-foreground">

      <div className={`flex items-center gap-3 px-6 py-7 border-b border-sidebar-border ${collapsed ? 'justify-center px-0' : ''}`}>
        <QidsMark size={collapsed ? 24 : 26} className="text-gold flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="tracking-[0.32em] text-[13px] text-on-surface">QiDS</span>
            <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground mt-1.5">INTELLIGENCE · DEVELOPMENT · SYSTEM</span>
          </div>
        )}
      </div>

      <nav className="flex-grow overflow-y-auto py-6" aria-label="Sections">
        {navConfig.groups.map(group => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <div className="label-eyebrow px-4 mb-3">{group.label}</div>
            )}
            {group.items.map(({ path, label, icon: Icon, entitlement }) => {
              const locked = entitlement ? !can(plan, entitlement) : false;
              return (
                <NavLink key={path} to={path} end={path === '/app/dashboard'} className={navItemClass} title={locked ? `${label} · ${plan.name} plan` : label}>
                  <Icon size={16} strokeWidth={1.5} className={locked ? 'opacity-50' : ''} />
                  {!collapsed && (
                    <span className={`truncate ${locked ? 'opacity-50' : ''}`}>{label}</span>
                  )}
                  {locked && !collapsed && <Lock size={11} className="ml-auto text-gold/60" />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={`px-6 mb-4 ${collapsed ? '!px-2' : ''}`}>
        <button onClick={() => navigate('/app/assessment')}
          className="btn-primary w-full !py-2.5 !text-[13px]">
          {collapsed ? '+' : 'New Assessment'}
        </button>
      </div>

      <div className="mt-auto">
        {user && (
          <div className="border-t border-sidebar-border py-4 px-4">
            {!collapsed && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[11px] font-mono text-on-surface flex-shrink-0 bg-transparent">
                    {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="text-[12px] text-on-surface truncate">{userProfile?.name || user.displayName || 'User'}</div>
                    <div className="text-[10px] font-mono tracking-wider text-muted-foreground capitalize">{userProfile?.role || 'individual'}</div>
                  </div>
                </div>
                {roleSwitcherEnabled && (
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="w-full text-left mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-gold/80 hover:text-gold cursor-pointer bg-transparent border-none p-0 py-1"
                >
                  {showRoleSwitcher ? '— Hide roles' : '+ Switch role'}
                </button>
                )}
                {roleSwitcherEnabled && showRoleSwitcher && (
                  <div className="mb-3 space-y-1">
                    {ROLE_OPTIONS.map(r => (
                      <button
                        key={r}
                        onClick={async () => {
                          await updateUserRole(user.uid, r);
                          setShowRoleSwitcher(false);
                          window.location.reload();
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-mono border transition-colors cursor-pointer ${
                          role === r
                            ? 'bg-surface-container-low border-gold/60 text-gold'
                            : 'bg-transparent border-sidebar-border text-muted-foreground hover:border-gold/30 hover:text-on-surface'
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {collapsed && (
              <div className="flex justify-center mb-3">
                <div className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[11px] font-mono text-on-surface bg-transparent">
                  {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            )}
            <button onClick={handleLogout} aria-label="Sign out"
              className={`w-full flex items-center gap-3 py-2 text-[13px] text-muted-foreground hover:text-on-surface transition-colors cursor-pointer ${collapsed ? 'justify-center px-0' : 'pl-1'}`}>
              <LogOut size={15} strokeWidth={1.5} />
              {!collapsed && <span className="tracking-wide">Sign Out</span>}
            </button>
          </div>
        )}

        <div className={`border-t border-sidebar-border px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase overflow-hidden whitespace-nowrap ${collapsed ? 'mx-4 px-0 text-center border-x-0' : 'text-muted-foreground'}`}>
          {collapsed ? (
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" />
          ) : (
            <span>QiDS · v1.0 · main</span>
          )}
        </div>
      </div>
    </aside>
  );
}

function MobileNav({ onMenuOpen }) {
  const location = useLocation();
  return (
    <nav className="mobile-nav">
      {MOBILE_NAV.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname.startsWith(path);
        return (
          <NavLink key={path} to={path} end={path === '/app/dashboard'}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={19} strokeWidth={isActive ? 2 : 1.5} className="mobile-nav-icon" />
            <span style={{ fontSize: 10, fontWeight: isActive ? 500 : 400 }}>{label}</span>
          </NavLink>
        );
      })}
      <button onClick={onMenuOpen} aria-label="More menu" className="mobile-nav-item">
        <Menu size={19} strokeWidth={1.5} className="mobile-nav-icon" />
        <span style={{ fontSize: 10 }}>More</span>
      </button>
    </nav>
  );
}

function MobileMenuDrawer({ onClose }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); onClose(); navigate('/login'); };
  const modalRef = useModalA11y({ open: true, onClose });

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed inset-0 z-[100] bg-sidebar text-sidebar-foreground overflow-y-auto animate-fade">
      <div className="flex justify-between items-center p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <QidsMark size={24} className="text-gold" />
          <div className="flex flex-col leading-none">
            <span className="tracking-[0.32em] text-[13px] text-on-surface">QiDS</span>
            <span className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground mt-1.5">INTELLIGENCE · DEVELOPMENT · SYSTEM</span>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close menu"
          className="p-2 border border-sidebar-border text-muted-foreground hover:text-on-surface transition-colors cursor-pointer bg-transparent">
          <X size={16} />
        </button>
      </div>

      {user && (
        <div className="flex items-center gap-4 p-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[12px] font-mono text-on-surface flex-shrink-0 bg-transparent">
            {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-on-surface">{userProfile?.name || user.displayName || 'User'}</div>
            <div className="text-[10px] font-mono tracking-wider text-muted-foreground capitalize">{userProfile?.role || 'individual'}</div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {(PERSONA_NAV[personaFor(userProfile?.role)] || PERSONA_NAV.individual).groups.map(group => (
          <div key={group.label}>
            <div className="label-eyebrow mb-3">{group.label}</div>
            {group.items.map(({ path, label, icon: Icon, entitlement }) => {
              const locked = entitlement ? !can(getPlan(userProfile?.plan), entitlement) : false;
              return (
                <NavLink key={path} to={path} end={path === '/app/dashboard'} onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-4 py-3 transition-colors ${isActive ? 'text-gold border-l-2 border-gold pl-3' : 'text-muted-foreground hover:text-on-surface pl-3'
                    }`}>
                  <Icon size={15} strokeWidth={1.5} className={locked ? 'opacity-50' : ''} />
                  <span className={`text-[13px] tracking-wide ${locked ? 'opacity-50' : ''}`}>{label}</span>
                  {locked && <Lock size={11} className="ml-auto text-gold/60" />}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-sidebar-border" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 border border-sidebar-border text-muted-foreground text-[13px] tracking-wide hover:text-on-surface hover:border-gold/50 transition-colors cursor-pointer bg-transparent">
          <LogOut size={15} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function TopBar({ onMenuOpen, collapsed, onToggleSidebar, onOpenPalette }) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const mode = userProfile?.role || 'individual';
  const name = userProfile?.name || user?.displayName || user?.email || 'User';
  const initials = (name[0] || 'U').toUpperCase();

  return (
    <header className="topbar">
      <RouteTransitionBar />
      <div className="flex items-center gap-4 topbar-nav min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center border border-sidebar-border text-muted-foreground hover:text-on-surface hover:border-gold/60 transition-colors cursor-pointer bg-transparent">
          {collapsed
            ? <PanelLeftOpen size={16} strokeWidth={1.5} />
            : <PanelLeftClose size={16} strokeWidth={1.5} />}
        </button>
        <div className="flex items-center gap-2 font-mono text-[12px] tracking-wider min-w-0">
          <span className="text-gold status-dot-pulse">●</span>
          <span className="text-muted-foreground">MODE</span>
          <span className="text-on-surface truncate capitalize">{mode}</span>
        </div>
      </div>
      <div className="flex items-center gap-5 topbar-actions">
        <button
          onClick={onOpenPalette}
          aria-label="Open command palette"
          title="Search pages and actions (Ctrl+K)"
          className="hidden md:inline-flex items-center gap-2 h-8 px-3 border border-sidebar-border text-muted-foreground hover:text-gold hover:border-gold/60 transition-colors cursor-pointer bg-transparent font-mono text-[10px] tracking-[0.14em] uppercase">
          <Search size={12} strokeWidth={1.5} />
          <span className="hidden lg:inline">Search</span>
          <kbd className="text-[9px] opacity-70">⌘K</kbd>
        </button>
        <span className="hidden md:inline-flex items-center"><ThemeToggle /></span>
        <button onClick={() => navigate('/mode')}
          className="hidden md:inline-flex items-center gap-2 bg-transparent border-none p-0 font-mono text-[11px] tracking-[0.18em] uppercase text-muted-foreground hover:text-gold transition-colors cursor-pointer">
          Switch mode <ChevronRight size={12} />
        </button>
        <span className="hidden md:block h-4 w-px bg-sidebar-border" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[11px] font-mono text-on-surface flex-shrink-0 bg-transparent">
            {initials}
          </div>
          <div className="hidden xl:flex flex-col leading-none min-w-0">
            <span className="text-[12px] text-on-surface truncate max-w-48">{name}</span>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground capitalize">{mode}</span>
          </div>
        </div>
      </div>
      <div className="topbar-mobile-actions hide-desktop">
        <ThemeToggle />
        <button onClick={onMenuOpen} aria-label="Open menu"
          className="p-2 text-muted-foreground hover:text-on-surface transition-colors cursor-pointer bg-transparent border-none">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

const SIDEBAR_KEY = 'qids-sidebar-collapsed';

function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    // Restore the user's preferred rail width across sessions.
    try { return window.localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; }
  });
  const [context, setContext] = useState('individual');
  const [assessmentData, setAssessmentData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [mergedPillarScores, setMergedPillarScores] = useState(null);
  const [evalStatus, setEvalStatus] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();

  // Sidebar toggle from the command palette.
  useEffect(() => {
    const onToggle = () => setCollapsed(c => !c);
    window.addEventListener('qids:toggle-sidebar', onToggle);
    return () => window.removeEventListener('qids:toggle-sidebar', onToggle);
  }, []);

  // Persist sidebar collapse preference.
  useEffect(() => {
    try { window.localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0'); } catch { /* best-effort */ }
  }, [collapsed]);

  // ⌘K / Ctrl+K opens the command palette from anywhere in the shell.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!user) return;
    getLatestAssessment(user.uid).then(a => { if (a) setAssessmentData(a); }).catch(() => {});
    getLatestPostAssessment(user.uid).then(p => { if (p) setPostData(p); }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!assessmentData?.id) { setEvaluations([]); setMergedPillarScores(null); setEvalStatus({}); return; }
    getAllEvaluations(assessmentData.id).then(evals => {
      setEvaluations(evals);
      const status = {};
      evals.forEach(e => { status[e.pillar] = true; });
      setEvalStatus(status);
      const merged = mergeEvaluationScores(assessmentData.rawScores || {}, evals, assessmentData);
      if (merged.merged) {
        const newPillarScores = {};
        Object.keys(PILLARS).forEach(id => {
          newPillarScores[id] = computePillarScore(id, merged.rawScores[id] || {});
        });
        setMergedPillarScores(newPillarScores);
      } else {
        setMergedPillarScores(null);
      }
    }).catch(() => {});
  }, [assessmentData?.id]);

  return (
    <AppContext.Provider value={{ context, setContext, assessmentData, setAssessmentData, postData, setPostData, evaluations, mergedPillarScores, evalStatus, demoMode: false }}>
      <div className={`flex min-h-screen bg-background ${collapsed ? 'shell-collapsed' : ''}`}>
        <a href="#qids-main" className="skip-link">Skip to content</a>
        <Sidebar collapsed={collapsed} />
        <div className={`app-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          <TopBar onMenuOpen={() => setMobileMenuOpen(true)} collapsed={collapsed} onToggleSidebar={() => setCollapsed(c => !c)} onOpenPalette={() => setPaletteOpen(true)} />
          <main id="qids-main" className="flex-1 min-h-0 overflow-y-auto overflow-x-clip">
            <Routes>
              <Route index element={<PersonaHome />} />
              <Route path="dashboard" element={<PageSuspense><Dashboard /></PageSuspense>} />
              <Route path="framework" element={<PageSuspense><FrameworkMap /></PageSuspense>} />
              <Route path="pillars" element={<PageSuspense><FourPillars /></PageSuspense>} />
              <Route path="pillars/:pillarId" element={<PageSuspense><FourPillars /></PageSuspense>} />
              <Route path="assessment" element={<PageSuspense><Assessment /></PageSuspense>} />
              <Route path="progress" element={<PageSuspense><Progress /></PageSuspense>} />
              <Route path="report" element={<PageSuspense><ReportGenerator /></PageSuspense>} />
              <Route path="settings" element={<PageSuspense><Settings /></PageSuspense>} />

              {/* Admin only — role enforced at the route, not just the sidebar. */}
              <Route path="admin" element={
                <RoleRoute roles={['admin']}>
                  <PageSuspense><AdminPanel /></PageSuspense>
                </RoleRoute>
              } />

              {/* Evaluator console — evaluators and admins. */}
              <Route path="evaluator" element={
                <RoleRoute roles={['evaluator', 'admin']}>
                  <PageSuspense><EvaluatorDashboard /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="evaluator/assess/:assessmentId" element={
                <RoleRoute roles={['evaluator', 'admin']}>
                  <PageSuspense><EvaluatorScoring /></PageSuspense>
                </RoleRoute>
              } />

              <Route path="my-evaluator" element={<PageSuspense><MyEvaluator /></PageSuspense>} />
              <Route path="questionnaires" element={<PageSuspense><Questionnaires /></PageSuspense>} />

              {/* Pro entitlement: intervention plans. */}
              <Route path="intervention-plan" element={
                <EntitlementRoute entitlement="interventionPlans" feature="Intervention plans">
                  <PageSuspense><InterventionPlan /></PageSuspense>
                </EntitlementRoute>
              } />

              {/* Enterprise batteries — Talent entitlement, employer/admin roles. */}
              <Route path="enterprise" element={
                <RoleRoute roles={['employer', 'admin']}>
                  <EntitlementRoute entitlement="deployedBatteries" feature="Enterprise batteries">
                    <PageSuspense><EnterpriseRunner mode="enterprise" /></PageSuspense>
                  </EntitlementRoute>
                </RoleRoute>
              } />
              <Route path="enterprise/:tier" element={
                <RoleRoute roles={['employer', 'admin']}>
                  <EntitlementRoute entitlement="deployedBatteries" feature="Enterprise batteries">
                    <PageSuspense><EnterpriseRunner mode="enterprise" /></PageSuspense>
                  </EntitlementRoute>
                </RoleRoute>
              } />
              <Route path="role-fit" element={
                <RoleRoute roles={['employer', 'admin']}>
                  <EntitlementRoute entitlement="roleFit" feature="Role Fit">
                    <PageSuspense><EnterpriseRunner mode="role" /></PageSuspense>
                  </EntitlementRoute>
                </RoleRoute>
              } />
              <Route path="role-fit/:tier" element={
                <RoleRoute roles={['employer', 'admin']}>
                  <EntitlementRoute entitlement="roleFit" feature="Role Fit">
                    <PageSuspense><EnterpriseRunner mode="role" /></PageSuspense>
                  </EntitlementRoute>
                </RoleRoute>
              } />
              <Route path="talent" element={
                <RoleRoute roles={['employer', 'admin']}>
                  <PageSuspense><EmployerDashboard /></PageSuspense>
                </RoleRoute>
              } />

              <Route path="individual" element={<PageSuspense><IndividualOnboarding /></PageSuspense>} />
              <Route path="individual/results/:id" element={<PageSuspense><IndividualResults /></PageSuspense>} />
              <Route path="individual/credential/:id" element={<PageSuspense><IndividualCredential /></PageSuspense>} />

              {/* Interview Studio — evaluators and admins. */}
              <Route path="interview" element={
                <RoleRoute roles={['evaluator', 'admin', 'employer']}>
                  <PageSuspense><InterviewerDashboard /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="interview/setup" element={
                <RoleRoute roles={['evaluator', 'admin', 'employer']}>
                  <PageSuspense><InterviewSetup /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="interview/scoring/:sessionId" element={
                <RoleRoute roles={['evaluator', 'admin', 'employer']}>
                  <PageSuspense><InterviewPostScoring /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="interview/live/:sessionId" element={
                <RoleRoute roles={['evaluator', 'admin', 'employer']}>
                  <PageSuspense><InterviewLive /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="interview/report/:sessionId" element={
                <RoleRoute roles={['evaluator', 'admin', 'employer']}>
                  <PageSuspense><InterviewReport /></PageSuspense>
                </RoleRoute>
              } />

              {/* School — teachers manage; admins oversee. */}
              <Route path="school" element={
                <RoleRoute roles={['teacher', 'admin']}>
                  <PageSuspense><TeacherDashboard /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="school/create" element={
                <RoleRoute roles={['teacher', 'admin']}>
                  <PageSuspense><ClassManager /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="school/class/:classId" element={
                <RoleRoute roles={['teacher', 'admin']}>
                  <PageSuspense><ClassManager /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="school/class/:classId/analytics" element={
                <RoleRoute roles={['teacher', 'admin']}>
                  <PageSuspense><ClassAnalytics /></PageSuspense>
                </RoleRoute>
              } />
              <Route path="school/join" element={<PageSuspense><StudentJoin /></PageSuspense>} />
              <Route path="school/reports" element={
                <RoleRoute roles={['teacher', 'admin']}>
                  <PageSuspense><SchoolReports /></PageSuspense>
                </RoleRoute>
              } />

              {/* Unknown app routes: real 404, not a silent redirect. */}
              <Route path="*" element={
                <PageSuspense><NotFound inline /></PageSuspense>
              } />
            </Routes>
          </main>
          <footer className="hidden md:flex items-center justify-between border-t border-border py-4 px-10">
            <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">QiDS · QUADRANT INTELLIGENCE DEVELOPMENT SYSTEM</span>
            <span className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">STRUCTURE · CLARITY · DEPTH</span>
          </footer>
        </div>
        <MobileNav onMenuOpen={() => setMobileMenuOpen(true)} />
      </div>
      {mobileMenuOpen && <MobileMenuDrawer onClose={() => setMobileMenuOpen(false)} />}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems(navigate, personaFor(userProfile?.role || 'individual'), { setTheme, theme })}
      />
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ToastProvider>            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/mode" element={<Mode />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<PageSuspense><Signup /></PageSuspense>} />
              {/* Public credential — no auth, by design (the growth loop). */}
              <Route path="/credential/:id" element={<PageSuspense><PublicCredential /></PageSuspense>} />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <PageSuspense><Onboarding /></PageSuspense>
                </ProtectedRoute>
              } />
              <Route path="/app/*" element={
                <ProtectedRoute>
                  <OnboardingGate>
                    <AppShell />
                  </OnboardingGate>
                </ProtectedRoute>
              } />
              <Route path="*" element={<PageSuspense><NotFound /></PageSuspense>} />
            </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
