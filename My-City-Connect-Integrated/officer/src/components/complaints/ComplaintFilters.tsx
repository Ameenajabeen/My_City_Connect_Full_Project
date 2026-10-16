/**
 * MY CITY CONNECT - Complaint Filters
 */
import React from 'react';
import { ComplaintPriority, ComplaintStatus } from '../../types';
import { Filter, X, Search } from 'lucide-react';

interface ComplaintFiltersProps {
  status: ComplaintStatus | 'ALL';
  setStatus: (s: ComplaintStatus | 'ALL') => void;
  priority: ComplaintPriority | 'ALL';
  setPriority: (p: ComplaintPriority | 'ALL') => void;
  category: string | 'ALL';
  setCategory: (c: string | 'ALL') => void;
  departmentId: string | 'ALL';
  setDepartmentId: (d: string | 'ALL') => void;
  search: string;
  setSearch: (s: string) => void;
  departments?: Array<{ id: string; name: string }>;
  onReset: () => void;
}

const CATEGORIES = [
  'Potholes',
  'Garbage accumulation',
  'Broken streetlights',
  'Water leakage',
  'Drainage problems',
  'Damaged roads',
  'Stray animals',
  'Other municipal issues',
];

const STATUSES: ComplaintStatus[] = [
  'SUBMITTED',
  'AI_VERIFICATION',
  'VERIFIED',
  'DUPLICATE',
  'DEPARTMENT_ASSIGNED',
  'WORKER_ASSIGNED',
  'REJECTED',
  'IN_PROGRESS',
  'WORKER_COMPLETED',
  'OFFICER_VERIFICATION',
  'REWORK',
  'RESOLVED',
  'CLOSED',
];

export const ComplaintFilters: React.FC<ComplaintFiltersProps> = ({
  status,
  setStatus,
  priority,
  setPriority,
  category,
  setCategory,
  departmentId,
  setDepartmentId,
  search,
  setSearch,
  departments = [],
  onReset,
}) => {
  const isFiltered =
    status !== 'ALL' || priority !== 'ALL' || category !== 'ALL' || departmentId !== 'ALL' || search.trim() !== '';

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xs space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="input-complaint-filter-search"
            type="text"
            placeholder="Search complaint description, address, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          {/* Status */}
          <select
            id="select-filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ComplaintStatus | 'ALL')}
            className="px-2.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            id="select-filter-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as ComplaintPriority | 'ALL')}
            className="px-2.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Category */}
          <select
            id="select-filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            id="select-filter-department"
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
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <button
            id="btn-clear-complaint-filters"
            onClick={onReset}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
