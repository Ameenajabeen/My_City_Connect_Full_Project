import { Injectable, NotFoundException, BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentStatus, ComplaintStatus, UserRole } from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class AssignmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private tracking: TrackingGateway,
  ) {}

  async getAllAssignments() {
    if (!this.prisma.isConnected) throw new ServiceUnavailableException('PostgreSQL is unavailable. Assignments cannot be retrieved.');
    return this.prisma.assignment.findMany({
      include: { complaint: true, worker: { include: { user: true, department: true } } },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async createAssignment(assignedBy: string, dto: CreateAssignmentDto & { departmentId?: string }) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database unavailable');

    const [complaint, worker] = await Promise.all([
      this.prisma.complaint.findUnique({ where: { id: dto.complaintId } }),
      this.prisma.worker.findUnique({ where: { id: dto.workerId }, include: { user: true, department: true } }),
    ]);

    if (!complaint) throw new NotFoundException('Complaint not found');
    if (!worker) throw new NotFoundException('Worker not found');
    if (worker.availability !== 'AVAILABLE') throw new ConflictException('Worker is not available');
    if (complaint.assignedWorkerId && complaint.assignedWorkerId !== worker.id) {
      throw new ConflictException('Complaint is already assigned to another worker');
    }
    if (complaint.departmentId && complaint.departmentId !== worker.departmentId) {
      throw new ConflictException('Worker department does not match complaint department');
    }
    if (!['VERIFIED', 'DEPARTMENT_ASSIGNED'].includes(complaint.status)) {
      throw new BadRequestException(`Complaint cannot be assigned while status is ${complaint.status}`);
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          complaintId: dto.complaintId,
          workerId: dto.workerId,
          assignedBy,
          status: AssignmentStatus.ASSIGNED,
          notes: dto.notes,
        },
        include: { worker: { include: { user: true, department: true } }, complaint: true },
      });

      await tx.complaint.update({
        where: { id: dto.complaintId },
        data: {
          assignedWorkerId: dto.workerId,
          status: ComplaintStatus.WORKER_ASSIGNED,
          departmentId: complaint.departmentId || worker.departmentId,
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: dto.complaintId,
          status: ComplaintStatus.WORKER_ASSIGNED,
          changedBy: assignedBy,
          remarks: dto.notes || `Assigned to worker ${worker.user.name} (${worker.employeeId || worker.id})`,
        },
      });

      await tx.worker.update({ where: { id: worker.id }, data: { availability: 'BUSY' } });

      await tx.notification.create({
        data: {
          userId: worker.userId,
          title: 'New task assigned',
          message: `Complaint #${complaint.complaintNumber} has been assigned to you.`,
          type: 'WORKER_ASSIGNED',
          relatedComplaintId: complaint.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: complaint.citizenId,
          title: 'Worker assigned',
          message: `A municipal worker has been assigned to complaint #${complaint.complaintNumber}.`,
          type: 'ASSIGNMENT',
          relatedComplaintId: complaint.id,
        },
      });

      return created;
    });

    this.tracking.broadcastAssignmentUpdated(assignment.id, dto.complaintId, AssignmentStatus.ASSIGNED);
    this.tracking.broadcastComplaintStatus(dto.complaintId, ComplaintStatus.WORKER_ASSIGNED, dto.notes);
    return assignment;
  }

  async getWorkerByUserId(userId: string) {
    if (!this.prisma.isConnected) throw new NotFoundException('Worker not found');
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');
    return worker;
  }

  async getWorkerAssignments(workerId: string) {
    if (!this.prisma.isConnected) throw new ServiceUnavailableException('PostgreSQL is unavailable. Worker assignments cannot be retrieved.');
    return this.prisma.assignment.findMany({
      where: { workerId },
      include: {
        complaint: {
          include: {
            department: true,
            assignedWorker: { include: { user: true } },
            feedbacks: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        worker: { include: { user: true, department: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async acceptAssignment(assignmentId: string, workerUserId: string) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database unavailable');
    const assignment = await this.prisma.assignment.findFirst({ where: { OR: [{ id: assignmentId }, { complaintId: assignmentId }] }, include: { worker: { include: { user: true, department: true } }, complaint: true } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.worker.userId !== workerUserId) throw new BadRequestException('Assignment does not belong to this worker');
    if (assignment.status !== AssignmentStatus.ASSIGNED) throw new BadRequestException(`Assignment is already ${assignment.status}`);

    const updated = await this.prisma.assignment.update({ where: { id: assignmentId }, data: { status: AssignmentStatus.ACCEPTED, acceptedAt: new Date() } });
    await this.notifications.createAndSendNotification(assignment.complaint.citizenId, 'Worker accepted assignment', `The assigned worker accepted complaint #${assignment.complaint.complaintNumber}.`, 'WORKER_ACCEPTED', assignment.complaintId);
    const officers = await this.prisma.user.findMany({ where: { role: UserRole.OFFICER }, select: { id: true } });
    for (const officer of officers) {
      await this.notifications.createAndSendNotification(
        officer.id,
        'Worker accepted assignment',
        `${assignment.worker.user.name} accepted complaint #${assignment.complaint.complaintNumber}.`,
        'WORKER_ACCEPTED',
        assignment.complaintId,
      );
    }
    this.tracking.broadcastAssignmentUpdated(assignment.id, assignment.complaintId, AssignmentStatus.ACCEPTED);
    return updated;
  }

  async updateWorkerStatus(assignmentId: string, workerUserId: string, status: string, notes?: string) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database unavailable');
    const assignment = await this.prisma.assignment.findFirst({ where: { OR: [{ id: assignmentId }, { complaintId: assignmentId }] }, include: { worker: true, complaint: true } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.worker.userId !== workerUserId) throw new BadRequestException('Assignment does not belong to this worker');

    const allowed: Record<string, string[]> = {
      ASSIGNED: ['ACCEPTED', 'DECLINED', 'REJECTED'],
      ACCEPTED: ['ON_THE_WAY', 'IN_ROUTE', 'DECLINED', 'REJECTED'],
      ON_THE_WAY: ['ARRIVED', 'DECLINED', 'REJECTED'],
      ARRIVED: ['IN_PROGRESS'],
      IN_ROUTE: ['ARRIVED', 'IN_PROGRESS', 'DECLINED', 'REJECTED'],
      IN_PROGRESS: ['VERIFICATION'],
      VERIFICATION: [],
      COMPLETED: [],
      DECLINED: ['ASSIGNED'],
      REJECTED: ['ASSIGNED'],
    };
    if (!(allowed[assignment.status] || []).includes(status)) {
      throw new BadRequestException(`Invalid task transition: ${assignment.status} → ${status}`);
    }

    let complaintStatus: ComplaintStatus | null = null;
    if (status === 'IN_PROGRESS') complaintStatus = ComplaintStatus.IN_PROGRESS;
    if (status === 'REJECTED') complaintStatus = ComplaintStatus.REWORK;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: status as any,
          notes: notes ?? assignment.notes,
        },
      });
      if (status === 'DECLINED' || status === 'REJECTED') {
        await tx.worker.update({ where: { id: assignment.workerId }, data: { availability: 'AVAILABLE' } });
      }
      if (complaintStatus) {
        await tx.complaint.update({ where: { id: assignment.complaintId }, data: { status: complaintStatus } });
        await tx.complaintStatusHistory.create({
          data: { complaintId: assignment.complaintId, status: complaintStatus, changedBy: workerUserId, remarks: notes || `Worker status changed to ${status}` },
        });
      }
      return result;
    });

    if (complaintStatus) {
      this.tracking.broadcastComplaintStatus(assignment.complaintId, complaintStatus, notes);
      await this.notifications.createAndSendNotification(
        assignment.complaint.citizenId,
        'Complaint status updated',
        `Complaint #${assignment.complaint.complaintNumber} is now ${complaintStatus}.`,
        'COMPLAINT_STATUS',
        assignment.complaintId,
      );
    }
    this.tracking.broadcastAssignmentUpdated(assignment.id, assignment.complaintId, status);
    if (status === 'IN_PROGRESS') {
      const officers = await this.prisma.user.findMany({ where: { role: 'OFFICER' }, select: { id: true } });
      for (const officer of officers) {
        await this.notifications.createAndSendNotification(
          officer.id,
          'Worker started task',
          `Work started on complaint #${assignment.complaint.complaintNumber}.`,
          'COMPLAINT_IN_PROGRESS',
          assignment.complaintId,
        );
      }
    }
    return updated;
  }
}
