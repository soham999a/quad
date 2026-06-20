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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
        <Shield size={40} color="var(--text-muted)" opacity={0.4} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>Admin access required</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You don't have permission to view this page.</div>
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
    <div className="page-pad animate-fade" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Admin Panel</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Manage users, assign evaluators, and configure roles</p>
        </div>
        <button onClick={loadData} disabled={loading} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Students', count: students.length, icon: Users, color: '#6366f1' },
          { label: 'Evaluators', count: evaluators.length, icon: UserCheck, color: '#10b981' },
          { label: 'Admins', count: admins.length, icon: Shield, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '16px 20px', background: 'var(--navy-4)', border: '1px solid var(--border-light)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk', color: stat.color }}>{stat.count}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text" placeholder="Search students by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, fontSize: 13 }}
        />
      </div>

      {/* Students Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
          Students ({filtered.length})
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading users...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No students found.</div>
        ) : (
          filtered.map((student, i) => {
            const isExpanded = expandedStudent === student.uid;
            const evaluator = getCurrentEvaluator(student.uid);
            return (
              <div key={student.uid} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div
                  onClick={() => setExpandedStudent(isExpanded ? null : student.uid)}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{(student.name || student.email || '?')[0].toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name || 'Unnamed'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={10} /> {student.email || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {evaluator ? (
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <UserCheck size={11} /> {evaluator.name || 'Assigned'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} /> Unassigned
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border-light)' }}>
                    {/* Assign evaluator */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {evaluator ? 'Change Evaluator' : 'Assign Evaluator'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {evaluators.filter(e => e.uid !== assignments[student.uid]).map(ev => (
                        <button key={ev.uid} onClick={() => handleAssign(student.uid, ev.uid)} style={{
                          padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                          color: '#34d399', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <UserCheck size={12} /> {ev.name || ev.email}
                        </button>
                      ))}
                      {evaluators.filter(e => e.uid !== assignments[student.uid]).length === 0 && evaluators.length > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>All evaluators already assigned</span>
                      )}
                      {evaluators.length === 0 && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No evaluators available. Change a user's role to evaluator first.</span>
                      )}
                    </div>

                    {/* Remove current evaluator */}
                    {evaluator && (
                      <div style={{ marginTop: 10 }}>
                        <button onClick={() => handleRemove(student.uid, evaluator.uid)} style={{
                          padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}>
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
      <div className="card" style={{ marginTop: 20, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
          All Users — Role Management
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {allUsers.filter(u => u.uid !== user?.uid).map(u => (
              <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--navy-4)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>{(u.name || u.email || '?')[0].toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name || 'Unnamed'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
                <select
                  value={u.role || 'student'}
                  onChange={e => handleRoleChange(u.uid, e.target.value)}
                  style={{ width: 'auto', padding: '4px 8px', fontSize: 11, borderRadius: 6 }}
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
