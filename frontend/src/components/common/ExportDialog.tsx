import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ExportDialogProps {
  isOpen: boolean;
  selectedDocumentIds: string[];
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  selectedDocumentIds,
  onClose,
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (selectedDocumentIds.length === 0) {
      showToast({
        type: 'warning',
        title: 'No Documents Selected',
        message: 'Please select at least one document to export.',
      });
      return;
    }

    try {
      setIsExporting(true);
      const blob = await apiClient.exportBlob(
        '/documents/export',
        {
          format,
          documentIds: selectedDocumentIds,
          includeReviews: true,
        },
        token
      );

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = format === 'csv' ? 'csv' : 'json';
      a.href = url;
      a.download = `document_processor_export_${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Export Generated',
        message: `Successfully exported ${selectedDocumentIds.length} document(s) as ${format.toUpperCase()}.`,
      });
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Unable to generate export at this time.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          disabled={isExporting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 id="export-dialog-title" className="text-lg font-semibold text-white">
              Export Processed Data
            </h3>
            <p className="text-xs text-slate-400">
              {selectedDocumentIds.length} document(s) selected
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-5">
          Select your desired format. Export files include sanitized metadata, AI extractions, confidence scores, and user review verification states.
        </p>

        {/* Format Selector Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setFormat('csv')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
              format === 'csv'
                ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6" />
            <span className="text-sm font-medium">CSV Table</span>
            <span className="text-[11px] text-slate-500">Spreadsheet ready, injection sanitized</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('json')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
              format === 'json'
                ? 'bg-indigo-600/15 border-indigo-500 text-indigo-300 ring-2 ring-indigo-500/30'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-6 h-6" />
            <span className="text-sm font-medium">JSON Schema</span>
            <span className="text-[11px] text-slate-500">Structured data with warnings & reviews</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedDocumentIds.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
