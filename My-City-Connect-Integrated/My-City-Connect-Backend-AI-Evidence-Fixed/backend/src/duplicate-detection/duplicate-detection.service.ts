import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ComplaintCategory } from '../common/enums';
import { calculateHaversineDistanceMeters } from '../common/utils/geo.util';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarComplaintId: string | null;
  similarComplaintNumber: string | null;
  distanceMeters: number | null;
  createdAt: Date | null;
}

@Injectable()
export class DuplicateDetectionService {
  private readonly logger = new Logger(DuplicateDetectionService.name);

  constructor(private prisma: PrismaService) {}

  async checkDuplicate(
    latitude: number,
    longitude: number,
    category: ComplaintCategory,
    radiusMeters = 50,
    timeWindowDays = 7
  ): Promise<DuplicateCheckResult> {
    if (!this.prisma.isConnected) {
      return {
        isDuplicate: false,
        similarComplaintId: null,
        similarComplaintNumber: null,
        distanceMeters: null,
        createdAt: null,
      };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

    // Approximate bounding box filter for efficient SQL query (1 degree latitude ~ 111km)
    const latDelta = radiusMeters / 111000;
    const lngDelta = radiusMeters / (111000 * Math.cos((latitude * Math.PI) / 180));

    const candidates = await this.prisma.complaint.findMany({
      where: {
        category,
        createdAt: { gte: cutoffDate },
        status: { notIn: ['RESOLVED', 'REJECTED', 'CANCELLED'] },
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
      },
      select: {
        id: true,
        complaintNumber: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
      take: 20,
    });

    for (const candidate of candidates) {
      const distance = calculateHaversineDistanceMeters(
        latitude,
        longitude,
        candidate.latitude,
        candidate.longitude
      );

      if (distance <= radiusMeters) {
        this.logger.log(
          `Duplicate detected: within ${distance}m of existing complaint ${candidate.complaintNumber}`
        );
        return {
          isDuplicate: true,
          similarComplaintId: candidate.id,
          similarComplaintNumber: candidate.complaintNumber,
          distanceMeters: distance,
          createdAt: candidate.createdAt,
        };
      }
    }

    return {
      isDuplicate: false,
      similarComplaintId: null,
      similarComplaintNumber: null,
      distanceMeters: null,
      createdAt: null,
    };
  }
}
