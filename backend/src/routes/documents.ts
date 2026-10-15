import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import {
  DocumentQuerySchema,
  DocumentUpdateSchema,
  SaveReviewsSchema,
  ExportRequestSchema,
  UploadOptionsSchema,
  DEFAULT_MAX_UPLOAD_BYTES,
  DEFAULT_MAX_UPLOAD_FILES,
} from '../shared/index.js';
import { requireAuth } from '../middleware/auth.js';
import { validateUploadedFile } from '../services/fileValidation/fileValidator.js';
import { storageService } from '../services/storage/storageService.js';
import { documentStore } from '../services/db/documentStore.js';
import { documentProcessor } from '../services/processing/documentProcessor.js';
import { exportDocumentsAsCsv, exportDocumentsAsJson } from '../services/export/exportService.js';
import { env } from '../config/env.js';

const router = Router();

// Configure Multer for in-memory buffer storage with strict limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES || DEFAULT_MAX_UPLOAD_BYTES,
    files: env.MAX_UPLOAD_FILES || DEFAULT_MAX_UPLOAD_FILES,
  },
});

// ----------------------------------------------------------------------------
// 1. LIST DOCUMENTS (Paginated, Search, Filters, Sort)
// ----------------------------------------------------------------------------
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = DocumentQuerySchema.parse(req.query);
    const { documents, total } = await documentStore.listDocuments(req.user!.id, query);

    res.status(200).json({
      success: true,
      data: documents,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 2. UPLOAD DOCUMENTS (Multipart)
// ----------------------------------------------------------------------------
router.post(
  '/',
  requireAuth,
  upload.array('files', env.MAX_UPLOAD_FILES || DEFAULT_MAX_UPLOAD_FILES),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const uploadedStoragePaths: string[] = [];

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILES_UPLOADED',
            message: 'Please provide at least one file to upload',
          },
        });
        return;
      }

      // Parse metadata from request body
      let rawTags: string[] = [];
      if (req.body.tags) {
        rawTags = Array.isArray(req.body.tags)
          ? req.body.tags
          : typeof req.body.tags === 'string'
          ? req.body.tags.split(',').map((t: string) => t.trim())
          : [];
      }

      const options = UploadOptionsSchema.parse({
        category: req.body.category || 'other',
        customCategory: req.body.customCategory || null,
        tags: rawTags,
        processingInstructions: req.body.processingInstructions || null,
        acknowledgement: req.body.acknowledgement === 'true' || req.body.acknowledgement === true,
      });

      const results = [];
      const userId = req.user!.id;

      for (const file of files) {
        // Validate file content, size, and magic bytes
        const validation = validateUploadedFile(file);
        if (!validation.valid || !validation.mimeType || !validation.sanitizedName) {
          res.status(400).json({
            success: false,
            error: {
              code: validation.errorCode || 'VALIDATION_FAILED',
              message: validation.errorMessage || 'Invalid file format or content',
              details: { filename: file.originalname },
            },
          });
          return;
        }

        const documentId = crypto.randomUUID();
        const ext = path.extname(validation.sanitizedName) || (validation.mimeType === 'application/pdf' ? '.pdf' : '.bin');
        const storagePath = `${userId}/${documentId}${ext}`;

        // 1. Upload to private object storage
        const uploadRes = await storageService.uploadFile(
          storagePath,
          file.buffer,
          validation.mimeType
        );

        if (uploadRes.error) {
          // Cleanup any previously uploaded files on failure
          for (const p of uploadedStoragePaths) {
            await storageService.deleteFile(p).catch(() => {});
          }
          res.status(500).json({
            success: false,
            error: {
              code: 'STORAGE_UPLOAD_FAILED',
              message: 'Failed to upload document to private storage',
            },
          });
          return;
        }

        uploadedStoragePaths.push(storagePath);

        // 2. Create document record in database
        const docRecord = await documentStore.createDocument({
          id: documentId,
          owner_id: userId,
          original_name: validation.sanitizedName,
          mime_type: validation.mimeType,
          size_bytes: file.buffer.length,
          storage_path: storagePath,
          category: options.category,
          custom_category: options.customCategory,
          tags: options.tags,
        });

        // 3. Trigger asynchronous background processing pipeline
        documentProcessor
          .processDocument(documentId, userId, {
            processingInstructions: options.processingInstructions,
          })
          .catch((err) => {
            console.error(`Background processing failed for doc ${documentId}:`, err?.message || err);
          });

        results.push(docRecord);
      }

      res.status(201).json({
        success: true,
        data: results,
      });
    } catch (err) {
      // Rollback uploaded files if anything threw
      for (const p of uploadedStoragePaths) {
        await storageService.deleteFile(p).catch(() => {});
      }
      next(err);
    }
  }
);

