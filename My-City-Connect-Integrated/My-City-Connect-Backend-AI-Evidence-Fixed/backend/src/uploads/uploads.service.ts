import { Injectable } from '@nestjs/common';
import { S3Service, UploadResult } from './s3.service';

@Injectable()
export class UploadsService {
  constructor(private s3Service: S3Service) {}

  async processEvidenceImage(file: Express.Multer.File, folder = 'complaints'): Promise<UploadResult> {
    return this.s3Service.uploadFile(file, folder);
  }
}
