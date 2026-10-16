/**
 * MY CITY CONNECT - Assignment Service
 */
import { apiClient } from './apiClient';
import { Assignment } from '../types';

export interface CreateAssignmentPayload {
  complaintId: string;
  workerId: string;
  departmentId: string;
  notes?: string;
}

export const assignmentService = {
  async createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
    const res = await apiClient.post<{ data: Assignment } | Assignment>('/assignments', payload);
    return 'data' in res && res.data ? res.data : (res as Assignment);
  },

  async updateAssignmentStatus(
    id: string,
    status: Assignment['status'],
    notes?: string
  ): Promise<Assignment> {
    const res = await apiClient.patch<{ data: Assignment } | Assignment>(`/assignments/${id}/status`, {
      status,
      notes,
    });
    return 'data' in res && res.data ? res.data : (res as Assignment);
  },

  async getAssignments(complaintId?: string): Promise<Assignment[]> {
    const query = complaintId ? `?complaintId=${encodeURIComponent(complaintId)}` : '';
    const res = await apiClient.get<{ data: Assignment[] } | Assignment[]>(`/assignments${query}`);
    return Array.isArray(res) ? res : res.data || [];
  },
};
