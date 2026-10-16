import {
  Controller, Post, Get, Delete, Patch, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { UpdateComplaintStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, ComplaintStatus } from '../common/enums';

@ApiTags('Complaints')
@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Roles(UserRole.CITIZEN, UserRole.ADMIN)
  async createComplaint(@CurrentUser('id') citizenId: string, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.createComplaint(citizenId, dto);
  }

  @Get()
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getOfficerComplaints(@Query() query: any) {
    return this.complaintsService.getOfficerComplaints(query);
  }

  @Get('dashboard-kpis')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getDashboardKPIs() {
    return this.complaintsService.getDashboardKPIs();
  }

  @Get('map')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getMapComplaints() {
    return this.complaintsService.getMapComplaints();
  }

  @Get('my')
  @Roles(UserRole.CITIZEN)
  async getMyComplaints(@CurrentUser('id') citizenId: string, @Query() query: QueryComplaintsDto) {
    return this.complaintsService.getMyComplaints(citizenId, query);
  }

  @Get(':id')
  async getComplaintById(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: UserRole) {
    return this.complaintsService.getComplaintById(id, userId, userRole);
  }

  @Get(':id/timeline')
  async getComplaintTimeline(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: UserRole) {
    return this.complaintsService.getComplaintTimeline(id, userId, userRole);
  }

  @Get(':id/completion-proof')
  async getCompletionProofs(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole) {
    return this.complaintsService.getCompletionProofs(id, userId, role);
  }

  @Post(':id/verify')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async verify(@Param('id') id: string, @CurrentUser('id') officerId: string) {
    return this.complaintsService.verifyComplaint(id, officerId);
  }

  @Post(':id/reject')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async reject(@Param('id') id: string, @CurrentUser('id') officerId: string, @Body('reason') reason?: string) {
    return this.complaintsService.rejectComplaint(id, officerId, reason || 'Complaint rejected during verification.');
  }

  @Patch(':id/priority')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async priority(@Param('id') id: string, @Body('priority') priority: string) {
    return this.complaintsService.setPriority(id, priority);
  }

  @Patch(':id/department')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async department(@Param('id') id: string, @CurrentUser('id') officerId: string, @Body('departmentId') departmentId: string) {
    return this.complaintsService.assignDepartment(id, departmentId, officerId);
  }

  @Post(':id/assign')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async assignWorker(
    @Param('id') id: string,
    @CurrentUser('id') officerId: string,
    @Body('workerId') workerId: string,
    @Body('departmentId') departmentId?: string,
    @Body('notes') notes?: string,
  ) {
    return this.complaintsService.assignWorker(id, officerId, workerId, departmentId, notes);
  }

  @Post(':id/completion-proof')
  @Roles(UserRole.WORKER)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  async uploadCompletionProof(
    @Param('id') id: string,
    @CurrentUser('id') workerUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('latitude') latitude: string,
    @Body('longitude') longitude: string,
    @Body('accuracy') accuracy?: string,
    @Body('remarks') remarks?: string,
  ) {
    if (!file) throw new Error('Completion image is required');
    return this.complaintsService.uploadCompletionProof(
      id,
      workerUserId,
      file,
      Number(latitude),
      Number(longitude),
      accuracy == null ? undefined : Number(accuracy),
      remarks,
    );
  }

  @Post(':id/review-proof')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async reviewProof(@Param('id') id: string, @CurrentUser('id') officerId: string, @Body('approved') approved: boolean, @Body('notes') notes?: string) {
    return this.complaintsService.reviewCompletionProof(id, officerId, approved, notes);
  }

  @Post(':id/approve')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async approve(@Param('id') id: string, @CurrentUser('id') officerId: string, @Body('notes') notes?: string) {
    return this.complaintsService.reviewCompletionProof(id, officerId, true, notes);
  }

  @Post(':id/rework')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async rework(@Param('id') id: string, @CurrentUser('id') officerId: string, @Body('notes') notes?: string) {
    return this.complaintsService.reviewCompletionProof(id, officerId, false, notes);
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKER, UserRole.OFFICER, UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateComplaintStatusDto,
  ) {
    return this.complaintsService.updateStatus(id, userId, userRole, dto);
  }

  @Delete(':id')
  @Roles(UserRole.CITIZEN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelComplaint(@Param('id') id: string, @CurrentUser('id') citizenId: string) {
    return this.complaintsService.cancelComplaint(id, citizenId);
  }
}
