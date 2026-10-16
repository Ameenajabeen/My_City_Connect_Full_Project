import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ComplaintStatus, UserRole } from '../common/enums';

@Injectable()
export class FeedbackService {
  private inMemoryFeedbacks: Map<string, any> = new Map();

  constructor(private prisma: PrismaService) {}

  async getFeedback(complaintId: string, userId: string, role: UserRole) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (role === UserRole.CITIZEN && complaint.citizenId !== userId) {
      throw new ForbiddenException('You can only view feedback for your own complaint');
    }
    return this.prisma.feedback.findMany({ where: { complaintId }, orderBy: { createdAt: 'desc' } });
  }

  async submitFeedback(complaintId: string, citizenId: string, dto: CreateFeedbackDto) {
    if (this.prisma.isConnected) {
      const complaint = await this.prisma.complaint.findUnique({
        where: { id: complaintId },
      });

      if (!complaint) {
        throw new NotFoundException(`Complaint ${complaintId} not found`);
      }

      if (complaint.citizenId !== citizenId) {
        throw new ForbiddenException('You can only submit feedback for your own complaints');
      }

      // STRICT VALIDATION: Only allow feedback after worker completion proof is available.
      const allowedStatuses = [
        ComplaintStatus.WORKER_COMPLETED,
        ComplaintStatus.RESOLVED,
      ];
      const runtimeStatus = complaint.status?.toString();
      if (!allowedStatuses.includes(runtimeStatus as ComplaintStatus)) {
        throw new BadRequestException(
          `Feedback can only be submitted after the worker has completed the work. Current status: ${complaint.status}`
        );
      }

      const existingFeedback = await this.prisma.feedback.findUnique({
        where: {
          complaintId_citizenId: { complaintId, citizenId },
        },
      });

      if (existingFeedback) {
        throw new ConflictException('Feedback has already been submitted for this complaint');
      }

      return this.prisma.feedback.create({
        data: {
          complaintId,
          citizenId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });
    }

    const key = `${complaintId}:${citizenId}`;
    if (this.inMemoryFeedbacks.has(key)) {
      throw new ConflictException('Feedback has already been submitted for this complaint');
    }

    const fb = {
      id: 'fb-' + Date.now(),
      complaintId,
      citizenId,
      rating: dto.rating,
      comment: dto.comment,
      createdAt: new Date(),
    };
    this.inMemoryFeedbacks.set(key, fb);
    return fb;
  }
}
