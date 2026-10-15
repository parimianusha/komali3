import { z } from 'zod';

export const FieldReviewItemSchema = z.object({
  field_key: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]{1,64}$/, 'Invalid field key format'),
  original_value: z.any().optional(),
  corrected_value: z.any(),
  verified: z.boolean().default(false),
  note: z.string().trim().max(1000).nullable().optional(),
});

export type FieldReviewItem = z.infer<typeof FieldReviewItemSchema>;

export const SaveReviewsSchema = z.object({
  reviews: z.array(FieldReviewItemSchema).min(1).max(100),
});

export type SaveReviewsInput = z.infer<typeof SaveReviewsSchema>;

export const ReviewRecordSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  field_key: z.string(),
  original_value: z.any(),
  corrected_value: z.any(),
  verified: z.boolean(),
  note: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;
