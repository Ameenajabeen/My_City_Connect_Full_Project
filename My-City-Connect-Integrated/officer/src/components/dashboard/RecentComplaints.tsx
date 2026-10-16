/**
 * MY CITY CONNECT - Recent Complaints Table
 * Enterprise White + Black styling for latest incidents.
 */
import React from 'react';
import { Complaint } from '../../types';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { StateView } from '../common/StateView';
import { useApp } from '../../context/AppContext';
import { Eye, MapPin, ArrowRight } from 'lucide-react';

interface RecentComplaintsProps {
  complaints: Complaint[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export const RecentComplaints: React.FC<RecentComplaintsProps> = ({
  complaints,
  isLoading,
  isError,
  onRetry,
}) => {
  const { navigate } = useApp();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Latest Citizen Complaints
          </h2>
        </div>
        <StateView type="loading" title="Loading latest complaints..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Latest Citizen Complaints
          </h2>
        </div>
        <StateView
          type="error"
          title="Unable to load complaints"
          message="Could not retrieve real records from the backend API."
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!complaints || complaints.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Latest Citizen Complaints
          </h2>
        </div>
        <StateView
          type="empty"
          title="No complaints registered yet"
          message="Citizen complaints will automatically stream here once submitted to the NestJS backend."
          onRetry={onRetry}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50">
        <div>
          <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Latest Citizen Complaints
          </h2>
          <p className="text-[11px] text-zinc-500">
            Real-time feed of citizen reports requiring officer assessment
          </p>
        </div>
        <button
          id="btn-view-all-complaints"
          onClick={() => navigate('/complaints')}
          className="inline-flex items-center gap-1 text-xs font-bold text-zinc-900 hover:text-zinc-600 transition-colors"
        >
          View Full Register
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4">Ticket #</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Location</th>
              <th className="py-2.5 px-4">Priority</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Department</th>
              <th className="py-2.5 px-4">Worker</th>
              <th className="py-2.5 px-4">Date & Time</th>
              <th className="py-2.5 px-4 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {complaints.map((item) => (
              <tr
                key={item.id}
                onClick={() => navigate(`/complaints/${item.id}`)}
                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 font-mono font-bold text-zinc-900 group-hover:text-black">
                  {item.ticketNumber || item.id.substring(0, 8)}
                </td>
                <td className="py-3 px-4 font-semibold text-zinc-800 max-w-[150px] truncate">
                  {item.category}
                </td>
                <td className="py-3 px-4 text-zinc-600 max-w-[200px] truncate">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="truncate">{item.address || `${item.latitude}, ${item.longitude}`}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <PriorityBadge priority={item.priority} size="sm" />
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="py-3 px-4 text-zinc-700">
                  {item.departmentName || <span className="text-zinc-400 italic">Unassigned</span>}
                </td>
                <td className="py-3 px-4 text-zinc-700">
                  {item.assignedWorkerName || <span className="text-zinc-400 italic">Unassigned</span>}
                </td>
                <td className="py-3 px-4 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                  {new Date(item.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    id={`btn-view-complaint-${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/complaints/${item.id}`);
                    }}
                    className="p-1.5 rounded text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
                    title="Open Incident Dossier"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
