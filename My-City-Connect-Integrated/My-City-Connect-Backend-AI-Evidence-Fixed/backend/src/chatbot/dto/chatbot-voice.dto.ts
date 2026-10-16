import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatbotVoiceDto {
  @ApiPropertyOptional({ example: 'ta', description: 'Audio spoken language' })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({ description: 'Optional base64 encoded audio or audio stream URL' })
  @IsOptional()
  @IsString()
  audioBase64?: string;
}
