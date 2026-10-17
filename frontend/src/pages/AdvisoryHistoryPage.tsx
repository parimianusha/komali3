// ==============================================================================
// AgriSage AI: Advisory History & Decision Archive Page
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  History,
  Sparkles,
  Search,
  Filter,
  Trash2,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import { AdvisoryRecord } from '../shared/types';
import { ADVISORY_CATEGORIES, ADVISORY_CATEGORY_INFO } from '../shared/agriculture';

export const AdvisoryHistoryPage: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [advisories, setAdvisories] = useState<AdvisoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<AdvisoryRecord | null>(null);

  useEffect(() => {
    fetchAdvisories();
  }, [token]);

  // Check if deep linked with ?id=...
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && advisories.length > 0) {
      const match = advisories.find((a) => a.id === id);
      if (match) {
        setSelectedReport(match);
      }
    }
  }, [searchParams, advisories]);

  const fetchAdvisories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<AdvisoryRecord[]>('/advisory', undefined, token);
      setAdvisories(res.data || []);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Loading History',
        message: err.message || 'Could not fetch previous advisory reports.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete advisory report "${title}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/advisory/${id}`, token);
      showToast({
        type: 'info',
        title: 'Report Deleted',
        message: 'Advisory report removed from history.',
      });
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      fetchAdvisories();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  const filteredAdvisories = advisories.filter((a) => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = a.title.toLowerCase().includes(q);
      const inDesc = a.user_description.toLowerCase().includes(q);
      const inSummary = a.structured_report?.summary?.toLowerCase().includes(q);
      const inCrop = a.crop_name?.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inSummary && !inCrop) return false;
    }
    return true;
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Critical</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>High</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
            <span>Moderate</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Low Risk</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-emerald-400" />
            <span>{t('nav_history')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access previous AI crop advisory reports, pest diagnosis recommendations, and seasonal plans.
          </p>
        </div>

        <Link
          to="/advisory"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Advisory</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search advisories by crop, disease symptoms, or recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {ADVISORY_CATEGORIES.map((cat) => {
              const info = ADVISORY_CATEGORY_INFO[cat];
              return (
                <option key={cat} value={cat}>
                  {info.title[language] || info.title.en}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Advisories List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-sm font-medium">Loading advisory archive...</span>
        </div>
      ) : filteredAdvisories.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center max-w-lg mx-auto space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No advisory records found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery || selectedCategory !== 'all'
              ? 'No reports match your current filter criteria.'
              : 'You have not generated any crop advisory reports yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAdvisories.map((advisory) => {
            const catInfo = ADVISORY_CATEGORY_INFO[advisory.category];

            return (
              <div
                key={advisory.id}
                onClick={() => setSelectedReport(advisory)}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all space-y-3 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        {catInfo?.title[language] || catInfo?.title.en || advisory.category}
                      </span>
                      {advisory.is_sample && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                          Demo
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {advisory.title}
                    </h3>
                  </div>

                  {getRiskBadge(advisory.structured_report?.riskLevel || 'moderate')}
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {advisory.structured_report?.summary}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
                  <div className="flex items-center gap-3">
                    {advisory.crop_name && <span>Crop: {advisory.crop_name}</span>}
                    {advisory.farm_name && <span>Farm: {advisory.farm_name}</span>}
                    <span>{new Date(advisory.created_at).toLocaleDateString('en-IN')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(advisory.id, advisory.title);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Full Advisory Report Modal View */}
      {/* ---------------------------------------------------------------------- */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Saved Advisory Report
                  </span>
                  {selectedReport.is_sample && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                      Demo Sample
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{selectedReport.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {selectedReport.crop_name && <span>Crop: {selectedReport.crop_name}</span>}
                  {selectedReport.farm_name && <span>Farm: {selectedReport.farm_name}</span>}
                  <span>{new Date(selectedReport.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo Preview if attached */}
            {selectedReport.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-56 flex items-center justify-center">
                <img
                  src={selectedReport.image_url}
                  alt="Crop symptom photograph"
                  className="max-h-52 object-contain rounded-lg"
                />
              </div>
            )}

            {/* Summary Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Summary
                </span>
                {getRiskBadge(selectedReport.structured_report.riskLevel)}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {selectedReport.structured_report.summary}
              </p>
            </div>

            {/* Understanding of Situation */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Field Context & Situation Understanding
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                {selectedReport.structured_report.understandingOfSituation}
              </p>
            </div>

            {/* Possible Explanations / Differentials */}
            {selectedReport.structured_report.possibleExplanations?.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Possible Causes & Differential Diagnosis
                </h3>
                <div className="space-y-2">
                  {selectedReport.structured_report.possibleExplanations.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{exp.cause}</span>
                        <span className="text-[11px] font-semibold text-amber-400 capitalize">
                          {exp.probability} probability
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>
                      {exp.distinguishingFactors && (
                        <div className="text-[11px] text-emerald-400 font-medium">
                          Field Verification: {exp.distinguishingFactors}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Next Steps */}
            {selectedReport.structured_report.immediateNextSteps?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Immediate Actionable Steps (Cultural & Biological Measures)</span>
                </h3>
                <ul className="space-y-2">
                  {selectedReport.structured_report.immediateNextSteps.map((step, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-slate-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-300 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preventive Measures */}
            {selectedReport.structured_report.preventiveMeasures?.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Preventive Measures
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                  {selectedReport.structured_report.preventiveMeasures.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expert Referral */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>When to Consult Local KVK / Agriculture Officer</span>
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedReport.structured_report.whenToConsultExpert}
              </p>
            </div>

            {/* Supporting Sources & Disclaimer */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-500">
              {selectedReport.structured_report.supportingSources?.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-400">Agronomic Sources: </span>
                  <span>{selectedReport.structured_report.supportingSources.join(' • ')}</span>
                </div>
              )}
              <p className="italic">{selectedReport.structured_report.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
