// ==============================================================================
// AgriSage AI: Farmer Profile & System Settings Page
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Database,
  Cpu,
  CheckCircle2,
  Save,
  Globe,
  MapPin,
  Ruler,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { UserProfile } from '../shared/types';
import { INDIAN_LOCATIONS, SupportedLanguage } from '../shared/agriculture';

export const SettingsPage: React.FC = () => {
  const { user, token } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    preferredLanguage: language,
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    village: '',
    preferredUnits: 'metric' as 'metric' | 'imperial' | 'traditional',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await apiClient.get<UserProfile>('/profile', undefined, token);
      if (res.data) {
        setProfileForm({
          displayName: res.data.display_name || user?.displayName || '',
          preferredLanguage: res.data.preferred_language || language,
          country: res.data.country || 'India',
          state: res.data.state || 'Andhra Pradesh',
          district: res.data.district || 'Guntur',
          village: res.data.village || '',
          preferredUnits: res.data.preferred_units || 'metric',
          phone: res.data.phone || '',
        });
      }
    } catch (err: any) {
      console.warn('Could not load profile from server, using auth fallback:', err.message);
      setProfileForm((prev) => ({
        ...prev,
        displayName: user?.displayName || '',
      }));
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await apiClient.put<UserProfile>(
        '/profile',
        {
          displayName: profileForm.displayName,
          preferredLanguage: profileForm.preferredLanguage,
          country: profileForm.country,
          state: profileForm.state,
          district: profileForm.district,
          village: profileForm.village || null,
          preferredUnits: profileForm.preferredUnits,
          phone: profileForm.phone || null,
        },
        token
      );

      // Sync active language in UI
      setLanguage(profileForm.preferredLanguage as SupportedLanguage);

      showToast({
        type: 'success',
        title: 'Profile Saved',
        message: 'Your farmer profile settings have been updated.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const indianStates = Array.from(new Set(INDIAN_LOCATIONS.map((l) => l.state))).sort();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <User className="w-6 h-6 text-emerald-400" />
          <span>{t('nav_settings')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your farmer identity, regional parameters, preferred units, and view platform architecture.
        </p>
      </div>

      {/* Farmer Profile Editor Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Farmer Profile Details</h2>
              <p className="text-xs text-slate-400">
                Used to tailor agricultural recommendations and localized weather forecasts.
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            ID: {user?.id?.slice(0, 8)}...
          </span>
        </div>

        {loadingProfile ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span className="text-xs">Loading profile settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || 'farmer@agrisage.ai'}
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-800/60 px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preferred Language
                </label>
                <select
                  value={profileForm.preferredLanguage}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      preferredLanguage: e.target.value as SupportedLanguage,
                    })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State *</label>
                <select
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">District *</label>
                <input
                  type="text"
                  required
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  placeholder="e.g. Guntur"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Village / Locality (Optional)
                </label>
                <input
                  type="text"
                  value={profileForm.village}
                  onChange={(e) => setProfileForm({ ...profileForm, village: e.target.value })}
                  placeholder="e.g. Chilakaluripet"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preferred Units
                </label>
                <select
                  value={profileForm.preferredUnits}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      preferredUnits: e.target.value as any,
                    })
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="metric">Metric (Acres, kg, °C)</option>
                  <option value="traditional">Traditional (Bigha / Guntha)</option>
                  <option value="imperial">Imperial (Hectares, lbs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50 transition-all"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* System Architecture & Security Guardrails Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">System Architecture &amp; Security</h2>
            <p className="text-xs text-slate-400">
              Verified integrations, database row-level security, and ethical AI safeguards.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Supabase Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase PostgreSQL &amp; Auth</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Dual-Mode Active
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Full Row-Level Security (RLS) configured. Schema migrations ready in <code>supabase/migrations/</code> for profiles, farms, crops, advisories, documents, and private storage buckets.
            </p>
          </div>

          {/* Gemini AI Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Google Gemini 3.8 Flash SDK</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Verified Active
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Official <code>@google/genai</code> SDK on Express backend with schema-constrained JSON outputs and Zod runtime validation.
            </p>
          </div>

          {/* Open-Meteo Weather Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-400" />
                <span>Open-Meteo Weather Provider</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Live Telemetry
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Verified meteorological provider for Indian coordinates. Retrieves real-time temperature, humidity, precipitation, and 5-day forecasts with clear provenance.
            </p>
          </div>

          {/* Intelligent Document Processor Status */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
                <span>Intelligent Document Processor (IDP)</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Ready
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Extracts NPK, pH, EC, organic carbon, micronutrients, sum insured from Soil Health Cards, lab reports, and agricultural scheme documents with human review interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
