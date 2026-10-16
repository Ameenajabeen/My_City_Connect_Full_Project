import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('AI Image Verification & Duplicate Detection')
@Controller('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Roles(UserRole.CITIZEN, UserRole.WORKER, UserRole.OFFICER, UserRole.ADMIN)
  @Post('verify-image')
  @ApiOperation({ summary: 'Analyze evidence photo through FastAPI / YOLOv8 civic detector' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Captured image file (JPEG, PNG, WebP)',
        },
        latitude: {
          type: 'number',
          description: 'Optional GPS latitude associated with the evidence capture',
        },
        longitude: {
          type: 'number',
          description: 'Optional GPS longitude associated with the evidence capture',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async verifyImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string | undefined>,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required for AI verification');
    }

    const latitude = this.parseCoordinate(body?.latitude);
    const longitude = this.parseCoordinate(body?.longitude);

    return this.aiService.verifyUploadedImage(file, undefined, {
      latitude,
      longitude,
    });
  }

  private parseCoordinate(value?: string): number | undefined {
    if (value === undefined || value === null || value.trim() === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  @Roles(UserRole.CITIZEN, UserRole.OFFICER, UserRole.ADMIN)
  @Post('check-duplicate')
  @ApiOperation({ summary: 'Check for identical category complaints within 50-meter radius' })
  async checkDuplicate(@Body() dto: CheckDuplicateDto) {
    return this.aiService.checkDuplicate(dto);
  }
}
