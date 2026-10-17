// ==============================================================================
// AgriSage AI: Main Agricultural Decision Support Dashboard
// ==============================================================================

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tractor,
  Sprout,
  Sparkles,
  Bug,
  Compass,
  FileText,
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  ArrowRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import { AdvisoryRecord, WeatherReport, FarmRecord, CropRecord } from '../shared/types';
import { AGRI_DOCUMENT_LABELS, AgriDocumentCategory } from '../shared/agriculture';

export const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalFarms: number;
    totalActiveCrops: number;
    totalAdvisories: number;
    totalDocuments: number;
    primaryFarm?: FarmRecord | null;
    weather?: WeatherReport | null;
    recentAdvisories: AdvisoryRecord[];
    recentDocuments: any[];
  } | null>(null);

  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/stats', undefined, token);
      if (res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setDemoLoading(true);
      const res = await apiClient.post<any>('/demo/load', {}, token);
      showToast({
        type: 'success',
        title: 'Demo Data Loaded',
        message: 'Successfully loaded Krishna Valley farm, crops, advisory, and soil test document.',
      });
      fetchDashboardData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Demo Load Failed',
        message: err.message || 'Could not load demonstration records.',
      });
    } finally {
      setDemoLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            {t('risk_critical')}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            {t('risk_high')}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
            {t('risk_moderate')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {t('risk_low')}
          </span>
        );
    }
  };

  const weather = stats?.weather;
  const primaryFarm = stats?.primaryFarm;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border border-emerald-800/40 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              <Sprout className="w-3.5 h-3.5" />
              <span>AgriSage AI • Precision Decision Support</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {t('dash_welcome')}, {user?.displayName || 'Farmer Partner'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {primaryFarm
                ? `Managing ${stats?.totalFarms || 1} farm (${primaryFarm.name} in ${primaryFarm.district}, ${primaryFarm.state}) with ${stats?.totalActiveCrops || 0} active crops.`
                : t('dash_tagline')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleLoadDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 shadow-sm transition-all"
            >
              {demoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Database className="w-4 h-4 text-emerald-400" />
              )}
              <span>{t('load_demo_btn')}</span>
            </button>

            <Link
              to="/advisory"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('quick_action_advisory')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Farms */}
        <Link
          to="/farms"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t('metric_farms')}</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 group-hover:scale-110 transition-transform">
              <Tractor className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalFarms ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">farms registered</span>
          </div>
        </Link>

        {/* Metric 2: Crops */}
        <Link
          to="/farms"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t('metric_crops')}</span>
            <div className="p-2 rounded-xl bg-green-950/60 text-green-400 group-hover:scale-110 transition-transform">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalActiveCrops ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">growing in field</span>
          </div>
        </Link>

        {/* Metric 3: Advisories */}
        <Link
          to="/history"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t('metric_advisories')}</span>
            <div className="p-2 rounded-xl bg-teal-950/60 text-teal-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalAdvisories ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">reports generated</span>
          </div>
        </Link>

        {/* Metric 4: Documents */}
        <Link
          to="/documents"
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t('metric_documents')}</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats?.totalDocuments ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">soil cards & records</span>
          </div>
        </Link>
      </div>

      {/* Live Weather Widget */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">
                  {weather ? weather.locationName : 'Regional Meteorological Station'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Live Verified Provider
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {weather
                  ? `${weather.providerAttribution} • Updated: ${weather.dataFreshness}`
                  : 'Live weather observations are fetched via Open-Meteo API'}
              </p>
            </div>
          </div>

          {weather && (
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{weather.temperature}°C</span>
              <p className="text-xs text-emerald-400 font-medium">{weather.weatherDescription}</p>
            </div>
          )}
        </div>

        {weather ? (
          <div className="mt-5 space-y-4">
            {/* Real-time Current Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <Thermometer className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Feels Like</span>
                  <span className="text-sm font-semibold text-white">
                    {weather.apparentTemperature ?? weather.temperature}°C
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Relative Humidity</span>
                  <span className="text-sm font-semibold text-white">{weather.humidity ?? 60}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <Wind className="w-4 h-4 text-teal-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Wind Speed</span>
                  <span className="text-sm font-semibold text-white">{weather.windSpeed ?? 10} km/h</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
                <Droplets className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-[11px] text-slate-400 block">Precipitation</span>
                  <span className="text-sm font-semibold text-white">
                    {weather.precipitation ?? 0} mm
                  </span>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast Strip */}
            {weather.dailyForecasts && weather.dailyForecasts.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  5-Day Agricultural Forecast
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {weather.dailyForecasts.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-1"
                    >
                      <span className="text-[11px] font-medium text-slate-400 block">
                        {new Date(d.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs font-bold text-white block">
                        {d.maxTemp}° / {d.minTemp}°
                      </span>
                      <span className="text-[10px] text-cyan-400 block">
                        Rain: {d.precipitationProbability}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/40 text-center text-xs text-slate-400">
            No farm location configured yet. Add your farm with State & District to see live weather observation and agricultural forecast.
          </div>
        )}
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action 1: General Advisory */}
        <Link
          to="/advisory"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm group-hover:text-emerald-400 transition-colors">
              {t('quick_action_advisory')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Get context-aware advice on nutrients, irrigation, soil conditioning, or cultivation stages.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 pt-1">
            <span>Consult AI</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Action 2: Pest Doctor */}
        <Link
          to="/pest-diagnosis"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/70 border border-amber-900/30 hover:border-amber-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/40 flex items-center justify-center text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors">
              {t('quick_action_diagnose')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload crop photo or describe leaf curling, spots, and wilting for differential diagnosis.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-amber-400 pt-1">
            <span>Diagnose Crop</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Action 3: Crop Suitability */}
        <Link
          to="/crop-suitability"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/70 border border-teal-900/30 hover:border-teal-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/40 flex items-center justify-center text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm group-hover:text-teal-400 transition-colors">
              {t('quick_action_suitability')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Find recommended Indian crops matching your district, season, soil pH, and water availability.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-teal-400 pt-1">
            <span>Evaluate Suitability</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Action 4: Ag Documents */}
        <Link
          to="/documents/new"
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/70 border border-blue-900/30 hover:border-blue-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
              {t('quick_action_upload')}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Extract NPK, pH, EC from Soil Health Cards, lab reports, or crop insurance policies.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-blue-400 pt-1">
            <span>Upload Document</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Advisories & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Advisories */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white text-base">
                {t('recent_advisories_title')}
              </h3>
            </div>
            <Link to="/history" className="text-xs font-medium text-emerald-400 hover:underline">
              View All
            </Link>
          </div>

          {stats?.recentAdvisories && stats.recentAdvisories.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAdvisories.map((advisory) => (
                <Link
                  key={advisory.id}
                  to={`/history?id=${advisory.id}`}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-start justify-between gap-4 block group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {advisory.title}
                      </span>
                      {advisory.is_sample && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {advisory.structured_report?.summary}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {advisory.crop_name && <span>Crop: {advisory.crop_name}</span>}
                      <span>{new Date(advisory.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getRiskBadge(advisory.structured_report?.riskLevel || 'moderate')}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
              <Sprout className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                No advisory requests yet. Ask a question about your crop, disease symptoms, or fertilizer scheduling.
              </p>
              <Link
                to="/advisory"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Advisory</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right: Recent Agricultural Documents */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-white text-base">
                {t('recent_documents_title')}
              </h3>
            </div>
            <Link to="/documents" className="text-xs font-medium text-blue-400 hover:underline">
              View All
            </Link>
          </div>

          {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc: any) => {
                const categoryInfo =
                  AGRI_DOCUMENT_LABELS[doc.category as AgriDocumentCategory] ||
                  AGRI_DOCUMENT_LABELS.other;

                return (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-all flex items-center justify-between gap-4 block group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                          {doc.original_name}
                        </span>
                        {doc.is_sample && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {categoryInfo[language] || categoryInfo.en}
                      </p>
                      <span className="text-[11px] text-slate-500 block">
                        Uploaded: {new Date(doc.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          doc.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'processing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                No agricultural documents uploaded yet. Upload a Soil Health Card or fertilizer recommendation.
              </p>
              <Link
                to="/documents/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
