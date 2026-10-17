// ==============================================================================
// AgriSage AI: Farm & Crop Management Page
// ==============================================================================

import React, { useEffect, useState } from 'react';
import {
  Tractor,
  Sprout,
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Layers,
  Droplets,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../lib/apiClient';
import { FarmRecord, CropRecord } from '../shared/types';
import {
  SOIL_TYPES,
  SOIL_TYPE_LABELS,
  IRRIGATION_METHODS,
  IRRIGATION_LABELS,
  WATER_AVAILABILITY,
  GROWTH_STAGES,
  GROWTH_STAGE_LABELS,
  SEASONS,
  SEASON_LABELS,
  INDIAN_CROP_CATALOG,
  INDIAN_LOCATIONS,
} from '../shared/agriculture';

export const FarmsPage: React.FC = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFarmIdForCrop, setSelectedFarmIdForCrop] = useState<string | null>(null);

  // Form states
  const [farmForm, setFarmForm] = useState({
    name: '',
    approximateLocation: '',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    area: 3,
    areaUnit: 'acres',
    soilType: 'black',
    soilPh: '',
    irrigationMethod: 'drip',
    waterAvailability: 'moderate',
    growingSeason: 'kharif',
    notes: '',
  });

  const [cropForm, setCropForm] = useState({
    farmId: '',
    cropName: 'Chilli',
    variety: '',
    sowingDate: new Date().toISOString().split('T')[0],
    growthStage: 'vegetative',
    season: 'kharif',
    irrigationDetails: '',
    fieldObservations: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFarmsAndCrops();
  }, [token]);

  const fetchFarmsAndCrops = async () => {
    try {
      setLoading(true);
      const [farmsRes, cropsRes] = await Promise.all([
        apiClient.get<FarmRecord[]>('/farms', undefined, token),
        apiClient.get<CropRecord[]>('/crops', undefined, token),
      ]);
      setFarms(farmsRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error Loading Data',
        message: err.message || 'Failed to retrieve farms and crops.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        name: farmForm.name,
        approximateLocation: farmForm.approximateLocation || null,
        state: farmForm.state,
        district: farmForm.district,
        area: Number(farmForm.area),
        areaUnit: farmForm.areaUnit,
        soilType: farmForm.soilType,
        soilPh: farmForm.soilPh ? Number(farmForm.soilPh) : null,
        irrigationMethod: farmForm.irrigationMethod,
        waterAvailability: farmForm.waterAvailability,
        growingSeason: farmForm.growingSeason,
        notes: farmForm.notes || null,
      };

      await apiClient.post('/farms', payload, token);
      showToast({
        type: 'success',
        title: 'Farm Added',
        message: `Farm "${farmForm.name}" has been registered successfully.`,
      });
      setFarmModalOpen(false);
      setFarmForm({
        name: '',
        approximateLocation: '',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        area: 3,
        areaUnit: 'acres',
        soilType: 'black',
        soilPh: '',
        irrigationMethod: 'drip',
        waterAvailability: 'moderate',
        growingSeason: 'kharif',
        notes: '',
      });
      fetchFarmsAndCrops();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create farm.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async (farmId: string, farmName: string) => {
    if (!window.confirm(`Are you sure you want to delete farm "${farmName}" and its crops?`)) {
      return;
    }
    try {
      await apiClient.delete(`/farms/${farmId}`, token);
      showToast({
        type: 'info',
        title: 'Farm Deleted',
        message: `Farm "${farmName}" was removed.`,
      });
      fetchFarmsAndCrops();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const targetFarmId = selectedFarmIdForCrop || cropForm.farmId || (farms[0]?.id ?? '');
      if (!targetFarmId) {
        throw new Error('Please select a valid farm first.');
      }

      const payload = {
        farmId: targetFarmId,
        cropName: cropForm.cropName,
        variety: cropForm.variety || null,
        sowingDate: cropForm.sowingDate,
        growthStage: cropForm.growthStage,
        season: cropForm.season,
        irrigationDetails: cropForm.irrigationDetails || null,
        fieldObservations: cropForm.fieldObservations || null,
        status: cropForm.status,
      };

      await apiClient.post('/crops', payload, token);
      showToast({
        type: 'success',
        title: 'Crop Added',
        message: `Crop "${cropForm.cropName}" has been tracked.`,
      });
      setCropModalOpen(false);
      fetchFarmsAndCrops();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Crop Registration Failed',
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCrop = async (cropId: string, cropName: string) => {
    if (!window.confirm(`Are you sure you want to delete crop record "${cropName}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/crops/${cropId}`, token);
      showToast({
        type: 'info',
        title: 'Crop Deleted',
        message: `Crop "${cropName}" removed.`,
      });
      fetchFarmsAndCrops();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message,
      });
    }
  };

  // Distinct Indian states for selector
  const indianStates = Array.from(new Set(INDIAN_LOCATIONS.map((l) => l.state))).sort();
  const districtOptions = INDIAN_LOCATIONS.filter((l) => l.state === farmForm.state).map(
    (l) => l.district
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Tractor className="w-6 h-6 text-emerald-400" />
            <span>{t('nav_farms')}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your agricultural land parcels, soil profiles, and crop cultivation cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFarmModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Farm</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-sm font-medium">Loading your farm profiles...</span>
        </div>
      ) : farms.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto">
            <Tractor className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">No farms added yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Register your farm with soil characteristics and location to unlock localized weather guidance and tailored advisory.
          </p>
          <button
            onClick={() => setFarmModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register Your First Farm</span>
          </button>
        </div>
      ) : (
        /* Farms Grid */
        <div className="space-y-8">
          {farms.map((farm) => {
            const farmCrops = crops.filter((c) => c.farm_id === farm.id);
            const soilLabel = SOIL_TYPE_LABELS[farm.soil_type]?.[language] || farm.soil_type;
            const irrigationLabel =
              IRRIGATION_LABELS[farm.irrigation_method]?.[language] || farm.irrigation_method;

            return (
              <div
                key={farm.id}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-6 shadow-md"
              >
                {/* Farm Summary Top Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white">{farm.name}</h2>
                      {farm.is_sample && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Demo Sample
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {farm.approximate_location ? `${farm.approximate_location}, ` : ''}
                        {farm.district}, {farm.state}
                      </span>
                      <span>•</span>
                      <span>
                        {farm.area} {farm.area_unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFarmIdForCrop(farm.id);
                        setCropModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Crop</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFarm(farm.id, farm.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Farm Agronomic Metadata Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-[11px] text-slate-500 block">Soil Classification</span>
                    <span className="font-semibold text-slate-200 block truncate">{soilLabel}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-[11px] text-slate-500 block">Soil Reaction (pH)</span>
                    <span className="font-semibold text-slate-200 block">
                      {farm.soil_ph !== null && farm.soil_ph !== undefined
                        ? `pH ${farm.soil_ph}`
                        : 'Unknown / Not Tested'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-[11px] text-slate-500 block">Irrigation System</span>
                    <span className="font-semibold text-slate-200 block truncate">
                      {irrigationLabel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-[11px] text-slate-500 block">Water Availability</span>
                    <span className="font-semibold text-slate-200 block capitalize">
                      {farm.water_availability}
                    </span>
                  </div>
                </div>

                {/* Crops in this farm */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Crops Under Cultivation ({farmCrops.length})</span>
                    </h3>
                  </div>

                  {farmCrops.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      No active crops recorded for this farm yet. Click "Add Crop" to record sowing dates and track growth stages.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {farmCrops.map((crop) => {
                        const stageLabel =
                          GROWTH_STAGE_LABELS[crop.growth_stage]?.[language] || crop.growth_stage;

                        return (
                          <div
                            key={crop.id}
                            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {crop.crop_name}
                                </span>
                                {crop.variety && (
                                  <span className="text-xs text-slate-400 font-medium">
                                    ({crop.variety})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-emerald-400">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20">
                                  {stageLabel}
                                </span>
                                <span className="text-slate-400 text-[11px] capitalize">
                                  {crop.season} season
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                <span>Sown: {crop.sowing_date}</span>
                              </div>

                              {crop.field_observations && (
                                <p className="text-xs text-slate-400 line-clamp-1 italic pt-1">
                                  "{crop.field_observations}"
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteCrop(crop.id, crop.crop_name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Crop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Farm Creation Modal */}
      {/* ---------------------------------------------------------------------- */}
      {farmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tractor className="w-5 h-5 text-emerald-400" />
                <span>Register Farm Land</span>
              </h3>
              <button
                onClick={() => setFarmModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Farm Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Acres North Field"
                  value={farmForm.name}
                  onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">State *</label>
                  <select
                    value={farmForm.state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      const dists = INDIAN_LOCATIONS.filter((l) => l.state === newState).map(
                        (l) => l.district
                      );
                      setFarmForm({
                        ...farmForm,
                        state: newState,
                        district: dists[0] || '',
                      });
                    }}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {indianStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={farmForm.district}
                    onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}
                    placeholder="District name"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Area *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={farmForm.area}
                    onChange={(e) => setFarmForm({ ...farmForm, area: parseFloat(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <select
                    value={farmForm.areaUnit}
                    onChange={(e) => setFarmForm({ ...farmForm, areaUnit: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                    <option value="guntha">Guntha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Soil Type</label>
                  <select
                    value={farmForm.soilType}
                    onChange={(e) => setFarmForm({ ...farmForm, soilType: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SOIL_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {SOIL_TYPE_LABELS[st]?.[language] || st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Soil pH (Leave blank if unknown)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="2"
                    max="12"
                    placeholder="e.g. 7.2"
                    value={farmForm.soilPh}
                    onChange={(e) => setFarmForm({ ...farmForm, soilPh: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Irrigation Method
                  </label>
                  <select
                    value={farmForm.irrigationMethod}
                    onChange={(e) => setFarmForm({ ...farmForm, irrigationMethod: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {IRRIGATION_METHODS.map((im) => (
                      <option key={im} value={im}>
                        {IRRIGATION_LABELS[im]?.[language] || im}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Water Availability
                  </label>
                  <select
                    value={farmForm.waterAvailability}
                    onChange={(e) => setFarmForm({ ...farmForm, waterAvailability: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {WATER_AVAILABILITY.map((wa) => (
                      <option key={wa} value={wa}>
                        {wa.charAt(0).toUpperCase() + wa.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setFarmModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Crop Creation Modal */}
      {/* ---------------------------------------------------------------------- */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-400" />
                <span>Record New Crop</span>
              </h3>
              <button
                onClick={() => setCropModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCrop} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Associate Farm *
                </label>
                <select
                  value={selectedFarmIdForCrop || cropForm.farmId || farms[0]?.id || ''}
                  onChange={(e) => {
                    setSelectedFarmIdForCrop(e.target.value);
                    setCropForm({ ...cropForm, farmId: e.target.value });
                  }}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district}, {f.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Select Crop *
                  </label>
                  <input
                    list="cropCatalogueList"
                    required
                    value={cropForm.cropName}
                    onChange={(e) => setCropForm({ ...cropForm, cropName: e.target.value })}
                    placeholder="e.g. Chilli, Rice, Cotton"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="cropCatalogueList">
                    {INDIAN_CROP_CATALOG.map((c) => (
                      <option key={c.name} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Variety (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Teja, BPT 5204"
                    value={cropForm.variety}
                    onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sowing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={cropForm.sowingDate}
                    onChange={(e) => setCropForm({ ...cropForm, sowingDate: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Growth Stage *
                  </label>
                  <select
                    value={cropForm.growthStage}
                    onChange={(e) => setCropForm({ ...cropForm, growthStage: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {GROWTH_STAGES.map((gs) => (
                      <option key={gs} value={gs}>
                        {GROWTH_STAGE_LABELS[gs]?.[language] || gs}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Field Observations (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Good seedling emergence, light yellowing on edge leaves"
                  value={cropForm.fieldObservations}
                  onChange={(e) => setCropForm({ ...cropForm, fieldObservations: e.target.value })}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Record Crop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
