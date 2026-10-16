/**
 * MY CITY CONNECT - Analytics Service
 */
import { apiClient } from './apiClient';
import { AnalyticsData } from '../types';

export interface AnalyticsFilterParams {
  period?: 'today' | '7d' | '30d' | '3m' | 'custom';
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}

export const analyticsService = {
  async getAnalytics(params: AnalyticsFilterParams = {}): Promise<AnalyticsData> {
    const query = new URLSearchParams();
    if (params.period) query.set('period', params.period);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.departmentId && params.departmentId !== 'ALL') query.set('departmentId', params.departmentId);

    const queryString = query.toString();
    const endpoint = `/analytics${queryString ? `?${queryString}` : ''}`;
    const res = await apiClient.get<{ data: AnalyticsData } | AnalyticsData>(endpoint);
    return 'data' in res && res.data ? res.data : (res as AnalyticsData);
  },
};
