import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, RotateCw, FileSpreadsheet } from 'lucide-react';
import { DocumentRecord, DocumentQueryParams } from '@/shared';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DocumentFilters } from '../features/documents/DocumentFilters';
import { DocumentTable } from '../features/documents/DocumentTable';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const DocumentsListPage: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params: DocumentQueryParams = {
        page,
        limit,
        sortBy: sortBy as any,
        sortOrder,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(category ? { category: category as any } : {}),
        ...(status ? { status: status as any } : {}),
      };

      const res = await apiClient.get<DocumentRecord[]>('/documents', params, token);
      if (res.data) {
        setDocuments(res.data);
        setTotal(res.meta?.total || res.data.length);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Fetch Failed',
        message: err.message || 'Could not load documents.',
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, status, sortBy, sortOrder, token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/documents/${id}`, token);
      showToast({
        type: 'success',
        title: 'Document Deleted',
        message: 'The document and its storage object were permanently deleted.',
      });
      fetchDocuments();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Unable to delete document.',
      });
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      showToast({
        type: 'info',
        title: 'Reprocessing Started',
        message: 'Document queued for re-extraction with Gemini AI.',
      });
      await apiClient.post(`/documents/${id}/process`, {}, token);
      fetchDocuments();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reprocess Error',
        message: err.message || 'Could not reprocess document.',
      });
    }
  };

  const handleRename = async (id: string, currentName: string) => {
    const newName = prompt('Enter new document name:', currentName);
    if (!newName || newName.trim() === currentName) return;

    try {
      await apiClient.patch(`/documents/${id}`, { original_name: newName.trim() }, token);
      showToast({
        type: 'success',
        title: 'Document Renamed',
        message: 'Document name updated.',
      });
      fetchDocuments();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Rename Failed',
        message: err.message || 'Unable to rename document.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Documents</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, search, verify extractions, and export processed business records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDocuments()}
            title="Refresh document list"
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <Link
            to="/documents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <DocumentFilters
        search={search}
        category={category}
        status={status}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearchChange={(v: string) => {
          setSearch(v);
          setPage(1);
        }}
        onCategoryChange={(v: string) => {
          setCategory(v);
          setPage(1);
        }}
        onStatusChange={(v: string) => {
          setStatus(v);
          setPage(1);
        }}
        onSortByChange={(v: string) => setSortBy(v)}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        onReset={() => {
          setSearch('');
          setCategory('');
          setStatus('');
          setSortBy('created_at');
          setSortOrder('desc');
          setPage(1);
        }}
      />

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <TableSkeleton rows={8} />
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileSpreadsheet className="w-8 h-8" />}
          title={search || category || status ? 'No documents match your filters' : 'No documents uploaded yet'}
          description={
            search || category || status
              ? 'Try adjusting your search query, status, or category filters.'
              : 'Start by uploading PDF, PNG, JPEG, or text documents to extract structured data.'
          }
          action={
            <Link
              to="/documents/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/25"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
          }
        />
      ) : (
        <DocumentTable
          documents={documents}
          total={total}
          page={page}
          limit={limit}
          onPageChange={(p: number) => setPage(p)}
          onDeleteDocument={handleDelete}
          onReprocessDocument={handleReprocess}
          onRenameDocument={handleRename}
        />
      )}
    </div>
  );
};
