/**
 * MY CITY CONNECT - Field Workforce Management Page
 * Monitors live personnel availability, task assignments, and municipal departments.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { WorkerStatusBadge } from '../components/common/Badge';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { workerService } from '../services/workerService';
import { departmentService } from '../services/departmentService';
import { Worker, Department, WorkerAvailability } from '../types';
import {
  HardHat,
  Search,
  RefreshCw,
  Eye,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  Phone,
} from 'lucide-react';

export const WorkersPage: React.FC = () => {
  const { navigate, refreshTrigger } = useApp();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Filters
  const [departmentId, setDepartmentId] = useState<string | 'ALL'>(() =>
    new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('departmentId') || 'ALL'
  );
  const [availability, setAvailability] = useState<WorkerAvailability | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');

  const loadWorkers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [workerRes, deptRes] = await Promise.all([
        workerService.getWorkers({
          departmentId: departmentId !== 'ALL' ? departmentId : undefined,
          availability: availability !== 'ALL' ? availability : undefined,
          search: search.trim() ? search.trim() : undefined,
        }),
        departmentService.getDepartments().catch(() => []),
      ]);
      setWorkers(workerRes);
      setDepartments(deptRes);
    } catch {
      setIsError(true);
      setWorkers([]);
    } finally {
      setIsLoading(false);
    }
  }, [departmentId, availability, search]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers, refreshTrigger]);

  const handleResetFilters = () => {
    setDepartmentId('ALL');
    setAvailability('ALL');
    setSearch('');
  };

  return (
    <PageContainer
      title="Field Workforce Management"
      subtitle="Direct oversight of municipal personnel across sanitation, public works, electricity, and water supply units."
      actions={
        <button
          id="btn-refresh-workers"
          onClick={loadWorkers}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Workforce
        </button>
      }
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-worker-search"
              type="text"
              placeholder="Search worker by name, ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Department Filter */}
            <select
              id="select-worker-dept-filter"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Availability Filter */}
            <select
              id="select-worker-status-filter"
              value={availability}
              onChange={(e) => setAvailability(e.target.value as WorkerAvailability | 'ALL')}
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="BUSY">Busy</option>
              <option value="OFFLINE">Offline</option>
            </select>

            {(departmentId !== 'ALL' || availability !== 'ALL' || search) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Worker Table / Empty State */}
        {isLoading ? (
          <StateView type="loading" title="Loading field personnel records..." />
        ) : isError ? (
          <StateView
            type="error"
            title="Unable to load workers"
            message="Could not retrieve workforce records from the backend API."
            onRetry={loadWorkers}
          />
        ) : workers.length === 0 ? (
          <StateView
            type="empty"
            title={
              departmentId !== 'ALL' || availability !== 'ALL' || search
                ? 'No matching field workers found'
                : 'No field workers registered in the system.'
            }
            message={
              departmentId !== 'ALL' || availability !== 'ALL' || search
                ? 'Try resetting the filters or searching with different terms.'
                : 'Workers will appear here once provisioned in the backend database or when registered via the Worker Mobile App.'
            }
            actionText={
              departmentId !== 'ALL' || availability !== 'ALL' || search
                ? 'Clear Filters'
                : undefined
            }
            onAction={handleResetFilters}
            onRetry={loadWorkers}
          />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Worker ID</th>
                    <th className="py-3 px-4">Personnel Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Preferred Working Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Current Task</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Performance</th>
                    <th className="py-3 px-4">Last GPS Update</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {workers.map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => navigate(`/workers/${w.id}`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        {w.employeeId || w.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-900/30 border border-blue-600/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{w.name}</span>
                            {w.phone && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {w.phone}
                              </span>
                            )}
                            {w.email && <span className="text-[10px] text-slate-400 block">{w.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {w.departmentName || 'General Municipal'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {w.preferredLocation || <span className="text-slate-500 italic">Not set</span>}
                      </td>
                      <td className="py-3 px-4">
                        <WorkerStatusBadge availability={w.availability} />
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                        {w.currentComplaintTitle || (
                          <span className="text-slate-400 italic">None assigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {w.completedTasksCount || 0}
                      </td>
                      <td className="py-3 px-4">
                        {w.performanceScore !== undefined ? (
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-emerald-400 font-bold">
                              {w.performanceScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unrated</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {w.lastLocationUpdate ? (
                          new Date(w.lastLocationUpdate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-slate-400 italic">No GPS signal</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`btn-open-worker-${w.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/workers/${w.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="Open Worker Profile"
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
        )}
      </div>
    </PageContainer>
  );
};
