/**
 * MY CITY CONNECT - Complaint Status Timeline
 * Reflects actual complaint resolution milestones and backend statusHistory.
 */
import React from 'react';
import { Complaint, ComplaintStatus, StatusHistoryItem } from '../../types';
import {
  FileText,
  ShieldCheck,
  Building2,
  UserCheck,
  CheckCircle,
  PlayCircle,
  Camera,
  Eye,
  Award,
  Clock,
  XCircle,
} from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  targetStatus: ComplaintStatus[];
  icon: React.ElementType;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: 'submitted', label: 'Submitted', targetStatus: ['SUBMITTED'], icon: FileText },
  { key: 'verified', label: 'Verified', targetStatus: ['VERIFIED'], icon: ShieldCheck },
  { key: 'dept_assigned', label: 'Department Assigned', targetStatus: ['DEPARTMENT_ASSIGNED'], icon: Building2 },
  { key: 'worker_assigned', label: 'Worker Assigned', targetStatus: ['WORKER_ASSIGNED'], icon: UserCheck },
  { key: 'worker_accepted', label: 'Worker Accepted', targetStatus: ['WORKER_ASSIGNED'], icon: CheckCircle },
  { key: 'in_progress', label: 'In Progress', targetStatus: ['IN_PROGRESS'], icon: PlayCircle },
  { key: 'proof_uploaded', label: 'Completion Proof', targetStatus: ['WORKER_COMPLETED'], icon: Camera },
  { key: 'officer_verification', label: 'Officer Verification', targetStatus: ['OFFICER_VERIFICATION', 'WORKER_COMPLETED'], icon: Eye },
  { key: 'resolved', label: 'Resolved', targetStatus: ['RESOLVED'], icon: Award },
];

interface ComplaintStatusTimelineProps {
  complaint: Complaint;
}

export const ComplaintStatusTimeline: React.FC<ComplaintStatusTimelineProps> = ({ complaint }) => {
  const currentStatus = complaint.status;
  const history = complaint.statusHistory || [];

  // Determine which steps are achieved based on status hierarchy or backend status history
  const statusRank: Record<ComplaintStatus, number> = {
    SUBMITTED: 0,
    VERIFIED: 1,
    REJECTED: -1,
    DEPARTMENT_ASSIGNED: 2,
    WORKER_ASSIGNED: 3,
    IN_PROGRESS: 5,
    WORKER_COMPLETED: 6,
    OFFICER_VERIFICATION: 7,
    REWORK: 5,
    DUPLICATE: -1,
    AI_VERIFICATION: 0,
    CANCELLED: -1,
    RESOLVED: 8,
    CLOSED: 9,
  };

  const currentRank = statusRank[currentStatus] ?? 0;
  const isRejected = currentStatus === 'REJECTED';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Resolution Workflow Timeline
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          Current: <strong className="text-blue-400">{currentStatus.replace('_', ' ')}</strong>
        </span>
      </div>

      {isRejected && (
        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-300 flex items-center gap-2 text-xs">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>This complaint was marked as Rejected during verification.</span>
        </div>
      )}

      {/* Interactive visual stepping */}
      <div className="relative pt-2 pb-2">
        <div className="hidden lg:grid grid-cols-9 gap-1 items-start">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = !isRejected && idx <= currentRank;
            const isCurrent = !isRejected && idx === currentRank;

            // Match timestamp from history if available
            const matchingHistory = history.find((h) =>
              step.targetStatus.includes(h.status)
            );

            return (
              <div key={step.key} className="flex flex-col items-center text-center px-1">
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    isCurrent
                      ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/20'
                      : isCompleted
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Step Label */}
                <span
                  className={`mt-2 text-[11px] font-semibold leading-tight ${
                    isCurrent
                      ? 'text-blue-400'
                      : isCompleted
                      ? 'text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* Real backend timestamp */}
                {matchingHistory?.timestamp && (
                  <span className="mt-1 text-[9px] font-mono text-slate-400">
                    {new Date(matchingHistory.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile / Tablet vertical layout */}
        <div className="lg:hidden space-y-3">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = !isRejected && idx <= currentRank;
            const isCurrent = !isRejected && idx === currentRank;
            const matchingHistory = history.find((h) =>
              step.targetStatus.includes(h.status)
            );

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${
                    isCurrent
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : isCompleted
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-semibold ${
                        isCurrent ? 'text-blue-400' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {matchingHistory?.timestamp && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(matchingHistory.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {matchingHistory?.comment && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{matchingHistory.comment}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
