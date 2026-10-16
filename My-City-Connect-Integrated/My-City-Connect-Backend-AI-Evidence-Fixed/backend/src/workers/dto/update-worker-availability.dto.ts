import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WorkerAvailability } from '../../common/enums';

export class UpdateWorkerAvailabilityDto {
  @ApiProperty({ enum: WorkerAvailability, example: WorkerAvailability.AVAILABLE })
  @IsEnum(WorkerAvailability)
  availability: WorkerAvailability;
}
