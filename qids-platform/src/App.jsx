import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  Brain, Map, ClipboardList, TrendingUp, FileText, UserCheck,
  ChevronRight, Menu, LogOut, Home, BookOpen, ListChecks, X, Shield, Users, Sparkles, BarChart3, Plus, Building2, Target
} from 'lucide-react';
import { PILLARS, CONTEXTS, mergeEvaluationScores } from './data/qidsData';
import { computePillarScore } from './core/engine/qids';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { getLatestAssessment, getLatestPostAssessment, getAllEvaluations } from './services/firestoreService';

import Landing from './pages/Landing';
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

const NAV_GROUPS = [
  {
    label: 'MAIN',
    items: [
      { path: '/app/dashboard', label: 'Dashboard', icon: Home },
      { path: '/app/assessment', label: 'Assessment', icon: ClipboardList },
      { path: '/app/progress', label: 'Progress', icon: TrendingUp },
      { path: '/app/report', label: 'Reports', icon: FileText },
    ]
  },
  {
    label: 'RESOURCES',
    items: [
      { path: '/app/pillars', label: 'Four Pillars', icon: Brain },
      { path: '/app/framework', label: 'Framework Guide', icon: Map },
      { path: '/app/questionnaires', label: 'Questionnaires', icon: ListChecks },
      { path: '/app/intervention-plan', label: 'Intervention Plan', icon: BookOpen },
    ]
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { path: '/app/enterprise', label: 'Enterprise (QGRA+)', icon: Building2 },
      { path: '/app/role-fit', label: 'Role Fit', icon: Target },
      { path: '/app/talent', label: 'Talent Console', icon: Users },
    ]
  },
];

const MOBILE_NAV = [
  { path: '/app/dashboard', label: 'Home', icon: Home },
  { path: '/app/assessment', label: 'Assess', icon: ClipboardList },
  { path: '/app/progress', label: 'Progress', icon: TrendingUp },
  { path: '/app/report', label: 'Report', icon: FileText },
  { path: '/app/pillars', label: 'Pillars', icon: Brain },
];

