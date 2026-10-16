/**
 * MY CITY CONNECT - Assign Worker Modal
 */
import React, { useState, useEffect } from 'react';
import { Worker, Department } from '../../types';
import { workerService } from '../../services/workerService';
import { WorkerStatusBadge } from '../common/Badge';
import { StateView } from '../common/StateView';
import { UserCheck, Search, HardHat, Check } from 'lucide-react';

interface AssignWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  complaintLocation?: string;
  departmentId?: string;
  departments: Department[];
  onAssign: (workerId: string, departmentId: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const AssignWorkerModal: React.FC<AssignWorkerModalProps> = ({
  isOpen,
  onClose,
  complaintId,
  complaintLocation,
  departmentId: initialDeptId,
  departments,
  onAssign,
  isLoading = false,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDeptId || '');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState<boolean>(false);
  const [workerSearch, setWorkerSearch] = useState<string>('');

  useEffect(() => {
    if (initialDeptId) {
      setSelectedDeptId(initialDeptId);
    }
  }, [initialDeptId]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingWorkers(true);
    workerService
      .getWorkers({ departmentId: selectedDeptId || undefined })
      .then((res) => {
        setWorkers(res);
      })
      .catch(() => {
        setWorkers([]);
      })
      .finally(() => {
        setLoadingWorkers(false);
      });
  }, [isOpen, selectedDeptId]);

  if (!isOpen) return null;

  const normalizeLocation = (value?: string | null) =>
    value?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() || '';
  const matchesComplaintLocation = (worker: Worker) => {
    const complaintArea = normalizeLocation(complaintLocation);
    const preferredArea = normalizeLocation(worker.preferredLocation);
    return Boolean(complaintArea && preferredArea && (
      complaintArea.includes(preferredArea) || preferredArea.includes(complaintArea)
    ));
  };
  const filteredWorkers = workers.filter((w) => {
    if (!workerSearch.trim()) return true;
    const q = workerSearch.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q) ||
      (w.departmentName && w.departmentName.toLowerCase().includes(q))
    );
  }).sort((a, b) => Number(matchesComplaintLocation(b)) - Number(matchesComplaintLocation(a)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || !selectedDeptId) return;
    await onAssign(selectedWorkerId, selectedDeptId, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Assign Field Worker</h3>
              <p className="text-[11px] text-slate-400">Dispatch municipal worker to complaint location</p>
              {complaintLocation && (
                <p className="text-[11px] text-slate-300 mt-1">Complaint location: {complaintLocation}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Department Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Responsible Department
            </label>
            <select
              id="select-assign-department"
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedWorkerId('');
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">-- Choose Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code || d.id})
                </option>
              ))}
            </select>
          </div>

          {/* Worker Selector List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Choose Field Worker
              </label>
              {workers.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  {workers.filter((w) => w.availability === 'AVAILABLE').length} Available
                </span>
              )}
            </div>

            {/* Worker Filter Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search worker by name, ID..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {loadingWorkers ? (
              <div className="py-8 text-center text-xs text-slate-400 border border-slate-800 rounded-lg">
                Retrieving active worker roster...
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 border border-slate-800 rounded-lg bg-slate-950/40">
                {workers.length === 0
                  ? 'No workers registered in this department.'
                  : 'No matching workers found.'}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-800 rounded-lg p-1.5 bg-slate-950/50">
                {filteredWorkers.map((w) => {
                  const isSelected = selectedWorkerId === w.id;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorkerId(w.id)}
                      className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                          : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <HardHat className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold block truncate">{w.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {w.id} • Workload: {w.activeTasksCount || 0} active
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Preferred location: {w.preferredLocation || 'Not set'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {matchesComplaintLocation(w) && (
                          <span className="text-[9px] text-emerald-300 font-semibold">Area match</span>
                        )}
                        <WorkerStatusBadge availability={w.availability} />
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Operational Dispatch Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dispatch Instructions / Field Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inspect drainage blockage behind block C. Priority inspection required."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-worker-assignment"
              type="submit"
              disabled={isLoading || !selectedWorkerId || !selectedDeptId}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg inline-flex items-center gap-1.5"
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Confirm Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
