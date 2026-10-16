import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    if (this.prisma.isConnected) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          preferredLanguage: true,
          avatarUrl: true,
          createdAt: true,
          citizenProfile: true,
          workerProfile: { include: { department: true } },
          officerProfile: { include: { department: true } },
        },
      });

      if (!user) throw new NotFoundException('User profile not found');
      return user;
    }

    return {
      id: userId,
      email: 'citizen@example.com',
      name: 'Priya Sundaram',
      phone: '+91 98401 23456',
      role: 'CITIZEN',
      preferredLanguage: 'en',
      avatarUrl: null,
      citizenProfile: {
        address: 'Anna Nagar, Chennai',
        emergencyContact: '+91 98400 11223',
        notificationPrefs: { push: true, sms: true },
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Explicit security boundary: never allow modifying role or id
    const safeData: any = {};
    if (dto.name !== undefined) safeData.name = dto.name;
    if (dto.phone !== undefined) safeData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) safeData.avatarUrl = dto.avatarUrl;
    if (dto.preferredLanguage !== undefined) safeData.preferredLanguage = dto.preferredLanguage;

    if (this.prisma.isConnected) {
      return this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: safeData,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            preferredLanguage: true,
            avatarUrl: true,
          },
        });

        if (dto.address || dto.emergencyContact || dto.notificationPrefs) {
          await tx.citizenProfile.upsert({
            where: { userId },
            create: {
              userId,
              address: dto.address,
              emergencyContact: dto.emergencyContact,
              notificationPrefs: dto.notificationPrefs,
            },
            update: {
              address: dto.address,
              emergencyContact: dto.emergencyContact,
              notificationPrefs: dto.notificationPrefs,
            },
          });
        }

        return updatedUser;
      });
    }

    return {
      id: userId,
      ...safeData,
    };
  }
}
