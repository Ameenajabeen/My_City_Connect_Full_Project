import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ComplaintCategory, CategorySource, AiVerificationStatus } from '../../common/enums';

export class CreateComplaintDto {
  @ApiProperty({ enum: ComplaintCategory, example: ComplaintCategory.STREETLIGHT })
  @IsEnum(ComplaintCategory, { message: 'Must be a valid civic complaint category' })
  @IsNotEmpty()
  category: ComplaintCategory;

  @ApiPropertyOptional({ enum: CategorySource, default: CategorySource.MANUAL })
  @IsOptional()
  @IsEnum(CategorySource)
  categorySource?: CategorySource = CategorySource.MANUAL;

  @ApiPropertyOptional({ enum: ComplaintCategory, example: ComplaintCategory.STREETLIGHT })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  aiDetectedCategory?: ComplaintCategory;

  @ApiPropertyOptional({ example: 0.94, description: 'Model confidence score between 0.0 and 1.0' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidence?: number;

  @ApiPropertyOptional({ enum: AiVerificationStatus, default: AiVerificationStatus.PENDING })
  @IsOptional()
  @IsEnum(AiVerificationStatus)
  aiVerificationStatus?: AiVerificationStatus;

  @ApiProperty({ example: 'Street light luminaire broken, dark street hazard at night' })
  @IsString()
  @IsNotEmpty({ message: 'Complaint description is required' })
  description: string;

  @ApiProperty({ example: 'https://storage.mycityconnect.gov.in/complaints/1029.jpg' })
  @IsString()
  @IsNotEmpty({ message: 'Photographic evidence image URL is required' })
  imageUrl: string;

  @ApiProperty({ example: 13.0827, description: 'Latitude (-90 to +90)' })
  @IsNumber()
  @Min(-90, { message: 'Latitude must be >= -90' })
  @Max(90, { message: 'Latitude must be <= 90' })
  latitude: number;

  @ApiProperty({ example: 80.2707, description: 'Longitude (-180 to +180)' })
  @IsNumber()
  @Min(-180, { message: 'Longitude must be >= -180' })
  @Max(180, { message: 'Longitude must be <= 180' })
  longitude: number;

  @ApiPropertyOptional({ example: 8.5, description: 'GPS accuracy radius in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Accuracy must be a non-negative number' })
  locationAccuracy?: number;

  @ApiProperty({ example: 'Anna Nagar 2nd Avenue, Near Roundabout, Chennai, Tamil Nadu' })
  @IsString()
  @IsNotEmpty({ message: 'Street address is required' })
  address: string;

  @ApiPropertyOptional({ example: 'Ward 104, Zone 8' })
  @IsOptional()
  @IsString()
  ward?: string;
}