function Sidebar({ collapsed, setCollapsed }) {
  const { user, userProfile, logout, updateUserRole } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const role = userProfile?.role || 'student';
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const ROLE_OPTIONS = ['student', 'individual', 'teacher', 'evaluator', 'admin', 'employer'];

  const roleNavItems = [];
  if (role === 'individual' || role === 'student') {
    roleNavItems.push({ path: '/app/individual', label: 'My Assessment', icon: Sparkles });
    roleNavItems.push({ path: '/app/my-evaluator', label: 'My Evaluator', icon: UserCheck });
  }
  if (role === 'evaluator' || role === 'admin') {
    roleNavItems.push({ path: '/app/evaluator', label: 'Evaluator Dashboard', icon: Users });
    roleNavItems.push({ path: '/app/interview', label: 'Interview Studio', icon: Users });
  }
  if (role === 'teacher' || role === 'admin') {
    roleNavItems.push({ path: '/app/school', label: 'School Dashboard', icon: BookOpen });
    roleNavItems.push({ path: '/app/school/reports', label: 'School Reports', icon: FileText });
  }
  if (role === 'student') {
    roleNavItems.push({ path: '/app/school/join', label: 'Join Class', icon: BookOpen });
  }
  if (role === 'admin') {
    roleNavItems.push({ path: '/app/admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <aside className="desktop-sidebar fixed left-0 top-0 h-screen flex-col z-40 bg-background border-r-[0.5px] border-outline-variant"
      style={{ width: collapsed ? 60 : 228, transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
      <div className="px-6 mt-8 mb-12" style={{ overflow: 'hidden' }}>
        {collapsed ? (
          <div className="flex justify-center">
            <Brain size={20} className="text-primary" />
          </div>
        ) : (
          <>
            <div className="text-label-md font-label-md uppercase tracking-widest text-primary mb-1">QIDS Platform</div>
<div className="text-technical-sm font-technical-sm text-surface-variant">ARCHITECTURE</div>
          </>
        )}
      </div>

      <nav className="flex-grow overflow-y-auto" aria-label="Sections">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest px-4 mb-2">{group.label}</div>
            )}
            {group.items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === '/app/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3 transition-all ${isActive
                    ? 'text-primary font-bold border-l-2 border-primary bg-surface-container-low'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  } ${collapsed ? 'justify-center mx-2 rounded-lg border-l-0' : 'pl-4'}`
                }>
                <Icon size={16} strokeWidth={1.5} />
                {!collapsed && <span className="text-label-md font-label-md">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {roleNavItems.length > 0 && (
          <div className="mb-2">
            {!collapsed && (
              <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest px-4 mb-2">
                {role === 'admin' ? 'ADMIN' : role === 'teacher' ? 'TEACHER' : role === 'evaluator' ? 'EVALUATOR' : 'TOOLS'}
              </div>
            )}
            {roleNavItems.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3 transition-all ${isActive
                    ? 'text-primary font-bold border-l-2 border-primary bg-surface-container-low'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  } ${collapsed ? 'justify-center mx-2 rounded-lg border-l-0' : 'pl-4'}`
                }>
                <Icon size={16} strokeWidth={1.5} />
                {!collapsed && <span className="text-label-md font-label-md">{label}</span>}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="px-6 mb-8">
        <button onClick={() => navigate('/app/assessment')}
          className="btn-primary glow w-full">
          NEW ASSESSMENT
        </button>
      </div>

      <div className="mt-auto">
        {user && (
          <div className="border-t-[0.5px] border-outline-variant py-4 px-4">
            {!collapsed && (
              <>
                <div className="flex items-center gap-3 px-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-technical-sm font-technical-sm text-on-surface flex-shrink-0">
                    {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="text-label-md font-label-md text-on-surface truncate">
                      {userProfile?.name || user.displayName || 'User'}
                    </div>
                    <div className="text-technical-sm font-technical-sm text-surface-variant capitalize">{userProfile?.role || 'individual'}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="w-full text-left px-2 mb-2 text-technical-sm font-technical-sm text-primary hover:underline cursor-pointer bg-transparent border-none p-0 py-1"
                >
                  {showRoleSwitcher ? 'Hide role switcher' : 'Switch role (dev)'}
                </button>
                {showRoleSwitcher && (
                  <div className="px-2 mb-3 space-y-1">
                    {ROLE_OPTIONS.map(r => (
                      <button
                        key={r}
                        onClick={async () => {
                          await updateUserRole(user.uid, r);
                          setShowRoleSwitcher(false);
                          window.location.reload();
                        }}
                        className={`w-full text-left px-3 py-1.5 text-technical-sm font-technical-sm border-[0.5px] transition-all cursor-pointer ${
                          role === r
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-transparent border-outline-variant text-surface-variant hover:border-primary/20'
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
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-technical-sm font-technical-sm text-on-surface">
                  {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            )}
            <button onClick={handleLogout} aria-label="Sign out"
              className="w-full flex items-center gap-3 py-3 pl-4 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer">
              <LogOut size={16} strokeWidth={1.5} />
              {!collapsed && <span className="text-label-md font-label-md">Sign Out</span>}
            </button>
          </div>
        )}
      </div>

      <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="mx-4 mb-4 py-2 flex items-center justify-center border-[0.5px] border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer">
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
        const isActive = location.pathname.startsWith(path);
        return (
          <NavLink key={path} to={path} end={path === '/app/dashboard'}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className="mobile-nav-icon" />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </NavLink>
        );
      })}
      <button onClick={onMenuOpen} aria-label="More menu" className="mobile-nav-item">
        <Menu size={20} strokeWidth={1.5} className="mobile-nav-icon" />
        <span style={{ fontSize: 10 }}>More</span>
      </button>
    </nav>
  );
}

function MobileMenuDrawer({ onClose }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); onClose(); navigate('/login'); };

  return (
    <div className="fixed inset-0 z-[100] bg-surface overflow-y-auto animate-fade-up">
      <div className="flex justify-between items-center p-6 border-b-[0.5px] border-outline-variant">
        <div>
          <div className="text-label-md font-label-md uppercase tracking-widest text-primary">QIDS Platform</div>
          <div className="text-technical-sm font-technical-sm text-surface-variant">ARCHITECTURE</div>
        </div>
        <button onClick={onClose} aria-label="Close menu"
          className="p-2 border-[0.5px] border-outline-variant text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-transparent">
          <X size={16} />
        </button>
      </div>

      {user && (
        <div className="flex items-center gap-4 p-6 border-b-[0.5px] border-outline-variant">
          <div className="w-10 h-10 bg-surface-container-highest flex items-center justify-center text-technical-sm font-technical-sm text-on-surface flex-shrink-0">
            {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-label-md font-label-md text-on-surface">{userProfile?.name || user.displayName || 'User'}</div>
            <div className="text-technical-sm font-technical-sm text-surface-variant capitalize">{userProfile?.role || 'individual'}</div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">{group.label}</div>
            {group.items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === '/app/dashboard'} onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3 transition-all ${isActive ? 'text-primary font-bold border-l-2 border-primary pl-3' : 'text-on-surface-variant hover:text-primary pl-3'
                  }`
                }>
                <Icon size={16} strokeWidth={1.5} />
                <span className="text-label-md font-label-md">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {(userProfile?.role === 'individual' || userProfile?.role === 'student') && (
          <div>
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">ASSESSMENT</div>
            <NavLink to="/app/my-evaluator" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 py-3 transition-all ${isActive ? 'text-primary font-bold border-l-2 border-primary pl-3' : 'text-on-surface-variant hover:text-primary pl-3'
                }`}>
              <UserCheck size={16} strokeWidth={1.5} />
              <span className="text-label-md font-label-md">My Evaluator</span>
            </NavLink>
          </div>
        )}

        {(userProfile?.role === 'evaluator' || userProfile?.role === 'admin') && (
          <div>
            <div className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest mb-3">
              {userProfile?.role === 'admin' ? 'ADMIN' : 'EVALUATION'}
            </div>
            <NavLink to="/app/evaluator" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 py-3 transition-all ${isActive ? 'text-primary font-bold border-l-2 border-primary pl-3' : 'text-on-surface-variant hover:text-primary pl-3'
                }`}>
              <Users size={16} strokeWidth={1.5} />
              <span className="text-label-md font-label-md">Evaluator Dashboard</span>
            </NavLink>
            {userProfile?.role === 'admin' && (
              <NavLink to="/app/admin" onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3 transition-all ${isActive ? 'text-primary font-bold border-l-2 border-primary pl-3' : 'text-on-surface-variant hover:text-primary pl-3'
                  }`}>
                <Shield size={16} strokeWidth={1.5} />
                <span className="text-label-md font-label-md">Admin Panel</span>
              </NavLink>
            )}
          </div>
        )}
      </div>

      <div className="p-6 border-t-[0.5px] border-outline-variant" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 border-[0.5px] border-error/30 text-error text-label-md font-label-md hover:bg-error/10 transition-all cursor-pointer bg-transparent">
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function TopBar({ context, setContext, onMenuOpen }) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <div className="flex items-center gap-12 topbar-nav">
        <div className="text-headline-md font-headline-md font-medium text-primary uppercase tracking-tight">QIDS</div>
        <nav className="hidden md:flex gap-8" aria-label="Primary">
          <NavLink to="/app/dashboard" className="text-label-md font-label-md text-primary border-b-[0.5px] border-primary pb-1 transition-opacity">
            I | ANALYTICS
          </NavLink>
          <NavLink to="/app/report" className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors">
            II | ARCHIVE
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-6 topbar-actions">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-technical-sm font-technical-sm text-surface-variant uppercase tracking-widest">Context</span>
          <select value={context} onChange={e => setContext(e.target.value)}
            className="bg-transparent text-technical-sm font-technical-sm text-on-surface-variant border-[0.5px] border-outline-variant px-3 py-2 rounded-md cursor-pointer hover:border-primary/50 transition-colors">
            {CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <button onClick={() => navigate('/app/report')}
          className="btn-primary">
          NEW REPORT
        </button>
      </div>
      <div className="topbar-mobile-actions hide-desktop">
        <button onClick={onMenuOpen} aria-label="Open menu"
          className="p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
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
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className={`app-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
          <TopBar context={context} setContext={setContext} onMenuOpen={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="framework" element={<FrameworkMap />} />
              <Route path="pillars" element={<FourPillars />} />
              <Route path="pillars/:pillarId" element={<FourPillars />} />
              <Route path="assessment" element={<Assessment />} />
              <Route path="progress" element={<Progress />} />
              <Route path="report" element={<ReportGenerator />} />
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
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/app/*" element={
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
