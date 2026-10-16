import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterWorkerDto {
  @ApiProperty({ example: 'Priya Sundaram' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'priya.sundaram@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass@123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'department-uuid' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiPropertyOptional({ example: '+919840123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'EMP-1001' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}