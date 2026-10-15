import { z } from 'zod';
import { DOCUMENT_CATEGORIES, DOCUMENT_STATUSES } from '../constants.js';

export const DocumentCategorySchema = z.enum(DOCUMENT_CATEGORIES);
export const DocumentStatusSchema = z.enum(DOCUMENT_STATUSES);

export const UploadOptionsSchema = z.object({
  category: DocumentCategorySchema.default('other'),
  customCategory: z
    .string()
    .trim()
    .max(50, 'Custom category must not exceed 50 characters')
    .optional()
    .nullable(),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .default([]),
  processingInstructions: z
    .string()
    .trim()
    .max(500, 'Processing instructions must not exceed 500 characters')
    .optional()
    .nullable(),
  acknowledgement: z
    .boolean()
    .refine((val) => val === true, 'You must acknowledge the AI processing terms'),
});

export type UploadOptions = z.infer<typeof UploadOptionsSchema>;

export const DocumentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).optional(),
  category: DocumentCategorySchema.optional(),
  status: DocumentStatusSchema.optional(),
  tag: z.string().trim().max(50).optional(),
  sortBy: z
    .enum(['created_at', 'original_name', 'size_bytes', 'status', 'category'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DocumentQueryParams = z.infer<typeof DocumentQuerySchema>;

export const DocumentUpdateSchema = z.object({
  original_name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name too long')
    .optional(),
  category: DocumentCategorySchema.optional(),
  custom_category: z.string().trim().max(50).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export type DocumentUpdateInput = z.infer<typeof DocumentUpdateSchema>;

export const DocumentRecordSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  original_name: z.string(),
  mime_type: z.string(),
  size_bytes: z.number().int().positive(),
  storage_path: z.string().optional(),
  category: DocumentCategorySchema,
  custom_category: z.string().nullable(),
  status: DocumentStatusSchema,
  extracted_text: z.string().nullable(),
  processing_attempts: z.number().int().nonnegative(),
  last_error_code: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  processed_at: z.string().nullable(),
  tags: z.array(z.string()).optional(),
  latest_extraction: z.any().optional(),
  reviews: z.array(z.any()).optional(),
});

export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;
