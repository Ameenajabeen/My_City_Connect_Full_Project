import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional } from 'class-validator';
import { ComplaintCategory } from '../../common/enums';

export class CheckDuplicateDto {
  @ApiProperty({ example: 13.0827 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 80.2707 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ enum: ComplaintCategory, example: ComplaintCategory.STREETLIGHT })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @ApiPropertyOptional({ example: 50, description: 'Radius in meters to check for duplicate issues' })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number = 50;
}
