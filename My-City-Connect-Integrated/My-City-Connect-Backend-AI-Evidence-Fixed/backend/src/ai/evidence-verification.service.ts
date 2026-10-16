import { Injectable } from '@nestjs/common';

export interface EvidenceVerificationInput {
  buffer: Buffer;
  mimeType?: string;
  originalName?: string;
  latitude?: number;
  longitude?: number;
}

export interface EvidenceVerificationResult {
  evidenceScore: number;
  authenticityScore: number;
  imageQualityScore: number;
  metadataScore: number;
  gpsEvidenceScore: number;
  hasExifMetadata: boolean;
  hasCameraMetadata: boolean;
  hasCaptureTimestamp: boolean;
  gpsProvided: boolean;
  isValidImage: boolean;
  sourceEvidence: 'CAPTURE_METADATA' | 'GPS_AND_METADATA' | 'IMAGE_ONLY' | 'INVALID_IMAGE';
  notes: string[];
}

@Injectable()
export class EvidenceVerificationService {
  /**
   * This is an evidence-confidence layer, not a forensic guarantee.
   * An image file alone cannot prove that a person physically took the photo
   * or that it was not downloaded from the internet. EXIF metadata can also
   * be removed or forged. The score therefore measures available capture
   * evidence and image quality and is combined with the vision model score.
   */
  verify(input: EvidenceVerificationInput): EvidenceVerificationResult {
    const { buffer, mimeType = '', originalName = '' } = input;
    const imageInfo = this.inspectImage(buffer, mimeType, originalName);

    if (!imageInfo.valid) {
      return {
        evidenceScore: 0,
        authenticityScore: 0,
        imageQualityScore: 0,
        metadataScore: 0,
        gpsEvidenceScore: 0,
        hasExifMetadata: false,
        hasCameraMetadata: false,
        hasCaptureTimestamp: false,
        gpsProvided: false,
        isValidImage: false,
        sourceEvidence: 'INVALID_IMAGE',
        notes: ['The uploaded file is not recognized as a supported image.'],
      };
    }

    const gpsProvided =
      Number.isFinite(input.latitude) && Number.isFinite(input.longitude);

    let metadataScore = 0.35;
    if (imageInfo.hasExif) metadataScore += 0.15;
    if (imageInfo.hasCameraMetadata) metadataScore += 0.20;
    if (imageInfo.hasCaptureTimestamp) metadataScore += 0.15;
    metadataScore = this.clamp(metadataScore, 0, 1);

    // GPS supplied by the authenticated client is useful evidence, but is not
    // treated as proof of image origin because coordinates can be supplied
    // independently of the image file.
    const gpsEvidenceScore = gpsProvided ? 0.95 : 0.20;

    const imageQualityScore = this.calculateQualityScore(
      imageInfo.width,
      imageInfo.height,
      buffer.length,
    );

    const evidenceScore = this.clamp(
      metadataScore * 0.50 +
        imageQualityScore * 0.30 +
        gpsEvidenceScore * 0.20,
      0,
      1,
    );

    const notes: string[] = [];
    if (imageInfo.hasCameraMetadata) {
      notes.push('Camera metadata was found in the image.');
    } else {
      notes.push(
        'No camera metadata was found; this does not prove the image is downloaded.',
      );
    }
    if (imageInfo.hasCaptureTimestamp) {
      notes.push('A capture timestamp was found in the image metadata.');
    }
    if (gpsProvided) {
      notes.push('GPS coordinates were supplied with the verification request.');
    } else {
      notes.push('No GPS coordinates were supplied with the verification request.');
    }

    let sourceEvidence: EvidenceVerificationResult['sourceEvidence'] =
      'IMAGE_ONLY';
    if (gpsProvided && (imageInfo.hasCameraMetadata || imageInfo.hasExif)) {
      sourceEvidence = 'GPS_AND_METADATA';
    } else if (
      imageInfo.hasCameraMetadata ||
      imageInfo.hasCaptureTimestamp ||
      imageInfo.hasExif
    ) {
      sourceEvidence = 'CAPTURE_METADATA';
    }

    return {
      evidenceScore,
      // Keep the public name explicit: this is an evidence/authenticity
      // indicator, not a guarantee of physical capture.
      authenticityScore: evidenceScore,
      imageQualityScore,
      metadataScore,
      gpsEvidenceScore,
      hasExifMetadata: imageInfo.hasExif,
      hasCameraMetadata: imageInfo.hasCameraMetadata,
      hasCaptureTimestamp: imageInfo.hasCaptureTimestamp,
      gpsProvided,
      isValidImage: true,
      sourceEvidence,
      notes,
    };
  }

  private calculateQualityScore(
    width: number,
    height: number,
    bytes: number,
  ): number {
    const pixels = width * height;
    let resolutionScore = 0.45;
    if (pixels >= 2_000_000) resolutionScore = 1.0;
    else if (pixels >= 1_000_000) resolutionScore = 0.90;
    else if (pixels >= 500_000) resolutionScore = 0.78;
    else if (pixels >= 250_000) resolutionScore = 0.65;

    let sizeScore = 0.45;
    if (bytes >= 200_000) sizeScore = 1.0;
    else if (bytes >= 100_000) sizeScore = 0.90;
    else if (bytes >= 50_000) sizeScore = 0.78;
    else if (bytes >= 20_000) sizeScore = 0.65;

    return this.clamp(resolutionScore * 0.70 + sizeScore * 0.30, 0, 1);
  }

