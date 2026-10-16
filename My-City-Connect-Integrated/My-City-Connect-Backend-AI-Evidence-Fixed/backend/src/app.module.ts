import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { UploadsModule } from './uploads/uploads.module';
import { WorkersModule } from './workers/workers.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { TrackingModule } from './tracking/tracking.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AiModule } from './ai/ai.module';
import { DuplicateDetectionModule } from './duplicate-detection/duplicate-detection.module';
import { RedzonesModule } from './redzones/redzones.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ServeStaticModule.forRoot({
  rootPath: join(process.cwd(), 'public'),
}),
    DatabaseModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ComplaintsModule,
    UploadsModule,
    WorkersModule,
    AssignmentsModule,
    TrackingModule,
    NotificationsModule,
    FeedbackModule,
    AiModule,
    DuplicateDetectionModule,
    RedzonesModule,
    ChatbotModule,
    HealthModule,
  ],
})
export class AppModule {}
