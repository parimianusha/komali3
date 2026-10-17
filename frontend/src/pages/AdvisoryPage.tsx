// ==============================================================================
// AgriSage AI: AI Crop Advisory Page
// Evidence-based structured crop guidance powered by Gemini 3.8 Flash
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Tractor,
  Sprout,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  Printer,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import {
  ADVISORY_CATEGORIES,
  ADVISORY_CATEGORY_INFO,
  AdvisoryCategory,
} from '../shared/agriculture';
import { FarmRecord, CropRecord, AdvisoryRecord, StructuredAdvisoryReport } from '../shared/types';

export const AdvisoryPage: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<AdvisoryCategory>('general_management');
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [userDescription, setUserDescription] = useState<string>('');
  const [advisoryLanguage, setAdvisoryLanguage] = useState<'en' | 'te' | 'hi'>(language);

  // Processing & Result State
  const [submitting, setSubmitting] = useState(false);
  const [activeReport, setActiveReport] = useState<AdvisoryRecord | null>(null);

  useEffect(() => {
    fetchContextData();
  }, [token]);

  const fetchContextData = async () => {
    try {
      setLoadingContext(true);
      const [fRes, cRes] = await Promise.all([
        apiClient.get<FarmRecord[]>('/farms', undefined, token),
        apiClient.get<CropRecord[]>('/crops', undefined, token),
      ]);
      const farmList = fRes.data || [];
      const cropList = cRes.data || [];
      setFarms(farmList);
      setCrops(cropList);

      if (farmList.length > 0) {
        setSelectedFarmId(farmList[0].id);
      }
      if (cropList.length > 0) {
        setSelectedCropId(cropList[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching context:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleGenerateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDescription.trim() || userDescription.length < 8) {
      showToast({
        type: 'warning',
        title: 'More details needed',
        message: 'Please provide a descriptive inquiry or symptom observation (at least 8 characters).',
      });
      return;
    }

    try {
      setSubmitting(true);
      const selectedFarm = farms.find((f) => f.id === selectedFarmId);
      const selectedCrop = crops.find((c) => c.id === selectedCropId);

      const payload = {
        farmId: selectedFarmId || null,
        cropId: selectedCropId || null,
        category: selectedCategory,
        userDescription,
        language: advisoryLanguage,
        includeWeather: true,
      };

      const res = await apiClient.post<AdvisoryRecord>('/advisory/general', payload, token);

      if (res.data) {
        setActiveReport(res.data);
        showToast({
          type: 'success',
          title: 'Advisory Generated',
          message: 'Structured agricultural recommendations successfully compiled.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Advisory Generation Failed',
        message: err.message || 'Could not compile advisory report.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>CRITICAL ALERT</span>
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>HIGH ATTENTION</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
            <Info className="w-3.5 h-3.5 text-yellow-400" />
            <span>MODERATE RISK</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>LOW RISK</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-emerald-400" />
          <span>{t('nav_advisory')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Context-aware agronomic guidance combining your farm soil profile, growth stage, live weather, and scientific ICAR practices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleGenerateAdvisory}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5 shadow-md"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Inquiry Details</span>
            </h2>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Advisory Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AdvisoryCategory)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
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

            {/* Farm & Crop Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Farm
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No specific farm</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Crop
                </label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">No specific crop</option>
                  {crops
                    .filter((c) => !selectedFarmId || c.farm_id === selectedFarmId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.crop_name} {c.variety ? `(${c.variety})` : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Language Selector for Advisory Response */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preferred Response Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdvisoryLanguage('en')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    advisoryLanguage === 'en'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setAdvisoryLanguage('te')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    advisoryLanguage === 'te'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  type="button"
                  onClick={() => setAdvisoryLanguage('hi')}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    advisoryLanguage === 'hi'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* User Observations Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Describe your observations or question *
              </label>
              <textarea
                rows={5}
                required
                placeholder="e.g. Chilli crop at flowering stage. Leaves showing slight upward curling and yellow veins. Observed during dry spell after furrow irrigation. What are immediate safe next steps?"
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Include symptoms, weather context, or fertilizer applied in the last 7 days.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consulting Gemini Agronomic Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Advisory</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt Guidelines Card */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Evidence-Based Transparency Guarantee</span>
            </span>
            <p className="leading-relaxed">
              AgriSage AI validates all recommendations against ICAR agronomic thresholds. We never invent weather observations or prescribe off-label chemical dosages.
            </p>
          </div>
        </div>

        {/* Right Column: Advisory Report View (7 cols) */}
        <div className="lg:col-span-7">
          {submitting ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto" />
              <h3 className="font-semibold text-white text-base">
                Analyzing Field Observations...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Correlating symptoms with crop stage, regional soil characteristics, and live weather telemetry from Open-Meteo.
              </p>
            </div>
          ) : activeReport ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                      Advisory Report
                    </span>
                    {activeReport.is_sample && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                        Demo
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{activeReport.title}</h2>
                  <span className="text-xs text-slate-400 block">
                    Generated: {new Date(activeReport.created_at).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getRiskBadge(activeReport.structured_report.riskLevel)}
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Print / Save PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Summary Alert */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-1">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  Executive Summary
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {activeReport.structured_report.summary}
                </p>
              </div>

              {/* Understanding of Situation */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Situation Understanding & Farm Context
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  {activeReport.structured_report.understandingOfSituation}
                </p>
              </div>

              {/* Possible Explanations / Differentials */}
              {activeReport.structured_report.possibleExplanations?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Possible Causes & Differential Diagnosis
                  </h3>
                  <div className="space-y-2.5">
                    {activeReport.structured_report.possibleExplanations.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{exp.cause}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              exp.probability === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {exp.probability} probability
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>
                        {exp.distinguishingFactors && (
                          <div className="text-[11px] text-emerald-400 font-medium pt-1">
                            Field Check: {exp.distinguishingFactors}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Next Steps */}
              {activeReport.structured_report.immediateNextSteps?.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Immediate Actionable Steps (Safe Cultural & Biological Measures)</span>
                  </h3>
                  <ul className="space-y-2">
                    {activeReport.structured_report.immediateNextSteps.map((step, idx) => (
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
              {activeReport.structured_report.preventiveMeasures?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Long-Term Preventive Measures
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                    {activeReport.structured_report.preventiveMeasures.map((prev, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {prev}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expert Consultation Callout */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>When to Consult an Agricultural Extension Expert</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeReport.structured_report.whenToConsultExpert}
                </p>
              </div>

              {/* Supporting References & Disclaimer */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-500">
                {activeReport.structured_report.supportingSources?.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-400">Agronomic Sources: </span>
                    <span>{activeReport.structured_report.supportingSources.join(' • ')}</span>
                  </div>
                )}
                <p className="italic">{activeReport.structured_report.disclaimer}</p>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-semibold text-white text-base">
                Ready to Analyze Your Crop Question
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Select your farm and crop, describe symptoms or fertilizer questions, and AgriSage AI will produce a validated decision report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
