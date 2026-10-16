import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyImageDto {
  @ApiPropertyOptional({ description: 'Optional image URL if already uploaded to S3' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
