import React from 'react';
import {
  User,
  Shield,
  Key,
  Database,
  Cpu,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const SettingsPage: React.FC = () => {
  const { user, isDemoMode } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System &amp; Workspace Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your account profile, infrastructure configuration, and AI integration parameters.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">User Profile &amp; Identity</h3>
            <p className="text-xs text-slate-400">Authenticated user details and access scope</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 font-medium block">Display Name</span>
            <span className="text-sm font-semibold text-white mt-1 block">
              {user?.displayName || 'User'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 font-medium block">Email Address</span>
            <span className="text-sm font-semibold text-white mt-1 block truncate">
              {user?.email || 'user@example.com'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 sm:col-span-2">
            <span className="text-slate-500 font-medium block">User ID (Owner Scope)</span>
            <span className="text-xs font-mono text-slate-300 mt-1 block truncate">
              {user?.id}
            </span>
          </div>
        </div>
      </div>

      {/* Infrastructure & Security Architecture */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">System Architecture &amp; Security Guardrails</h3>
            <p className="text-xs text-slate-400">Security principles enforced by the platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Supabase Status */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Supabase PostgreSQL &amp; Auth</span>
              </span>
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Live Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Dev Offline Store
                </span>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Full Row Level Security (RLS) policies configured for profiles, documents, extractions, reviews, and tags.
            </p>
          </div>

          {/* Gemini AI Status */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Google Gemini AI</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                @google/genai SDK
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Strict server-side execution with system prompt grounding, JSON schema output, and local Zod validation.
            </p>
          </div>

          {/* Private Object Storage */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Private Object Storage</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Signed URLs (TTL: 300s)
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Objects are isolated under <code>&lt;owner_id&gt;/&lt;document_id&gt;</code> and never exposed with public URLs.
            </p>
          </div>

          {/* Export Security */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Sanitized Exports</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Formula Injection Guard
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              CSV outputs neutralize formula injection prefixes (<code>=</code>, <code>+</code>, <code>-</code>, <code>@</code>) and omit storage paths or internal traces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
