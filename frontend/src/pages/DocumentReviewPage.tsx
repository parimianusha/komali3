import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { DocumentRecord } from '@/shared';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DocumentPreview } from '../features/documents/DocumentPreview';
import { ReviewEditor } from '../features/documents/ReviewEditor';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

export const DocumentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);

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
        message: err.message || 'Unable to retrieve document.',
      });
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-900">
        <div>
          <Link
            to={`/documents/${document.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Document Details</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Review &amp; Verify: {document.original_name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare source document against AI extracted fields. Edit values, verify correctness, and record audit notes.
          </p>
        </div>
      </div>

      {/* Side-by-Side Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Original File Preview */}
        <div className="sticky top-20">
          <DocumentPreview
            documentId={document.id}
            originalName={document.original_name}
            mimeType={document.mime_type}
            extractedText={document.extracted_text}
          />
        </div>

        {/* Right Pane: Review Editor */}
        <div>
          {extraction ? (
            <ReviewEditor
              documentId={document.id}
              extraction={extraction}
              existingReviews={document.reviews}
              onReviewsSaved={() => fetchDocument()}
            />
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-base font-semibold text-slate-300">No Extractions to Review</h4>
              <p className="text-xs text-slate-500 mt-1">
                Please reprocess this document first to generate AI fields.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
