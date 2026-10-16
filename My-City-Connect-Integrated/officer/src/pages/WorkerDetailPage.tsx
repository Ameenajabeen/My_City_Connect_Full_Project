/**
 * MY CITY CONNECT - Worker Personnel Record Page
 * Displays worker details, GPS location map, task history, and operational performance.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { WorkerStatusBadge, StatusBadge, PriorityBadge } from '../components/common/Badge';
import { CityMap } from '../components/map/CityMap';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { workerService } from '../services/workerService';
import { Worker, Complaint } from '../types';
import {
  HardHat,
  Phone,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  MapPin,
  Award,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface WorkerDetailPageProps {
  workerId: string;
}

export const WorkerDetailPage: React.FC<WorkerDetailPageProps> = ({ workerId }) => {
  const { navigate, refreshTrigger } = useApp();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [taskHistory, setTaskHistory] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const loadWorkerData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [workerRes, historyRes] = await Promise.all([
        workerService.getWorkerById(workerId),
        workerService.getWorkerTaskHistory(workerId).catch(() => []),
      ]);
      setWorker(workerRes);
      setTaskHistory(historyRes);
    } catch {
      setIsError(true);
      setWorker(null);
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    loadWorkerData();
  }, [loadWorkerData, refreshTrigger]);

  if (isLoading) {
    return (
      <PageContainer
        title="Loading Worker Profile..."
        backPath="/workers"
        backLabel="Back to Workers"
      >
        <StateView type="loading" title="Retrieving personnel dossier..." />
      </PageContainer>
    );
  }

  if (isError || !worker) {
    return (
      <PageContainer
        title="Worker Not Found"
        backPath="/workers"
        backLabel="Back to Workers"
      >
        <StateView
          type="error"
          title="Worker profile not found"
          message={`No worker record located for ID "${workerId}".`}
          onRetry={loadWorkerData}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={worker.name}
      subtitle={`Field Personnel ID: ${worker.id} • ${worker.departmentName || 'Municipal Operations'}`}
      backPath="/workers"
      backLabel="Back to Workers"
      actions={
        <button
          id="btn-refresh-worker-detail"
          onClick={loadWorkerData}
          className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Worker ID</span>
            <strong className="text-white">{worker.employeeId || worker.id}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Email</span>
            <strong className="text-white break-all">{worker.email || 'Not provided'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Preferred Working Location</span>
            <strong className="text-white">{worker.preferredLocation || 'Not set'}</strong>
          </div>
        </div>
        {/* Header Bar */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
              {worker.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{worker.name}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  {worker.departmentName}
                </span>
                {worker.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5" />
                    {worker.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WorkerStatusBadge availability={worker.availability} />
            {worker.performanceScore !== undefined && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-mono font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {worker.performanceScore}% Score
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Details & Task History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Assignment Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Current Active Assignment
              </h3>
              {worker.currentAssignmentId ? (
                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-800/40 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      Assignment #{worker.currentAssignmentId}
                    </span>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {worker.currentComplaintTitle || 'Civic issue in progress'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Status: {worker.currentAssignmentStatus || worker.availability}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/complaints/${worker.currentAssignmentId}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg inline-flex items-center gap-1"
                  >
                    View Case
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg bg-slate-950/30">
                  Worker is currently available with no active dispatched tasks.
                </div>
              )}
            </div>

            {/* Task History Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Personnel Task History
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Total Completed: <strong className="text-white">{worker.completedTasksCount || 0}</strong>
                </span>
              </div>

              {taskHistory.length === 0 ? (
                <StateView
                  type="empty"
                  title="No tasks completed yet."
                  message="Completed municipal assignments will appear in this log once closed."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                        <th className="py-2.5 px-3">Ticket</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Resolved Date</th>
                        <th className="py-2.5 px-3 text-right">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {taskHistory.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => navigate(`/complaints/${t.id}`)}
                          className="hover:bg-slate-800/40 cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-400">
                            {t.ticketNumber || t.id.substring(0, 8)}
                          </td>
                          <td className="py-2.5 px-3 text-white font-medium">{t.category}</td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="py-2.5 px-3">
                            <PriorityBadge priority={t.priority} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {t.resolvedAt
                              ? new Date(t.resolvedAt).toLocaleDateString()
                              : 'In progress'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-white inline" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: GPS Telemetry Map */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Live GPS Location
              </h3>

              {worker.latitude && worker.longitude ? (
                <>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <p className="font-mono text-slate-400 text-[11px]">
                      Lat: {worker.latitude.toFixed(5)}, Lng: {worker.longitude.toFixed(5)}
                    </p>
                    {worker.lastLocationUpdate && (
                      <p className="text-[10px] text-slate-400">
                        Signal: {new Date(worker.lastLocationUpdate).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-800">
                    <CityMap
                      workers={[worker]}
                      selectedWorker={worker}
                      className="w-full h-64"
                    />
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
                  Worker location unavailable.
                </div>
              )}
            </div>

            {/* Performance Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Performance Indices
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Resolution Efficiency</span>
                  <span className="font-mono font-bold text-white">
                    {worker.performanceScore ? `${worker.performanceScore}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Workload</span>
                  <span className="font-mono font-bold text-white">
                    {worker.activeTasksCount || 0} active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Completed All-Time</span>
                  <span className="font-mono font-bold text-white">
                    {worker.completedTasksCount || 0} tasks
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
