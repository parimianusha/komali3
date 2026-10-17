// ==============================================================================
// AgriSage AI: Crop Selection & Agro-Climatic Suitability Wizard
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Tractor,
  Sprout,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import { FarmRecord, CropSuitabilityReport } from '../shared/types';
import {
  SOIL_TYPES,
  SOIL_TYPE_LABELS,
  IRRIGATION_METHODS,
  IRRIGATION_LABELS,
  WATER_AVAILABILITY,
  SEASONS,
  SEASON_LABELS,
  INDIAN_LOCATIONS,
} from '../shared/agriculture';

export const CropSuitabilityPage: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');

  // Form State
  const [form, setForm] = useState({
    state: 'Andhra Pradesh',
    district: 'Guntur',
    season: 'kharif',
    soilType: 'black',
    soilPh: '',
    irrigationMethod: 'drip',
    waterAvailability: 'moderate',
    area: 4,
    farmerPreferences: '',
  });

  const [evaluating, setEvaluating] = useState(false);
  const [report, setReport] = useState<CropSuitabilityReport | null>(null);

  useEffect(() => {
    fetchFarms();
  }, [token]);

  const fetchFarms = async () => {
    try {
      const res = await apiClient.get<FarmRecord[]>('/farms', undefined, token);
      if (res.data && res.data.length > 0) {
        setFarms(res.data);
        const f0 = res.data[0];
        setSelectedFarmId(f0.id);
        setForm((prev) => ({
          ...prev,
          state: f0.state,
          district: f0.district,
          soilType: f0.soil_type,
          soilPh: f0.soil_ph ? String(f0.soil_ph) : '',
          irrigationMethod: f0.irrigation_method,
          waterAvailability: f0.water_availability,
          area: f0.area,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFarmSelect = (farmId: string) => {
    setSelectedFarmId(farmId);
    const f = farms.find((item) => item.id === farmId);
    if (f) {
      setForm((prev) => ({
        ...prev,
        state: f.state,
        district: f.district,
        soilType: f.soil_type,
        soilPh: f.soil_ph ? String(f.soil_ph) : '',
        irrigationMethod: f.irrigation_method,
        waterAvailability: f.water_availability,
        area: f.area,
      }));
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setEvaluating(true);
      const payload: any = {
        farmId: selectedFarmId || null,
        state: form.state,
        district: form.district,
        season: form.season,
        soilType: form.soilType,
        soilPh: form.soilPh ? Number(form.soilPh) : null,
        irrigationMethod: form.irrigationMethod,
        waterAvailability: form.waterAvailability,
        area: Number(form.area),
        farmerPreferences: form.farmerPreferences || null,
        language,
      };

      const res = await apiClient.post<any>('/advisory/crop-suitability', payload, token);

      if (res.data?.suitabilityReport) {
        setReport(res.data.suitabilityReport);
        showToast({
          type: 'success',
          title: 'Evaluation Complete',
          message: 'Crop recommendations tailored to your soil and water profile.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Evaluation Failed',
        message: err.message || 'Could not evaluate crop options.',
      });
    } finally {
      setEvaluating(false);
    }
  };

  const indianStates = Array.from(new Set(INDIAN_LOCATIONS.map((l) => l.state))).sort();

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-teal-400" />
          <span>{t('nav_suitability')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Evaluate high-performing Indian crops matched to your district agro-climatic zone, soil pH, irrigation infrastructure, and water availability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Wizard Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleEvaluate}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4 shadow-md"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Tractor className="w-4 h-4 text-teal-400" />
              <span>Cultivation Parameters</span>
            </h2>

            {/* Farm autofill picker */}
            {farms.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Load Parameters From Farm
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => handleFarmSelect(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="">Custom parameters</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district}, {f.state})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* State & District */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
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
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Season & Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Planned Season *
                </label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {SEASON_LABELS[s]?.[language] || s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Area (Acres)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: parseFloat(e.target.value) })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Soil Type & pH */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Soil Type</label>
                <select
                  value={form.soilType}
                  onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {SOIL_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {SOIL_TYPE_LABELS[st]?.[language] || st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Soil pH (if known)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 7.2"
                  value={form.soilPh}
                  onChange={(e) => setForm({ ...form, soilPh: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Irrigation & Water Availability */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Irrigation Method
                </label>
                <select
                  value={form.irrigationMethod}
                  onChange={(e) => setForm({ ...form, irrigationMethod: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {IRRIGATION_METHODS.map((im) => (
                    <option key={im} value={im}>
                      {IRRIGATION_LABELS[im]?.[language] || im}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Water Availability
                </label>
                <select
                  value={form.waterAvailability}
                  onChange={(e) => setForm({ ...form, waterAvailability: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {WATER_AVAILABILITY.map((wa) => (
                    <option key={wa} value={wa}>
                      {wa.charAt(0).toUpperCase() + wa.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Farmer Preferences & Market Goal (optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Interested in high-value spices, pulses for soil regeneration, or organic cultivation."
                value={form.farmerPreferences}
                onChange={(e) => setForm({ ...form, farmerPreferences: e.target.value })}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {evaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Agro-Ecological Models...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  <span>Recommend Suitable Crops</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column (7 cols) */}
        <div className="lg:col-span-7">
          {evaluating ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto" />
              <h3 className="font-semibold text-white text-base">
                Running Crop Suitability Reasoning...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Analyzing district rainfall patterns, soil water-retention capacity, and ICAR seasonal sowing calendars.
              </p>
            </div>
          ) : report ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">
                  Agro-Climatic Suitability Report
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Recommended Crops for {form.district}, {form.state} ({form.season.toUpperCase()})
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {report.generalObservations}
                </p>
              </div>

              {/* Ranked Crop Options */}
              <div className="space-y-4">
                {report.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-bold text-white text-base">{opt.cropName}</h3>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30 text-xs font-bold">
                        <span>{opt.suitabilityScore}% Match</span>
                      </div>
                    </div>

                    {/* Suitability Reasons */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Why this crop is suitable:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-300">
                        {opt.suitabilityReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Constraints & Considerations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="font-semibold text-amber-400 block">Key Constraints:</span>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          {opt.relevantConstraints.join(', ')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="font-semibold text-emerald-400 block">Agronomic Tips:</span>
                        <p className="text-slate-400 leading-relaxed text-[11px]">
                          {opt.cultivationConsiderations.join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Verification Steps */}
                    {opt.suggestedVerificationSteps?.length > 0 && (
                      <div className="text-[11px] text-slate-400 pt-1">
                        <span className="font-semibold text-slate-300">Recommended Next Step: </span>
                        <span>{opt.suggestedVerificationSteps.join(' • ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Water & Soil Assessment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <span className="font-bold text-teal-300 block">Soil Compatibility Assessment</span>
                  <p className="text-slate-400 leading-relaxed">{report.soilConditionSummary}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-300 block">Water Budget Assessment</span>
                  <p className="text-slate-400 leading-relaxed">{report.waterBudgetAssessment}</p>
                </div>
              </div>

              {/* Action Plan */}
              {report.suggestedActionPlan?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Suggested Preparation Action Plan
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {report.suggestedActionPlan.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Factual Transparency Disclaimer */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 italic">
                {report.disclaimer}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-semibold text-white text-base">
                Discover Optimal Crops for Your Land
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Configure your state, district, season, and irrigation method. AgriSage AI evaluates regional agronomic models to recommend suitable options.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
