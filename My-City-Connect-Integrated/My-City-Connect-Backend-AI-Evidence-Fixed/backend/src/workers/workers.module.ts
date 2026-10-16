import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { AssignmentsModule } from '../assignments/assignments.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AssignmentsModule, TrackingModule],
  controllers: [WorkersController],
  providers: [WorkersService],
  exports: [WorkersService],
})
export class WorkersModule {}
