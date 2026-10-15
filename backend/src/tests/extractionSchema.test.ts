import { describe, it, expect } from 'vitest';
import { ExtractionResultSchema } from '../shared/index.js';

describe('Extraction Result Zod Schema', () => {
  it('should accept valid, schema-compliant model output', () => {
    const validOutput = {
      schemaVersion: '1.0',
      documentType: 'invoice',
      summary: 'Invoice from Acme Supplies dated 2025-01-15.',
      fields: [
        {
          key: 'invoice_number',
          label: 'Invoice Number',
          value: 'INV-1042',
          normalizedValue: null,
          confidence: 0.97,
          evidence: 'Invoice No. INV-1042',
        },
        {
          key: 'invoice_date',
          label: 'Invoice Date',
          value: '15 January 2025',
          normalizedValue: '2025-01-15',
          confidence: 0.91,
          evidence: 'Date: 15 January 2025',
        },
      ],
      warnings: [],
    };

    const parsed = ExtractionResultSchema.safeParse(validOutput);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid snake_case key formats', () => {
    const invalidKeyOutput = {
      schemaVersion: '1.0',
      documentType: 'invoice',
      summary: 'Summary text',
      fields: [
        {
          key: 'Invoice Number With Spaces', // Invalid key
          label: 'Invoice Number',
          value: '1042',
        },
      ],
      warnings: [],
    };

    const parsed = ExtractionResultSchema.safeParse(invalidKeyOutput);
    expect(parsed.success).toBe(false);
  });

  it('should reject confidence values outside [0, 1] range', () => {
    const invalidConfidence = {
      schemaVersion: '1.0',
      documentType: 'invoice',
      summary: 'Summary',
      fields: [
        {
          key: 'total_amount',
          label: 'Total',
          value: '100',
          confidence: 1.5, // Invalid > 1
        },
      ],
      warnings: [],
    };

    const parsed = ExtractionResultSchema.safeParse(invalidConfidence);
    expect(parsed.success).toBe(false);
  });

  it('should reject unsupported document types', () => {
    const invalidType = {
      schemaVersion: '1.0',
      documentType: 'unsupported_unknown_class',
      summary: 'Summary',
      fields: [],
      warnings: [],
    };

    const parsed = ExtractionResultSchema.safeParse(invalidType);
    expect(parsed.success).toBe(false);
  });
});
