/**
 * MY CITY CONNECT - Department Service
 */
import { apiClient } from './apiClient';
import { Department } from '../types';

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const res = await apiClient.get<{ data: Department[] } | Department[]>('/departments');
    return Array.isArray(res) ? res : res.data || [];
  },

  async getDepartmentById(id: string): Promise<Department> {
    const res = await apiClient.get<{ data: Department } | Department>(`/departments/${id}`);
    return 'data' in res && res.data ? res.data : (res as Department);
  },

  async createDepartment(data: { name: string; code: string }): Promise<Department> {
    const res = await apiClient.post<{ data: Department } | Department>('/departments', data);
    return 'data' in res && res.data ? res.data : (res as Department);
  },
};
