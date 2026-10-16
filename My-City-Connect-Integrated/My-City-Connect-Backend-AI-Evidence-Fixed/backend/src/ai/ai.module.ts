import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiClientService } from './ai-client.service';
import { DuplicateDetectionModule } from '../duplicate-detection/duplicate-detection.module';
import { EvidenceVerificationService } from './evidence-verification.service';

@Module({
  imports: [DuplicateDetectionModule],
  controllers: [AiController],
  providers: [AiService, AiClientService, EvidenceVerificationService],
  exports: [AiService, AiClientService],
})
export class AiModule {}
