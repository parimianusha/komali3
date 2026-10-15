import { describe, it, expect } from 'vitest';
import { exportDocumentsAsCsv, exportDocumentsAsJson } from '../services/export/exportService.js';
import { DocumentRecord } from '../shared/index.js';

describe('Export Service Security & Sanitization', () => {
  const sampleDoc: DocumentRecord = {
    id: '11111111-1111-1111-1111-111111111111',
    owner_id: '00000000-0000-0000-0000-000000000001',
    original_name: 'test_invoice.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    category: 'invoice',
    custom_category: null,
    status: 'completed',
    extracted_text: 'Sample text content',
    processing_attempts: 1,
    last_error_code: null,
    created_at: '2025-01-15T10:00:00.000Z',
    updated_at: '2025-01-15T10:01:00.000Z',
    processed_at: '2025-01-15T10:01:00.000Z',
    tags: ['q1', 'taxes'],
    latest_extraction: {
      result: {
        schemaVersion: '1.0',
        documentType: 'invoice',
        summary: 'Invoice from Acme Corp',
        fields: [
          {
            key: 'invoice_total',
            label: 'Total Amount',
            value: '=1+1', // Formula injection attempt!
            normalizedValue: null,
            confidence: 0.98,
            evidence: 'Total: $2.00',
          },
          {
            key: 'dangerous_field',
            label: 'Malicious Field',
            value: '@SUM(1,2)', // Another formula injection attempt!
            normalizedValue: null,
            confidence: 0.95,
            evidence: null,
          },
        ],
        warnings: [],
      },
    },
    reviews: [
      {
        id: 'rev-1',
        document_id: '11111111-1111-1111-1111-111111111111',
        reviewer_id: '00000000-0000-0000-0000-000000000001',
        field_key: 'invoice_total',
        original_value: '=1+1',
        corrected_value: '2.00',
        verified: true,
        note: 'Confirmed correct total',
        created_at: '2025-01-15T10:05:00.000Z',
        updated_at: '2025-01-15T10:05:00.000Z',
      },
    ],
  };

  it('should neutralize formula injection in CSV cells starting with =, +, -, @', () => {
    const csv = exportDocumentsAsCsv([sampleDoc]);

    // The cell starting with '=' should be prefixed with single quote "'"
    expect(csv).toContain("Total Amount,'=1+1");
    // The cell starting with '@' should be prefixed with single quote "'"
    expect(csv).toContain("'@SUM(1,2)");
  });

  it('should correctly escape quotes and commas in CSV output', () => {
    const docWithQuotes: DocumentRecord = {
      ...sampleDoc,
      original_name: 'Name, with "Quotes", and commas.pdf',
    };
    const csv = exportDocumentsAsCsv([docWithQuotes]);
    expect(csv).toContain('"Name, with ""Quotes"", and commas.pdf"');
  });

  it('should exclude private storage paths and secrets in JSON export', () => {
    const jsonStr = exportDocumentsAsJson([sampleDoc]);
    const parsed = JSON.parse(jsonStr);

    expect(parsed[0].id).toBe(sampleDoc.id);
    expect(parsed[0].storage_path).toBeUndefined();
    expect(parsed[0].private_bucket).toBeUndefined();
    expect(parsed[0].extracted_fields.length).toBe(2);
  });
});
