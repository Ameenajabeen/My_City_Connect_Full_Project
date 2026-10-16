import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TrackingGateway } from './tracking.gateway';
import { LocationUpdateDto } from './dto/location-update.dto';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway
  ) {}

  async recordWorkerLocation(dto: LocationUpdateDto) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Worker location was not recorded.');
    }
    await this.prisma.trackingLocation.create({
      data: {
        workerId: dto.workerId,
        complaintId: dto.complaintId || null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        speed: dto.speed,
        heading: dto.heading,
      },
    });

    await this.prisma.worker.update({
      where: { id: dto.workerId },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        lastLocationUpdate: new Date(),
      },
    });

    // Broadcast via WebSocket
    this.trackingGateway.handleWorkerLocation(null as any, dto);

    return { received: true, timestamp: new Date() };
  }

  async getLatestComplaintTracking(complaintId: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Worker tracking cannot be retrieved.');
    }
    const complaint = await this.prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          assignedWorker: {
            include: {
              user: { select: { name: true, phone: true, avatarUrl: true } },
            },
          },
        },
    });

      if (!complaint) throw new NotFoundException('Complaint not found');
      if (!complaint.assignedWorker) {
        return {
          complaintId,
          workerAssigned: false,
          location: null,
        };
      }

    return {
      complaintId,
      workerAssigned: true,
      worker: {
        id: complaint.assignedWorker.id,
        name: complaint.assignedWorker.user.name,
        phone: complaint.assignedWorker.user.phone,
        status: complaint.assignedWorker.status,
        latitude: complaint.assignedWorker.latitude,
        longitude: complaint.assignedWorker.longitude,
        lastLocationUpdate: complaint.assignedWorker.lastLocationUpdate,
      },
    };
  }
}
