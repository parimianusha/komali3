import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Cpu } from 'lucide-react';
import { DocumentUploader } from '../features/documents/DocumentUploader';

export const DocumentUploadPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Documents</span>
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Upload Documents</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload PDF or image files for automated structured extraction via Gemini AI.
        </p>
      </div>

      {/* Main Upload Form */}
      <DocumentUploader />

      {/* Security Architecture Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-900 text-xs text-slate-400">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-200">Private Object Storage</h4>
            <p className="mt-1 leading-relaxed text-slate-400">
              Files are stored in private Supabase buckets with short-lived, signed URLs. Never exposed publicly.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-200">Server-Side GenAI</h4>
            <p className="mt-1 leading-relaxed text-slate-400">
              Gemini processing happens exclusively server-side. Prompts and keys are never bundled to the client.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-200">Untrusted Input Guard</h4>
            <p className="mt-1 leading-relaxed text-slate-400">
              Document contents are treated as untrusted data, preventing prompt injection and hallucinated advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
