import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LocationUpdateDto {
  @ApiProperty({ example: 'wrk-uuid-here' })
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @ApiPropertyOptional({ example: 'cmp-uuid-here' })
  @IsOptional()
  @IsString()
  complaintId?: string;

  @ApiProperty({ example: 13.0855 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 80.2180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 5.2, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 35.0, description: 'Speed in km/h' })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiPropertyOptional({ example: 180.0, description: 'Heading degrees' })
  @IsOptional()
  @IsNumber()
  heading?: number;
}
