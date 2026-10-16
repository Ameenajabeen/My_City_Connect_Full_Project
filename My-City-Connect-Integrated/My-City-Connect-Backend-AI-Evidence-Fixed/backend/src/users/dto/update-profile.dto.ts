import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Priya Sundaram' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+919840123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'ta' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional({ example: { push: true, sms: false, email: true } })
  @IsOptional()
  @IsObject()
  notificationPrefs?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Anna Nagar West, Chennai' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+919840999888' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}
