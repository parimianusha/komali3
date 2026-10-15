import path from 'path';
import { ALLOWED_MIME_TYPES, AllowedMimeType, DEFAULT_MAX_UPLOAD_BYTES } from '../../shared/index.js';
import { env } from '../../config/env.js';

export interface ValidationResult {
  valid: boolean;
  mimeType?: AllowedMimeType;
  sanitizedName?: string;
  errorCode?: string;
  errorMessage?: string;
}

export function sanitizeFilename(filename: string): string {
  // Strip paths, control chars, null bytes, and restrict to safe basename
  const basename = path.basename(filename);
  const clean = basename
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim();

  return clean.slice(0, 255) || 'document';
}

export function detectMagicBytes(buffer: Buffer): AllowedMimeType | null {
  if (buffer.length < 4) return null;

  // PDF magic: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // JPEG magic: FF D8 FF
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // Plain text check: inspect first 1024 bytes for absence of null bytes and valid UTF-8
  const sampleLength = Math.min(buffer.length, 1024);
  let isText = true;
  for (let i = 0; i < sampleLength; i++) {
    const byte = buffer[i];
    // Check for null or non-whitespace control characters
    if (byte === 0 || (byte < 7 && byte !== 9 && byte !== 10 && byte !== 13)) {
      isText = false;
      break;
    }
  }

  if (isText) {
    try {
      const decoded = buffer.slice(0, sampleLength).toString('utf8');
      if (decoded.length > 0) {
        return 'text/plain';
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function validateUploadedFile(
  file: Express.Multer.File,
  maxBytes: number = env.MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES
): ValidationResult {
  const sanitizedName = sanitizeFilename(file.originalname);

  if (!file.buffer || file.buffer.length === 0) {
    return {
      valid: false,
      errorCode: 'FILE_EMPTY',
      errorMessage: 'Uploaded file contains no data',
    };
  }

  if (file.buffer.length > maxBytes) {
    return {
      valid: false,
      errorCode: 'FILE_TOO_LARGE',
      errorMessage: `File size exceeds the limit of ${Math.round(maxBytes / (1024 * 1024))}MB`,
    };
  }

  const detectedMime = detectMagicBytes(file.buffer);

  if (!detectedMime) {
    return {
      valid: false,
      errorCode: 'INVALID_FILE_TYPE',
      errorMessage: 'Unsupported file content. Allowed formats: PDF, PNG, JPEG, Plain text.',
    };
  }

  // Check declared MIME against allowed MIME
  const isAllowed = ALLOWED_MIME_TYPES.includes(detectedMime as AllowedMimeType);
  if (!isAllowed) {
    return {
      valid: false,
      errorCode: 'UNSUPPORTED_MIME_TYPE',
      errorMessage: `File type ${detectedMime} is not supported.`,
    };
  }

  return {
    valid: true,
    mimeType: detectedMime as AllowedMimeType,
    sanitizedName,
  };
}
