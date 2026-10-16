/**
 * MY CITY CONNECT - Red Zone Service
 * Red zones represent geographic clusters with high complaint density.
 */
import { apiClient } from './apiClient';
import { RedZone } from '../types';

export const redZoneService = {
  async getRedZones(): Promise<RedZone[]> {
    const res = await apiClient.get<{ data: RedZone[] } | RedZone[]>('/red-zones');
    const zones = Array.isArray(res) ? res : res.data || [];
    return zones.map((zone) => {
      const raw = zone as RedZone & {
        latitude?: number;
        longitude?: number;
        priority?: RedZone['severity'];
        dominantCategory?: string;
      };

      return {
        ...raw,
        name: raw.name || raw.dominantCategory || raw.id,
        topCategory: raw.topCategory || raw.dominantCategory,
        severity: raw.severity || raw.priority || 'HIGH',
        centerLatitude: raw.centerLatitude ?? raw.latitude ?? 0,
        centerLongitude: raw.centerLongitude ?? raw.longitude ?? 0,
        radiusMeters: raw.radiusMeters,
      };
    });
  },

  async getRedZoneById(id: string): Promise<RedZone> {
    const res = await apiClient.get<{ data: RedZone } | RedZone>(`/red-zones/${id}`);
    return 'data' in res && res.data ? res.data : (res as RedZone);
  },
};
