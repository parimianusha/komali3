import { describe, it, expect, beforeEach } from 'vitest';
import { documentStore } from '../services/db/documentStore.js';
import { documentProcessor } from '../services/processing/documentProcessor.js';

describe('Document Processing Claims & Concurrency', () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  let testDocId: string;

  beforeEach(async () => {
    testDocId = crypto.randomUUID();
    await documentStore.createDocument({
      id: testDocId,
      owner_id: userId,
      original_name: 'test_invoice.txt',
      mime_type: 'text/plain',
      size_bytes: 50,
      storage_path: `${userId}/${testDocId}.txt`,
      category: 'invoice',
    });
  });

  it('should successfully claim document and prevent duplicate concurrent claim', async () => {
    // First claim
    const firstClaim = await documentStore.claimDocumentForProcessing(testDocId, userId);
    expect(firstClaim.claimed).toBe(true);
    expect(firstClaim.document?.status).toBe('processing');

    // Second claim immediately while processing lease is fresh (< 5 mins)
    const secondClaim = await documentStore.claimDocumentForProcessing(testDocId, userId);
    expect(secondClaim.claimed).toBe(false);
    expect(secondClaim.reason).toBe('CONCURRENT_PROCESSING_IN_PROGRESS');
  });

  it('should gracefully record failure if file is missing from storage', async () => {
    // Process document whose file doesn't exist in storage
    const result = await documentProcessor.processDocument(testDocId, userId);
    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.errorCode).toBe('FILE_DOWNLOAD_FAILED');

    // Document status in DB should be marked failed
    const doc = await documentStore.getDocument(testDocId, userId);
    expect(doc?.status).toBe('failed');
    expect(doc?.last_error_code).toBe('FILE_DOWNLOAD_FAILED');
  });
});
