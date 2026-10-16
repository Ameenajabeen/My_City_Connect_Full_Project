import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'priya.sundaram@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid when supplied' })
  email?: string;

  @ApiPropertyOptional({ example: 'EMP-1001', description: 'Worker employee ID. Citizens/officers can continue using email.' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'priya.sundaram@example.com', description: 'Alternative identifier: email or worker employee ID.' })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiProperty({ example: 'Pass@123456' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
