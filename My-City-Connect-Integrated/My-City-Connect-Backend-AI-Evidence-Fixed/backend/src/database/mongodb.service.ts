import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';

export interface AiResultDoc {
  complaintId: string;
  model: string;
  modelVersion: string;
  detectedCategory: string;
  confidence: number;
  visualConfidence?: number;
  finalConfidence?: number;
  evidenceScore?: number;
  authenticityScore?: number;
  imageQualityScore?: number;
  metadataScore?: number;
  gpsEvidenceScore?: number;
  hasExifMetadata?: boolean;
  hasCameraMetadata?: boolean;
  hasCaptureTimestamp?: boolean;
  gpsProvided?: boolean;
  sourceEvidence?: string;
  detections: any[];
  processingTimeMs: number;
  createdAt: Date;
}

export interface ChatMessageDoc {
  citizenId: string;
  sessionId?: string;
  sender: 'CITIZEN' | 'BOT';
  message: string;
  language: string;
  createdAt: Date;
}

@Injectable()
export class MongoDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoDbService.name);
  private client: MongoClient | null = null;
  private db: Db | null = null;
  public isConnected = false;

  // In-memory fallback if MongoDB instance is not reachable in local test environments
  private inMemoryAiResults: AiResultDoc[] = [];
  private inMemoryChatHistory: ChatMessageDoc[] = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const uri = this.configService.get<string>('mongodb.uri');
    if (!uri) {
      this.logger.warn('MongoDB URI not configured. Using in-memory fallback.');
      return;
    }

    try {
      this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      this.logger.log('MongoDB connection established successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.warn(`MongoDB connection unavailable (${error.message}). In-memory buffer active.`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
    }
  }

  getCollection<T = any>(name: string): Collection<T> | null {
    if (this.isConnected && this.db) {
      return this.db.collection<T>(name);
    }
    return null;
  }

  async saveAiResult(doc: AiResultDoc): Promise<void> {
    const coll = this.getCollection<AiResultDoc>('ai_results');
    if (coll) {
      await coll.insertOne(doc as any);
    } else {
      this.inMemoryAiResults.push(doc);
    }
  }

  async getAiResultsForComplaint(complaintId: string): Promise<AiResultDoc[]> {
    const coll = this.getCollection<AiResultDoc>('ai_results');
    if (coll) {
      return (await coll.find({ complaintId } as any).toArray()) as unknown as AiResultDoc[];
    }
    return this.inMemoryAiResults.filter((r) => r.complaintId === complaintId);
  }

  async saveChatMessage(doc: ChatMessageDoc): Promise<void> {
    const coll = this.getCollection<ChatMessageDoc>('chat_history');
    if (coll) {
      await coll.insertOne(doc as any);
    } else {
      this.inMemoryChatHistory.push(doc);
    }
  }

  async getChatHistory(citizenId: string, limit = 50): Promise<ChatMessageDoc[]> {
    const coll = this.getCollection<ChatMessageDoc>('chat_history');
    if (coll) {
      return (await coll
        .find({ citizenId } as any)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()) as unknown as ChatMessageDoc[];
    }
    return this.inMemoryChatHistory
      .filter((m) => m.citizenId === citizenId)
      .slice(-limit);
  }
}
