import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService
  ) {}

  async getUserNotifications(userId: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Notifications cannot be retrieved.');
    }
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Notification state was not changed.');
    }
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Notification state was not changed.');
    }
    return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  async saveDeviceToken(userId: string, token: string) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Device token was not saved.');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { deviceToken: token } });
    return { tokenSaved: true };
  }

  async createAndSendNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedComplaintId?: string
  ) {
    if (!this.prisma.isConnected) {
      throw new ServiceUnavailableException('PostgreSQL is unavailable. Notification was not recorded.');
    }
    const notif = await this.prisma.notification.create({
      data: { userId, title, message, type, relatedComplaintId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deviceToken: true },
    });

    if (user?.deviceToken) {
      await this.fcm.sendPushNotification(user.deviceToken, title, message, {
        complaintId: relatedComplaintId || '',
        type,
      });
    }

    return notif;
  }
}
