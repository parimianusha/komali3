import { z } from 'zod';
import { DOCUMENT_CATEGORIES, CURRENT_EXTRACTION_SCHEMA_VERSION } from '../constants';

export const ExtractedFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{1,64}$/, 'Field key must be snake_case alphanumeric up to 64 chars'),
  label: z.string().trim().min(1).max(100),
  value: z.string().nullable(),
  normalizedValue: z.string().nullable().optional().default(null),
  confidence: z.number().min(0).max(1).nullable().optional().default(null),
  evidence: z.string().max(1000).nullable().optional().default(null),
});

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;

export const ExtractionResultSchema = z.object({
  schemaVersion: z.literal(CURRENT_EXTRACTION_SCHEMA_VERSION),
  documentType: z.enum(DOCUMENT_CATEGORIES),
  summary: z.string().trim().max(2000),
  fields: z.array(ExtractedFieldSchema).max(100),
  warnings: z.array(z.string().trim().max(500)).max(50).default([]),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export const ExtractionRecordSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  version: z.number().int().positive(),
  provider: z.string(),
  model: z.string(),
  schema_version: z.string(),
  result: ExtractionResultSchema,
  warnings: z.array(z.string()),
  created_at: z.string(),
});

export type ExtractionRecord = z.infer<typeof ExtractionRecordSchema>;
