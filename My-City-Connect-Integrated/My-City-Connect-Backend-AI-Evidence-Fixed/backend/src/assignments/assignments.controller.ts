import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Assignments')
@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getAll() {
    return this.assignmentsService.getAllAssignments();
  }

  @Post()
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Officer assigns worker to a verified complaint' })
  async createAssignment(@CurrentUser('id') assignedBy: string, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.createAssignment(assignedBy, dto);
  }

  @Get('worker/:id')
  @Roles(UserRole.WORKER, UserRole.OFFICER, UserRole.ADMIN)
  async getWorkerAssignments(@Param('id') workerId: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole) {
    if (role === UserRole.WORKER) {
      const worker = await this.assignmentsService.getWorkerByUserId(userId);
      if (worker.id !== workerId) throw new Error('Worker identity mismatch');
    }
    return this.assignmentsService.getWorkerAssignments(workerId);
  }

  @Patch(':id/accept')
  @Roles(UserRole.WORKER)
  async acceptAssignment(@Param('id') id: string, @CurrentUser('id') workerUserId: string) {
    return this.assignmentsService.acceptAssignment(id, workerUserId);
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKER)
  async updateWorkerStatus(
    @Param('id') id: string,
    @CurrentUser('id') workerUserId: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.assignmentsService.updateWorkerStatus(id, workerUserId, status, notes);
  }
}
