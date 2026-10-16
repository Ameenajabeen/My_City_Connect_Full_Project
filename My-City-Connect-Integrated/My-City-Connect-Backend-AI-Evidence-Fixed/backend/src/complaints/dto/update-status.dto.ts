import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ComplaintStatus } from '../../common/enums';

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  @IsNotEmpty()
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Inspection team dispatched with ladder truck' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Completion evidence image URL when status is RESOLVED' })
  @IsOptional()
  @IsString()
  completionPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Completion notes or field report' })
  @IsOptional()
  @IsString()
  completionNotes?: string;
}
