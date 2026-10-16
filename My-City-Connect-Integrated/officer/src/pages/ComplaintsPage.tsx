/**
 * MY CITY CONNECT - Complaints Register Page
 * Full citizen issue directory with advanced filters, pagination, and CSV export.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { ComplaintFilters } from '../components/complaints/ComplaintFilters';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { departmentService } from '../services/departmentService';
import { Complaint, ComplaintPriority, ComplaintStatus, Department } from '../types';
import {
  Download,
  RefreshCw,
  Eye,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const { navigate, refreshTrigger } = useApp();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Filters
  const [status, setStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [priority, setPriority] = useState<ComplaintPriority | 'ALL'>('ALL');
  const [category, setCategory] = useState<string | 'ALL'>('ALL');
  const [departmentId, setDepartmentId] = useState<string | 'ALL'>(() =>
    new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('departmentId') || 'ALL'
  );
  const [search, setSearch] = useState<string>('');

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(15);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Load departments for filter dropdown
  useEffect(() => {
    departmentService
      .getDepartments()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  // Fetch Complaints from Real API
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await complaintService.getComplaints({
        status: status !== 'ALL' ? status : undefined,
        priority: priority !== 'ALL' ? priority : undefined,
        category: category !== 'ALL' ? category : undefined,
        departmentId: departmentId !== 'ALL' ? departmentId : undefined,
        search: search.trim() ? search.trim() : undefined,
        page,
        limit,
      });
      setComplaints(res.data || []);
      setTotalCount(res.total || (res.data ? res.data.length : 0));
    } catch {
      setIsError(true);
      setComplaints([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [status, priority, category, departmentId, search, page, limit]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints, refreshTrigger]);

  const handleResetFilters = () => {
    setStatus('ALL');
    setPriority('ALL');
    setCategory('ALL');
    setDepartmentId('ALL');
    setSearch('');
    setPage(1);
  };

  // Export Real Complaints to CSV
  const handleExportCSV = () => {
    if (complaints.length === 0) return;

    const headers = [
      'Ticket Number',
      'Category',
      'Description',
      'Priority',
      'Status',
      'Department',
      'Worker',
      'Citizen Name',
      'Citizen Phone',
      'Address',
      'Created At',
    ];

    const rows = complaints.map((c) => [
      `"${c.ticketNumber || c.id}"`,
      `"${c.category || ''}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      `"${c.priority || ''}"`,
      `"${c.status || ''}"`,
      `"${c.departmentName || ''}"`,
      `"${c.assignedWorkerName || ''}"`,
      `"${c.citizenName || ''}"`,
      `"${c.citizenPhone || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${new Date(c.createdAt).toISOString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `complaints_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <PageContainer
      title="Citizen Complaints Register"
      subtitle="Comprehensive log of reported municipal grievances requiring officer triage, verification, and worker dispatch."
      actions={
        <div className="flex items-center gap-2">
          <button
            id="btn-export-complaints-csv"
            onClick={handleExportCSV}
            disabled={complaints.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            id="btn-refresh-complaints-page"
            onClick={fetchComplaints}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <ComplaintFilters
          status={status}
          setStatus={(s) => {
            setStatus(s);
            setPage(1);
          }}
          priority={priority}
          setPriority={(p) => {
            setPriority(p);
            setPage(1);
          }}
          category={category}
          setCategory={(c) => {
            setCategory(c);
            setPage(1);
          }}
          departmentId={departmentId}
          setDepartmentId={(d) => {
            setDepartmentId(d);
            setPage(1);
          }}
          search={search}
          setSearch={(s) => {
            setSearch(s);
            setPage(1);
          }}
          departments={departments}
          onReset={handleResetFilters}
        />

        {/* Complaints Table / State View */}
        {isLoading ? (
          <StateView type="loading" title="Loading complaints directory..." />
        ) : isError ? (
          <StateView
            type="error"
            title="Failed to retrieve complaints"
            message="An error occurred while fetching complaints from the backend service."
            onRetry={fetchComplaints}
          />
        ) : complaints.length === 0 ? (
          <StateView
            type="empty"
            title={
              status !== 'ALL' || priority !== 'ALL' || category !== 'ALL' || search
                ? 'No matching complaints found'
                : 'No complaints have been submitted yet.'
            }
            message={
              status !== 'ALL' || priority !== 'ALL' || category !== 'ALL' || search
                ? 'Try adjusting your filter parameters or search keyword.'
                : 'Citizen reports will appear here automatically when submitted from the Citizen Mobile App.'
            }
            actionText={
              status !== 'ALL' || priority !== 'ALL' || category !== 'ALL' || search
                ? 'Clear Filters'
                : undefined
            }
            onAction={handleResetFilters}
            onRetry={fetchComplaints}
          />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Worker</th>
                    <th className="py-3 px-4">Citizen</th>
                    <th className="py-3 px-4">Reported</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {complaints.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/complaints/${item.id}`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-400 group-hover:text-blue-300">
                        {item.ticketNumber || item.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-[140px] truncate">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[180px] truncate">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {item.address || `${item.latitude}, ${item.longitude}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={item.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.departmentName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.assignedWorkerName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.citizenName || <span className="text-slate-400 italic">Anonymous</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`btn-open-complaint-${item.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/complaints/${item.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="Open Complaint Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-200">{complaints.length}</strong> of{' '}
                <strong className="text-slate-200">{totalCount}</strong> records
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-complaints-prev-page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  id="btn-complaints-next-page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};
