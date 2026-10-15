import { documentStore } from '../db/documentStore.js';
import { storageService } from '../storage/storageService.js';
import { geminiExtractionService } from '../extraction/geminiService.js';
import { extractTextFromPdf } from '../extraction/pdfExtractor.js';

export class DocumentProcessor {
  /**
   * Processes or reprocesses a document idempotently
   */
  async processDocument(
    documentId: string,
    ownerId: string,
    options?: { processingInstructions?: string | null }
  ): Promise<{ success: boolean; status: string; errorCode?: string }> {
    // 1. Durable atomic claim
    const claimResult = await documentStore.claimDocumentForProcessing(documentId, ownerId);
    if (!claimResult.claimed) {
      return {
        success: false,
        status: claimResult.reason === 'CONCURRENT_PROCESSING_IN_PROGRESS' ? 'processing' : 'failed',
        errorCode: claimResult.reason,
      };
    }

    const doc = claimResult.document!;

    try {
      // 2. Fetch binary file from private storage
      const download = await storageService.downloadFile((doc as any).storage_path);
      if (download.error || !download.buffer) {
        await documentStore.failDocumentProcessing(documentId, ownerId, 'FILE_DOWNLOAD_FAILED');
        return {
          success: false,
          status: 'failed',
          errorCode: 'FILE_DOWNLOAD_FAILED',
        };
      }

      const fileBuffer = download.buffer;
      let rawTextContent: string | null = null;

      // 3. Extract text content if applicable
      if (doc.mime_type === 'application/pdf') {
        const pdfResult = await extractTextFromPdf(fileBuffer);
        if (pdfResult.text) {
          rawTextContent = pdfResult.text;
        }
      } else if (doc.mime_type === 'text/plain') {
        rawTextContent = fileBuffer.toString('utf8');
      }

      // 4. Invoke Gemini AI extraction service
      const extraction = await geminiExtractionService.extractDocument({
        documentId: doc.id,
        category: doc.category as any,
        customCategory: doc.custom_category,
        processingInstructions: options?.processingInstructions,
        mimeType: doc.mime_type,
        fileBuffer,
        rawTextContent,
      });

      // 5. Complete document processing and persist versioned extraction
      await documentStore.completeDocumentProcessing(
        documentId,
        ownerId,
        rawTextContent || '',
        {
          provider: extraction.provider,
          model: extraction.model,
          schemaVersion: extraction.schemaVersion,
          result: extraction.result,
          warnings: extraction.result.warnings,
        }
      );

      return {
        success: true,
        status: 'completed',
      };
    } catch (err: any) {
      const code = err?.code || (err?.message?.includes('AI_DISABLED') ? 'AI_DISABLED' : 'EXTRACTION_FAILED');
      await documentStore.failDocumentProcessing(documentId, ownerId, code);

      return {
        success: false,
        status: 'failed',
        errorCode: code,
      };
    }
  }
}

export const documentProcessor = new DocumentProcessor();
