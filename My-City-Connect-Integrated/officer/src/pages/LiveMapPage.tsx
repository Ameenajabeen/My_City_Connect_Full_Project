/**
 * MY CITY CONNECT - Live Map Page
 * Full tactical map command center with multi-layer overlays, worker tracking, and route calculation.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { CityMap } from '../components/map/CityMap';
import { MapInfoPanel } from '../components/map/MapInfoPanel';
import { StateView } from '../components/common/StateView';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { workerService } from '../services/workerService';
import { redZoneService } from '../services/redZoneService';
import { departmentService } from '../services/departmentService';
import { Complaint, Worker, RedZone, Department, ComplaintPriority, WorkerAvailability } from '../types';
import {
  Layers,
  Filter,
  RefreshCw,
  Navigation,
  MapPin,
  HardHat,
  AlertOctagon,
  X,
} from 'lucide-react';

export const LiveMapPage: React.FC = () => {
  const { refreshTrigger } = useApp();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [redZones, setRedZones] = useState<RedZone[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Tactical Filters
  const [filterPriority, setFilterPriority] = useState<ComplaintPriority | 'ALL'>('ALL');
  const [filterDept, setFilterDept] = useState<string | 'ALL'>('ALL');
  const [filterWorkerStatus, setFilterWorkerStatus] = useState<WorkerAvailability | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const loadAllMapData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [compRes, workRes, zonesRes, deptsRes] = await Promise.all([
        complaintService.getComplaints({ limit: 100 }).catch(() => ({ data: [], total: 0 })),
        workerService.getWorkers().catch(() => []),
        redZoneService.getRedZones().catch(() => []),
        departmentService.getDepartments().catch(() => []),
      ]);

      setComplaints(compRes.data || []);
      setWorkers(workRes || []);
      setRedZones(zonesRes || []);
      setDepartments(deptsRes || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllMapData();
  }, [loadAllMapData, refreshTrigger]);

  // Filtered lists based on officer selections
  const filteredComplaints = complaints.filter((c) => {
    if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
    if (filterDept !== 'ALL' && c.departmentId !== filterDept) return false;
    return true;
  });

  const filteredWorkers = workers.filter((w) => {
    if (filterWorkerStatus !== 'ALL' && w.availability !== filterWorkerStatus) return false;
    if (filterDept !== 'ALL' && w.departmentId !== filterDept) return false;
    return true;
  });

  return (
    <PageContainer
      title="City Tactical Live Map"
      subtitle="Geospatial command console: live citizen incident points, worker GPS locations, and high-density red zones."
      fullWidth
      actions={
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-map-filters"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              showFilters || filterPriority !== 'ALL' || filterDept !== 'ALL' || filterWorkerStatus !== 'ALL'
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>

          {selectedWorker && selectedComplaint && (
            <div className="text-xs text-blue-400 bg-blue-950/40 border border-blue-800/40 px-3 py-1 rounded-lg">
              Viewing Worker &amp; Complaint locations
            </div>
          )}

          <button
            id="btn-refresh-live-map"
            onClick={loadAllMapData}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
            title="Refresh Map Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-3 relative">
        {/* Tactical Filters Dropdown Panel */}
        {showFilters && (
          <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl backdrop-blur-md text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-100">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Department
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Complaint Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as ComplaintPriority | 'ALL')}
                  className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority Only</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Worker Availability
                </label>
                <select
                  value={filterWorkerStatus}
                  onChange={(e) => setFilterWorkerStatus(e.target.value as WorkerAvailability | 'ALL')}
                  className="px-2.5 py-1 text-xs rounded bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="ALL">All Workers</option>
                  <option value="AVAILABLE">Available Only</option>
                  <option value="BUSY">Busy</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setFilterDept('ALL');
                setFilterPriority('ALL');
                setFilterWorkerStatus('ALL');
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Live GIS Map Canvas */}
        <div className="relative">
          <CityMap
            complaints={filteredComplaints}
            workers={filteredWorkers}
            redZones={redZones}
            selectedComplaint={selectedComplaint}
            selectedWorker={selectedWorker}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onSelectWorker={(w) => setSelectedWorker(w)}
            className="w-full h-[calc(100vh-14rem)] min-h-[550px]"
          />

          {/* Slide-out Information Dossier */}
          <MapInfoPanel
            selectedComplaint={selectedComplaint}
            selectedWorker={selectedWorker}
            onClose={() => {
              setSelectedComplaint(null);
              setSelectedWorker(null);
            }}
          />
        </div>
      </div>
    </PageContainer>
  );
};
