import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'cmp-uuid-here' })
  @IsString()
  @IsNotEmpty()
  complaintId: string;

  @ApiProperty({ example: 'worker-uuid-here' })
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @ApiPropertyOptional({ example: 'Priority repair required before evening peak traffic' })
  @IsOptional()
  @IsString()
  notes?: string;
}
