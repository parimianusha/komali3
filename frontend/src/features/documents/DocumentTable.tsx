import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  MoreVertical,
  Edit3,
  RotateCw,
  Trash2,
  Download,
  Eye,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DocumentRecord } from '@/shared';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ConfirmDeleteDialog } from '../../components/common/ConfirmDeleteDialog';
import { ExportDialog } from '../../components/common/ExportDialog';

interface DocumentTableProps {
  documents: DocumentRecord[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onDeleteDocument: (id: string) => Promise<void>;
  onReprocessDocument: (id: string) => Promise<void>;
  onRenameDocument: (id: string, currentName: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  total,
  page,
  limit,
  onPageChange,
  onDeleteDocument,
  onReprocessDocument,
  onRenameDocument,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(documents.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await onDeleteDocument(deleteTarget.id);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Header Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-300">
              {selectedIds.length} of {documents.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </button>
            <button
              onClick={() => {
                if (selectedIds.length === 1) {
                  const target = documents.find((d) => d.id === selectedIds[0]);
                  if (target) setDeleteTarget(target);
                }
              }}
              disabled={selectedIds.length > 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 font-medium">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      documents.length > 0 && selectedIds.length === documents.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold">Document Name</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">AI Extraction Summary</th>
                <th className="py-3.5 px-4 font-semibold">Uploaded</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {documents.map((doc) => {
                const isSelected = selectedIds.includes(doc.id);
                const extraction = doc.latest_extraction?.result;

                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(doc.id, e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Name & Size */}
                    <td className="py-4 px-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-indigo-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-medium text-white hover:text-indigo-400 transition-colors truncate block max-w-xs"
                            title={doc.original_name}
                          >
                            {doc.original_name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                            <span>{formatFileSize(doc.size_bytes)}</span>
                            {doc.tags && doc.tags.length > 0 && (
                              <>
                                <span>&bull;</span>
                                <span className="text-slate-400 truncate max-w-[120px]">
                                  #{doc.tags.join(', #')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <CategoryBadge
                        category={doc.category}
                        customCategory={doc.custom_category}
                      />
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={doc.status} />
                    </td>

                    {/* AI Extraction Summary */}
                    <td className="py-4 px-4 max-w-xs">
                      {extraction ? (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-300 line-clamp-1">
                            {extraction.summary}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400">
                            <Sparkles className="w-3 h-3" />
                            {extraction.fields?.length || 0} fields extracted
                          </span>
                        </div>
                      ) : doc.status === 'processing' ? (
                        <span className="text-xs text-indigo-400 animate-pulse italic">
                          Extracting data fields...
                        </span>
                      ) : doc.last_error_code ? (
                        <span className="text-xs font-mono text-rose-400">
                          {doc.last_error_code}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No extraction</span>
                      )}
                    </td>

                    {/* Upload Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap relative">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          to={`/documents/${doc.id}`}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {doc.status === 'completed' && (
                          <Link
                            to={`/documents/${doc.id}/review`}
                            title="Review Fields"
                            className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => onReprocessDocument(doc.id)}
                          title="Reprocess with AI"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          title="Delete Document"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 gap-3">
          <div>
            Showing <span className="text-white font-medium">{documents.length}</span> of{' '}
            <span className="text-white font-medium">{total}</span> documents
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.original_name}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Export Modal */}
      <ExportDialog
        isOpen={isExportOpen}
        selectedDocumentIds={selectedIds}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
