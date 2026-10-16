import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ComplaintStatus } from '../common/enums';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Department was not created.');
    }
    return this.prisma.department.create({
      data: { name: dto.name.trim(), code: dto.code.trim().toUpperCase() },
    });
  }

  async findAll() {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Department records cannot be retrieved.');
    }

    const [departments, resolvedCounts] = await Promise.all([
      this.prisma.department.findMany({
        where: { active: true },
        include: { _count: { select: { complaints: true, workers: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.complaint.groupBy({
        by: ['departmentId'],
        where: { status: ComplaintStatus.RESOLVED, departmentId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const resolvedByDepartment = new Map(
      resolvedCounts.map((entry) => [entry.departmentId, entry._count._all]),
    );

    return departments.map((department) => ({
      ...department,
      totalComplaints: department._count.complaints,
      resolvedComplaints: resolvedByDepartment.get(department.id) || 0,
      totalWorkersCount: department._count.workers,
      activeWorkers: department._count.workers,
      activeComplaintsCount: department._count.complaints - (resolvedByDepartment.get(department.id) || 0),
    }));
  }

  async findById(id: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Department details cannot be retrieved.');
    }
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        workers: { include: { user: { select: { id: true, name: true, email: true } } } },
        complaints: { include: { citizen: { select: { id: true, name: true } }, assignedWorker: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }
}
