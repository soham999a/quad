import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, assignEvaluator, removeAssignment, getEvaluatorAssignments, updateUserRole } from '../../services/firestoreService';
import { useToast } from '../../components/Toast';
import { Shield, UserCheck, UserX, Users, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminPanel() {
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const role = userProfile?.role || 'individual';

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
        <Shield size={40} className="text-primary/40" />
        <div className="text-body-md font-label-md text-on-background">Admin access required</div>
        <div className="text-technical-sm font-technical-sm text-on-surface-variant">You don't have permission to view this page.</div>
      </div>
    );
  }

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const users = await getAllUsers();
    setAllUsers(users);
    const assignMap = {};
    const evaluators = users.filter(u => u.role === 'evaluator');
    for (const ev of evaluators) {
      const evAssigns = await getEvaluatorAssignments(ev.uid);
      evAssigns.forEach(a => { assignMap[a.studentUid] = ev.uid; });
    }
    setAssignments(assignMap);
    setLoading(false);
  };

  const students = allUsers.filter(u => u.role === 'student' || u.role === 'individual');
  const evaluators = allUsers.filter(u => u.role === 'evaluator');
  const admins = allUsers.filter(u => u.role === 'admin');

  const handleAssign = async (studentUid, evaluatorUid) => {
    const ok = await assignEvaluator(evaluatorUid, studentUid);
    if (ok) {
      setAssignments(prev => ({ ...prev, [studentUid]: evaluatorUid }));
      toast('Evaluator assigned successfully', 'success');
    } else {
      toast('Failed to assign evaluator', 'error');
    }
  };

  const handleRemove = async (studentUid, evaluatorUid) => {
    const ok = await removeAssignment(evaluatorUid, studentUid);
    if (ok) {
      setAssignments(prev => { const n = { ...prev }; delete n[studentUid]; return n; });
      toast('Assignment removed', 'success');
    } else {
      toast('Failed to remove assignment', 'error');
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    const ok = await updateUserRole(uid, newRole);
    if (ok) {
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      toast(`Role updated to ${newRole}`, 'success');
    } else {
      toast('Failed to update role', 'error');
    }
  };

  const filtered = students.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCurrentEvaluator = (studentUid) => {
    const evUid = assignments[studentUid];
    if (!evUid) return null;
    return allUsers.find(u => u.uid === evUid);
  };

  return (
    <div className="page-pad max-w-[1200px] mx-auto animate-fade">
      {/* Header */}
      <section className="flex justify-between items-start mb-10 md:mb-16">
        <div>
          <div className="text-technical-sm font-technical-sm text-primary mb-2 uppercase tracking-[0.2em]">Administration</div>
          <h1 className="text-headline-md font-headline-md text-on-background page-headline">Admin Panel</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Manage users, assign evaluators, configure roles</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-technical-sm font-technical-sm border-[0.5px] border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer bg-transparent uppercase tracking-widest flex-shrink-0"
          style={{ borderRadius: '8px' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </section>

      {/* Stats */}
      <section className="responsive-grid-3 w-full border-y-[0.5px] border-outline-variant mb-10 md:mb-16">
        {[
          { label: 'Students', count: students.length },
          { label: 'Evaluators', count: evaluators.length },
          { label: 'Admins', count: admins.length },
        ].map((stat, i) => (
          <div key={stat.label}
            className={`py-6 md:py-8 ${i === 0 ? 'pr-4 md:pr-8' : i === 1 ? 'px-4 md:px-8 border-x-[0.5px] border-outline-variant' : 'pl-4 md:pl-8'}`}>
            <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 md:mb-4 uppercase tracking-widest">{stat.label}</div>
            <div className="text-[24px] md:text-[28px] font-technical-sm text-primary">{String(stat.count).padStart(2, '0')}</div>
          </div>
        ))}
      </section>

      {/* Search */}
      <div className="relative mb-6 md:mb-8">
        <Search size={14} className="text-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text" placeholder="Search students by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-12 md:h-14 pl-10 pr-4 bg-transparent border-[0.5px] border-outline-variant text-label-md font-label-md text-on-background placeholder:text-surface-variant outline-none focus:border-primary transition-colors"
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Students */}
      <div className="mb-10 md:mb-16">
        <div className="flex justify-between items-end mb-4 md:mb-6 pb-2 border-b-[0.5px] border-outline-variant">
          <h2 className="text-label-md font-label-md text-on-background uppercase tracking-wider">Students</h2>
          <span className="text-technical-sm font-technical-sm text-surface-variant">{filtered.length} total</span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-technical-sm font-technical-sm text-surface-variant">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-technical-sm font-technical-sm text-surface-variant">No students found.</div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((student, i) => {
              const isExpanded = expandedStudent === student.uid;
              const evaluator = getCurrentEvaluator(student.uid);
              return (
                <div key={student.uid}>
                  <div
                    onClick={() => setExpandedStudent(isExpanded ? null : student.uid)}
                    className="h-14 md:h-16 flex items-center justify-between border-b-[0.5px] border-outline-variant group hover:bg-surface-container-low transition-colors px-2 cursor-pointer touch-target"
                  >
                    <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                      <span className="text-technical-sm font-technical-sm text-surface-variant flex-shrink-0 w-6">{String(i + 1).padStart(2, '0')}</span>
                      <div className="size-8 flex items-center justify-center shrink-0 border-[0.5px] border-outline-variant text-technical-sm font-technical-sm text-primary bg-surface-container-low"
                        style={{ borderRadius: '8px' }}>
                        {(student.name || student.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-label-md font-label-md text-on-background truncate">{student.name || 'Unnamed'}</div>
                        <div className="text-technical-sm font-technical-sm text-surface-variant truncate">{student.email || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                      {evaluator ? (
                        <span className="px-2 md:px-3 py-1 bg-primary/10 text-primary text-technical-sm font-technical-sm tracking-wider flex items-center gap-1">
                          <UserCheck size={10} /> {evaluator.name || 'Assigned'}
                        </span>
                      ) : (
                        <span className="px-2 md:px-3 py-1 border-[0.5px] border-outline text-technical-sm font-technical-sm text-outline tracking-wider">
                          UNASSIGNED
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={14} className="text-surface-variant flex-shrink-0" /> : <ChevronDown size={14} className="text-surface-variant flex-shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 md:px-8 pb-4 md:pb-6 pt-3 bg-surface-container-lowest border-b-[0.5px] border-outline-variant">
                      <div className="text-technical-sm font-technical-sm text-surface-variant mb-3 uppercase tracking-wider">
                        {evaluator ? 'Change Evaluator' : 'Assign Evaluator'}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {evaluators.filter(e => e.uid !== assignments[student.uid]).map(ev => (
                          <button key={ev.uid} onClick={() => handleAssign(student.uid, ev.uid)}
                            className="px-3 py-1.5 cursor-pointer text-technical-sm font-technical-sm inline-flex items-center gap-1.5 border-[0.5px] border-primary/40 text-primary hover:bg-primary/10 transition-all bg-transparent"
                            style={{ borderRadius: '8px' }}>
                            <UserCheck size={10} /> {ev.name || ev.email}
                          </button>
                        ))}
                        {evaluators.filter(e => e.uid !== assignments[student.uid]).length === 0 && evaluators.length > 0 && (
                          <span className="text-technical-sm font-technical-sm text-surface-variant">All evaluators already assigned</span>
                        )}
                        {evaluators.length === 0 && (
                          <span className="text-technical-sm font-technical-sm text-surface-variant">No evaluators available. Change a user's role to evaluator first.</span>
                        )}
                      </div>
                      {evaluator && (
                        <button onClick={() => handleRemove(student.uid, evaluator.uid)}
                          className="mt-3 px-3 py-1.5 cursor-pointer text-technical-sm font-technical-sm inline-flex items-center gap-1 border-[0.5px] border-error/40 text-error hover:bg-error/10 transition-all bg-transparent"
                          style={{ borderRadius: '8px' }}>
                          <UserX size={10} /> Remove {evaluator.name}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Management */}
      <div className="mb-10 md:mb-16">
        <div className="flex justify-between items-end mb-4 md:mb-6 pb-2 border-b-[0.5px] border-outline-variant">
          <h2 className="text-label-md font-label-md text-on-background uppercase tracking-wider">All Users — Role Management</h2>
        </div>
        <div className="flex flex-col">
          {allUsers.filter(u => u.uid !== user?.uid).map(u => (
            <div key={u.uid}
              className="h-14 md:h-16 flex items-center justify-between border-b-[0.5px] border-outline-variant group hover:bg-surface-container-low transition-colors px-2"
            >
              <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
                <div className="size-8 flex items-center justify-center shrink-0 border-[0.5px] border-outline-variant text-technical-sm font-technical-sm text-primary bg-surface-container-low"
                  style={{ borderRadius: '8px' }}>
                  {(u.name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-label-md font-label-md text-on-background truncate">{u.name || 'Unnamed'}</div>
                  <div className="text-technical-sm font-technical-sm text-surface-variant truncate">{u.email}</div>
                </div>
              </div>
              <select
                value={u.role || 'student'}
                onChange={e => handleRoleChange(u.uid, e.target.value)}
                className="h-8 md:h-9 px-3 bg-transparent border-[0.5px] border-outline-variant text-technical-sm font-technical-sm text-on-background outline-none cursor-pointer focus:border-primary transition-colors"
                style={{ borderRadius: '8px' }}
              >
                <option value="student">Student</option>
                <option value="evaluator">Evaluator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
