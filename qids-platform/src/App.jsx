import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import {
  Brain, Map, ClipboardList, TrendingUp, FileText, UserCheck,
  ChevronRight, Menu, LogOut, Home, BookOpen, ListChecks, X, Shield, Users, Sparkles, Building2, Target
} from 'lucide-react';
import { PILLARS, CONTEXTS, mergeEvaluationScores } from './data/qidsData';
import QidsMark from './components/QidsMark';
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
    label: 'PLATFORM',
    items: [
      { path: '/app/dashboard', label: 'Dashboard', icon: Home },
      { path: '/app/assessment', label: 'Assessment', icon: ClipboardList },
      { path: '/app/progress', label: 'Progress', icon: TrendingUp },
      { path: '/app/report', label: 'Reports', icon: FileText },
    ]
  },
  {
    label: 'KNOWLEDGE',
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

  const itemClass = ({ isActive }, withCode) =>
    `group flex items-center gap-3 py-2.5 pr-4 text-[13px] border-l-2 transition-colors ${
      isActive
        ? 'border-[#B8924A] bg-[#1C1C1C] text-bone'
        : 'border-transparent text-[#D1CCC2]/60 hover:text-bone hover:bg-[#1C1C1C]/60'
    } ${collapsed ? 'justify-center mx-2 pl-0' : 'pl-4'}`;

  let codeCounter = 0;
  const nextCode = () => String(codeCounter++).padStart(2, '0');

  return (
    <aside className="desktop-sidebar fixed left-0 top-0 h-screen flex-col z-40 bg-sidebar text-[#D1CCC2]"
      style={{ width: collapsed ? 64 : 260, transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>

      <div className={`flex items-center gap-3 pt-7 pb-6 mx-5 border-b border-[#262626] ${collapsed ? 'justify-center px-0' : ''}`}>
        <QidsMark size={collapsed ? 24 : 26} className="text-[#B8924A] flex-shrink-0" />
        {!collapsed && (
          <div className="leading-tight overflow-hidden">
            <div className="text-[11px] tracking-[0.22em] text-[#B8924A] font-mono">QIDS</div>
            <div className="text-[12px] text-bone font-medium tracking-wide truncate">Intelligence Development</div>
          </div>
        )}
      </div>

      <nav className="flex-grow overflow-y-auto px-2 py-3" aria-label="Sections">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mt-5 first:mt-0">
            {!collapsed && (
              <div className="px-4 pb-2 text-[10px] tracking-[0.22em] text-[#D1CCC2]/40 font-mono uppercase">{group.label}</div>
            )}
            {group.items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === '/app/dashboard'} className={(s) => itemClass(s)} title={label}>
                <span className={`font-mono text-[10px] opacity-50 ${collapsed ? 'hidden' : ''}`}>{nextCode()}</span>
                <Icon size={15} strokeWidth={1.5} className="opacity-80" />
                {!collapsed && <span className="tracking-wide truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}

        {roleNavItems.length > 0 && (
          <div className="mt-5">
            {!collapsed && (
              <div className="px-4 pb-2 text-[10px] tracking-[0.22em] text-[#D1CCC2]/40 font-mono uppercase">
                {role === 'admin' ? 'ADMIN' : role === 'teacher' ? 'SCHOOL' : role === 'evaluator' ? 'EVALUATION' : 'PERSONAL'}
              </div>
            )}
            {roleNavItems.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end className={(s) => itemClass(s)} title={label}>
                <span className={`font-mono text-[10px] ${collapsed ? 'hidden' : ''} opacity-50`}>{nextCode()}</span>
                <Icon size={15} strokeWidth={1.5} className="opacity-80" />
                {!collapsed && <span className="tracking-wide truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="mx-5 mb-4">
        <button onClick={() => navigate('/app/assessment')}
          className={`btn-primary w-full ${collapsed ? '!px-0' : ''}`}>
          {collapsed ? '+' : 'NEW ASSESSMENT'}
        </button>
      </div>

      <div className="mt-auto">
        {user && (
          <div className="border-t border-[#262626] py-4 px-4">
            {!collapsed && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-none bg-[#262626] flex items-center justify-center text-[10px] font-mono text-bone flex-shrink-0">
                    {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="text-[13px] text-bone truncate">{userProfile?.name || user.displayName || 'User'}</div>
                    <div className="text-[10px] font-mono text-[#D1CCC2]/50 capitalize">{userProfile?.role || 'individual'}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="w-full text-left mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-[#B8924A]/80 hover:text-[#B8924A] cursor-pointer bg-transparent border-none p-0 py-1"
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
                            ? 'bg-[#1C1C1C] border-[#B8924A]/60 text-[#B8924A]'
                            : 'bg-transparent border-[#262626] text-[#D1CCC2]/60 hover:border-[#B8924A]/30 hover:text-bone'
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
                <div className="w-8 h-8 bg-[#262626] flex items-center justify-center text-[10px] font-mono text-bone">
                  {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>
            )}
            <button onClick={handleLogout} aria-label="Sign out"
              className={`w-full flex items-center gap-3 py-2 text-[13px] text-[#D1CCC2]/60 hover:text-bone transition-colors cursor-pointer ${collapsed ? 'justify-center px-0' : 'pl-1'}`}>
              <LogOut size={15} strokeWidth={1.5} />
              {!collapsed && <span className="tracking-wide">Sign Out</span>}
            </button>
          </div>
        )}

        <div className={`border-t border-[#262626] px-1 py-4 text-[10px] font-mono leading-relaxed ${collapsed ? 'mx-4 px-0 text-center' : 'text-[#D1CCC2]/45'}`}>
          {collapsed ? (
            <span className="inline-block h-1.5 w-1.5 bg-[#B8924A]" />
          ) : (
            <div className="flex items-center justify-between">
              <span>v1.0 · main</span>
              <span className="h-1.5 w-1.5 bg-[#B8924A]" />
            </div>
          )}
        </div>

        <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="mx-5 mb-4 py-2 flex items-center justify-center border border-[#262626] text-[#D1CCC2]/60 hover:text-[#B8924A] hover:border-[#B8924A]/50 transition-colors cursor-pointer">
          {collapsed ? <ChevronRight size={13} /> : <Menu size={13} />}
        </button>
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

  return (
    <div className="fixed inset-0 z-[100] bg-sidebar text-[#D1CCC2] overflow-y-auto animate-fade-up">
      <div className="flex justify-between items-center p-6 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <QidsMark size={24} className="text-[#B8924A]" />
          <div>
            <div className="text-[11px] tracking-[0.22em] text-[#B8924A] font-mono">QIDS</div>
            <div className="text-[12px] text-bone">Intelligence Development</div>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close menu"
          className="p-2 border border-[#262626] text-[#D1CCC2]/60 hover:text-bone transition-colors cursor-pointer bg-transparent">
          <X size={16} />
        </button>
      </div>

      {user && (
        <div className="flex items-center gap-4 p-6 border-b border-[#262626]">
          <div className="w-10 h-10 bg-[#262626] flex items-center justify-center text-[11px] font-mono text-bone flex-shrink-0">
            {(userProfile?.name || user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-bone">{userProfile?.name || user.displayName || 'User'}</div>
            <div className="text-[10px] font-mono text-[#D1CCC2]/50 capitalize">{userProfile?.role || 'individual'}</div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-8">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="text-[10px] tracking-[0.22em] text-[#D1CCC2]/40 font-mono uppercase mb-3">{group.label}</div>
            {group.items.map(({ path, label, icon: Icon }) => (
              <NavLink key={path} to={path} end={path === '/app/dashboard'} onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3 transition-colors ${isActive ? 'text-[#B8924A] border-l-2 border-[#B8924A] pl-3' : 'text-[#D1CCC2]/70 hover:text-bone pl-3'
                  }`
                }>
                <Icon size={15} strokeWidth={1.5} />
                <span className="text-[13px] tracking-wide">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {(userProfile?.role === 'individual' || userProfile?.role === 'student') && (
          <div>
            <div className="text-[10px] tracking-[0.22em] text-[#D1CCC2]/40 font-mono uppercase mb-3">PERSONAL</div>
            <NavLink to="/app/my-evaluator" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 py-3 transition-colors ${isActive ? 'text-[#B8924A] border-l-2 border-[#B8924A] pl-3' : 'text-[#D1CCC2]/70 hover:text-bone pl-3'
                }`}>
              <UserCheck size={15} strokeWidth={1.5} />
              <span className="text-[13px] tracking-wide">My Evaluator</span>
            </NavLink>
          </div>
        )}

        {(userProfile?.role === 'evaluator' || userProfile?.role === 'admin') && (
          <div>
            <div className="text-[10px] tracking-[0.22em] text-[#D1CCC2]/40 font-mono uppercase mb-3">
              {userProfile?.role === 'admin' ? 'ADMIN' : 'EVALUATION'}
            </div>
            <NavLink to="/app/evaluator" onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-4 py-3 transition-colors ${isActive ? 'text-[#B8924A] border-l-2 border-[#B8924A] pl-3' : 'text-[#D1CCC2]/70 hover:text-bone pl-3'
                }`}>
              <Users size={15} strokeWidth={1.5} />
              <span className="text-[13px] tracking-wide">Evaluator Dashboard</span>
            </NavLink>
            {userProfile?.role === 'admin' && (
              <NavLink to="/app/admin" onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 py-3 transition-colors ${isActive ? 'text-[#B8924A] border-l-2 border-[#B8924A] pl-3' : 'text-[#D1CCC2]/70 hover:text-bone pl-3'
                  }`}>
                <Shield size={15} strokeWidth={1.5} />
                <span className="text-[13px] tracking-wide">Admin Panel</span>
              </NavLink>
            )}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-[#262626]" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-4 border border-[#262626] text-[#D1CCC2]/70 text-[13px] tracking-wide hover:text-bone hover:border-[#B8924A]/50 transition-colors cursor-pointer bg-transparent">
          <LogOut size={15} strokeWidth={1.5} />
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
      <div className="flex items-center gap-10 topbar-nav">
        <div className="flex items-center gap-3">
          <QidsMark size={20} className="text-[#B8924A]" />
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-slate">
            QIDS · Platform
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-3" aria-label="Primary">
          <NavLink to="/app/dashboard" className="flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase text-ink border-b border-[#B8924A] pb-1 transition-colors no-underline">
            Analytics
          </NavLink>
          <span className="h-px w-8 bg-[#B8924A]" />
          <NavLink to="/app/report" className="font-mono text-[11px] tracking-[0.18em] uppercase text-slate hover:text-ink transition-colors no-underline">
            Archive
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-6 topbar-actions">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate/70">Context</span>
          <select value={context} onChange={e => setContext(e.target.value)}
            className="bg-transparent font-mono text-[12px] text-slate border border-rule px-3 py-1.5 rounded-sm cursor-pointer hover:border-[#B8924A]/60 transition-colors">
            {CONTEXTS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <button onClick={() => navigate('/app/report')}
          className="btn-primary !py-2 !px-5 !text-[13px]">
          NEW REPORT
        </button>
      </div>
      <div className="topbar-mobile-actions hide-desktop">
        <button onClick={onMenuOpen} aria-label="Open menu"
          className="p-2 text-slate hover:text-ink transition-colors cursor-pointer bg-transparent border-none">
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
