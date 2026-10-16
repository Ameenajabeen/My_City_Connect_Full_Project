/**
 * MY CITY CONNECT - Municipal Departments Page
 * Direct governance over city administrative divisions, workforce headcount, and SLA resolution rates.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { departmentService } from '../services/departmentService';
import { Modal } from '../components/common/Modal';
import { Department } from '../types';
import {
  Building2,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  RefreshCw,
  HardHat,
  Award,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const { refreshTrigger, navigate } = useApp();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');

  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res);
    } catch {
      setIsError(true);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments, refreshTrigger]);

  const createDepartment = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await departmentService.createDepartment({ name: departmentName.trim(), code: departmentCode.trim() });
      setDepartmentName('');
      setDepartmentCode('');
      setCreateOpen(false);
      await loadDepartments();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create department.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer
      title="Municipal Departments & Units"
      subtitle="Administrative oversight across civic engineering divisions: roads, sanitation, electrical grids, and public health."
      actions={
        <div className="flex items-center gap-2">
          <button
            id="btn-create-department"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Department
          </button>
          <button
            id="btn-refresh-departments"
            onClick={loadDepartments}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Registry
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {isLoading ? (
          <StateView type="loading" title="Retrieving departmental registry..." />
        ) : isError ? (
          <StateView
            type="error"
            title="Failed to load departments"
            message="Could not communicate with the backend municipal registry."
            onRetry={loadDepartments}
          />
        ) : departments.length === 0 ? (
          <StateView
            type="empty"
            title="No municipal departments configured."
            message="Departments configured in the backend database will appear here."
            onRetry={loadDepartments}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => {
              const efficiency =
                dept.efficiencyScore !== undefined
                  ? dept.efficiencyScore
                  : dept.totalComplaints && dept.totalComplaints > 0
                  ? Math.round(((dept.resolvedComplaints || 0) / dept.totalComplaints) * 100)
                  : undefined;

              return (
                <div
                  key={dept.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-tight">
                            {dept.name}
                          </h3>
                          <span className="text-[10px] font-mono text-blue-400 uppercase">
                            Code: {dept.code || dept.id}
                          </span>
                        </div>
                      </div>

                      {efficiency !== undefined && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                          {efficiency}% SLA
                        </span>
                      )}
                    </div>

                    {dept.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {dept.description}
                      </p>
                    )}

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center font-mono">
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                          Complaints
                        </span>
                        <span className="text-sm font-bold text-white">
                          {dept.totalComplaints ?? 0}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                          Resolved
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          {dept.resolvedComplaints ?? 0}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                          Workers
                        </span>
                        <span className="text-sm font-bold text-blue-400">
                          {dept.totalWorkersCount ?? dept.activeWorkers ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1.5 text-xs text-slate-400">
                      {dept.headName && (
                        <div className="text-slate-300 font-medium">
                          Head: <span className="text-white">{dept.headName}</span>
                        </div>
                      )}
                      {dept.contactPhone && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dept.contactPhone}</span>
                        </div>
                      )}
                      {dept.contactEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{dept.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/complaints?departmentId=${dept.id}`)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      View Department Complaints
                    </button>
                    <button
                      onClick={() => navigate(`/workers?departmentId=${dept.id}`)}
                      className="text-xs font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1"
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      Workers
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Department"
        description="Add a department to the shared municipal registry."
        confirmText="Create Department"
        onConfirm={createDepartment}
        isLoading={creating}
      >
        <label className="block text-xs font-semibold text-slate-300">
          Department name
          <input
            value={departmentName}
            onChange={(event) => setDepartmentName(event.target.value)}
            maxLength={120}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
            required
          />
        </label>
        <label className="block text-xs font-semibold text-slate-300">
          Department code
          <input
            value={departmentCode}
            onChange={(event) => setDepartmentCode(event.target.value.toUpperCase())}
            maxLength={20}
            pattern="[A-Za-z0-9_-]+"
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
            required
          />
        </label>
        {createError && <p role="alert" className="text-xs text-rose-400">{createError}</p>}
      </Modal>
    </PageContainer>
  );
};
