import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { calculateHaversineDistanceMeters } from '../common/utils/geo.util';

export interface RedZoneCluster {
  id: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  complaintCount: number;
  dominantCategory: string;
  priority: 'HIGH' | 'CRITICAL';
  description: string;
}

@Injectable()
export class RedzonesService {
  constructor(private prisma: PrismaService) {}

  async detectRedZones(clusterRadiusMeters = 300, minComplaintThreshold = 3): Promise<RedZoneCluster[]> {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Red zones cannot be calculated.');
    }
    let complaints: { latitude: number; longitude: number; category: string }[] = [];

    if (this.prisma.isConnected) {
      complaints = await this.prisma.complaint.findMany({
        where: {
          status: { notIn: ['RESOLVED', 'CANCELLED'] },
        },
        select: { latitude: true, longitude: true, category: true },
      });
    }

    if (complaints.length === 0) {
      return [];
    }

    // Spatial clustering
    const clusters: RedZoneCluster[] = [];
    const visited = new Set<number>();

    for (let i = 0; i < complaints.length; i++) {
      if (visited.has(i)) continue;

      const group = [complaints[i]];
      visited.add(i);

      for (let j = i + 1; j < complaints.length; j++) {
        if (visited.has(j)) continue;
        const dist = calculateHaversineDistanceMeters(
          complaints[i].latitude,
          complaints[i].longitude,
          complaints[j].latitude,
          complaints[j].longitude
        );

        if (dist <= clusterRadiusMeters) {
          group.push(complaints[j]);
          visited.add(j);
        }
      }

      if (group.length >= minComplaintThreshold) {
        // Find dominant category in cluster
        const categoryCounts: Record<string, number> = {};
        let avgLat = 0;
        let avgLng = 0;

        for (const item of group) {
          avgLat += item.latitude;
          avgLng += item.longitude;
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }

        avgLat /= group.length;
        avgLng /= group.length;

        let dominantCategory = 'OTHER';
        let maxCount = 0;
        for (const [cat, cnt] of Object.entries(categoryCounts)) {
          if (cnt > maxCount) {
            maxCount = cnt;
            dominantCategory = cat;
          }
        }

        clusters.push({
          id: `rz-${clusters.length + 1}`,
          latitude: Number(avgLat.toFixed(6)),
          longitude: Number(avgLng.toFixed(6)),
          radiusMeters: clusterRadiusMeters,
          complaintCount: group.length,
          dominantCategory,
          priority: group.length >= 5 ? 'CRITICAL' : 'HIGH',
          description: `Dense cluster of ${group.length} active ${dominantCategory.toLowerCase()} complaints`,
        });
      }
    }

    return clusters;
  }
}
