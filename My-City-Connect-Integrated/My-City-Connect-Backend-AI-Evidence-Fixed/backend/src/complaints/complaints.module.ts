import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { DepartmentsModule } from '../departments/departments.module';
import { DuplicateDetectionModule } from '../duplicate-detection/duplicate-detection.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrackingModule } from '../tracking/tracking.module';
import { UploadsModule } from '../uploads/uploads.module';
import { RedzonesModule } from '../redzones/redzones.module';

@Module({
  imports: [
    DepartmentsModule,
    DuplicateDetectionModule,
    AssignmentsModule,
    NotificationsModule,
    TrackingModule,
    UploadsModule,
    RedzonesModule,
  ],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
