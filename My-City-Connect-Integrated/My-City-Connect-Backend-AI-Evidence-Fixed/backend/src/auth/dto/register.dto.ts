import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'Priya Sundaram' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'priya.sundaram@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+919840123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Pass@123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string = 'en';

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CITIZEN })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.CITIZEN;

  @ApiPropertyOptional({ example: 'EMP-1001', description: 'Required when provisioning a worker account.' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'BADGE-1001', description: 'Officer badge number.' })
  @IsOptional()
  @IsString()
  badgeNumber?: string;

  @ApiPropertyOptional({ example: 'department-uuid' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
