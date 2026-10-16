import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly driver: string;
  private readonly bucket: string;
  private s3Client: any = null;

  constructor(private configService: ConfigService) {
    this.driver = this.configService.get<string>('aws.storageDriver', 'local');
    this.bucket = this.configService.get<string>('aws.bucket', 'mycityconnect-evidence');
    this.initS3();
  }

  private initS3() {
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');

    if (this.driver === 's3' && accessKeyId && secretAccessKey) {
      try {
        const { S3Client } = require('@aws-sdk/client-s3');
        this.s3Client = new S3Client({
          region: this.configService.get<string>('aws.region', 'ap-south-1'),
          credentials: { accessKeyId, secretAccessKey },
        });
        this.logger.log(`AWS S3 client configured for bucket: ${this.bucket}`);
      } catch (err) {
        this.logger.warn(`AWS S3 init error, falling back to local storage: ${err.message}`);
      }
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'complaints'): Promise<UploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image buffer received for upload');
    }

    const mimeType = this.detectImageMimeType(file.buffer);
    if (!mimeType) {
      throw new BadRequestException(`Unsupported file content (${file.mimetype}). Only valid JPEG, PNG, and WebP images are allowed.`);
    }

    // Max 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File size exceeds the 10MB maximum limit');
    }

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const ext = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp';
    const key = `${folder}/${timestamp}-${randomHex}${ext}`;

    if (this.s3Client && this.driver === 's3') {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: mimeType,
        })
      );
      const region = this.configService.get<string>('aws.region', 'ap-south-1');
      const url = `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
      return { url, key, mimeType, sizeBytes: file.size };
    }

    // Local file storage fallback
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, `${timestamp}-${randomHex}${ext}`);
    fs.writeFileSync(localFilePath, file.buffer);

    const url = `/uploads/${folder}/${timestamp}-${randomHex}${ext}`;
    return {
      url,
      key,
      mimeType,
      sizeBytes: file.size,
    };
  }

  private detectImageMimeType(buffer: Buffer): string | null {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 && buffer.subarray(1, 4).toString('ascii') === 'PNG' &&
      buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
    ) {
      return 'image/png';
    }
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }
    return null;
  }
}
