import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';
import { LocationUpdateDto } from './dto/location-update.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Real-time Tracking')
@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('location')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Worker publishes telemetry GPS location coordinates' })
  async updateLocation(@Body() dto: LocationUpdateDto) {
    return this.trackingService.recordWorkerLocation(dto);
  }

  @Get('complaint/:complaintId')
  @Roles(UserRole.CITIZEN, UserRole.OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current real-time GPS position of worker assigned to complaint' })
  async getComplaintTracking(@Param('complaintId') complaintId: string) {
    return this.trackingService.getLatestComplaintTracking(complaintId);
  }
}
