import { Module } from '@nestjs/common';
import { RedzonesService } from './redzones.service';
import { RedzonesController } from './redzones.controller';

@Module({
  controllers: [RedzonesController],
  providers: [RedzonesService],
  exports: [RedzonesService],
})
export class RedzonesModule {}
