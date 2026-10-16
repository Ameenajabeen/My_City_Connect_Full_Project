import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MongoDbService } from './mongodb.service';

@Global()
@Module({
  providers: [PrismaService, MongoDbService],
  exports: [PrismaService, MongoDbService],
})
export class DatabaseModule {}
