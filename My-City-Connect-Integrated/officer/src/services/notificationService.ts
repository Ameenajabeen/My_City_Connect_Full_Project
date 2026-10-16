/**
 * MY CITY CONNECT - Notification Service
 */
import { apiClient } from './apiClient';
import { DashboardNotification } from '../types';

export const notificationService = {
  async getNotifications(): Promise<DashboardNotification[]> {
    const res = await apiClient.get<{ data: DashboardNotification[] } | DashboardNotification[]>(
      '/notifications'
    );
    return Array.isArray(res) ? res : res.data || [];
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/mark-all-read');
  },
};
