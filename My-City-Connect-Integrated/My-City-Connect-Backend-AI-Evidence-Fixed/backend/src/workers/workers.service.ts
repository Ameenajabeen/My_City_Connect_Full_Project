import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkerAvailability } from '../common/enums';
import { calculateHaversineDistanceMeters } from '../common/utils/geo.util';
import { AssignmentsService } from '../assignments/assignments.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class WorkersService {
  constructor(
    private prisma: PrismaService,
    private assignments: AssignmentsService,
    private tracking: TrackingGateway,
  ) {}

  async findAll(departmentId?: string, availability?: string) {
    if (!this.prisma.isConnected) throw new ServiceUnavailableException('PostgreSQL is unavailable. Worker records cannot be retrieved.');
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (availability) where.availability = availability;
    const workers = await this.prisma.worker.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        department: true,
        assignments: {
          where: { status: { notIn: ['COMPLETED', 'REASSIGNED', 'DECLINED', 'REJECTED'] } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { complaint: { select: { id: true, description: true } } },
        },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return workers.map((worker) => this.toWorker(worker));
  }

  async findNearby(lat: number, lng: number, radiusMeters = 5000) {
    const all: any[] = await this.findAll();
    return all
      .filter((w) => w.latitude != null && w.longitude != null)
      .map((w) => ({ ...w, distanceMeters: calculateHaversineDistanceMeters(lat, lng, w.latitude, w.longitude) }))
      .filter((w) => w.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  async getById(id: string) {
    if (!this.prisma.isConnected) throw new NotFoundException('Worker not found');
    const worker = await this.prisma.worker.findUnique({ where: { id }, include: { user: true, department: true, _count: { select: { assignments: true } } } });
    if (!worker) throw new NotFoundException('Worker not found');
    return this.toWorker(worker);
  }

  async getAssignmentsByWorkerId(workerId: string) {
    const assignments: any[] = await this.assignments.getWorkerAssignments(workerId);
    return assignments.map((a) => this.toTask(a));
  }

  async getLocation(id: string) {
    if (!this.prisma.isConnected) throw new NotFoundException('Worker not found');
    const worker = await this.prisma.worker.findUnique({ where: { id }, select: { id: true, latitude: true, longitude: true, lastLocationUpdate: true } });
    if (!worker) throw new NotFoundException('Worker not found');
    return { workerId: worker.id, latitude: worker.latitude, longitude: worker.longitude, updatedAt: worker.lastLocationUpdate };
  }

  async getByUserId(userId: string) {
    if (!this.prisma.isConnected) throw new NotFoundException('Worker profile not found');
    const worker = await this.prisma.worker.findUnique({ where: { userId }, include: { user: true, department: true, _count: { select: { assignments: true } } } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    return this.toWorker(worker);
  }

  async getAssignmentsByUserId(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    const assignments: any[] = await this.assignments.getWorkerAssignments(worker.id);
    return assignments.map((a) => this.toTask(a));
  }

  async getTaskByUserId(userId: string, assignmentId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    const assignments: any[] = await this.assignments.getWorkerAssignments(worker.id);
    const assignment = assignments.find((a) => a.id === assignmentId || a.complaintId === assignmentId);
    if (!assignment) throw new NotFoundException('Task not found for this worker');
    return this.toTask(assignment);
  }

  async updateAvailability(userId: string, availability: WorkerAvailability) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database unavailable');
    const updated = await this.prisma.worker.update({ where: { userId }, data: { availability } });
    this.tracking.broadcastWorkerAvailability(updated.id, availability);
    return { workerId: updated.id, availability: updated.availability };
  }

  async updatePreferredLocation(userId: string, preferredLocation: string) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database unavailable');
    return this.prisma.worker.update({
      where: { userId },
      data: { preferredLocation: preferredLocation.trim() },
      select: { id: true, preferredLocation: true },
    });
  }

  async updateLocation(userId: string, lat: number, lng: number, accuracy?: number, complaintId?: string) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database unavailable');
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    const timestamp = new Date();
    const updated = await this.prisma.worker.update({ where: { id: worker.id }, data: { latitude: lat, longitude: lng, lastLocationUpdate: timestamp } });
    await this.prisma.trackingLocation.create({ data: { workerId: worker.id, complaintId: complaintId || null, latitude: lat, longitude: lng, accuracy } });
    this.tracking.broadcastWorkerLocation({ workerId: worker.id, complaintId, latitude: lat, longitude: lng, accuracy, timestamp: timestamp.toISOString() });
    return { workerId: updated.id, latitude: lat, longitude: lng, timestamp: timestamp.toISOString() };
  }

  private toWorker(worker: any) {
    const currentAssignment = worker.assignments?.[0];
    return {
      id: worker.id,
      userId: worker.userId,
      employeeId: worker.employeeId || `EMP-${worker.id.slice(-6)}`,
      name: worker.user.name,
      email: worker.user.email,
      phone: worker.user.phone || '',
      department: worker.department?.name || '',
      departmentName: worker.department?.name || '',
      departmentId: worker.departmentId,
      assignedZone: worker.department?.code || '',
      preferredLocation: worker.preferredLocation,
      currentAssignmentId: currentAssignment?.id,
      currentComplaintId: currentAssignment?.complaint?.id,
      currentComplaintTitle: currentAssignment?.complaint?.description?.slice(0, 80),
      currentAssignmentStatus: currentAssignment?.status,
      role: 'WORKER',
      isAvailable: worker.availability === 'AVAILABLE',
      availability: worker.availability,
      currentLatitude: worker.latitude,
      currentLongitude: worker.longitude,
      latitude: worker.latitude,
      longitude: worker.longitude,
      lastLocationUpdate: worker.lastLocationUpdate,
      rating: worker.rating,
      completedTasksCount: worker._count?.assignments || 0,
      profilePhotoUrl: worker.user.avatarUrl,
      avatarUrl: worker.user.avatarUrl,
    };
  }

  private toTask(assignment: any) {
    const c = assignment.complaint;
    return {
      id: c.id,
      assignmentId: assignment.id,
      complaintId: c.id,
      title: c.description?.slice(0, 80) || 'Civic Complaint',
      description: c.description,
      category: c.category,
      department: c.department?.name || assignment.worker?.department?.name || '',
      address: c.address,
      latitude: c.latitude,
      longitude: c.longitude,
      priority: c.priority,
      status: assignment.status === 'COMPLETED' && c.status === 'RESOLVED'
        ? 'COMPLETED'
        : assignment.status,
      citizenImageUrl: c.imageUrl,
      workerId: assignment.workerId,
      assignedAt: assignment.assignedAt,
      acceptedAt: assignment.acceptedAt,
      arrivedAt: assignment.status === 'ARRIVED' ? assignment.updatedAt : null,
      resolvedAt: c.completedAt,
      completedAt: c.status === 'RESOLVED' ? c.updatedAt : null,
      completionPhotoUrl: c.completionPhotoUrl,
      completionNotes: c.completionNotes,
      feedback: c.feedbacks?.[0] ?? null,
      distance: 0,
    };
  }
}
