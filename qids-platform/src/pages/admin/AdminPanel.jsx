import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllUsers, assignEvaluator, removeAssignment, getEvaluatorAssignments, updateUserRole } from '../../services/firestoreService';
import { useToast } from '../../components/Toast';
import { Shield, UserCheck, UserX, Users, Search, RefreshCw, Mail, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
        <Shield size={40} className="text-[#ebc073]/40" />
        <div className="text-base font-semibold text-[#e5e2e1]">Admin access required</div>
        <div className="text-sm text-[#d1c5b3]">You don't have permission to view this page.</div>
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
    <div className="page-pad animate-fade max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <div className="text-technical-sm font-technical-sm text-[#ebc073] mb-2 uppercase tracking-[0.2em]">Administration</div>
          <h1 className="text-[28px] font-medium m-0" style={{ fontFamily: "'Avenir Next', sans-serif", letterSpacing: '-0.01em', color: '#e5e2e1' }}>Admin Panel</h1>
          <p className="text-[14px] mt-1.5 m-0" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>Manage users, assign evaluators, configure roles</p>
        </div>
        <button onClick={loadData} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] border-[0.5px] border-[#4e4638] text-[#d1c5b3] hover:text-[#ebc073] hover:border-[#ebc073] transition-all cursor-pointer bg-transparent uppercase tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '8px' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats — architectural minimal labels */}
      <div className="flex gap-0 mb-10 border-b-[0.5px] border-[#4e4638] pb-6">
        {[
          { label: 'Students', count: students.length },
          { label: 'Evaluators', count: evaluators.length },
          { label: 'Admins', count: admins.length },
        ].map((stat, i) => (
          <div key={stat.label} className={`flex items-center gap-4 ${i < 2 ? 'pr-8 mr-8 border-r-[0.5px] border-[#4e4638]' : ''}`}>
            <div className="text-[32px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ebc073', lineHeight: 1 }}>{String(stat.count).padStart(2, '0')}</div>
            <div className="text-[12px] uppercase tracking-[0.15em]" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={13} className="text-[#9a8f7f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text" placeholder="Search students by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ borderRadius: '8px', border: '0.5px solid #4e4638', background: '#131313', color: '#e5e2e1', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
          className="w-full py-2.5 pl-9 pr-3.5 outline-none focus:border-[#ebc073] transition-all"
        />
      </div>

      {/* Students section */}
      <div className="border-[0.5px] border-[#4e4638] mb-8" style={{ borderRadius: '0' }}>
        <div className="px-4 py-3 border-b-[0.5px] border-[#4e4638]">
          <span className="text-[12px] font-medium uppercase tracking-[0.15em]" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>
            Students
          </span>
          <span className="ml-2 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>({filtered.length})</span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>No students found.</div>
        ) : (
          filtered.map((student, i) => {
            const isExpanded = expandedStudent === student.uid;
            const evaluator = getCurrentEvaluator(student.uid);
            return (
              <div key={student.uid}>
                <div
                  onClick={() => setExpandedStudent(isExpanded ? null : student.uid)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-[#1c1b1b]"
                  style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #4e4638' : 'none' }}
                >
                  <div className="size-8 flex items-center justify-center shrink-0 border-[0.5px] border-[#4e4638] text-[11px] font-medium"
                    style={{ borderRadius: '8px', background: '#1c1b1b', color: '#ebc073', fontFamily: "'JetBrains Mono', monospace" }}>
                    {(student.name || student.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{student.name || 'Unnamed'}</div>
                    <div className="text-[11px] flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>
                      <Mail size={9} /> {student.email || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {evaluator ? (
                      <span className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 border-[0.5px] border-[#ebc073]/30"
                        style={{ borderRadius: '8px', background: 'transparent', color: '#ebc073', fontFamily: "'Sora', sans-serif" }}>
                        <UserCheck size={10} /> {evaluator.name || 'Assigned'}
                      </span>
                    ) : (
                      <span className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 border-[0.5px] border-[#4e4638]"
                        style={{ borderRadius: '8px', background: 'transparent', color: '#9a8f7f', fontFamily: "'Sora', sans-serif" }}>
                        <AlertCircle size={10} /> Unassigned
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={13} className="text-[#9a8f7f]" /> : <ChevronDown size={13} className="text-[#9a8f7f]" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t-[0.5px] border-[#4e4638]" style={{ background: '#0e0e0e' }}>
                    <div className="text-[11px] font-medium uppercase tracking-wider mb-2.5" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>
                      {evaluator ? 'Change Evaluator' : 'Assign Evaluator'}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {evaluators.filter(e => e.uid !== assignments[student.uid]).map(ev => (
                        <button key={ev.uid} onClick={() => handleAssign(student.uid, ev.uid)}
                          className="px-3 py-1.5 cursor-pointer text-[11px] inline-flex items-center gap-1.5 border-[0.5px] border-[#ebc073]/40 text-[#ebc073] hover:bg-[#ebc073]/10 transition-all"
                          style={{ borderRadius: '8px', background: 'transparent', fontFamily: "'Sora', sans-serif" }}>
                          <UserCheck size={11} /> {ev.name || ev.email}
                        </button>
                      ))}
                      {evaluators.filter(e => e.uid !== assignments[student.uid]).length === 0 && evaluators.length > 0 && (
                        <span className="text-[11px]" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>All evaluators already assigned</span>
                      )}
                      {evaluators.length === 0 && (
                        <span className="text-[11px]" style={{ fontFamily: "'Sora', sans-serif", color: '#9a8f7f' }}>No evaluators available. Change a user's role to evaluator first.</span>
                      )}
                    </div>
                    {evaluator && (
                      <div className="mt-2.5">
                        <button onClick={() => handleRemove(student.uid, evaluator.uid)}
                          className="px-3 py-1.5 cursor-pointer text-[11px] inline-flex items-center gap-1 border-[0.5px] border-[#ffb4ab]/40 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-all"
                          style={{ borderRadius: '8px', background: 'transparent', fontFamily: "'Sora', sans-serif" }}>
                          <UserX size={10} /> Remove {evaluator.name}
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

      {/* Role Management */}
      <div className="border-[0.5px] border-[#4e4638]">
        <div className="px-4 py-3 border-b-[0.5px] border-[#4e4638]">
          <span className="text-[12px] font-medium uppercase tracking-[0.15em]" style={{ fontFamily: "'Sora', sans-serif", color: '#d1c5b3' }}>
            All Users — Role Management
          </span>
        </div>
        <div className="p-4">
          <div className="space-y-[1px]">
            {allUsers.filter(u => u.uid !== user?.uid).map(u => (
              <div key={u.uid} className="flex items-center gap-3 px-3 py-2.5 border-[0.5px] border-[#4e4638]"
                style={{ borderRadius: '8px', background: '#1c1b1b' }}>
                <div className="size-7 flex items-center justify-center shrink-0 border-[0.5px] border-[#4e4638] text-[10px] font-medium"
                  style={{ borderRadius: '8px', background: '#131313', color: '#ebc073', fontFamily: "'JetBrains Mono', monospace" }}>
                  {(u.name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium" style={{ fontFamily: "'Sora', sans-serif", color: '#e5e2e1' }}>{u.name || 'Unnamed'}</div>
                  <div className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: '#9a8f7f' }}>{u.email}</div>
                </div>
                <select
                  value={u.role || 'student'}
                  onChange={e => handleRoleChange(u.uid, e.target.value)}
                  style={{ borderRadius: '8px', border: '0.5px solid #4e4638', background: '#131313', color: '#e5e2e1', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
                  className="py-1 px-2 outline-none cursor-pointer"
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
