import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

interface DocumentPreviewProps {
  documentId: string;
  originalName: string;
  mimeType: string;
  extractedText?: string | null;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  documentId,
  originalName,
  mimeType,
  extractedText,
}) => {
  const { token } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'source' | 'extractedText'>('source');

  useEffect(() => {
    let isMounted = true;
    async function loadSignedUrl() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<{ signedUrl: string; expiresInSeconds: number }>(
          `/documents/${documentId}/file`,
          undefined,
          token
        );
        if (isMounted) {
          setSignedUrl(res.data?.signedUrl || null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load document preview');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSignedUrl();
    return () => {
      isMounted = false;
    };
  }, [documentId, token]);

  const handleDownload = () => {
    if (!signedUrl) return;
    const a = document.createElement('a');
    a.href = signedUrl;
    a.download = originalName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const isText = mimeType === 'text/plain';

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('source')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'source'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Original File
            </button>
            <button
              onClick={() => setActiveTab('extractedText')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === 'extractedText'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Extracted Raw Text
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'source' && isImage && (
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 mr-2 text-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-slate-400">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {signedUrl && (
            <>
              <a
                href={signedUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new window"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={handleDownload}
                title="Download source file"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 min-h-[500px] max-h-[750px] overflow-auto p-4 flex items-center justify-center bg-slate-950/40 relative">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading document viewer...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 text-rose-400 max-w-sm text-center p-6 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <AlertCircle className="w-8 h-8" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {!loading && !error && activeTab === 'extractedText' && (
          <div className="w-full h-full p-4 overflow-auto font-mono text-xs text-slate-300 bg-slate-950 rounded-xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap select-text">
            {extractedText || (
              <span className="text-slate-500 italic">
                No raw text extracted for this document yet.
              </span>
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'source' && signedUrl && (
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            {isPdf && (
              <iframe
                src={`${signedUrl}#toolbar=0&navpanes=0`}
                title={originalName}
                className="w-full h-[650px] rounded-xl border border-slate-800 bg-white"
              />
            )}

            {isImage && (
              <div className="overflow-auto max-h-[650px] w-full flex items-center justify-center p-4">
                <img
                  src={signedUrl}
                  alt={originalName}
                  style={{ width: `${zoomLevel}%` }}
                  className="rounded-xl shadow-2xl object-contain transition-all duration-200 border border-slate-800"
                />
              </div>
            )}

            {isText && (
              <iframe
                src={signedUrl}
                title={originalName}
                className="w-full h-[600px] rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-200 font-mono text-xs"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
