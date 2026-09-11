import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  Brain, Map, ClipboardList, TrendingUp, FileText, UserCheck,
  ChevronRight, Menu, LogOut, Home, BookOpen, X, Shield, Users, Sparkles, Building2, Target, Lock,
  PanelLeftClose, PanelLeftOpen,
  Settings as SettingsIcon
} from 'lucide-react';
import { PILLARS, mergeEvaluationScores } from './data/qidsData';
import QidsMark from './components/QidsMark';
import { computePillarScore } from './core/engine/qids';
import { getPlan, can } from './core/plans';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGate from './components/OnboardingGate';
import ThemeToggle from './components/ThemeToggle';
import { ToastProvider } from './components/Toast';
import { getLatestAssessment, getLatestPostAssessment, getAllEvaluations } from './services/firestoreService';

import Landing from './pages/Landing';
import Onboarding from './pages/onboarding/Onboarding';
import Mode from './pages/Mode';
import NotFound from './pages/NotFound';
import Settings from './pages/account/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import FrameworkMap from './pages/FrameworkMap';
import FourPillars from './pages/FourPillars';
import Assessment from './pages/Assessment';
import Progress from './pages/Progress';
import ReportGenerator from './pages/ReportGenerator';
import AdminPanel from './pages/admin/AdminPanel';
import EvaluatorDashboard from './pages/evaluator/EvaluatorDashboard';
import EvaluatorScoring from './pages/evaluator/EvaluatorScoring';
import MyEvaluator from './pages/student/MyEvaluator';
import Questionnaires from './pages/Questionnaires';
import InterventionPlan from './pages/InterventionPlan';
import EnterpriseRunner from './pages/enterprise/EnterpriseRunner';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import IndividualOnboarding from './pages/individual/IndividualOnboarding';
import IndividualResults from './pages/individual/IndividualResults';
import IndividualCredential from './pages/individual/IndividualCredential';
import InterviewerDashboard from './pages/interview/InterviewerDashboard';
import InterviewSetup from './pages/interview/InterviewSetup';
import InterviewPostScoring from './pages/interview/InterviewPostScoring';
import InterviewLive from './pages/interview/InterviewLive';
import InterviewReport from './pages/interview/InterviewReport';
import TeacherDashboard from './pages/school/TeacherDashboard';
import ClassManager from './pages/school/ClassManager';
import ClassAnalytics from './pages/school/ClassAnalytics';
import StudentJoin from './pages/school/StudentJoin';
import SchoolReports from './pages/school/SchoolReports';

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
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="w-full text-left mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-gold/80 hover:text-gold cursor-pointer bg-transparent border-none p-0 py-1"
                >
                  {showRoleSwitcher ? '— Hide roles' : '+ Switch role'}
                </button>
                {showRoleSwitcher && (
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

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-sidebar text-sidebar-foreground overflow-y-auto animate-fade">
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

function TopBar({ onMenuOpen, collapsed, onToggleSidebar }) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const mode = userProfile?.role || 'individual';
  const name = userProfile?.name || user?.displayName || user?.email || 'User';
  const initials = (name[0] || 'U').toUpperCase();

  return (
    <header className="topbar">
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

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [context, setContext] = useState('individual');
  const [assessmentData, setAssessmentData] = useState(null);
  const [postData, setPostData] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [mergedPillarScores, setMergedPillarScores] = useState(null);
  const [evalStatus, setEvalStatus] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

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
        <Sidebar collapsed={collapsed} />
        <div className={`app-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          <TopBar onMenuOpen={() => setMobileMenuOpen(true)} collapsed={collapsed} onToggleSidebar={() => setCollapsed(c => !c)} />
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-clip">
            <Routes>
              <Route index element={<PersonaHome />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="framework" element={<FrameworkMap />} />
              <Route path="pillars" element={<FourPillars />} />
              <Route path="pillars/:pillarId" element={<FourPillars />} />
              <Route path="assessment" element={<Assessment />} />
              <Route path="progress" element={<Progress />} />
              <Route path="report" element={<ReportGenerator />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="evaluator" element={<EvaluatorDashboard />} />
              <Route path="evaluator/assess/:assessmentId" element={<EvaluatorScoring />} />
              <Route path="my-evaluator" element={<MyEvaluator />} />
              <Route path="questionnaires" element={<Questionnaires />} />
              <Route path="intervention-plan" element={<InterventionPlan />} />
              <Route path="enterprise" element={<EnterpriseRunner mode="enterprise" />} />
              <Route path="enterprise/:tier" element={<EnterpriseRunner mode="enterprise" />} />
              <Route path="role-fit" element={<EnterpriseRunner mode="role" />} />
              <Route path="role-fit/:tier" element={<EnterpriseRunner mode="role" />} />
              <Route path="talent" element={<EmployerDashboard />} />
              <Route path="individual" element={<IndividualOnboarding />} />
              <Route path="individual/results/:id" element={<IndividualResults />} />
              <Route path="individual/credential/:id" element={<IndividualCredential />} />
              <Route path="interview" element={<InterviewerDashboard />} />
              <Route path="interview/setup" element={<InterviewSetup />} />
              <Route path="interview/scoring/:sessionId" element={<InterviewPostScoring />} />
              <Route path="interview/live/:sessionId" element={<InterviewLive />} />
              <Route path="interview/report/:sessionId" element={<InterviewReport />} />
              <Route path="school" element={<TeacherDashboard />} />
              <Route path="school/create" element={<ClassManager />} />
              <Route path="school/class/:classId" element={<ClassManager />} />
              <Route path="school/class/:classId/analytics" element={<ClassAnalytics />} />
              <Route path="school/join" element={<StudentJoin />} />
              <Route path="school/reports" element={<SchoolReports />} />
              <Route path="*" element={<PersonaHome />} />
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
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/mode" element={<Mode />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="/app/*" element={
              <ProtectedRoute>
                <OnboardingGate>
                  <AppShell />
                </OnboardingGate>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
