import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, assignEvaluator, removeAssignment, getEvaluatorAssignments, updateUserRole } from '../../services/firestoreService';
import { useToast } from '../../components/Toast';
import { Shield, UserCheck, UserX, Users, Search, ChevronDown, ChevronUp, RefreshCw, Mail, AlertCircle } from 'lucide-react';

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
        <Shield size={40} className="text-surface-variant/40" />
        <div className="text-base font-semibold text-on-surface-variant">Admin access required</div>
        <div className="text-sm text-surface-variant">You don't have permission to view this page.</div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

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
      setAssignments(prev => {
        const next = { ...prev };
        delete next[studentUid];
        return next;
      });
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
    <div className="px-6 py-6 animate-fade max-w-[1100px] mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Admin Panel</h1>
          <p className="text-sm text-surface-variant">Manage users, assign evaluators, and configure roles</p>
        </div>
        <button onClick={loadData} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface cursor-pointer transition-all disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {[
          { label: 'Students', count: students.length, icon: Users, color: '#6366f1' },
          { label: 'Evaluators', count: evaluators.length, icon: UserCheck, color: '#10b981' },
          { label: 'Admins', count: admins.length, icon: Shield, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div>
              <div className="text-2xl font-extrabold" style={{ color: stat.color }}>{stat.count}</div>
              <div className="text-xs text-surface-variant">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="text-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text" placeholder="Search students by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full py-2.5 pl-9 pr-3.5 rounded-lg text-sm"
        />
      </div>

      {/* Students Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-outline-variant text-sm font-bold text-on-surface-variant">
          Students ({filtered.length})
        </div>
        {loading ? (
          <div className="p-10 text-center text-surface-variant text-sm">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-surface-variant text-sm">No students found.</div>
        ) : (
          filtered.map((student, i) => {
            const isExpanded = expandedStudent === student.uid;
            const evaluator = getCurrentEvaluator(student.uid);
            return (
              <div key={student.uid} className={i < filtered.length - 1 ? 'border-b border-outline-variant' : ''}>
                <div
                  onClick={() => setExpandedStudent(isExpanded ? null : student.uid)}
                  className="px-4 py-3 flex items-center gap-3 cursor-pointer transition-all hover:bg-white/[0.02]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                    <span className="text-xs font-extrabold text-white">{(student.name || student.email || '?')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{student.name || 'Unnamed'}</div>
                    <div className="text-xs text-surface-variant flex items-center gap-1.5">
                      <Mail size={10} className="text-surface-variant" /> {student.email || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {evaluator ? (
                      <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <UserCheck size={11} /> {evaluator.name || 'Assigned'}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
                        <AlertCircle size={11} /> Unassigned
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={14} className="text-surface-variant" /> : <ChevronDown size={14} className="text-surface-variant" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-outline-variant">
                    {/* Assign evaluator */}
                    <div className="text-xs font-semibold text-surface-variant mb-2">
                      {evaluator ? 'Change Evaluator' : 'Assign Evaluator'}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {evaluators.filter(e => e.uid !== assignments[student.uid]).map(ev => (
                        <button key={ev.uid} onClick={() => handleAssign(student.uid, ev.uid)} className="px-3 py-1.5 rounded-lg cursor-pointer text-xs flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                          <UserCheck size={12} /> {ev.name || ev.email}
                        </button>
                      ))}
                      {evaluators.filter(e => e.uid !== assignments[student.uid]).length === 0 && evaluators.length > 0 && (
                        <span className="text-xs text-surface-variant">All evaluators already assigned</span>
                      )}
                      {evaluators.length === 0 && (
                        <span className="text-xs text-surface-variant">No evaluators available. Change a user's role to evaluator first.</span>
                      )}
                    </div>

                    {/* Remove current evaluator */}
                    {evaluator && (
                      <div className="mt-2.5">
                        <button onClick={() => handleRemove(student.uid, evaluator.uid)} className="px-3 py-1.5 rounded-lg cursor-pointer text-xs inline-flex items-center gap-1" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                          <UserX size={11} /> Remove {evaluator.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* All Users list with role management */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl mt-5 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-outline-variant text-sm font-bold text-on-surface-variant">
          All Users — Role Management
        </div>
        <div className="p-4">
          <div className="grid gap-2">
            {allUsers.filter(u => u.uid !== user?.uid).map(u => (
              <div key={u.uid} className="flex items-center gap-3 px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant">
                <div className="w-7 h-7 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-extrabold text-white">{(u.name || u.email || '?')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{u.name || 'Unnamed'}</div>
                  <div className="text-[10px] text-surface-variant">{u.email}</div>
                </div>
                <select
                  value={u.role || 'student'}
                  onChange={e => handleRoleChange(u.uid, e.target.value)}
                  className="py-1 px-2 text-xs rounded-md"
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
    </div>
  );
}