  private inspectImage(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): {
    valid: boolean;
    width: number;
    height: number;
    hasExif: boolean;
    hasCameraMetadata: boolean;
    hasCaptureTimestamp: boolean;
  } {
    const jpeg = this.parseJpeg(buffer);
    if (jpeg.valid) {
      const text = this.readAscii(buffer);
      return {
        ...jpeg,
        hasExif: jpeg.hasExif,
        hasCameraMetadata:
          this.containsAny(text, ['Make', 'Model']) ||
          this.containsExifTagPattern(buffer, [0x01, 0x01, 0x01, 0x10]),
        hasCaptureTimestamp:
          text.includes('DateTimeOriginal') ||
          text.includes('DateTimeDigitized'),
      };
    }

    const png = this.parsePng(buffer);
    if (png.valid) {
      return {
        ...png,
        hasExif: png.hasExif,
        hasCameraMetadata: false,
        hasCaptureTimestamp: false,
      };
    }

    const webp = this.parseWebp(buffer);
    if (webp.valid) {
      return {
        ...webp,
        hasExif: webp.hasExif,
        hasCameraMetadata: false,
        hasCaptureTimestamp: false,
      };
    }

    // Keep the parameters referenced so callers can safely pass arbitrary
    // multipart metadata without affecting validation.
    void mimeType;
    void originalName;

    return {
      valid: false,
      width: 0,
      height: 0,
      hasExif: false,
      hasCameraMetadata: false,
      hasCaptureTimestamp: false,
    };
  }

  private parseJpeg(buffer: Buffer) {
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
      return {
        valid: false,
        width: 0,
        height: 0,
        hasExif: false,
      };
    }

    let offset = 2;
    let hasExif = false;
    while (offset + 4 <= buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }

      const marker = buffer[offset + 1];
      offset += 2;

      if (marker === 0xd9 || marker === 0xda) break;
      if (marker >= 0xd0 && marker <= 0xd7) continue;
      if (offset + 2 > buffer.length) break;

      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) break;

      if (
        marker === 0xe1 &&
        segmentLength >= 8 &&
        buffer.toString('ascii', offset + 2, offset + 8) === 'Exif\0\0'
      ) {
        hasExif = true;
      }

      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15.
      const isStartOfFrame =
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf);

      if (isStartOfFrame && segmentLength >= 7) {
        const height = buffer.readUInt16BE(offset + 3);
        const width = buffer.readUInt16BE(offset + 5);
        return { valid: true, width, height, hasExif };
      }

      offset += segmentLength;
    }

    // A valid JPEG may use a less common frame marker. It is still a valid
    // image even when dimensions could not be extracted here.
    return { valid: true, width: 0, height: 0, hasExif };
  }

  private parsePng(buffer: Buffer) {
    const signature = '89504e470d0a1a0a';
    if (
      buffer.length < 24 ||
      buffer.subarray(0, 8).toString('hex') !== signature
    ) {
      return {
        valid: false,
        width: 0,
        height: 0,
        hasExif: false,
      };
    }

    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    let hasExif = false;
    let offset = 8;

    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const type = buffer.toString('ascii', offset + 4, offset + 8);
      if (type === 'eXIf') hasExif = true;
      offset += 12 + length;
      if (offset > buffer.length) break;
    }

    return { valid: true, width, height, hasExif };
  }

  private parseWebp(buffer: Buffer) {
    if (
      buffer.length < 16 ||
      buffer.toString('ascii', 0, 4) !== 'RIFF' ||
      buffer.toString('ascii', 8, 12) !== 'WEBP'
    ) {
      return {
        valid: false,
        width: 0,
        height: 0,
        hasExif: false,
      };
    }

    let offset = 12;
    let hasExif = false;
    let width = 0;
    let height = 0;

    while (offset + 8 <= buffer.length) {
      const type = buffer.toString('ascii', offset, offset + 4);
      const size = buffer.readUInt32LE(offset + 4);
      const data = offset + 8;

      if (type === 'EXIF') hasExif = true;

      if (type === 'VP8X' && size >= 10 && data + 10 <= buffer.length) {
        width =
          1 +
          buffer[data + 4] +
          (buffer[data + 5] << 8) +
          (buffer[data + 6] << 16);
        height =
          1 +
          buffer[data + 7] +
          (buffer[data + 8] << 8) +
          (buffer[data + 9] << 16);
      }

      offset += 8 + size + (size % 2);
      if (offset > buffer.length) break;
    }

    return { valid: true, width, height, hasExif };
  }

  private readAscii(buffer: Buffer): string {
    // Metadata is normally ASCII/UTF-8. Limit scanning to keep verification
    // cheap for large evidence files.
    const sample = buffer.subarray(0, Math.min(buffer.length, 2_000_000));
    return sample.toString('latin1');
  }

  private containsAny(text: string, values: string[]): boolean {
    return values.some((value) => text.includes(value));
  }

  private containsExifTagPattern(buffer: Buffer, pattern: number[]): boolean {
    outer: for (let i = 0; i <= buffer.length - pattern.length; i++) {
      for (let j = 0; j < pattern.length; j++) {
        if (buffer[i + j] !== pattern[j]) continue outer;
      }
      return true;
    }
    return false;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
