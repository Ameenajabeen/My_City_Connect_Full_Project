/**
 * MY CITY CONNECT - Complaint Service
 */
import { apiClient } from './apiClient';
import {
  Complaint,
  ComplaintPriority,
  ComplaintStatus,
  DashboardKPIData,
  PaginatedResponse,
} from '../types';

const resolveFileUrl = (url?: string): string | undefined => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin;
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

export interface ComplaintFilterParams {
  search?: string;
  status?: ComplaintStatus | 'ALL';
  priority?: ComplaintPriority | 'ALL';
  category?: string | 'ALL';
  departmentId?: string | 'ALL';
  page?: number;
  pageSize?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const complaintService = {
  /**
   * Fetch paginated list of citizen complaints
   */
  async getComplaints(params: ComplaintFilterParams = {}): Promise<PaginatedResponse<Complaint>> {
    const query = new URLSearchParams();
    const effectivePageSize = params.pageSize || params.limit;
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.departmentId && params.departmentId !== 'ALL') query.set('departmentId', params.departmentId);
    if (params.page) query.set('page', params.page.toString());
    if (effectivePageSize) query.set('pageSize', effectivePageSize.toString());
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/complaints${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get<PaginatedResponse<Complaint> | Complaint[]>(endpoint);

    // Normalize backend response.
// Backend returns:
// { success: true, data: { items: [...], total, page, pageSize, totalPages } }

const response = res as any;

// Handle API envelope: { success, data: ... }
const payload = response?.data ?? response;

// Handle paginated response: { items: [...] }
if (Array.isArray(payload?.items)) {
  return {
    ...payload,
    items: payload.items,
    data: payload.items,
    total: payload.total ?? payload.items.length,
    page: payload.page ?? params.page ?? 1,
    pageSize: payload.pageSize ?? effectivePageSize ?? payload.items.length,
    totalPages: payload.totalPages ?? 1,
  };
}

// Handle direct array response: [...]
if (Array.isArray(payload)) {
  return {
    items: payload,
    data: payload,
    total: payload.length,
    page: params.page || 1,
    pageSize: effectivePageSize || payload.length,
    totalPages: 1,
  };
}

// Safe fallback
return {
  items: [],
  data: [],
  total: 0,
  page: params.page || 1,
  pageSize: effectivePageSize || 0,
  totalPages: 0,
};
  },

  /**
   * Fetch complaint details by ID
   */
  async getComplaintById(id: string): Promise<Complaint> {
    const res = await apiClient.get<{ data: Complaint } | Complaint>(`/complaints/${id}`);
    const item = 'data' in res && res.data ? res.data : (res as Complaint);
    item.photoUrl = resolveFileUrl(item.photoUrl || (item as any).imageUrl);
    item.completionProofUrl = resolveFileUrl(item.completionProofUrl || (item as any).completionPhotoUrl || (item as any).resolutionProofUrl);
    item.resolutionProofUrl = resolveFileUrl(item.resolutionProofUrl || item.completionProofUrl || (item as any).completionPhotoUrl);
    return item;
  },

  /**
   * Update complaint status
   */
  async updateStatus(
    id: string,
    status: ComplaintStatus,
    comment?: string
  ): Promise<Complaint> {
    const res = await apiClient.patch<any>(`/complaints/${id}/status`, { status, remarks: comment });
    return (res as any)?.data ?? res;
  },

  /**
   * Verify citizen complaint
   */
  async verifyComplaint(
    id: string,
    verified: boolean = true,
    rejectionReason?: string
  ): Promise<Complaint> {
    const res = verified
      ? await apiClient.post<any>(`/complaints/${id}/verify`)
      : await apiClient.post<any>(`/complaints/${id}/reject`, { reason: rejectionReason });
    return (res as any)?.data ?? res;
  },

  /**
   * Reject citizen complaint
   */
  async rejectComplaint(id: string, reason: string): Promise<Complaint> {
    const res = await apiClient.post<any>(`/complaints/${id}/reject`, { reason });
    return (res as any)?.data ?? res;
  },

  /**
   * Change priority level
   */
  async setPriority(id: string, priority: ComplaintPriority): Promise<Complaint> {
    const res = await apiClient.patch<any>(`/complaints/${id}/priority`, { priority });
    return (res as any)?.data ?? res;
  },

  /**
   * Assign department
   */
  async assignDepartment(id: string, departmentId: string): Promise<Complaint> {
    const res = await apiClient.patch<any>(`/complaints/${id}/department`, { departmentId });
    return (res as any)?.data ?? res;
  },

  /**
   * Assign or reassign worker
   */
  async assignWorker(
    id: string,
    workerId: string,
    notesOrDepartmentId?: string,
    notes?: string
  ): Promise<Complaint> {
    const payload: { workerId: string; departmentId?: string; notes?: string } = { workerId };
    if (notes !== undefined) {
      payload.departmentId = notesOrDepartmentId;
      payload.notes = notes;
    } else {
      payload.notes = notesOrDepartmentId;
    }
    const res = await apiClient.post<any>(`/complaints/${id}/assign`, payload);
    return (res as any)?.data ?? res;
  },

  /**
   * Approve or reject worker completion proof
   */
  async reviewCompletionProof(
    id: string,
    approved: boolean,
    notes?: string
  ): Promise<Complaint> {
    const res = await apiClient.post<any>(`/complaints/${id}/review-proof`, { approved, notes });
    return (res as any)?.data ?? res;
  },

  /**
   * Approve resolution
   */
  async approveResolution(id: string, notes?: string): Promise<Complaint> {
    const res = await apiClient.post<any>(`/complaints/${id}/approve`, { notes });
    return (res as any)?.data ?? res;
  },

  /**
   * Request rework from worker
   */
  async requestRework(id: string, notes: string): Promise<Complaint> {
    const res = await apiClient.post<any>(`/complaints/${id}/rework`, { notes });
    return (res as any)?.data ?? res;
  },

  /**
   * Dashboard statistics
   */
  async getDashboardKPIs(): Promise<DashboardKPIData> {
    const res = await apiClient.get<any>('/complaints/dashboard-kpis');
    return (res as any)?.data ?? res;
  },
};
