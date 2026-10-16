import { Injectable, Logger } from '@nestjs/common';
import { AiClientService, AiInferenceResult } from './ai-client.service';
import { DuplicateDetectionService } from '../duplicate-detection/duplicate-detection.service';
import { MongoDbService } from '../database/mongodb.service';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { EvidenceVerificationService } from './evidence-verification.service';
import { AiVerificationStatus } from '../common/enums';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private aiClient: AiClientService,
    private duplicateDetection: DuplicateDetectionService,
    private mongoDb: MongoDbService,
    private evidenceVerification: EvidenceVerificationService,
  ) {}

  async verifyUploadedImage(
    file: Express.Multer.File,
    complaintId?: string,
    location?: { latitude?: number; longitude?: number },
  ): Promise<AiInferenceResult> {
    const result = await this.aiClient.verifyImage(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Add capture/evidence signals without replacing the existing vision model.
    // Existing `confidence` is kept as the public combined confidence so the
    // current Citizen app does not need a breaking API change.
    const evidence = this.evidenceVerification.verify({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      latitude: location?.latitude,
      longitude: location?.longitude,
    });

    const visualConfidence = result.visualConfidence ?? result.confidence ?? 0;
    // The vision model remains the gate: evidence can increase/decrease the
    // confidence of a visual result, but evidence alone can never create a
    // positive visual classification.
    const finalConfidence = Math.max(
      0,
      Math.min(
        1,
        visualConfidence * (0.70 + evidence.evidenceScore * 0.30),
      ),
    );

    const finalStatus =
      result.detectedCategory !== 'OTHER' &&
      result.valid &&
      finalConfidence >= 0.70
        ? AiVerificationStatus.VERIFIED
        : finalConfidence > 0
          ? AiVerificationStatus.LOW_CONFIDENCE
          : result.aiVerificationStatus;

    const enrichedResult: AiInferenceResult = {
      ...result,
      confidence: finalConfidence,
      visualConfidence,
      finalConfidence,
      evidenceScore: evidence.evidenceScore,
      authenticityScore: evidence.authenticityScore,
      imageQualityScore: evidence.imageQualityScore,
      metadataScore: evidence.metadataScore,
      gpsEvidenceScore: evidence.gpsEvidenceScore,
      hasExifMetadata: evidence.hasExifMetadata,
      hasCameraMetadata: evidence.hasCameraMetadata,
      hasCaptureTimestamp: evidence.hasCaptureTimestamp,
      gpsProvided: evidence.gpsProvided,
      isValidEvidence: evidence.isValidImage,
      sourceEvidence: evidence.sourceEvidence,
      evidenceNotes: evidence.notes,
      aiVerificationStatus: finalStatus,
    };

    this.logger.log(
      `Evidence verification: visual=${(visualConfidence * 100).toFixed(1)}%, ` +
        `evidence=${(evidence.evidenceScore * 100).toFixed(1)}%, ` +
        `final=${(finalConfidence * 100).toFixed(1)}%, source=${evidence.sourceEvidence}`,
    );

    // Persist detailed computer vision + evidence results into MongoDB for auditing
    try {
      await this.mongoDb.saveAiResult({
        complaintId: complaintId || 'unassigned-' + Date.now(),
        model: result.modelLoaded ? 'custom-yolov8' : 'fallback-classifier',
        modelVersion: '1.0',
        detectedCategory: result.detectedCategory,
        confidence: enrichedResult.confidence,
        visualConfidence: enrichedResult.visualConfidence,
        finalConfidence: enrichedResult.finalConfidence,
        evidenceScore: enrichedResult.evidenceScore,
        authenticityScore: enrichedResult.authenticityScore,
        imageQualityScore: enrichedResult.imageQualityScore,
        metadataScore: enrichedResult.metadataScore,
        gpsEvidenceScore: enrichedResult.gpsEvidenceScore,
        hasExifMetadata: enrichedResult.hasExifMetadata,
        hasCameraMetadata: enrichedResult.hasCameraMetadata,
        hasCaptureTimestamp: enrichedResult.hasCaptureTimestamp,
        gpsProvided: enrichedResult.gpsProvided,
        sourceEvidence: enrichedResult.sourceEvidence,
        detections: enrichedResult.detections,
        processingTimeMs: result.processingTimeMs,
        createdAt: new Date(),
      });
    } catch (err) {
      this.logger.warn(`Failed to archive AI inference in MongoDB: ${err.message}`);
    }

    return enrichedResult;
  }

  async checkDuplicate(dto: CheckDuplicateDto) {
    return this.duplicateDetection.checkDuplicate(
      dto.latitude,
      dto.longitude,
      dto.category,
      dto.radiusMeters || 50
    );
  }
}
