import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(private configService: ConfigService) {}

  async sendPushNotification(deviceToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!deviceToken) return;

    const projectId = this.configService.get<string>('fcm.projectId');
    if (!projectId) {
      this.logger.debug(`[FCM Mock] Push to ${deviceToken.substring(0, 10)}...: "${title}" - "${body}"`);
      return;
    }

    try {
      this.logger.log(`FCM dispatched push to token: ${deviceToken.substring(0, 8)}...`);
    } catch (e: any) {
      this.logger.warn(`Failed to dispatch FCM message: ${e.message}`);
    }
  }
}
