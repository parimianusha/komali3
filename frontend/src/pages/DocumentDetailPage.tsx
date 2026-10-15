import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  Edit3,
  Trash2,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
  Tag,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { DocumentRecord } from '@/shared';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { DocumentPreview } from '../features/documents/DocumentPreview';
import { ExtractedFieldsPanel } from '../features/documents/ExtractedFieldsPanel';
import { ConfirmDeleteDialog } from '../components/common/ConfirmDeleteDialog';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiClient.get<DocumentRecord>(`/documents/${id}`, undefined, token);
      if (res.data) {
        setDocument(res.data);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Document Not Found',
        message: err.message || 'Unable to retrieve document details.',
      });
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleReprocess = async () => {
    if (!document) return;
    try {
      setIsReprocessing(true);
      showToast({
        type: 'info',
        title: 'Reprocessing Triggered',
        message: 'Re-running extraction with Gemini AI...',
      });
      await apiClient.post(`/documents/${document.id}/process`, {}, token);
      await fetchDocument();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reprocess Failed',
        message: err.message || 'Failed to reprocess document',
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/documents/${document.id}`, token);
      showToast({
        type: 'success',
        title: 'Document Deleted',
        message: 'Document and private file removed successfully.',
      });
      navigate('/documents');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Could not delete document.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async () => {
    if (!document) return;
    const newName = prompt('Enter new document name:', document.original_name);
    if (!newName || newName.trim() === document.original_name) return;

    try {
      await apiClient.patch(`/documents/${document.id}`, { original_name: newName.trim() }, token);
      showToast({
        type: 'success',
        title: 'Renamed',
        message: 'Document name updated.',
      });
      fetchDocument();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rename Failed',
        message: err.message || 'Unable to rename.',
      });
    }
  };

  if (loading || !document) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const extraction = document.latest_extraction?.result;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Header */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate max-w-lg">
                {document.original_name}
              </h1>
              <button
                onClick={handleRename}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Rename
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <CategoryBadge
                category={document.category}
                customCategory={document.custom_category}
              />
              <StatusBadge status={document.status} />
              <span>&bull;</span>
              <span className="font-mono">
                {(document.size_bytes / (1024 * 1024)).toFixed(2)} MB
              </span>
              <span>&bull;</span>
              <span>Uploaded {new Date(document.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {document.status === 'completed' && (
              <Link
                to={`/documents/${document.id}/review`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Review Fields</span>
              </Link>
            )}

            <button
              onClick={handleReprocess}
              disabled={isReprocessing || document.status === 'processing'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
              <span>Reprocess</span>
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing Failure Alert if Failed */}
      {document.status === 'failed' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Extraction Failed</h4>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Error code: <code>{document.last_error_code || 'EXTRACTION_ERROR'}</code>. The original document is safely preserved in private storage. You can click Reprocess to retry extraction.
            </p>
          </div>
        </div>
      )}

      {/* Two Column Layout: Document Source Preview vs Extracted Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Source File Preview */}
        <div>
          <DocumentPreview
            documentId={document.id}
            originalName={document.original_name}
            mimeType={document.mime_type}
            extractedText={document.extracted_text}
          />
        </div>

        {/* Right Column: AI Extraction & Fields */}
        <div>
          <ExtractedFieldsPanel
            documentId={document.id}
            extraction={extraction}
            reviews={document.reviews}
            canEdit={document.status === 'completed'}
          />
        </div>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        itemName={document.original_name}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