// ----------------------------------------------------------------------------
// 3. EXPORT SELECTED DOCUMENTS (CSV or JSON)
// ----------------------------------------------------------------------------
router.post('/export', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { format, documentIds } = ExportRequestSchema.parse(req.body);

    const documents = [];
    for (const docId of documentIds) {
      const doc = await documentStore.getDocument(docId, req.user!.id);
      if (doc) {
        documents.push(doc);
      }
    }

    if (documents.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENTS_NOT_FOUND',
          message: 'None of the requested documents were found or authorized for export',
        },
      });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'csv') {
      const csv = exportDocumentsAsCsv(documents);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="documents_export_${timestamp}.csv"`);
      res.status(200).send(csv);
      return;
    }

    const json = exportDocumentsAsJson(documents);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="documents_export_${timestamp}.json"`);
    res.status(200).send(json);
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 4. STREAM FILE (Safe stream for local testing/preview)
// ----------------------------------------------------------------------------
router.get('/stream-file/:path', async (req: Request, res: Response): Promise<void> => {
  try {
    const storagePath = decodeURIComponent(req.params.path);
    // Security check: prevent directory traversal
    if (storagePath.includes('..') || path.isAbsolute(storagePath)) {
      res.status(400).send('Invalid path');
      return;
    }

    const download = await storageService.downloadFile(storagePath);
    if (download.error || !download.buffer) {
      res.status(404).send('File not found');
      return;
    }

    const ext = path.extname(storagePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.txt') contentType = 'text/plain';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.status(200).send(download.buffer);
  } catch {
    res.status(500).send('Streaming error');
  }
});

// ----------------------------------------------------------------------------
// 5. GET DOCUMENT DETAILS
// ----------------------------------------------------------------------------
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await documentStore.getDocument(req.params.id, req.user!.id);

    if (!doc) {
      // Consistent 404 to avoid leaking existence of documents belonging to others
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'The requested document does not exist or you do not have permission to view it',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 6. GET DOCUMENT SIGNED URL
// ----------------------------------------------------------------------------
router.get('/:id/file', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await documentStore.getDocument(req.params.id, req.user!.id);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      });
      return;
    }

    const signed = await storageService.createSignedUrl((doc as any).storage_path);
    if (signed.error || !signed.signedUrl) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SIGNED_URL_FAILED',
          message: 'Unable to generate access URL for this document',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        signedUrl: signed.signedUrl,
        expiresInSeconds: env.SIGNED_URL_TTL_SECONDS,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 7. PATCH DOCUMENT METADATA (Rename, Category, Tags)
// ----------------------------------------------------------------------------
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = DocumentUpdateSchema.parse(req.body);
    const updated = await documentStore.updateDocument(req.params.id, req.user!.id, updates);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found or update not permitted',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 8. TRIGGER REPROCESSING
// ----------------------------------------------------------------------------
router.post('/:id/process', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await documentStore.getDocument(req.params.id, req.user!.id);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      });
      return;
    }

    // Trigger processing
    const processResult = await documentProcessor.processDocument(
      doc.id,
      req.user!.id,
      { processingInstructions: req.body.processingInstructions }
    );

    res.status(200).json({
      success: true,
      data: {
        status: processResult.status,
        errorCode: processResult.errorCode,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 9. SAVE HUMAN REVIEWS / CORRECTIONS
// ----------------------------------------------------------------------------
router.put('/:id/review', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await documentStore.getDocument(req.params.id, req.user!.id);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      });
      return;
    }

    const { reviews } = SaveReviewsSchema.parse(req.body);
    const saved = await documentStore.saveReviews(doc.id, req.user!.id, reviews);

    res.status(200).json({
      success: true,
      data: saved,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 10. DELETE DOCUMENT
// ----------------------------------------------------------------------------
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await documentStore.getDocument(req.params.id, req.user!.id);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      });
      return;
    }

    // 1. Delete file from storage
    await storageService.deleteFile((doc as any).storage_path);

    // 2. Delete database record & associated extractions/reviews/tags
    await documentStore.deleteDocument(doc.id, req.user!.id);

    res.status(200).json({
      success: true,
      data: { message: 'Document and stored files deleted successfully' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
