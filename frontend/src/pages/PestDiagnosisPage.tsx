// ==============================================================================
// AgriSage AI: Pest & Crop Disease Doctor (Multimodal Visual Diagnosis)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Bug,
  Camera,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Printer,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import { FarmRecord, CropRecord, AdvisoryRecord } from '../shared/types';
import { INDIAN_CROP_CATALOG } from '../shared/agriculture';

export const PestDiagnosisPage: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // Form State
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [cropName, setCropName] = useState('Chilli');
  const [userDescription, setUserDescription] = useState('');
  const [durationSpread, setDurationSpread] = useState('');
  const [affectedParts, setAffectedParts] = useState<string[]>(['leaves']);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [diagLanguage, setDiagLanguage] = useState<'en' | 'te' | 'hi'>(language);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<AdvisoryRecord | null>(null);

  useEffect(() => {
    fetchContext();
  }, [token]);

  const fetchContext = async () => {
    try {
      setLoadingContext(true);
      const [fRes, cRes] = await Promise.all([
        apiClient.get<FarmRecord[]>('/farms', undefined, token),
        apiClient.get<CropRecord[]>('/crops', undefined, token),
      ]);
      setFarms(fRes.data || []);
      setCrops(cRes.data || []);
      if (fRes.data && fRes.data.length > 0) setSelectedFarmId(fRes.data[0].id);
      if (cRes.data && cRes.data.length > 0) setSelectedCropId(cRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        showToast({
          type: 'error',
          title: 'Invalid File',
          message: 'Please upload a photo of the affected plant (JPEG, PNG, or WebP).',
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const togglePart = (part: string) => {
    if (affectedParts.includes(part)) {
      setAffectedParts(affectedParts.filter((p) => p !== part));
    } else {
      setAffectedParts([...affectedParts, part]);
    }
  };

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDescription.trim() || userDescription.length < 8) {
      showToast({
        type: 'warning',
        title: 'Description Needed',
        message: 'Please describe the symptoms (e.g. leaf spots, yellowing, curled edges).',
      });
      return;
    }

    try {
      setAnalyzing(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }
      if (selectedFarmId) formData.append('farmId', selectedFarmId);
      if (selectedCropId) formData.append('cropId', selectedCropId);
      formData.append('cropName', cropName);
      formData.append('userDescription', userDescription);
      formData.append('durationSpread', durationSpread || 'Noticed recently');
      formData.append('affectedPlantParts', JSON.stringify(affectedParts));
      formData.append('language', diagLanguage);

      const res = await apiClient.upload<AdvisoryRecord>('/advisory/diagnose', formData, token);

      if (res.data) {
        setReport(res.data);
        showToast({
          type: 'success',
          title: 'Diagnosis Complete',
          message: 'Differential diagnosis and safe biological management compiled.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Diagnosis Failed',
        message: err.message || 'Could not analyze crop photo and symptoms.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const plantPartOptions = [
    { id: 'leaves', label: 'Leaves (ఆకులు / पत्तियां)' },
    { id: 'stem', label: 'Stem / Branch (కాండం / तना)' },
    { id: 'roots', label: 'Roots / Collar (వేర్లు / जड़ें)' },
    { id: 'flowers', label: 'Flowers / Buds (పూత / फूल)' },
    { id: 'fruit_grain', label: 'Fruit / Grain (కాయ / फल)' },
    { id: 'whole_plant', label: 'Whole Plant (మొత్తం మొక్క / पूरा पौधा)' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Bug className="w-6 h-6 text-amber-400" />
          <span>{t('nav_diagnosis')}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Differential disease identification and pest management. Upload a crop photograph for multimodal vision analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleDiagnose}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-5 shadow-md"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Symptom & Photo Inspection</span>
            </h2>

            {/* Photo Upload Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Crop Photograph (Optional but Recommended)
              </label>

              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Uploaded plant symptom"
                    className="max-h-full max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/90 text-rose-400 hover:bg-slate-900 border border-slate-700"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl bg-slate-950/60 cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Click to capture or upload crop photo
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    JPEG, PNG, WebP up to 10MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Crop Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Crop Name *
                </label>
                <input
                  list="diagnosisCropList"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Chilli, Cotton, Tomato"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <datalist id="diagnosisCropList">
                  {INDIAN_CROP_CATALOG.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Associate Farm
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">No specific farm</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Affected Plant Parts Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Affected Plant Parts *
              </label>
              <div className="flex flex-wrap gap-2">
                {plantPartOptions.map((opt) => {
                  const selected = affectedParts.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => togglePart(opt.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration and Spread */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duration & Extent of Spread
              </label>
              <input
                type="text"
                placeholder="e.g. Noticed 3 days ago, spreading in 15% of northern rows"
                value={durationSpread}
                onChange={(e) => setDurationSpread(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Symptom Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Describe Visible Symptoms *
              </label>
              <textarea
                rows={4}
                required
                placeholder="e.g. Leaves curling upwards into boat shape, slight silvering on underside, premature flower dropping."
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['en', 'te', 'hi'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setDiagLanguage(l)}
                    className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      diagLanguage === l
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Diagnosing Symptoms & Photo...</span>
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4 text-slate-950" />
                  <span>Run Disease Diagnosis</span>
                </>
              )}
            </button>
          </form>

          {/* Safety Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Plant Pathology Safety Principle</span>
            </span>
            <p className="leading-relaxed">
              Never apply unverified chemical mixtures. When in doubt, bring affected leaf samples in a sealed polybag to your local Krishi Vigyan Kendra (KVK).
            </p>
          </div>
        </div>

        {/* Diagnostic Report Column (7 cols) */}
        <div className="lg:col-span-7">
          {analyzing ? (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
              <h3 className="font-semibold text-white text-base">
                Inspecting Visual Lesions & Symptom Patterns...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Gemini 3.8 Flash is analyzing plant morphology, chlorosis distribution, and pest damage vectors.
              </p>
            </div>
          ) : report ? (
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Diagnosis Report
                    </span>
                    {report.is_sample && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-medium">
                        Demo Sample
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{report.title}</h2>
                  <span className="text-xs text-slate-400 block">
                    Analyzed: {new Date(report.created_at).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>

              {/* Photo preview if attached */}
              {report.image_url && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 max-h-56 flex items-center justify-center">
                  <img
                    src={report.image_url}
                    alt="Diagnosed crop visual"
                    className="max-h-52 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Diagnosis Summary
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {report.structured_report.summary}
                </p>
              </div>

              {/* Differential Diagnosis Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Differential Diagnosis (Probable Causes)
                </h3>
                <div className="space-y-2.5">
                  {report.structured_report.possibleExplanations.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{exp.cause}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                            exp.probability === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : exp.probability === 'moderate'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {exp.probability} probability
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{exp.description}</p>
                      {exp.distinguishingFactors && (
                        <div className="text-[11px] text-amber-400 font-medium">
                          Distinctive Indicator: {exp.distinguishingFactors}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Biological & Cultural Controls */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Immediate Safe Next Steps (IPM & Biological Control)</span>
                </h3>
                <ul className="space-y-2">
                  {report.structured_report.immediateNextSteps.map((step, idx) => (
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

              {/* Preventive Measures */}
              {report.structured_report.preventiveMeasures?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Preventive Agronomic Measures
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                    {report.structured_report.preventiveMeasures.map((prev, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {prev}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* When to Consult Expert */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-1.5">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>When to Consult Local KVK Agronomist</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.structured_report.whenToConsultExpert}
                </p>
              </div>

              {/* Uncertainty Reasons */}
              {report.structured_report.uncertaintyReasons?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">
                    Diagnostic Limitations & Uncertainty Factors:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {report.structured_report.uncertaintyReasons.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 italic">
                {report.structured_report.disclaimer}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 p-12 text-center space-y-3">
              <Bug className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-semibold text-white text-base">
                Ready for Disease & Pest Inspection
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Take a clear close-up photo of curled leaves, insect damage, or spots. Our multimodal vision assistant will evaluate likely causes and safe remedies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
