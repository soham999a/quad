// ─── Notification type registry ──────────────────────────────────────────────
// One entry per notification `type`: the bell's icon, colour token and plain
// label. Adding an event anywhere in the app means adding a line here — the
// bell stays consistent by construction. Use only token colours (never raw
// hex) so both themes hold.
import {
  Bell,
  ClipboardList,
  UserPlus,
  UserCheck,
  CheckCircle2,
  ClipboardCheck,
  BookOpen,
  Shield,
  Mic,
} from 'lucide-react';

export const NOTIFICATION_TYPES = {
  // Teacher assigned an assessment → student
  assignment: { icon: ClipboardList, color: 'var(--phase-pre)', label: 'Assignment' },
  // Student joined a class → teacher
  join: { icon: UserPlus, color: 'var(--status-ok)', label: 'Class' },
  // Attempt recorded → student (own submission) and now → teacher (roster)
  attempt: { icon: CheckCircle2, color: 'var(--status-ok)', label: 'Submission' },
  // Individual selected an evaluator → evaluator
  evaluator: { icon: UserCheck, color: 'var(--status-warn)', label: 'Evaluator' },
  // Evaluator finished a pillar rubric → student ("your scores merged")
  evaluation: { icon: ClipboardCheck, color: 'var(--gold)', label: 'Evaluation' },
  // Child finished a practice chapter → guardian
  kid: { icon: BookOpen, color: 'var(--status-ok)', label: 'Kids' },
  // Interview report completed → candidate / evaluator parties
  interview: { icon: Mic, color: 'var(--phase-pre)', label: 'Interview' },
  // Admin signal (new evaluator signup / role grant)
  admin: { icon: Shield, color: 'var(--status-warn)', label: 'Admin' },
};

export function notificationType(type) {
  return NOTIFICATION_TYPES[type] || { icon: Bell, color: 'var(--gold)', label: 'Notice' };
}
