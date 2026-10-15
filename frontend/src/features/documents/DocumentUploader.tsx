import React, { useState, useRef, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tag,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import {
  DOCUMENT_CATEGORIES,
  DocumentCategory,
  ALLOWED_MIME_TYPES,
  DEFAULT_MAX_UPLOAD_BYTES,
} from '@/shared';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface QueuedFile {
  id: string;
  file: File;
  sizeFormatted: string;
  error?: string;
}

export const DocumentUploader: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [category, setCategory] = useState<DocumentCategory>('invoice');
  const [customCategory, setCustomCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [processingInstructions, setProcessingInstructions] = useState('');
  const [acknowledgement, setAcknowledgement] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateAndQueueFiles = (files: FileList | File[]) => {
    const newItems: QueuedFile[] = [];

    Array.from(files).forEach((file) => {
      let error: string | undefined;

      // Check mime type (and extension fallback)
      const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type as any);
      const isAllowedExt = /\.(pdf|png|jpe?g|txt)$/i.test(file.name);

      if (!isAllowedMime && !isAllowedExt) {
        error = 'Unsupported file format. Please upload PDF, PNG, JPEG, or TXT.';
      } else if (file.size > DEFAULT_MAX_UPLOAD_BYTES) {
        error = 'File exceeds maximum size limit of 10 MB.';
      } else if (file.size === 0) {
        error = 'File is empty.';
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        sizeFormatted: formatFileSize(file.size),
        error,
      });
    });

    setQueuedFiles((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndQueueFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (queuedFiles.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Files Added',
        message: 'Please choose at least one file to upload.',
      });
      return;
    }

    const hasErrors = queuedFiles.some((f) => f.error);
    if (hasErrors) {
      showToast({
        type: 'error',
        title: 'Validation Errors',
        message: 'Please remove invalid files before proceeding.',
      });
      return;
    }

    if (!acknowledgement) {
      showToast({
        type: 'warning',
        title: 'Acknowledgement Required',
        message: 'Please acknowledge the AI processing and data authorization notice.',
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      queuedFiles.forEach((item) => {
        formData.append('files', item.file);
      });

      formData.append('category', category);
      if (category === 'other' && customCategory.trim()) {
        formData.append('customCategory', customCategory.trim());
      }

      if (tagsInput.trim()) {
        formData.append('tags', tagsInput.trim());
      }

      if (processingInstructions.trim()) {
        formData.append('processingInstructions', processingInstructions.trim());
      }

      formData.append('acknowledgement', 'true');

      setUploadProgress(60);
      const res = await apiClient.upload<any[]>('/documents', formData, token);

      setUploadProgress(100);
      showToast({
        type: 'success',
        title: 'Upload Successful',
        message: `${queuedFiles.length} document(s) uploaded and queued for AI extraction!`,
      });

      if (res.data && res.data.length === 1) {
        navigate(`/documents/${res.data[0].id}`);
      } else {
        navigate('/documents');
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'An error occurred while uploading documents.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) validateAndQueueFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Drop documents here, or <span className="text-indigo-400 underline underline-offset-4">browse files</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Supports PDF, PNG, JPEG, and TXT files up to 10 MB each.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span>Server validated</span>
            <span>&bull;</span>
            <span>Encrypted private storage</span>
            <span>&bull;</span>
            <span>Never public</span>
          </div>
        </div>
      </div>

      {/* Queued Files List */}
      {queuedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-300">
              Selected Files ({queuedFiles.length})
            </span>
            <button
              type="button"
              onClick={() => setQueuedFiles([])}
              className="text-xs text-rose-400 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            {queuedFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      item.error
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{item.file.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-mono">{item.sizeFormatted}</span>
                      {item.error ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          {item.error}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(item.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata & Instructions Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 border border-slate-800/80 p-6 rounded-3xl">
        {/* Category Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Document Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1.5">
            Guides the AI extraction schema and prioritized business fields.
          </p>

          {category === 'other' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Custom Category Label (Optional)
              </label>
              <input
                type="text"
                maxLength={50}
                placeholder="e.g. Utility Bill, Certificate"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Tags (Optional)
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="e.g. Q1-2025, Taxes, Vendor-Acme"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Comma-separated tags for filtering and organization.
          </p>
        </div>

        {/* Processing Instructions */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Extraction Guidance / Instructions (Optional)
            </label>
            <span className="text-xs text-slate-500 font-mono">
              {processingInstructions.length}/500
            </span>
          </div>
          <textarea
            maxLength={500}
            rows={3}
            placeholder="e.g. Pay special attention to line items and VAT breakdown, or highlight the effective termination date."
            value={processingInstructions}
            onChange={(e) => setProcessingInstructions(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Note: Instructions guide field priority but will not override system safety or factual grounding.
          </p>
        </div>

        {/* Advisory and Acknowledgement Checkbox */}
        <div className="md:col-span-2 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
          <div className="flex items-start gap-3">
            <input
              id="acknowledgement"
              type="checkbox"
              checked={acknowledgement}
              onChange={(e) => setAcknowledgement(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 bg-slate-950 border-slate-700 rounded focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <label htmlFor="acknowledgement" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
              <strong className="text-white">AI Processing &amp; Authorization Notice:</strong> I understand that uploaded files will be securely processed by the configured Gemini AI extraction model on our private server. I confirm that I am authorized to process these documents and that they do not violate privacy or confidentiality policies.
            </label>
          </div>
        </div>
      </div>

      {/* Progress Bar (if uploading) */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Uploading and initiating AI pipeline...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Submit Action */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate('/documents')}
          disabled={isUploading}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUploading || queuedFiles.length === 0 || !acknowledgement}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <FileCheck className="w-4 h-4" />
              <span>Upload &amp; Extract Data</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
