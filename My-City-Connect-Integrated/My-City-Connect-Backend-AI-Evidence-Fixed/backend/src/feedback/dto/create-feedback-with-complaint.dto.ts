import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateFeedbackDto } from './create-feedback.dto';

export class CreateFeedbackWithComplaintDto extends CreateFeedbackDto {
  @ApiProperty({ example: 'complaint-uuid' })
  @IsString()
  @IsNotEmpty()
  complaintId: string;
}
