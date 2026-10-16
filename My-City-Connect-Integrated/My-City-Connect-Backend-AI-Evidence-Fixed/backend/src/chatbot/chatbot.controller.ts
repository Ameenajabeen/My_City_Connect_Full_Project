import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ChatbotVoiceDto } from './dto/chatbot-voice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Civic Chatbot Assistant')
@Controller('chatbot')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @ApiOperation({ summary: 'Send text message to civic AI chatbot assistant' })
  async postMessage(
    @CurrentUser('id') citizenId: string,
    @Body() dto: ChatbotMessageDto
  ) {
    return this.chatbotService.processMessage(citizenId, dto);
  }

  @Post('voice')
  @ApiOperation({ summary: 'Process voice input message from citizen mobile microphone' })
  async postVoice(
    @CurrentUser('id') citizenId: string,
    @Body() dto: ChatbotVoiceDto
  ) {
    return this.chatbotService.processVoiceInput(citizenId, dto.language || 'en');
  }

  @Get('history')
  @ApiOperation({ summary: 'Retrieve conversation history for current citizen from MongoDB' })
  async getChatHistory(@CurrentUser('id') citizenId: string) {
    return this.chatbotService.getHistory(citizenId);
  }
}
