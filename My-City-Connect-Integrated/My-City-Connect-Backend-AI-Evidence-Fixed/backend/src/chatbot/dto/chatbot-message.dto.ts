import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatbotMessageDto {
  @ApiProperty({ example: 'What is the status of my complaint #CMP1019?' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 'ta', description: 'Language code (en, ta, hi)' })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({ example: 'CMP1019' })
  @IsOptional()
  @IsString()
  contextComplaintId?: string;
}
