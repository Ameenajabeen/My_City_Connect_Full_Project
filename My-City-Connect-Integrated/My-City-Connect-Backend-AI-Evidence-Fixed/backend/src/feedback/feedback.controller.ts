import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateFeedbackWithComplaintDto } from './dto/create-feedback-with-complaint.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Citizen Feedback')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('complaints/:id/feedback')
  @Roles(UserRole.CITIZEN)
  async submitComplaintFeedback(@Param('id') complaintId: string, @CurrentUser('id') citizenId: string, @Body() dto: CreateFeedbackDto) {
    return this.feedbackService.submitFeedback(complaintId, citizenId, dto);
  }

  @Post('feedback')
  @Roles(UserRole.CITIZEN)
  async submitFeedbackAlias(@CurrentUser('id') citizenId: string, @Body() body: CreateFeedbackWithComplaintDto) {
    return this.feedbackService.submitFeedback(body.complaintId, citizenId, body);
  }

  @Get('complaints/:id/feedback')
  @Roles(UserRole.OFFICER, UserRole.ADMIN, UserRole.CITIZEN)
  async getComplaintFeedback(@Param('id') complaintId: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: UserRole) {
    return this.feedbackService.getFeedback(complaintId, userId, role);
  }
}
