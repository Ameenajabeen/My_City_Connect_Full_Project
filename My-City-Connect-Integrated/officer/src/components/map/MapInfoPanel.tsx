/**
 * MY CITY CONNECT - Map Information Panel
 * Enterprise White + Black slide-out drawer for selected Complaint or Worker.
 * Pure real coordinates display from MySQL. No fake routing or simulated duration.
 */
import React from 'react';
import { Complaint, Worker } from '../../types';
import { PriorityBadge, StatusBadge, WorkerStatusBadge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import {
  X,
  MapPin,
  Clock,
  User,
  Building2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface MapInfoPanelProps {
  selectedComplaint: Complaint | null;
  selectedWorker: Worker | null;
  onClose: () => void;
}

export const MapInfoPanel: React.FC<MapInfoPanelProps> = ({
  selectedComplaint,
  selectedWorker,
  onClose,
}) => {
  const { navigate } = useApp();

  if (!selectedComplaint && !selectedWorker) return null;

  const hasComplaintCoords =
    selectedComplaint &&
    typeof selectedComplaint.latitude === 'number' &&
    typeof selectedComplaint.longitude === 'number' &&
    !isNaN(selectedComplaint.latitude) &&
    !isNaN(selectedComplaint.longitude) &&
    selectedComplaint.latitude !== 0 &&
    selectedComplaint.longitude !== 0;

  const hasWorkerCoords =
    selectedWorker &&
    typeof selectedWorker.latitude === 'number' &&
    typeof selectedWorker.longitude === 'number' &&
    !isNaN(selectedWorker.latitude) &&
    !isNaN(selectedWorker.longitude) &&
    selectedWorker.latitude !== 0 &&
    selectedWorker.longitude !== 0;

  return (
    <div className="absolute top-16 right-4 z-20 w-80 md:w-96 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden text-zinc-900 animate-in slide-in-from-right-3 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">
          {selectedComplaint ? 'Incident Dossier' : 'Field Personnel Telemetry'}
        </span>
        <button
          id="btn-close-map-info-panel"
          onClick={onClose}
          className="p-1 rounded text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* COMPLAINT DETAILS */}
        {selectedComplaint && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-zinc-500 block">
                  #{selectedComplaint.ticketNumber}
                </span>
                <h4 className="text-sm font-bold text-zinc-900 leading-snug">
                  {selectedComplaint.title}
                </h4>
              </div>
              <PriorityBadge priority={selectedComplaint.priority} />
            </div>

            <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
              {selectedComplaint.description}
            </p>

            <div className="space-y-1.5 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedComplaint.status} />
                <span className="text-zinc-500">({selectedComplaint.category})</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                <span className="break-words">
                  {selectedComplaint.address || (hasComplaintCoords ? 'Coordinates on file' : 'Location not available.')}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                {hasComplaintCoords ? (
                  <span>
                    GPS: {selectedComplaint.latitude?.toFixed(5)}, {selectedComplaint.longitude?.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-amber-600 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Location not available.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Reported: {new Date(selectedComplaint.createdAt).toLocaleString()}</span>
              </div>
              {selectedComplaint.assignedWorkerName && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>Assigned: {selectedComplaint.assignedWorkerName}</span>
                </div>
              )}
            </div>

            {selectedComplaint.photoUrl && (
              <div className="mt-2">
                <span className="text-[11px] font-semibold text-zinc-500 block mb-1">
                  Citizen Photo Evidence
                </span>
                <img
                  src={selectedComplaint.photoUrl}
                  alt="Incident evidence"
                  className="w-full h-36 object-cover rounded border border-zinc-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                id="btn-panel-view-complaint"
                onClick={() => navigate(`/complaints/${selectedComplaint.id}`)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Inspect Full Incident Dossier
              </button>
            </div>
          </div>
        )}

        {/* WORKER DETAILS */}
        {selectedWorker && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-zinc-900">{selectedWorker.name}</h4>
                <p className="font-mono text-xs text-zinc-500">
                  ID: {selectedWorker.employeeId || selectedWorker.id}
                </p>
              </div>
              <WorkerStatusBadge availability={selectedWorker.availability} />
            </div>

            <div className="space-y-1.5 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Department: {selectedWorker.departmentName}</span>
              </div>
              {selectedWorker.currentAssignmentId && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Active Task: {selectedWorker.currentComplaintTitle || selectedWorker.currentAssignmentId}</span>
                </div>
              )}
              <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
                {hasWorkerCoords ? (
                  <span>
                    GPS: {selectedWorker.latitude?.toFixed(5)}, {selectedWorker.longitude?.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-amber-600 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Worker location unavailable.
                  </span>
                )}
              </div>
              {selectedWorker.lastLocationUpdate && (
                <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                  <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>GPS Updated: {new Date(selectedWorker.lastLocationUpdate).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                id="btn-panel-view-worker"
                onClick={() => navigate(`/workers/${selectedWorker.id}`)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-black hover:bg-zinc-800 rounded transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Worker Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
