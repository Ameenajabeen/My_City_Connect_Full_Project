import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DepartmentAllocationService } from '../departments/department-allocation.service';
import { DuplicateDetectionService } from '../duplicate-detection/duplicate-detection.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { UpdateComplaintStatusDto } from './dto/update-status.dto';
import {
  ComplaintStatus,
  UserRole,
  CategorySource,
  AiVerificationStatus,
} from '../common/enums';
import { CATEGORY_DEFINITIONS } from '../common/constants/categories.constant';
import { validateCoordinates, calculateHaversineDistanceMeters } from '../common/utils/geo.util';
import { AssignmentsService } from '../assignments/assignments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { S3Service } from '../uploads/s3.service';
import { RedzonesService } from '../redzones/redzones.service';

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    private prisma: PrismaService,
    private departmentAllocation: DepartmentAllocationService,
    private duplicateDetection: DuplicateDetectionService,
    private assignmentsService: AssignmentsService,
    private notificationsService: NotificationsService,
    private trackingGateway: TrackingGateway,
    private s3Service: S3Service,
    private redzonesService: RedzonesService,
  ) {}

  /**
   * Transactional Complaint Creation
   */
  async createComplaint(citizenId: string, dto: CreateComplaintDto) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaints are only stored in the shared database.');
    }

    // 1. Validate GPS coordinates
    if (!validateCoordinates(dto.latitude, dto.longitude)) {
      throw new BadRequestException('Invalid geographic coordinates provided (lat: -90..90, lng: -180..180)');
    }

    // 2. Generate unique complaint number CMP-YYYY-XXXXX
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const complaintNumber = `CMP-${year}-${randomSeq}`;

    // 3. Resolve department based on category
    const deptInfo = await this.departmentAllocation.resolveDepartmentForCategory(dto.category);

    // 4. Determine priority from central configuration
    const meta = CATEGORY_DEFINITIONS[dto.category];
    const priority = meta ? meta.basePriority : 'MEDIUM';

    // 5. Check for geographic duplicates within 50m
    const dupCheck = await this.duplicateDetection.checkDuplicate(
      dto.latitude,
      dto.longitude,
      dto.category,
      50
    );

    // 6. Final Category vs AI Category audit trail
    // CRITICAL: NEVER overwrite the AI detection!
    const categorySource = dto.categorySource || CategorySource.MANUAL;
    const aiDetectedCategory = dto.aiDetectedCategory || null;
    const aiConfidence = dto.aiConfidence ?? null;
    const aiVerificationStatus = dto.aiVerificationStatus || (
      aiConfidence && aiConfidence >= 0.70 ? AiVerificationStatus.VERIFIED :
      aiConfidence && aiConfidence > 0 ? AiVerificationStatus.LOW_CONFIDENCE :
      AiVerificationStatus.PENDING
    );

    if (this.prisma.isConnected) {
      const created = await this.prisma.$transaction(async (tx) => {
        // Create Complaint Record
        const complaint = await tx.complaint.create({
          data: {
            complaintNumber,
            citizenId,
            category: dto.category,
            categorySource,
            aiDetectedCategory,
            aiConfidence,
            aiVerificationStatus,
            description: dto.description,
            imageUrl: dto.imageUrl,
            latitude: dto.latitude,
            longitude: dto.longitude,
            locationAccuracy: dto.locationAccuracy,
            address: dto.address,
            ward: dto.ward || 'Ward 104, Zone 8',
            status: dupCheck.isDuplicate
              ? ComplaintStatus.DUPLICATE
              : aiVerificationStatus === AiVerificationStatus.VERIFIED
                ? ComplaintStatus.VERIFIED
                : ComplaintStatus.SUBMITTED,
            priority: priority as any,
            departmentId: deptInfo.departmentId,
            isDuplicate: dupCheck.isDuplicate,
            duplicateOfComplaintId: dupCheck.similarComplaintId,
          },
          include: {
            department: true,
          },
        });

        // Add Initial Status History entry
        await tx.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            status: ComplaintStatus.SUBMITTED,
            changedBy: citizenId,
            remarks: `Complaint submitted by citizen. Assigned to ${deptInfo.departmentName}.`,
          },
        });

        if (aiVerificationStatus === AiVerificationStatus.VERIFIED) {
          await tx.complaintStatusHistory.create({
            data: {
              complaintId: complaint.id,
              status: ComplaintStatus.VERIFIED,
              changedBy: 'AI_VISION_SERVICE',
              remarks: `AI verified issue: ${aiDetectedCategory} (${Math.round((aiConfidence || 0) * 100)}% confidence).`,
            },
          });
        }

        // Create notification for citizen
        await tx.notification.create({
          data: {
            userId: citizenId,
            title: 'Complaint Registered',
            message: `Your complaint #${complaintNumber} has been submitted to ${deptInfo.departmentName}.`,
            type: 'COMPLAINT_STATUS',
            relatedComplaintId: complaint.id,
          },
        });

        return complaint;
      });

      const officerUsers = await this.prisma.user.findMany({ where: { role: UserRole.OFFICER }, select: { id: true } });
      for (const officer of officerUsers) {
        await this.notificationsService.createAndSendNotification(
          officer.id,
          'New civic complaint',
          `Complaint #${created.complaintNumber} requires officer review.`,
          'NEW_COMPLAINT',
          created.id,
        );
      }

      this.trackingGateway.broadcastNewComplaint(created);
      this.trackingGateway.broadcastComplaintUpdated(created);
      return created;
    }

    throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint was not created.');
  }

  /**
   * List citizen's own complaints with pagination and filtering
   */
  async getMyComplaints(citizenId: string, query: QueryComplaintsDto) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Citizen complaints cannot be retrieved.');
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    if (this.prisma.isConnected) {
      const where: any = { citizenId };
      if (query.status) where.status = query.status;
      if (query.category) where.category = query.category;

      const [complaints, total] = await Promise.all([
        this.prisma.complaint.findMany({
          where,
          include: {
            department: true,
            assignedWorker: {
              include: {
                user: { select: { name: true, phone: true, avatarUrl: true } },
              },
            },
            assignments: { select: { status: true, assignedAt: true }, orderBy: { assignedAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.complaint.count({ where }),
      ]);

      return {
        items: complaints,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    throw new ServiceUnavailableException('PostgreSQL is unavailable. Citizen complaints cannot be retrieved.');
  }

  /**
   * Retrieve complaint details (Strict RBAC applied)
   */
  async getComplaintById(id: string, userId: string, userRole: UserRole) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint details cannot be retrieved.');
    }
    if (this.prisma.isConnected) {
      const complaint = await this.prisma.complaint.findUnique({
        where: { id },
        include: {
          department: true,
          assignedWorker: {
            include: {
              user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
            },
          },
          assignments: { select: { status: true, assignedAt: true }, orderBy: { assignedAt: 'desc' }, take: 1 },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
          feedbacks: true,
        },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint with ID ${id} not found`);
      }

      // Security check: Citizens can ONLY view their own complaints
      if (userRole === UserRole.CITIZEN && complaint.citizenId !== userId) {
        throw new ForbiddenException('Access denied: You are not authorized to view this complaint');
      }

      // Workers can only view complaints assigned to them
      if (userRole === UserRole.WORKER) {
        const worker = await this.prisma.worker.findUnique({ where: { userId } });
        if (!worker || complaint.assignedWorkerId !== worker.id) {
          throw new ForbiddenException('Access denied: Complaint is not assigned to you');
        }
      }

      return (userRole === UserRole.OFFICER || userRole === UserRole.ADMIN) ? this.toOfficerComplaint(complaint) : complaint;
    }

    throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint details cannot be retrieved.');
  }

  /**
   * Chronological status audit timeline
   */
  async getComplaintTimeline(id: string, userId: string, userRole: UserRole) {
    // Check permission first
    await this.getComplaintById(id, userId, userRole);

    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint history cannot be retrieved.');
    }
    return this.prisma.complaintStatusHistory.findMany({
      where: { complaintId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update complaint status (Worker / Officer)
   */
  async updateStatus(id: string, userId: string, userRole: UserRole, dto: UpdateComplaintStatusDto) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint status was not updated.');
    }
    const workerAllowed = [ComplaintStatus.IN_PROGRESS, ComplaintStatus.REWORK];
    const officerAllowed = [
      ComplaintStatus.VERIFIED,
      ComplaintStatus.REJECTED,
      ComplaintStatus.DEPARTMENT_ASSIGNED,
      ComplaintStatus.WORKER_ASSIGNED,
      ComplaintStatus.OFFICER_VERIFICATION,
      ComplaintStatus.RESOLVED,
      ComplaintStatus.REWORK,
    ];
    if (userRole === UserRole.WORKER && !workerAllowed.includes(dto.status)) {
      throw new ForbiddenException('Workers can only update worker-owned workflow states through the worker APIs.');
    }
    if ((userRole === UserRole.OFFICER || userRole === UserRole.ADMIN) && !officerAllowed.includes(dto.status)) {
      throw new BadRequestException(`Officer cannot directly set complaint status to ${dto.status}`);
    }

    if (this.prisma.isConnected) {
      const existing = await this.prisma.complaint.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Complaint not found');

      if (userRole === UserRole.WORKER) {
        const worker = await this.prisma.worker.findUnique({ where: { userId } });
        if (!worker || existing.assignedWorkerId !== worker.id) throw new ForbiddenException('Complaint is not assigned to this worker');
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const updateData: any = { status: dto.status };
        if (dto.completionPhotoUrl) updateData.completionPhotoUrl = dto.completionPhotoUrl;
        if (dto.completionNotes) updateData.completionNotes = dto.completionNotes;
        if (dto.status === ComplaintStatus.RESOLVED) updateData.completedAt = new Date();

        const result = await tx.complaint.update({ where: { id }, data: updateData });
        await tx.complaintStatusHistory.create({
          data: {
            complaintId: id,
            status: dto.status,
            changedBy: userId,
            remarks: dto.remarks || `Status transitioned to ${dto.status}`,
          },
        });
        await tx.notification.create({
          data: {
            userId: existing.citizenId,
            title: `Complaint Status Updated: ${dto.status}`,
            message: dto.remarks || `Your complaint #${existing.complaintNumber} is now ${dto.status}.`,
            type: 'COMPLAINT_STATUS',
            relatedComplaintId: id,
          },
        });
        return result;
      });

      this.trackingGateway.broadcastComplaintStatus(id, dto.status, dto.remarks);
      this.trackingGateway.broadcastComplaintUpdated(updated);
      if (dto.status === ComplaintStatus.RESOLVED) this.trackingGateway.broadcastComplaintResolved(updated);
      return updated;
    }

    throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint status was not updated.');
  }

  async getOfficerComplaints(query: any = {}) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Officer complaints cannot be retrieved.');
    }
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
    const where: any = {};
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.priority && query.priority !== 'ALL') where.priority = query.priority;
    if (query.category && query.category !== 'ALL') where.category = query.category;
    if (query.departmentId && query.departmentId !== 'ALL') where.departmentId = query.departmentId;
    if (query.search) where.OR = [
      { complaintNumber: { contains: query.search } },
      { description: { contains: query.search } },
      { address: { contains: query.search } },
    ];
    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          department: true,
          citizen: { select: { id: true, name: true, email: true, phone: true } },
          assignedWorker: { include: { user: true, department: true } },
          assignments: { select: { id: true, status: true, assignedAt: true, acceptedAt: true }, orderBy: { assignedAt: 'desc' }, take: 1 },
          statusHistory: { orderBy: { createdAt: 'desc' } },
          feedbacks: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return { items: items.map((c: any) => this.toOfficerComplaint(c)), total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getDashboardKPIs() {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Dashboard statistics cannot be calculated.');
    }
    const [complaints, workers, redZones] = await Promise.all([
      this.prisma.complaint.findMany({ select: { status: true, priority: true } }),
      this.prisma.worker.findMany({ select: { availability: true } }),
      this.redzonesService.detectRedZones(),
    ]);
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === ComplaintStatus.RESOLVED).length;
    return {
      totalComplaints: total,
      pendingComplaints: complaints.filter((c) => ['SUBMITTED','AI_VERIFICATION','VERIFIED','DEPARTMENT_ASSIGNED','DUPLICATE'].includes(c.status)).length,
      inProgressComplaints: complaints.filter((c) => ['WORKER_ASSIGNED','IN_PROGRESS','WORKER_COMPLETED','OFFICER_VERIFICATION','REWORK'].includes(c.status)).length,
      resolvedComplaints: resolved,
      highPriorityComplaints: complaints.filter((c) => ['HIGH','CRITICAL'].includes(c.priority)).length,
      activeWorkers: workers.filter((w) => w.availability === 'AVAILABLE').length,
      totalWorkers: workers.length,
      activeRedZones: redZones.length,
      resolutionRatePercentage: total ? Math.round((resolved / total) * 100) : 0,
      averageResolutionTimeHours: 0,
    };
  }

  async getMapComplaints() {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint map data cannot be retrieved.');
    }
    const complaints = await this.prisma.complaint.findMany({
      where: { status: { not: ComplaintStatus.CANCELLED } },
      include: { department: true, assignedWorker: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return complaints.map((c: any) => this.toOfficerComplaint(c));
  }

  private toOfficerComplaint(c: any) {
    return {
      ...c,
      photoUrl: c.imageUrl,
      departmentName: c.department?.name,
      assignedWorkerName: c.assignedWorker?.user?.name,
      assignmentId: c.assignments?.[0]?.id,
      assignmentStatus: c.assignments?.[0]?.status,
      assignmentAcceptedAt: c.assignments?.[0]?.acceptedAt,
      citizenName: c.citizen?.name,
      citizenPhone: c.citizen?.phone,
      citizenEmail: c.citizen?.email,
      statusHistory: c.statusHistory?.map((h: any) => ({ ...h, timestamp: h.createdAt, comment: h.remarks })),
    };
  }

  async verifyComplaint(id: string, officerUserId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.status === ComplaintStatus.DUPLICATE) throw new BadRequestException('Duplicate complaint cannot be verified as a new complaint');
    return this.updateStatus(id, officerUserId, UserRole.OFFICER, { status: ComplaintStatus.VERIFIED, remarks: 'Complaint verified by officer.' });
  }

  async rejectComplaint(id: string, officerUserId: string, reason: string) {
    return this.updateStatus(id, officerUserId, UserRole.OFFICER, { status: ComplaintStatus.REJECTED, remarks: reason });
  }

  async setPriority(id: string, priority: string) {
    if (!['LOW','MEDIUM','HIGH','CRITICAL'].includes(priority)) throw new BadRequestException('Invalid priority');
    return this.prisma.complaint.update({ where: { id }, data: { priority: priority as any } });
  }

  async assignDepartment(id: string, departmentId: string, officerUserId: string) {
    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) throw new NotFoundException('Department not found');
    const complaint = await this.prisma.complaint.update({ where: { id }, data: { departmentId, status: ComplaintStatus.DEPARTMENT_ASSIGNED } });
    await this.prisma.complaintStatusHistory.create({ data: { complaintId: id, status: ComplaintStatus.DEPARTMENT_ASSIGNED, changedBy: officerUserId, remarks: `Assigned to ${department.name}` } });
    return complaint;
  }

  async assignWorker(id: string, officerUserId: string, workerId: string, departmentId?: string, notes?: string) {
    return this.assignmentsService.createAssignment(officerUserId, { complaintId: id, workerId, notes } as any);
  }

  async uploadCompletionProof(id: string, workerUserId: string, file: Express.Multer.File, latitude: number, longitude: number, accuracy?: number, remarks?: string) {
    if (!file) throw new BadRequestException('Completion image is required');
    const worker = await this.prisma.worker.findUnique({ where: { userId: workerUserId } });
    if (!worker) throw new ForbiddenException('Worker profile not found');
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.assignedWorkerId !== worker.id) throw new ForbiddenException('This complaint is not assigned to you');
    if (!['IN_PROGRESS','REWORK'].includes(complaint.status)) throw new BadRequestException(`Completion proof is not allowed while complaint is ${complaint.status}`);
    const distance = calculateHaversineDistanceMeters(latitude, longitude, complaint.latitude, complaint.longitude);
    if (distance > 100) throw new BadRequestException(`Completion proof location is ${Math.round(distance)}m away. Move within 100m.`);
    const upload = await this.s3Service.uploadFile(file, 'completion');
    const proof = await this.prisma.$transaction(async (tx) => {
      const created = await tx.completionProof.create({ data: { complaintId: id, workerId: worker.id, imageUrl: upload.url, latitude, longitude, accuracy, remarks } });
      await tx.complaint.update({ where: { id }, data: { status: ComplaintStatus.WORKER_COMPLETED, completionPhotoUrl: upload.url, completionNotes: remarks, completedAt: new Date() } });
      await tx.assignment.updateMany({ where: { complaintId: id, workerId: worker.id }, data: { status: 'COMPLETED' } });
      await tx.complaintStatusHistory.create({ data: { complaintId: id, status: ComplaintStatus.WORKER_COMPLETED, changedBy: workerUserId, remarks: remarks || 'Worker submitted completion proof.' } });
      return created;
    });
    const officers = await this.prisma.user.findMany({ where: { role: UserRole.OFFICER }, select: { id: true } });
    for (const officer of officers) await this.notificationsService.createAndSendNotification(officer.id, 'Worker completion submitted', `Complaint #${complaint.complaintNumber} is waiting for officer verification.`, 'COMPLETION_PROOF_UPLOADED', id);
    this.trackingGateway.broadcastComplaintStatus(id, ComplaintStatus.WORKER_COMPLETED, remarks);
    return { proof, complaintId: id, status: ComplaintStatus.WORKER_COMPLETED };
  }

  async reviewCompletionProof(id: string, officerUserId: string, approved: boolean, notes?: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.status !== ComplaintStatus.WORKER_COMPLETED) throw new BadRequestException('Complaint is not awaiting completion verification');
    if (approved) {
      const updated = await this.prisma.$transaction(async (tx) => {
        const result = await tx.complaint.update({ where: { id }, data: { status: ComplaintStatus.RESOLVED, resolutionNotes: notes || complaint.completionNotes } });
        await tx.complaintStatusHistory.create({ data: { complaintId: id, status: ComplaintStatus.RESOLVED, changedBy: officerUserId, remarks: notes || 'Completion approved by officer.' } });
        await tx.completionProof.updateMany({ where: { complaintId: id }, data: { verified: true, verifiedAt: new Date() } });
        await tx.assignment.updateMany({ where: { complaintId: id }, data: { status: 'COMPLETED', completedAt: new Date() } });
        if (complaint.assignedWorkerId) await tx.worker.update({ where: { id: complaint.assignedWorkerId }, data: { availability: 'AVAILABLE' } });
        return result;
      });
      await this.notificationsService.createAndSendNotification(complaint.citizenId, 'Complaint resolved', `Complaint #${complaint.complaintNumber} has been resolved.`, 'COMPLAINT_RESOLVED', id);
      this.trackingGateway.broadcastComplaintStatus(id, ComplaintStatus.RESOLVED, notes);
      return updated;
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.complaint.update({ where: { id }, data: { status: ComplaintStatus.REWORK, resolutionNotes: notes } });
      await tx.complaintStatusHistory.create({ data: { complaintId: id, status: ComplaintStatus.REWORK, changedBy: officerUserId, remarks: notes || 'Officer requested rework.' } });
      await tx.assignment.updateMany({ where: { complaintId: id }, data: { status: 'IN_PROGRESS' } });
      return result;
    });
    if (complaint.assignedWorkerId) {
      const worker = await this.prisma.worker.findUnique({ where: { id: complaint.assignedWorkerId } });
      if (worker) await this.notificationsService.createAndSendNotification(worker.userId, 'Rework requested', `Complaint #${complaint.complaintNumber} needs additional work.`, 'REWORK_REQUESTED', id);
    }
    this.trackingGateway.broadcastComplaintStatus(id, ComplaintStatus.REWORK, notes);
    return updated;
  }

  async getCompletionProofs(id: string, userId: string, role: UserRole) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (role === UserRole.CITIZEN && complaint.citizenId !== userId) throw new ForbiddenException('Not authorized');
    return this.prisma.completionProof.findMany({ where: { complaintId: id }, orderBy: { createdAt: 'desc' } });
  }

  /**
   * Citizen can cancel their complaint if still in SUBMITTED state
   */
  async cancelComplaint(id: string, citizenId: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint was not cancelled.');
    }
    if (this.prisma.isConnected) {
      const complaint = await this.prisma.complaint.findUnique({ where: { id } });
      if (!complaint) throw new NotFoundException('Complaint not found');

      if (complaint.citizenId !== citizenId) {
        throw new ForbiddenException('You can only cancel your own complaint');
      }

      if (complaint.status !== ComplaintStatus.SUBMITTED) {
        throw new BadRequestException('Cannot cancel a complaint that has already progressed past submission');
      }

      return this.updateStatus(id, citizenId, UserRole.CITIZEN, {
        status: ComplaintStatus.CANCELLED,
        remarks: 'Cancelled by citizen',
      });
    }

    throw new ServiceUnavailableException('PostgreSQL is unavailable. Complaint was not cancelled.');
  }
}
