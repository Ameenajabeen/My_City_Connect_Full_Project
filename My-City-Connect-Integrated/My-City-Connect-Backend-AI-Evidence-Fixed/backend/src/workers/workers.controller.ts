import { Controller, Get, Patch, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { WorkersService } from './workers.service';
import { UpdateWorkerLocationDto } from './dto/update-worker-location.dto';
import { UpdateWorkerAvailabilityDto } from './dto/update-worker-availability.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';

class UpdatePreferredLocationDto {
  @ApiProperty({ example: 'North Ward' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  preferredLocation: string;
}

@ApiTags('Workers')
@Controller('workers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getWorkers(@Query('departmentId') departmentId?: string, @Query('availability') availability?: string) {
    return this.workersService.findAll(departmentId, availability);
  }

  @Get('available')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getAvailable(@Query('departmentId') departmentId?: string) {
    return this.workersService.findAll(departmentId, 'AVAILABLE');
  }

  @Get('nearby')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async getNearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius?: string) {
    return this.workersService.findNearby(Number(lat), Number(lng), radius ? Number(radius) : 5000);
  }

  @Get('me')
  @Roles(UserRole.WORKER)
  async me(@CurrentUser('id') userId: string) {
    return this.workersService.getByUserId(userId);
  }

  @Get('me/tasks')
  @Roles(UserRole.WORKER)
  async myTasks(@CurrentUser('id') userId: string) {
    return this.workersService.getAssignmentsByUserId(userId);
  }

  @Get('me/tasks/:id')
  @Roles(UserRole.WORKER)
  async myTask(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workersService.getTaskByUserId(userId, id);
  }

  @Patch('availability')
  @Roles(UserRole.WORKER)
  async updateAvailability(@CurrentUser('id') userId: string, @Body() dto: UpdateWorkerAvailabilityDto) {
    return this.workersService.updateAvailability(userId, dto.availability);
  }

  @Patch('preferred-location')
  @Roles(UserRole.WORKER)
  async updatePreferredLocation(@CurrentUser('id') userId: string, @Body() dto: UpdatePreferredLocationDto) {
    return this.workersService.updatePreferredLocation(userId, dto.preferredLocation);
  }

  @Patch('location')
  @Post('location')
  @Roles(UserRole.WORKER)
  async updateLocation(@CurrentUser('id') userId: string, @Body() dto: UpdateWorkerLocationDto) {
    return this.workersService.updateLocation(userId, dto.latitude, dto.longitude, dto.accuracy, dto.complaintId);
  }

  @Get(':id')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async byId(@Param('id') id: string) {
    return this.workersService.getById(id);
  }

  @Get(':id/tasks')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async tasks(@Param('id') id: string) {
    return this.workersService.getAssignmentsByWorkerId(id);
  }

  @Get(':id/location')
  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  async location(@Param('id') id: string) {
    return this.workersService.getLocation(id);
  }
}
