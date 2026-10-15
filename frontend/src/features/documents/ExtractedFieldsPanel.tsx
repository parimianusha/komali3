import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck2,
  Sparkles,
  AlertTriangle,
  Quote,
  CheckCircle,
  Edit3,
} from 'lucide-react';
import { ExtractionResult, ExtractedField } from '@/shared';
import { ConfidenceMeter } from '../../components/common/ConfidenceMeter';

interface ExtractedFieldsPanelProps {
  documentId: string;
  extraction?: ExtractionResult | null;
  reviews?: any[];
  canEdit?: boolean;
}

export const ExtractedFieldsPanel: React.FC<ExtractedFieldsPanelProps> = ({
  documentId,
  extraction,
  reviews = [],
  canEdit = true,
}) => {
  if (!extraction) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
        <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-300">
          No extraction data available
        </h4>
        <p className="text-sm text-slate-500 mt-1">
          This document is either queued for processing or has not been processed yet.
        </p>
      </div>
    );
  }

  // Create review lookup map
  const reviewMap = new Map<string, any>();
  reviews.forEach((r) => reviewMap.set(r.field_key, r));

  return (
    <div className="space-y-6">
      {/* AI Summary Card */}
      <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Executive Summary</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Schema v{extraction.schemaVersion}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">{extraction.summary}</p>
      </div>

      {/* Warnings & Notices */}
      {extraction.warnings && extraction.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>AI Extraction Warnings ({extraction.warnings.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90 pl-1">
            {extraction.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Extracted Fields Table/List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">
              Extracted Data Fields ({extraction.fields.length})
            </h3>
          </div>

          {canEdit && (
            <Link
              to={`/documents/${documentId}/review`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Review &amp; Correct Fields</span>
            </Link>
          )}
        </div>

        <div className="divide-y divide-slate-800/70">
          {extraction.fields.map((field: ExtractedField) => {
            const review = reviewMap.get(field.key);
            const isVerified = Boolean(review?.verified);
            const displayValue = review?.corrected_value ?? field.value;

            return (
              <div
                key={field.key}
                className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Field Header & Label */}
                <div className="md:w-1/3 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate">
                      {field.label}
                    </span>
                    {isVerified && (
                      <span
                        title="Verified by Human Reviewer"
                        className="inline-flex items-center text-emerald-400 text-xs gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500 block truncate mt-0.5">
                    {field.key}
                  </span>
                </div>

                {/* Field Value & Evidence */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-medium ${
                        displayValue !== null
                          ? 'text-white'
                          : 'text-slate-500 italic'
                      }`}
                    >
                      {displayValue !== null ? String(displayValue) : 'Not found'}
                    </span>

                    {field.normalizedValue && field.normalizedValue !== displayValue && (
                      <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                        Norm: {field.normalizedValue}
                      </span>
                    )}

                    {review?.corrected_value !== undefined && review?.corrected_value !== field.value && (
                      <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Edited
                      </span>
                    )}
                  </div>

                  {field.evidence && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-400 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                      <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="italic line-clamp-2">{field.evidence}</span>
                    </div>
                  )}

                  {review?.note && (
                    <p className="text-xs text-indigo-300/90 italic pl-1">
                      Note: {review.note}
                    </p>
                  )}
                </div>

                {/* Confidence Meter */}
                <div className="md:w-32 shrink-0 flex items-center md:justify-end">
                  <ConfidenceMeter confidence={field.confidence} showBar />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
