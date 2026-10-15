import { describe, it, expect } from 'vitest';
import {
  detectMagicBytes,
  sanitizeFilename,
  validateUploadedFile,
} from '../services/fileValidation/fileValidator.js';

describe('File Validator Service', () => {
  describe('detectMagicBytes', () => {
    it('should correctly detect PDF documents by magic bytes', () => {
      const pdfHeader = Buffer.from('%PDF-1.7\n%some-pdf-content');
      expect(detectMagicBytes(pdfHeader)).toBe('application/pdf');
    });

    it('should correctly detect PNG images by magic bytes', () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);
      expect(detectMagicBytes(pngHeader)).toBe('image/png');
    });

    it('should correctly detect JPEG images by magic bytes', () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMagicBytes(jpegHeader)).toBe('image/jpeg');
    });

    it('should correctly detect plain text content', () => {
      const textBuffer = Buffer.from('Invoice #10042\nDate: 2025-01-15\nTotal: $450.00');
      expect(detectMagicBytes(textBuffer)).toBe('text/plain');
    });

    it('should reject binary executable files disguised as text or pdf', () => {
      const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ PE header
      expect(detectMagicBytes(exeHeader)).toBeNull();
    });
  });

  describe('sanitizeFilename', () => {
    it('should strip path traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
    });

    it('should strip control characters and dangerous symbols', () => {
      expect(sanitizeFilename('invoice<test>:file|name?.pdf')).toBe('invoice_test__file_name_.pdf');
    });

    it('should enforce 255 character limit', () => {
      const longName = 'a'.repeat(300) + '.pdf';
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });
  });

  describe('validateUploadedFile', () => {
    it('should accept valid PDF file within size limit', () => {
      const mockFile = {
        originalname: 'invoice_2025.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 standard invoice header content'),
      } as Express.Multer.File;

      const result = validateUploadedFile(mockFile, 10 * 1024 * 1024);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe('application/pdf');
      expect(result.sanitizedName).toBe('invoice_2025.pdf');
    });

    it('should reject file exceeding size limit', () => {
      const mockFile = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(100),
      } as Express.Multer.File;

      const result = validateUploadedFile(mockFile, 50); // limit to 50 bytes
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should reject empty file', () => {
      const mockFile = {
        originalname: 'empty.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;

      const result = validateUploadedFile(mockFile);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('FILE_EMPTY');
    });
  });
});
