import React, { useState } from 'react';
import {
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Quote,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { ExtractionResult, ExtractedField, FieldReviewItem } from '@/shared';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfidenceMeter } from '../../components/common/ConfidenceMeter';

interface ReviewEditorProps {
  documentId: string;
  extraction: ExtractionResult;
  existingReviews?: any[];
  onReviewsSaved?: () => void;
}

interface LocalFieldState {
  key: string;
  label: string;
  originalValue: string | null;
  currentValue: string;
  confidence: number | null;
  evidence: string | null;
  verified: boolean;
  note: string;
}

export const ReviewEditor: React.FC<ReviewEditorProps> = ({
  documentId,
  extraction,
  existingReviews = [],
  onReviewsSaved,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state merging AI extraction and any prior reviews
  const [fieldStates, setFieldStates] = useState<LocalFieldState[]>(() => {
    const reviewMap = new Map<string, any>();
    existingReviews.forEach((r) => reviewMap.set(r.field_key, r));

    return extraction.fields.map((field) => {
      const review = reviewMap.get(field.key);
      const initialVal = review?.corrected_value ?? (field.value || '');

      return {
        key: field.key,
        label: field.label,
        originalValue: field.value,
        currentValue: initialVal !== null && initialVal !== undefined ? String(initialVal) : '',
        confidence: field.confidence,
        evidence: field.evidence,
        verified: review ? Boolean(review.verified) : false,
        note: review?.note || '',
      };
    });
  });

  const handleValueChange = (key: string, val: string) => {
    setFieldStates((prev) =>
      prev.map((f) => (f.key === key ? { ...f, currentValue: val } : f))
    );
  };

  const handleVerifiedToggle = (key: string) => {
    setFieldStates((prev) =>
      prev.map((f) => (f.key === key ? { ...f, verified: !f.verified } : f))
    );
  };

  const handleNoteChange = (key: string, noteVal: string) => {
    setFieldStates((prev) =>
      prev.map((f) => (f.key === key ? { ...f, note: noteVal } : f))
    );
  };

  const handleResetToAi = (key: string) => {
    setFieldStates((prev) =>
      prev.map((f) =>
        f.key === key
          ? {
              ...f,
              currentValue: f.originalValue || '',
              verified: false,
              note: '',
            }
          : f
      )
    );
    showToast({
      type: 'info',
      title: 'Reset to AI Value',
      message: 'Field reverted to original model extraction.',
    });
  };

  const handleVerifyAll = () => {
    setFieldStates((prev) => prev.map((f) => ({ ...f, verified: true })));
    showToast({
      type: 'info',
      title: 'All Fields Marked Verified',
      message: 'Click Save Review Changes to commit.',
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const items: FieldReviewItem[] = fieldStates.map((f) => ({
        field_key: f.key,
        original_value: f.originalValue,
        corrected_value: f.currentValue.trim() === '' ? null : f.currentValue.trim(),
        verified: f.verified,
        note: f.note.trim() ? f.note.trim() : null,
      }));

      await apiClient.put(
        `/documents/${documentId}/review`,
        { reviews: items },
        token
      );

      showToast({
        type: 'success',
        title: 'Review Saved',
        message: 'Field corrections and verification statuses updated successfully.',
      });

      if (onReviewsSaved) {
        onReviewsSaved();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to save review changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const verifiedCount = fieldStates.filter((f) => f.verified).length;
  const editedCount = fieldStates.filter(
    (f) => f.currentValue !== (f.originalValue || '')
  ).length;

  return (
    <div className="space-y-6">
      {/* Review Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <span>Human Review &amp; Field Verification</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified {verifiedCount} of {fieldStates.length} fields &bull; {editedCount} edited
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleVerifyAll}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Mark All Verified
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Review Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Field Review List */}
      <div className="space-y-4">
        {fieldStates.map((f) => {
          const isEdited = f.currentValue !== (f.originalValue || '');
          const isLowConfidence = f.confidence !== null && f.confidence < 0.65;
          const isMissing = !f.originalValue;

          return (
            <div
              key={f.key}
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                f.verified
                  ? 'bg-slate-900/90 border-emerald-500/30 ring-1 ring-emerald-500/10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                {/* Field Label & Flags */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{f.label}</span>
                    <span className="text-xs font-mono text-slate-500">({f.key})</span>

                    {isEdited && (
                      <span className="text-[10px] font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        Modified
                      </span>
                    )}

                    {(isLowConfidence || isMissing) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        {isMissing ? 'Missing from source' : 'Uncertain extraction'}
                      </span>
                    )}
                  </div>

                  {f.evidence && (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                      <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="italic">Evidence: "{f.evidence}"</span>
                    </div>
                  )}
                </div>

                {/* Status & Confidence Badge */}
                <div className="flex items-center gap-3 shrink-0">
                  <ConfidenceMeter confidence={f.confidence} />
                  <button
                    type="button"
                    onClick={() => handleVerifiedToggle(f.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      f.verified
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{f.verified ? 'Verified' : 'Verify'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Value and Original Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-400">
                      Confirmed / Corrected Value
                    </label>
                    {isEdited && (
                      <button
                        type="button"
                        onClick={() => handleResetToAi(f.key)}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revert to AI</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={f.currentValue}
                    onChange={(e) => handleValueChange(f.key, e.target.value)}
                    placeholder="Enter verified value"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    AI Original:{' '}
                    <span className="font-mono text-slate-400">
                      {f.originalValue !== null ? f.originalValue : 'null'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Reviewer Note (Audit Trail)
                  </label>
                  <input
                    type="text"
                    maxLength={1000}
                    value={f.note}
                    onChange={(e) => handleNoteChange(f.key, e.target.value)}
                    placeholder="e.g. Verified against stamp on page 2"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
