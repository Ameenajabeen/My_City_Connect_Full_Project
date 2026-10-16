/**
 * MY CITY CONNECT - Status & Priority Badges
 * Professional Enterprise White + Black styling with high contrast.
 */
import React from 'react';
import {
  ComplaintPriority,
  ComplaintStatus,
  WorkerAvailability,
  RedZoneSeverity,
} from '../../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  UserCheck,
  Eye,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  className?: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (priority === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded bg-red-50 text-red-700 border border-red-200 whitespace-nowrap ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
        HIGH
      </span>
    );
  }

  if (priority === 'MEDIUM') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${sizeClasses} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        MEDIUM
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      LOW
    </span>
  );
};

interface StatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'SUBMITTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200 whitespace-nowrap ${className}`}
        >
          <Clock className="w-3 h-3 text-zinc-600" />
          Submitted
        </span>
      );
    case 'VERIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-900 border border-zinc-300 whitespace-nowrap ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-zinc-700" />
          Verified
        </span>
      );
    case 'REJECTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200 whitespace-nowrap ${className}`}
        >
          <XCircle className="w-3 h-3 text-red-600" />
          Rejected
        </span>
      );
    case 'ASSIGNED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-900 border border-zinc-300 whitespace-nowrap ${className}`}
        >
          <UserCheck className="w-3 h-3 text-zinc-700" />
          Assigned
        </span>
      );
    case 'WORKER_ACCEPTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-900 border border-zinc-300 whitespace-nowrap ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-zinc-700" />
          Accepted
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${className}`}
        >
          <PlayCircle className="w-3 h-3 text-amber-600" />
          In Progress
        </span>
      );
    case 'WORKER_COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-900 border border-zinc-300 whitespace-nowrap ${className}`}>
          <Eye className="w-3 h-3 text-zinc-700" />
          Worker Completed
        </span>
      );
    case 'OFFICER_VERIFICATION':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-900 border border-zinc-300 whitespace-nowrap ${className}`}>
          <Eye className="w-3 h-3 text-zinc-700" />
          Officer Verification
        </span>
      );
    case 'REWORK':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${className}`}>
          <PlayCircle className="w-3 h-3 text-amber-600" />
          Rework
        </span>
      );
    case 'AWAITING_VERIFICATION':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-900 border border-zinc-300 whitespace-nowrap ${className}`}
        >
          <Eye className="w-3 h-3 text-zinc-700" />
          Awaiting Approval
        </span>
      );
    case 'RESOLVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap ${className}`}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    case 'CLOSED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap ${className}`}
        >
          <CheckCircle2 className="w-3 h-3 text-zinc-500" />
          Closed
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200 whitespace-nowrap ${className}`}
        >
          {status}
        </span>
      );
  }
};

interface WorkerStatusBadgeProps {
  availability: WorkerAvailability;
  className?: string;
}

export const WorkerStatusBadge: React.FC<WorkerStatusBadgeProps> = ({
  availability,
  className = '',
}) => {
  if (availability === 'AVAILABLE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        AVAILABLE
      </span>
    );
  }

  if (availability === 'BUSY') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        DISPATCHED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-600 border border-zinc-200 whitespace-nowrap ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
      OFFLINE
    </span>
  );
};

interface RedZoneSeverityBadgeProps {
  severity: RedZoneSeverity;
  className?: string;
}

export const RedZoneSeverityBadge: React.FC<RedZoneSeverityBadgeProps> = ({
  severity,
  className = '',
}) => {
  if (severity === 'CRITICAL') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-red-50 text-red-700 border border-red-200 whitespace-nowrap ${className}`}
      >
        <AlertTriangle className="w-3 h-3 text-red-600" />
        CRITICAL SEVERITY
      </span>
    );
  }

  if (severity === 'HIGH') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${className}`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        HIGH RISK
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-zinc-100 text-zinc-800 border border-zinc-200 whitespace-nowrap ${className}`}
    >
      <Radio className="w-3 h-3 text-zinc-600" />
      WARNING
    </span>
  );
};
