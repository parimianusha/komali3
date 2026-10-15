import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Files,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { DashboardStats, DocumentRecord } from '@/shared';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { CategoryBadge } from '../components/common/CategoryBadge';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsRes, docsRes] = await Promise.all([
          apiClient.get<DashboardStats>('/stats', undefined, token),
          apiClient.get<DocumentRecord[]>('/documents', { page: 1, limit: 5, sortBy: 'created_at', sortOrder: 'desc' }, token),
        ]);

        if (isMounted) {
          if (statsRes.data) setStats(statsRes.data);
          if (docsRes.data) setRecentDocuments(docsRes.data);
        }
      } catch (err: any) {
        if (isMounted) {
          showToast({
            type: 'error',
            title: 'Dashboard Error',
            message: err.message || 'Failed to load dashboard data',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Document Intelligence Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.displayName || 'Analyst'}
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Ingest business documents, extract grounded structured fields with Gemini AI, perform human-in-the-loop review, and export verified records.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/documents/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Documents</span>
            </Link>
            <Link
              to="/documents"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <span>View All Documents</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Ingested</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalDocuments || 0}</h3>
                <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Across all categories</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Files className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Completed &amp; Extracted</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats?.completedDocuments || 0}</h3>
                <span className="text-[11px] text-emerald-500/70 font-mono mt-0.5 block">Ready for review &amp; export</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">In Pipeline</p>
                <h3 className="text-2xl font-bold text-indigo-400 mt-1">{stats?.processingDocuments || 0}</h3>
                <span className="text-[11px] text-indigo-400/70 font-mono mt-0.5 block">AI parsing in progress</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Processing Errors</p>
                <h3 className="text-2xl font-bold text-rose-400 mt-1">{stats?.failedDocuments || 0}</h3>
                <span className="text-[11px] text-rose-500/70 font-mono mt-0.5 block">Retry available</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category Breakdown & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Documents Table (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Recent Activity</span>
            </h2>
            <Link
              to="/documents"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            {loading ? (
              <TableSkeleton rows={4} />
            ) : recentDocuments.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium">No documents processed yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Upload an invoice, receipt, or contract to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="text-sm font-medium text-white hover:text-indigo-400 truncate block max-w-xs"
                        >
                          {doc.original_name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <CategoryBadge category={doc.category} />
                          <span>&bull;</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={doc.status} />
                      <Link
                        to={`/documents/${doc.id}`}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown (1 column) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <span>Category Distribution</span>
          </h2>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
            {stats?.categoriesCount && Object.keys(stats.categoriesCount).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.categoriesCount).map(([category, count]) => {
                  const percent = stats.totalDocuments
                    ? Math.round((count / stats.totalDocuments) * 100)
                    : 0;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-slate-300">{category}</span>
                        <span className="font-mono text-slate-400">
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Category statistics will appear here once documents are ingested.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
