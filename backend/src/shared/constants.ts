export const DOCUMENT_CATEGORIES = [
  'invoice',
  'receipt',
  'contract',
  'form',
  'letter',
  'report',
  'other',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_STATUSES = [
  'uploaded',
  'processing',
  'completed',
  'failed',
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_UPLOAD_FILES = 10;
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 300; // 5 minutes
export const CURRENT_EXTRACTION_SCHEMA_VERSION = '1.0';
