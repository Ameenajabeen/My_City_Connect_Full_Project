import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ComplaintCategory, AiVerificationStatus } from '../common/enums';

export interface AiInferenceResult {
  valid: boolean;
  detectedCategory: ComplaintCategory;
  confidence: number;
  /** Raw visual-model confidence before evidence/capture weighting. */
  visualConfidence: number;
  /** Combined confidence exposed to existing clients. */
  finalConfidence: number;
  evidenceScore: number;
  authenticityScore: number;
  imageQualityScore: number;
  metadataScore: number;
  gpsEvidenceScore: number;
  hasExifMetadata: boolean;
  hasCameraMetadata: boolean;
  hasCaptureTimestamp: boolean;
  gpsProvided: boolean;
  isValidEvidence: boolean;
  sourceEvidence: 'CAPTURE_METADATA' | 'GPS_AND_METADATA' | 'IMAGE_ONLY' | 'INVALID_IMAGE';
  evidenceNotes: string[];
  aiVerificationStatus: AiVerificationStatus;
  message: string;
  detections: any[];
  processingTimeMs: number;
  modelLoaded: boolean;
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly serviceUrl: string;
  private readonly threshold: number;

  constructor(private configService: ConfigService) {
    this.serviceUrl = this.configService.get<string>('ai.serviceUrl', 'http://localhost:8000');
    this.threshold = this.configService.get<number>('ai.autoSelectThreshold', 0.70);
  }

  async verifyImage(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<AiInferenceResult> {
    const startTime = Date.now();

    try {
      // Build multipart request to FastAPI AI service
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: filename || 'evidence.jpg',
        contentType: mimeType || 'image/jpeg',
      });

      const response = await axios.post(`${this.serviceUrl}/predict`, form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 12000,
      });

      const data = response.data;
      const processingTimeMs = Date.now() - startTime;

      let detectedCat = ComplaintCategory.OTHER;
      if (data.detectedCategory && Object.values(ComplaintCategory).includes(data.detectedCategory)) {
        detectedCat = data.detectedCategory as ComplaintCategory;
      }

      const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
      let status = AiVerificationStatus.FAILED;

      if (data.status === 'NOT_CONFIGURED') {
        status = AiVerificationStatus.NOT_CONFIGURED;
      } else if (confidence >= this.threshold && data.valid) {
        status = AiVerificationStatus.VERIFIED;
      } else if (confidence > 0) {
        status = AiVerificationStatus.LOW_CONFIDENCE;
      }

      this.logger.log(
        `FastAPI AI verified image: ${detectedCat} (${(confidence * 100).toFixed(1)}%, status: ${status}) in ${processingTimeMs}ms`
      );

      return {
        valid: data.valid ?? false,
        detectedCategory: detectedCat,
        confidence,
        visualConfidence: confidence,
        finalConfidence: confidence,
        evidenceScore: 0,
        authenticityScore: 0,
        imageQualityScore: 0,
        metadataScore: 0,
        gpsEvidenceScore: 0,
        hasExifMetadata: false,
        hasCameraMetadata: false,
        hasCaptureTimestamp: false,
        gpsProvided: false,
        isValidEvidence: Boolean(data.valid),
        sourceEvidence: 'IMAGE_ONLY' as const,
        evidenceNotes: [],
        aiVerificationStatus: status,
        message: data.message || 'Image analysis completed',
        detections: data.detections || [],
        processingTimeMs,
        modelLoaded: data.modelLoaded ?? true,
      };
    } catch (error: any) {
      const processingTimeMs = Date.now() - startTime;
      this.logger.warn(`FastAPI AI service unreachable at ${this.serviceUrl} (${error.message}). Applying fallback handler.`);

      // If dev simulation is allowed in environment or FastAPI is temporarily offline:
      // Inspect buffer bytes heuristics rather than blindly defaulting to POTHOLE!
      return this.fallbackAnalysis(fileBuffer, processingTimeMs);
    }
  }

  private fallbackAnalysis(buffer: Buffer, processingTimeMs: number): AiInferenceResult {
    // When FastAPI is offline, we must NEVER blindly return POTHOLE 91%!
    // We check byte length, simple signature, or return LOW_CONFIDENCE / NOT_CONFIGURED
    const isDevSimulation = this.configService.get<boolean>('ai.devSimulation', false);

    if (!isDevSimulation) {
      return {
        valid: false,
        detectedCategory: ComplaintCategory.OTHER,
        confidence: 0.0,
        visualConfidence: 0.0,
        finalConfidence: 0.0,
        evidenceScore: 0,
        authenticityScore: 0,
        imageQualityScore: 0,
        metadataScore: 0,
        gpsEvidenceScore: 0,
        hasExifMetadata: false,
        hasCameraMetadata: false,
        hasCaptureTimestamp: false,
        gpsProvided: false,
        isValidEvidence: false,
        sourceEvidence: 'INVALID_IMAGE' as const,
        evidenceNotes: [],
        aiVerificationStatus: AiVerificationStatus.FAILED,
        message: 'AI Vision Service endpoint unreachable. Please verify model service status.',
        detections: [],
        processingTimeMs,
        modelLoaded: false,
      };
    }

    // Dev heuristic simulation (for offline testing only if AI_DEV_SIMULATION=true)
    return {
      valid: false,
      detectedCategory: ComplaintCategory.OTHER,
      confidence: 0.45,
      visualConfidence: 0.45,
      finalConfidence: 0.45,
      evidenceScore: 0,
      authenticityScore: 0,
      imageQualityScore: 0,
      metadataScore: 0,
      gpsEvidenceScore: 0,
      hasExifMetadata: false,
      hasCameraMetadata: false,
      hasCaptureTimestamp: false,
      gpsProvided: false,
      isValidEvidence: false,
      sourceEvidence: 'IMAGE_ONLY' as const,
      evidenceNotes: [],
      aiVerificationStatus: AiVerificationStatus.LOW_CONFIDENCE,
      message: 'AI service in offline simulation mode: manual category confirmation required.',
      detections: [],
      processingTimeMs,
      modelLoaded: false,
    };
  }
}
