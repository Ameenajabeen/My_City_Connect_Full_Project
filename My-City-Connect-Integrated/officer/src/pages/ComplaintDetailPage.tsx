/**
 * MY CITY CONNECT - Complaint Detail Dossier
 * Complete municipal adjudication, worker assignment, proof inspection, and resolution workflow.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { ComplaintStatusTimeline } from '../components/complaints/ComplaintStatusTimeline';
import { AssignWorkerModal } from '../components/complaints/AssignWorkerModal';
import { CityMap } from '../components/map/CityMap';
import { StateView } from '../components/common/StateView';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';
import { complaintService } from '../services/complaintService';
import { departmentService } from '../services/departmentService';
import { Complaint, Department, ComplaintStatus } from '../types';
import {
  ShieldCheck,
  XCircle,
  Building2,
  UserCheck,
  RefreshCw,
  Camera,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';

interface ComplaintDetailPageProps {
  complaintId: string;
}

export const ComplaintDetailPage: React.FC<ComplaintDetailPageProps> = ({ complaintId }) => {
  const { navigate, refreshTrigger, triggerRefresh } = useApp();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Modals & Action States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Confirmation Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    isDestructive: false,
    onConfirm: async () => {},
  });

  // Re-work comment input
  const [reworkReason, setReworkReason] = useState<string>('');
  const [showReworkInput, setShowReworkInput] = useState<boolean>(false);

  // Fetch Complaint and Departments
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [compRes, deptsRes] = await Promise.all([
        complaintService.getComplaintById(complaintId),
        departmentService.getDepartments().catch(() => []),
      ]);
      setComplaint(compRes);
      setDepartments(deptsRes);
    } catch {
      setIsError(true);
      setComplaint(null);
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Flash action message
  const flashSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
    triggerRefresh();
  };

  // 1. Verify Complaint
  const handleVerify = async () => {
    setIsActionLoading(true);
    try {
      await complaintService.verifyComplaint(complaintId, true, 'Officer verified civic issue report');
      flashSuccess('Complaint verified successfully.');
      await loadData();
    } catch {
      // Error handled
    } finally {
      setIsActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // 2. Reject Complaint
  const handleReject = async () => {
    setIsActionLoading(true);
    try {
      await complaintService.rejectComplaint(complaintId, 'Duplicate or invalid municipal report');
      flashSuccess('Complaint marked as rejected.');
      await loadData();
    } catch {
      // Error handled
    } finally {
      setIsActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // 3. Assign Worker
  const handleAssignWorker = async (
    workerId: string,
    departmentId: string,
    notes?: string
  ) => {
    setIsActionLoading(true);
    try {
      await complaintService.assignWorker(complaintId, workerId, departmentId, notes);
      flashSuccess('Worker assigned and dispatch telemetry notified.');
      await loadData();
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Request Re-work (Proof insufficient)
  const handleRequestRework = async () => {
    if (!reworkReason.trim()) return;
    setIsActionLoading(true);
    try {
      await complaintService.requestRework(complaintId, reworkReason);
      flashSuccess('Re-work requested from worker.');
      setShowReworkInput(false);
      setReworkReason('');
      await loadData();
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. Approve Resolution
  const handleApproveResolution = async () => {
    setIsActionLoading(true);
    try {
      await complaintService.approveResolution(
        complaintId,
        'Officer inspected completion proof and approved resolution'
      );
      flashSuccess('Complaint resolution approved.');
      await loadData();
    } finally {
      setIsActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // 6. Close Complaint
  const handleCloseComplaint = async () => {
    setIsActionLoading(true);
    try {
      await complaintService.updateStatus(complaintId, 'CLOSED', 'Case officially closed');
      flashSuccess('Complaint record closed.');
      await loadData();
    } finally {
      setIsActionLoading(false);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Loading Complaint Dossier..."
        backPath="/complaints"
        backLabel="Back to Complaints"
      >
        <StateView type="loading" title="Querying complaint details from backend..." />
      </PageContainer>
    );
  }

  if (isError || !complaint) {
    return (
      <PageContainer
        title="Complaint Not Found"
        backPath="/complaints"
        backLabel="Back to Complaints"
      >
        <StateView
          type="error"
          title="Unable to load complaint"
          message={`No complaint record found for ID "${complaintId}".`}
          onRetry={loadData}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Complaint #${complaint.ticketNumber || complaint.id}`}
      subtitle={`${complaint.category} • Reported on ${new Date(complaint.createdAt).toLocaleString()}`}
      backPath="/complaints"
      backLabel="Back to Complaints"
      actions={
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-complaint-detail"
            onClick={loadData}
            className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Success toast notification */}
        {actionSuccessMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Header Status Bar */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.departmentName && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {complaint.departmentName}
              </span>
            )}
            {complaint.assignedWorkerName && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Worker: {complaint.assignedWorkerName}
              </span>
            )}
            {complaint.assignmentStatus && (
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Assignment: {complaint.assignmentStatus.replaceAll('_', ' ')}
              </span>
            )}
          </div>

          {/* Quick Officer Command Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {complaint.status === 'SUBMITTED' && (
              <>
                <button
                  id="btn-verify-complaint"
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      title: 'Verify Complaint',
                      description:
                        'Are you sure you want to verify this citizen complaint? It will advance to Verified status and allow department dispatch.',
                      isDestructive: false,
                      onConfirm: handleVerify,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verify Issue
                </button>
                <button
                  id="btn-reject-complaint"
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      title: 'Reject Complaint',
                      description:
                        'Are you sure you want to reject this complaint? Please ensure this report is invalid or a duplicate.',
                      isDestructive: true,
                      onConfirm: handleReject,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900 border border-rose-800/40 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </>
            )}

            {(complaint.status === 'VERIFIED' || complaint.status === 'DEPARTMENT_ASSIGNED' || complaint.status === 'REWORK') && (
              <button
                id="btn-open-assign-worker-modal"
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {complaint.assignedWorkerId ? 'Reassign Worker' : 'Assign Worker'}
              </button>
            )}

            {complaint.status === 'WORKER_COMPLETED' && (
              <>
                <button
                  id="btn-approve-resolution"
                  onClick={() =>
                    setConfirmModal({
                      isOpen: true,
                      title: 'Approve Resolution',
                      description:
                        'Have you inspected the worker completion photo and notes? Approving will mark this complaint as Resolved.',
                      isDestructive: false,
                      onConfirm: handleApproveResolution,
                    })
                  }
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Resolution
                </button>
                <button
                  id="btn-request-rework"
                  onClick={() => setShowReworkInput((prev) => !prev)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900 border border-amber-800/40 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request Re-work
                </button>
              </>
            )}

            {complaint.status === 'RESOLVED' && (
              <button
                id="btn-close-complaint-case"
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    title: 'Close Complaint Record',
                    description:
                      'Are you sure you want to finalize and archive this complaint case? This officially closes the municipal docket.',
                    isDestructive: false,
                    onConfirm: handleCloseComplaint,
                  })
                }
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Close Case
              </button>
            )}
          </div>
        </div>

        {/* Re-work input bar */}
        {showReworkInput && (
          <div className="p-4 rounded-xl border border-amber-800/50 bg-amber-950/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
              <RotateCcw className="w-4 h-4" />
              Provide Instructions for Worker Re-work
            </div>
            <textarea
              id="input-rework-reason"
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="e.g. Debris not fully cleared around stormwater drain. Please inspect and re-upload completion photo."
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowReworkInput(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="btn-submit-rework"
                onClick={handleRequestRework}
                disabled={!reworkReason.trim() || isActionLoading}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg disabled:opacity-40"
              >
                Submit Re-work Notice
              </button>
            </div>
          </div>
        )}

        {/* Resolution Workflow Timeline */}
        <section aria-label="Resolution Timeline">
          <ComplaintStatusTimeline complaint={complaint} />
        </section>

        {/* Main 2-Column Grid: Dossier + Evidence & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Issue Description & Citizen Profile & Resolution Proof */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description & Category */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Complaint Details & Ground Truth
              </h3>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Category
                  </span>
                  <span className="font-semibold text-white">{complaint.category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Assigned Ward / Zone
                  </span>
                  <span className="font-semibold text-white">
                    {complaint.ward || 'Zone Central-4'}
                  </span>
                </div>
              </div>
            </div>

            {/* Citizen Information Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Citizen Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Citizen Name
                  </span>
                  <span className="font-semibold text-white">
                    {complaint.citizenName || 'Verified Citizen'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Contact Phone
                  </span>
                  <span className="font-mono text-slate-200 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {complaint.citizenPhone || 'Confidential (via App)'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Citizen Account ID
                  </span>
                  <span className="font-mono text-slate-400 text-[11px] truncate block">
                    {complaint.citizenId || 'ID Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Photographic Evidence (Before vs After) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                Photographic Evidence & Resolution Proof
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Citizen Uploaded Photo (Before) */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Citizen Report Photo (Before)
                  </span>
                  {complaint.photoUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                      <img
                        src={complaint.photoUrl}
                        alt="Citizen report"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 aspect-video flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                      <Camera className="w-6 h-6 mb-2 text-slate-400" />
                      <span>No citizen photo was uploaded with this complaint.</span>
                    </div>
                  )}
                </div>

                {/* 2. Worker Uploaded Photo (After Resolution) */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Worker Resolution Proof (After)
                  </span>
                  {complaint.resolutionProofUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                      <img
                        src={complaint.resolutionProofUrl}
                        alt="Worker resolution proof"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 aspect-video flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                      <Clock className="w-6 h-6 mb-2 text-slate-400" />
                      <span>
                        {complaint.status === 'IN_PROGRESS' || complaint.status === 'ASSIGNED'
                          ? 'Worker is currently dispatched. Awaiting proof upload.'
                          : 'No completion proof submitted yet.'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Notes & Timestamp */}
              {complaint.resolutionNotes && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-1">
                  <span className="font-bold text-emerald-300 block">Worker Field Notes:</span>
                  <p className="text-slate-200">{complaint.resolutionNotes}</p>
                  {complaint.resolvedAt && (
                    <span className="text-[10px] font-mono text-slate-400 block pt-1">
                      Submitted At: {new Date(complaint.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-200 block uppercase tracking-wider text-[10px]">
                  Citizen Feedback
                </span>
                {complaint.feedbacks && complaint.feedbacks.length > 0 ? (
                  complaint.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="space-y-1 rounded-lg border border-slate-700 bg-slate-900/40 p-2.5">
                      <div className="flex items-center gap-2 text-amber-300">
                        {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                        <span className="text-[10px] text-slate-400">({feedback.rating}/5)</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-line">{feedback.comment || 'No additional comment provided.'}</p>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Submitted: {new Date(feedback.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">No citizen feedback submitted yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Geographic Location & Tactical Telemetry */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Geographic Incident Location
              </h3>

              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-medium text-white">{complaint.address || 'Address unlisted'}</p>
                {complaint.latitude && complaint.longitude ? (
                  <p className="font-mono text-[11px] text-slate-400">
                    Coordinates: {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-400">
                    Location not available.
                  </p>
                )}
              </div>

              {/* Interactive GIS Map centered on complaint */}
              <div className="rounded-lg overflow-hidden border border-slate-800">
                <CityMap
                  complaints={[complaint]}
                  selectedComplaint={complaint}
                  className="w-full h-64"
                />
              </div>
            </div>

            {/* Department & Worker Metadata Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Assignment Telemetry
              </h3>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Assigned Department
                  </span>
                  <span className="text-white font-semibold">
                    {complaint.departmentName || 'Not Assigned'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Field Worker
                  </span>
                  <span className="text-white font-semibold">
                    {complaint.assignedWorkerName || 'No worker currently assigned'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Estimated Resolution Window
                  </span>
                  <span className="text-white font-semibold">
                    {complaint.estimatedResolutionHours
                      ? `${complaint.estimatedResolutionHours} Hours`
                      : '24–48 Hours Standard SLA'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Worker Modal */}
        <AssignWorkerModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          complaintId={complaint.id}
          complaintLocation={[complaint.address, complaint.ward].filter(Boolean).join(', ')}
          departmentId={complaint.departmentId}
          departments={departments}
          onAssign={handleAssignWorker}
          isLoading={isActionLoading}
        />

        {/* Confirmation Modal */}
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
          description={confirmModal.description}
          isDestructive={confirmModal.isDestructive}
          isLoading={isActionLoading}
          onConfirm={confirmModal.onConfirm}
        />
      </div>
    </PageContainer>
  );
};
