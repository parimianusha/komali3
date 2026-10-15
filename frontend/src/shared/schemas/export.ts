import { z } from 'zod';

export const ExportFormatSchema = z.enum(['csv', 'json']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportRequestSchema = z.object({
  format: ExportFormatSchema,
  documentIds: z.array(z.string().uuid()).min(1, 'Select at least one document').max(100, 'Maximum 100 documents can be exported at once'),
  includeReviews: z.boolean().default(true),
});

export type ExportRequest = z.infer<typeof ExportRequestSchema>;
