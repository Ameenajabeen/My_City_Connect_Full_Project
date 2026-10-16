import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { MongoDbService } from '../database/mongodb.service';
import axios from 'axios';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private mongoDb: MongoDbService,
    private configService: ConfigService
  ) {}

  async checkHealth() {
    // Check PostgreSQL
    let databaseStatus = 'UP';
    if (this.prisma.isConnected) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        databaseStatus = 'UP';
      } catch (e) {
        databaseStatus = 'DEGRADED';
      }
    } else {
      databaseStatus = 'OFFLINE_FALLBACK';
    }

    // Check MongoDB
    const mongodbStatus = this.mongoDb.isConnected ? 'UP' : 'IN_MEMORY_FALLBACK';

    // Check FastAPI AI Service
    let aiServiceStatus = 'UP';
    const aiUrl = this.configService.get<string>('ai.serviceUrl', 'http://localhost:8000');
    try {
      await axios.get(`${aiUrl}/health`, { timeout: 1500 });
      aiServiceStatus = 'UP';
    } catch (e) {
      aiServiceStatus = this.configService.get<boolean>('ai.devSimulation') ? 'DEV_SIMULATION' : 'DOWN';
    }

    // Storage status
    const storageDriver = this.configService.get<string>('aws.storageDriver', 'local');
    const storageStatus = storageDriver === 's3' ? 'AWS_S3_READY' : 'LOCAL_STORAGE_READY';

    return {
      api: 'UP',
      database: databaseStatus,
      mongodb: mongodbStatus,
      aiService: aiServiceStatus,
      storage: storageStatus,
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
