/**
 * MY CITY CONNECT - Worker Service
 */
import { apiClient } from './apiClient';
import { Worker, WorkerAvailability, Complaint } from '../types';

export interface WorkerFilterParams {
  departmentId?: string;
  availability?: WorkerAvailability | 'ALL';
  search?: string;
}

export const workerService = {
  async getWorkers(params: WorkerFilterParams = {}): Promise<Worker[]> {
    const query = new URLSearchParams();
    if (params.departmentId && params.departmentId !== 'ALL') query.set('departmentId', params.departmentId);
    if (params.availability && params.availability !== 'ALL') query.set('availability', params.availability);
    if (params.search) query.set('search', params.search);

    const queryString = query.toString();
    const res = await apiClient.get<{ data: Worker[] } | Worker[]>(
      `/workers${queryString ? `?${queryString}` : ''}`
    );
    return Array.isArray(res) ? res : (res.data || []);
  },

  async getAvailableWorkers(departmentId?: string): Promise<Worker[]> {
    const query = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
    const res = await apiClient.get<{ data: Worker[] } | Worker[]>(`/workers/available${query}`);
    return Array.isArray(res) ? res : (res.data || []);
  },

  async getWorkerById(id: string): Promise<Worker> {
    const res = await apiClient.get<{ data: Worker } | Worker>(`/workers/${id}`);
    return 'data' in res && res.data ? res.data : (res as Worker);
  },

  async getWorkerLocation(id: string): Promise<{ latitude: number; longitude: number; updatedAt: string }> {
    const res = await apiClient.get<{ data: { latitude: number; longitude: number; updatedAt: string } } | { latitude: number; longitude: number; updatedAt: string }>(
      `/workers/${id}/location`
    );
    return 'data' in res && res.data ? res.data : (res as { latitude: number; longitude: number; updatedAt: string });
  },

  async getWorkerTaskHistory(id: string): Promise<Complaint[]> {
    const res = await apiClient.get<{ data: Complaint[] } | Complaint[]>(
      `/workers/${id}/tasks`
    );
    return Array.isArray(res) ? res : (res.data || []);
  },
};
