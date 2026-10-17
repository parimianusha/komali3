// ==============================================================================
// AgriSage AI: Resilient Farm, Crop, Advisory & Profile Repository
// Dual-mode: Direct Supabase PostgreSQL + Graceful Local Fallback
// ==============================================================================

import {
  UserProfile,
  FarmRecord,
  CropRecord,
  AdvisoryRecord,
  AgriDashboardStats,
  StructuredAdvisoryReport,
} from '../../shared/types/index.js';
import { supabaseAdmin, isLiveSupabaseConfigured } from '../../config/supabase.js';
import { weatherService } from '../weather/weatherService.js';
import { randomUUID } from 'crypto';

interface MemoryState {
  profiles: Map<string, UserProfile>;
  farms: Map<string, FarmRecord>;
  crops: Map<string, CropRecord>;
  advisories: Map<string, AdvisoryRecord>;
}

const memoryDb: MemoryState = {
  profiles: new Map(),
  farms: new Map(),
  crops: new Map(),
  advisories: new Map(),
};

export class AgriStore {
  // --------------------------------------------------------------------------
  // Profile Operations
  // --------------------------------------------------------------------------

  async getProfile(userId: string): Promise<UserProfile> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            display_name: data.display_name,
            preferred_language: data.preferred_language || 'en',
            country: data.country || 'India',
            state: data.state || null,
            district: data.district || null,
            village: data.village || null,
            preferred_units: data.preferred_units || 'metric',
            phone: data.phone || null,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err: any) {
        // Fallback to memory
      }
    }

    let existing = memoryDb.profiles.get(userId);
    if (!existing) {
      existing = {
        id: userId,
        display_name: 'Farmer Partner',
        preferred_language: 'en',
        country: 'India',
        state: 'Andhra Pradesh',
        district: 'Guntur',
        village: 'Chilakaluripet',
        preferred_units: 'metric',
        phone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryDb.profiles.set(userId, existing);
    }
    return existing;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const now = new Date().toISOString();

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            display_name: updates.display_name,
            preferred_language: updates.preferred_language,
            country: updates.country || 'India',
            state: updates.state,
            district: updates.district,
            village: updates.village,
            preferred_units: updates.preferred_units,
            phone: updates.phone,
            updated_at: now,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            display_name: data.display_name,
            preferred_language: data.preferred_language || 'en',
            country: data.country || 'India',
            state: data.state || null,
            district: data.district || null,
            village: data.village || null,
            preferred_units: data.preferred_units || 'metric',
            phone: data.phone || null,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    const current = await this.getProfile(userId);
    const updated: UserProfile = {
      ...current,
      ...updates,
      updated_at: now,
    };
    memoryDb.profiles.set(userId, updated);
    return updated;
  }

  // --------------------------------------------------------------------------
  // Farm Operations
  // --------------------------------------------------------------------------

  async listFarms(ownerId: string): Promise<FarmRecord[]> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('farms')
          .select('*, crops(count)')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((f: any) => ({
            ...f,
            crop_count: f.crops?.[0]?.count ?? 0,
          }));
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    // Memory DB filter
    const userFarms = Array.from(memoryDb.farms.values())
      .filter((f) => f.owner_id === ownerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return userFarms.map((f) => {
      const cropCount = Array.from(memoryDb.crops.values()).filter((c) => c.farm_id === f.id).length;
      return { ...f, crop_count: cropCount };
    });
  }

  async getFarm(id: string, ownerId: string): Promise<FarmRecord | null> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('farms')
          .select('*')
          .eq('id', id)
          .eq('owner_id', ownerId)
          .single();

        if (!error && data) {
          const cropCount = await this.countCropsForFarm(id);
          return { ...data, crop_count: cropCount };
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    const farm = memoryDb.farms.get(id);
    if (!farm || farm.owner_id !== ownerId) return null;
    const cropCount = Array.from(memoryDb.crops.values()).filter((c) => c.farm_id === id).length;
    return { ...farm, crop_count: cropCount };
  }

  async createFarm(data: Omit<FarmRecord, 'id' | 'created_at' | 'updated_at'>): Promise<FarmRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newRecord: FarmRecord = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
      crop_count: 0,
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbRecord, error } = await supabaseAdmin
          .from('farms')
          .insert({
            id: newRecord.id,
            owner_id: newRecord.owner_id,
            name: newRecord.name,
            approximate_location: newRecord.approximate_location || null,
            state: newRecord.state,
            district: newRecord.district,
            area: newRecord.area,
            area_unit: newRecord.area_unit,
            soil_type: newRecord.soil_type,
            soil_ph: newRecord.soil_ph ?? null,
            organic_carbon: newRecord.organic_carbon || null,
            nitrogen_status: newRecord.nitrogen_status || 'unknown',
            phosphorus_status: newRecord.phosphorus_status || 'unknown',
            potassium_status: newRecord.potassium_status || 'unknown',
            irrigation_method: newRecord.irrigation_method,
            water_availability: newRecord.water_availability,
            growing_season: newRecord.growing_season,
            notes: newRecord.notes || null,
            is_sample: newRecord.is_sample,
          })
          .select()
          .single();

        if (!error && dbRecord) {
          return { ...dbRecord, crop_count: 0 };
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    memoryDb.farms.set(id, newRecord);
    return newRecord;
  }

  async updateFarm(id: string, ownerId: string, updates: Partial<FarmRecord>): Promise<FarmRecord | null> {
    const existing = await this.getFarm(id, ownerId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: FarmRecord = {
      ...existing,
      ...updates,
      id,
      owner_id: ownerId,
      updated_at: now,
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbRecord, error } = await supabaseAdmin
          .from('farms')
          .update({
            name: updated.name,
            approximate_location: updated.approximate_location,
            state: updated.state,
            district: updated.district,
            area: updated.area,
            area_unit: updated.area_unit,
            soil_type: updated.soil_type,
            soil_ph: updated.soil_ph,
            organic_carbon: updated.organic_carbon,
            nitrogen_status: updated.nitrogen_status,
            phosphorus_status: updated.phosphorus_status,
            potassium_status: updated.potassium_status,
            irrigation_method: updated.irrigation_method,
            water_availability: updated.water_availability,
            growing_season: updated.growing_season,
            notes: updated.notes,
            updated_at: now,
          })
          .eq('id', id)
          .eq('owner_id', ownerId)
          .select()
          .single();

        if (!error && dbRecord) {
          return { ...dbRecord, crop_count: existing.crop_count };
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    memoryDb.farms.set(id, updated);
    return updated;
  }

  async deleteFarm(id: string, ownerId: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('farms')
          .delete()
          .eq('id', id)
          .eq('owner_id', ownerId);

        if (!error) return true;
      } catch (err) {
        // Fallback to memory
      }
    }

    const farm = memoryDb.farms.get(id);
    if (!farm || farm.owner_id !== ownerId) return false;

    // Cascade delete crops belonging to farm
    for (const [cropId, crop] of memoryDb.crops.entries()) {
      if (crop.farm_id === id) {
        memoryDb.crops.delete(cropId);
      }
    }

    return memoryDb.farms.delete(id);
  }

  private async countCropsForFarm(farmId: string): Promise<number> {
    if (isLiveSupabaseConfigured) {
      try {
        const { count, error } = await supabaseAdmin
          .from('crops')
          .select('*', { count: 'exact', head: true })
          .eq('farm_id', farmId);
        if (!error && count !== null) return count;
      } catch (err) {
        // Fallback
      }
    }
    return Array.from(memoryDb.crops.values()).filter((c) => c.farm_id === farmId).length;
  }

  // --------------------------------------------------------------------------
  // Crop Operations
  // --------------------------------------------------------------------------

  async listCrops(ownerId: string, farmId?: string): Promise<CropRecord[]> {
    if (isLiveSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('crops')
          .select('*, farms(name)')
          .eq('owner_id', ownerId);

        if (farmId) {
          query = query.eq('farm_id', farmId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((c: any) => ({
            ...c,
            farm_name: c.farms?.name || 'Assigned Farm',
          }));
        }
      } catch (err) {
        // Fallback
      }
    }

    let crops = Array.from(memoryDb.crops.values()).filter((c) => c.owner_id === ownerId);
    if (farmId) {
      crops = crops.filter((c) => c.farm_id === farmId);
    }

    return crops
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((c) => {
        const farm = memoryDb.farms.get(c.farm_id);
        return {
          ...c,
          farm_name: farm?.name || 'Assigned Farm',
        };
      });
  }

  async getCrop(id: string, ownerId: string): Promise<CropRecord | null> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('crops')
          .select('*, farms(name)')
          .eq('id', id)
          .eq('owner_id', ownerId)
          .single();

        if (!error && data) {
          return {
            ...data,
            farm_name: data.farms?.name || 'Assigned Farm',
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    const crop = memoryDb.crops.get(id);
    if (!crop || crop.owner_id !== ownerId) return null;
    const farm = memoryDb.farms.get(crop.farm_id);
    return {
      ...crop,
      farm_name: farm?.name || 'Assigned Farm',
    };
  }

  async createCrop(data: Omit<CropRecord, 'id' | 'created_at' | 'updated_at'>): Promise<CropRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const farm = await this.getFarm(data.farm_id, data.owner_id);

    const newRecord: CropRecord = {
      ...data,
      id,
      farm_name: farm?.name || 'Assigned Farm',
      created_at: now,
      updated_at: now,
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbRecord, error } = await supabaseAdmin
          .from('crops')
          .insert({
            id: newRecord.id,
            farm_id: newRecord.farm_id,
            owner_id: newRecord.owner_id,
            crop_name: newRecord.crop_name,
            variety: newRecord.variety || null,
            sowing_date: newRecord.sowing_date,
            growth_stage: newRecord.growth_stage,
            season: newRecord.season,
            irrigation_details: newRecord.irrigation_details || null,
            field_observations: newRecord.field_observations || null,
            status: newRecord.status,
            is_sample: newRecord.is_sample,
          })
          .select()
          .single();

        if (!error && dbRecord) {
          return {
            ...dbRecord,
            farm_name: farm?.name || 'Assigned Farm',
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    memoryDb.crops.set(id, newRecord);
    return newRecord;
  }

  async updateCrop(id: string, ownerId: string, updates: Partial<CropRecord>): Promise<CropRecord | null> {
    const existing = await this.getCrop(id, ownerId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: CropRecord = {
      ...existing,
      ...updates,
      id,
      owner_id: ownerId,
      updated_at: now,
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbRecord, error } = await supabaseAdmin
          .from('crops')
          .update({
            crop_name: updated.crop_name,
            variety: updated.variety,
            sowing_date: updated.sowing_date,
            growth_stage: updated.growth_stage,
            season: updated.season,
            irrigation_details: updated.irrigation_details,
            field_observations: updated.field_observations,
            status: updated.status,
            updated_at: now,
          })
          .eq('id', id)
          .eq('owner_id', ownerId)
          .select()
          .single();

        if (!error && dbRecord) {
          return {
            ...dbRecord,
            farm_name: existing.farm_name,
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    memoryDb.crops.set(id, updated);
    return updated;
  }

  async deleteCrop(id: string, ownerId: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('crops')
          .delete()
          .eq('id', id)
          .eq('owner_id', ownerId);

        if (!error) return true;
      } catch (err) {
        // Fallback
      }
    }

    const crop = memoryDb.crops.get(id);
    if (!crop || crop.owner_id !== ownerId) return false;
    return memoryDb.crops.delete(id);
  }

  // --------------------------------------------------------------------------
  // Advisory Operations
  // --------------------------------------------------------------------------

  async listAdvisories(
    ownerId: string,
    filters?: { category?: string; farmId?: string; cropId?: string; search?: string }
  ): Promise<AdvisoryRecord[]> {
    if (isLiveSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('advisories')
          .select('*, farms(name), crops(crop_name)')
          .eq('owner_id', ownerId);

        if (filters?.category) {
          query = query.eq('category', filters.category);
        }
        if (filters?.farmId) {
          query = query.eq('farm_id', filters.farmId);
        }
        if (filters?.cropId) {
          query = query.eq('crop_id', filters.cropId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          let list = data.map((a: any) => ({
            ...a,
            farm_name: a.farms?.name || null,
            crop_name: a.crops?.crop_name || null,
          }));

          if (filters?.search) {
            const s = filters.search.toLowerCase();
            list = list.filter(
              (a) =>
                a.title.toLowerCase().includes(s) ||
                a.user_description.toLowerCase().includes(s) ||
                a.structured_report?.summary?.toLowerCase().includes(s)
            );
          }
          return list;
        }
      } catch (err) {
        // Fallback
      }
    }

    let advisories = Array.from(memoryDb.advisories.values()).filter((a) => a.owner_id === ownerId);

    if (filters?.category) {
      advisories = advisories.filter((a) => a.category === filters.category);
    }
    if (filters?.farmId) {
      advisories = advisories.filter((a) => a.farm_id === filters.farmId);
    }
    if (filters?.cropId) {
      advisories = advisories.filter((a) => a.crop_id === filters.cropId);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      advisories = advisories.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          a.user_description.toLowerCase().includes(s) ||
          a.structured_report?.summary?.toLowerCase().includes(s)
      );
    }

    return advisories.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getAdvisory(id: string, ownerId: string): Promise<AdvisoryRecord | null> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('advisories')
          .select('*, farms(name), crops(crop_name)')
          .eq('id', id)
          .eq('owner_id', ownerId)
          .single();

        if (!error && data) {
          return {
            ...data,
            farm_name: data.farms?.name || null,
            crop_name: data.crops?.crop_name || null,
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    const item = memoryDb.advisories.get(id);
    if (!item || item.owner_id !== ownerId) return null;
    return item;
  }

  async createAdvisory(data: Omit<AdvisoryRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AdvisoryRecord> {
    const id = randomUUID();
    const now = new Date().toISOString();

    let farmName: string | null = null;
    let cropName: string | null = null;

    if (data.farm_id) {
      const f = await this.getFarm(data.farm_id, data.owner_id);
      farmName = f?.name || null;
    }
    if (data.crop_id) {
      const c = await this.getCrop(data.crop_id, data.owner_id);
      cropName = c?.crop_name || null;
    }

    const newRecord: AdvisoryRecord = {
      ...data,
      id,
      farm_name: farmName,
      crop_name: cropName,
      created_at: now,
      updated_at: now,
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data: dbRecord, error } = await supabaseAdmin
          .from('advisories')
          .insert({
            id: newRecord.id,
            owner_id: newRecord.owner_id,
            farm_id: newRecord.farm_id || null,
            crop_id: newRecord.crop_id || null,
            category: newRecord.category,
            title: newRecord.title,
            user_description: newRecord.user_description,
            affected_plant_parts: newRecord.affected_plant_parts || [],
            duration_spread: newRecord.duration_spread || null,
            image_url: newRecord.image_url || null,
            language: newRecord.language,
            weather_context: newRecord.weather_context || null,
            structured_report: newRecord.structured_report,
            status: newRecord.status,
            is_sample: newRecord.is_sample,
          })
          .select()
          .single();

        if (!error && dbRecord) {
          return {
            ...dbRecord,
            farm_name: farmName,
            crop_name: cropName,
          };
        }
      } catch (err) {
        // Fallback
      }
    }

    memoryDb.advisories.set(id, newRecord);
    return newRecord;
  }

  async deleteAdvisory(id: string, ownerId: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabaseAdmin
          .from('advisories')
          .delete()
          .eq('id', id)
          .eq('owner_id', ownerId);

        if (!error) return true;
      } catch (err) {
        // Fallback
      }
    }

    const adv = memoryDb.advisories.get(id);
    if (!adv || adv.owner_id !== ownerId) return false;
    return memoryDb.advisories.delete(id);
  }

  // --------------------------------------------------------------------------
  // Dashboard & Aggregates
  // --------------------------------------------------------------------------

  async getAgriDashboardStats(ownerId: string): Promise<AgriDashboardStats> {
    const farms = await this.listFarms(ownerId);
    const crops = await this.listCrops(ownerId);
    const advisories = await this.listAdvisories(ownerId);

    const activeCrops = crops.filter((c) => c.status === 'active');
    const primaryFarm = farms.length > 0 ? farms[0] : null;

    let weather = null;
    if (primaryFarm) {
      weather = await weatherService.getWeather({
        state: primaryFarm.state,
        district: primaryFarm.district,
      });
    }

    return {
      totalFarms: farms.length,
      totalActiveCrops: activeCrops.length,
      totalAdvisories: advisories.length,
      totalDocuments: 0, // Augmented by documents controller
      recentAdvisories: advisories.slice(0, 5),
      recentDocuments: [],
      weather,
      primaryFarm,
    };
  }

  // --------------------------------------------------------------------------
  // Sample Data Loader (For College Hackathon Demonstration)
  // --------------------------------------------------------------------------

  async loadDemoData(ownerId: string): Promise<{
    farm: FarmRecord;
    crops: CropRecord[];
    advisory: AdvisoryRecord;
  }> {
    // 1. Create Sample Farm: Krishna Valley Organic Farm
    const farm = await this.createFarm({
      owner_id: ownerId,
      name: 'Krishna Valley Organic Farm (Demo Sample)',
      approximate_location: 'Near NH-16, Chilakaluripet, Guntur Dist',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      area: 4.5,
      area_unit: 'acres',
      soil_type: 'black',
      soil_ph: 7.4,
      organic_carbon: 'Medium (0.65%)',
      nitrogen_status: 'medium',
      phosphorus_status: 'high',
      potassium_status: 'medium',
      irrigation_method: 'drip',
      water_availability: 'moderate',
      growing_season: 'kharif',
      notes: 'Demonstration farm for AgriSage AI hackathon presentation. Practicing drip irrigation and integrated pest management.',
      is_sample: true,
    });

    // 2. Create Sample Crops: Chilli (Teja) & Bt Cotton
    const crop1 = await this.createCrop({
      farm_id: farm.id,
      owner_id: ownerId,
      crop_name: 'Chilli',
      variety: 'Teja (Guntur S4)',
      sowing_date: '2026-07-15',
      growth_stage: 'tillering_flowering',
      season: 'kharif',
      irrigation_details: 'Drip fertigation every 3 days',
      field_observations: 'Good flowering onset, slight leaf curling observed on northern parcel border.',
      status: 'active',
      is_sample: true,
    });

    const crop2 = await this.createCrop({
      farm_id: farm.id,
      owner_id: ownerId,
      crop_name: 'Cotton',
      variety: 'Bt Cotton RCH 659',
      sowing_date: '2026-06-25',
      growth_stage: 'vegetative',
      season: 'kharif',
      irrigation_details: 'Furrow irrigation supplemented with rain',
      field_observations: 'Healthy vegetative growth, 45cm canopy height.',
      status: 'active',
      is_sample: true,
    });

    // 3. Create Sample Advisory: Chilli Leaf Curl / Thrips Diagnosis
    const sampleReport: StructuredAdvisoryReport = {
      summary:
        'Suspected Chilli Thrips (Scirtothrips dorsalis) infestation with upward leaf curling and early silvering on young foliage.',
      understandingOfSituation:
        'The reported symptoms in Chilli (Teja variety) at flowering stage indicate upward curling of tender leaves, marginal chlorosis, and crinkling. This pattern is characteristic of thrips feeding injury in the Andhra Pradesh Guntur region during dry spells.',
      possibleExplanations: [
        {
          cause: 'Chilli Thrips (Scirtothrips dorsalis)',
          probability: 'high',
          description:
            'Nymphs and adults lacerate the tender leaves and suck cell sap, causing upward curling, bronzing/silvering on leaf undersides, and stunted flower buds.',
          distinguishingFactors:
            'Leaves curl upwards into a boat shape. Tiny yellow-brown slender insects visible under 10x lens on lower leaf surface.',
        },
        {
          cause: 'Yellow Mite (Polyphagotarsonemus latus)',
          probability: 'moderate',
          description:
            'Mites feed on lower leaf surface causing downward curling (inverted boat shape) and thickening of leaves.',
          distinguishingFactors:
            'Curling is strictly downward with brittle petiole elongation, unlike upward thrips curling.',
        },
        {
          cause: 'Chilli Leaf Curl Begomovirus (ChiLCV)',
          probability: 'low',
          description:
            'Viral disease transmitted by whiteflies leading to severe puckering, shortening of internodes, and stunted bushiness.',
          distinguishingFactors:
            'Accompanied by vein thickening and extreme plant stunting, which is not yet reported here.',
        },
      ],
      immediateNextSteps: [
        'Erect 15-20 blue or yellow sticky traps per acre at crop canopy level to monitor and mass-trap adult thrips.',
        'Spray Cold-Pressed Neem Oil (Azadirachtin 10,000 ppm) at 2-3 ml per liter of water with a mild wetting agent during early morning or late evening.',
        'Avoid excessive synthetic nitrogen fertilizers, as succulent lush growth encourages rapid thrips multiplication.',
        'Provide adequate soil moisture through drip irrigation; dry soil stress aggravates thrips damage.',
      ],
      preventiveMeasures: [
        'Intercrop with maize, sorghum, or marigold as border/barrier crops to impede thrips movement from adjacent plots.',
        'Encourage natural bio-control predators such as predatory mites (Amblyseius spp.) and green lacewings (Chrysoperla carnea).',
        'Conserve soil moisture with organic straw mulching.',
      ],
      followUpQuestions: [
        'Are leaves curling strictly upwards (boat shape) or downwards?',
        'Do you notice any fine silvering or brown scars along the midrib on the undersides of young leaves?',
        'What was the recent rainfall or temperature pattern over the past 7 days?',
      ],
      riskLevel: 'moderate',
      riskExplanation:
        'At the flowering stage, unchecked thrips can cause blossom drop and up to 30% yield loss, but timely biological and cultural intervention can arrest the spread within 7-10 days.',
      confidenceLevel: 'high',
      uncertaintyReasons: [
        'Physical microscopic inspection of the lower leaf surface is required to confirm the exact pest species versus secondary viral transmission.',
      ],
      supportingSources: [
        'ICAR - Indian Institute of Horticultural Research (IIHR) Chilli IPM Advisory',
        'Acharya N.G. Ranga Agricultural University (ANGRAU) Crop Protection Guidelines',
        'Directorate of Plant Protection, Quarantine & Storage (DPPQS) Pest Management Bulletin',
      ],
      whenToConsultExpert:
        'If leaf curling continues to spread to over 35% of the parcel after 5 days of organic spraying, or if flower abortion occurs, take plant samples immediately to the nearest Krishi Vigyan Kendra (KVK Guntur / Lam Farm) or contact the local Village Agriculture Assistant (VAA).',
      disclaimer:
        'AgriSage AI advisory is designed for decision support and does not replace on-site agronomic verification. Never apply unregistered chemical cocktails. Follow official CIB&RC product label guidelines.',
    };

    const advisory = await this.createAdvisory({
      owner_id: ownerId,
      farm_id: farm.id,
      crop_id: crop1.id,
      category: 'disease_pest',
      title: 'Suspected Chilli Thrips & Upward Leaf Curling in Teja Chilli',
      user_description:
        'Observed upward curling of leaves in 4-acre chilli plot. Flowering has started. Young shoots show slight browning and crinkling.',
      affected_plant_parts: ['leaves', 'flowers'],
      duration_spread: 'Noticed 4 days ago across northern border rows',
      image_url: null,
      language: 'en',
      weather_context: {
        locationName: 'Guntur, Andhra Pradesh',
        observationTime: new Date().toISOString(),
        temperature: 31,
        apparentTemperature: 34,
        humidity: 62,
        precipitation: 0,
        windSpeed: 12,
        weatherCode: 1,
        weatherDescription: 'Mainly clear',
        isForecast: false,
        providerAttribution: 'Open-Meteo Meteorological Data (Verified Provider)',
        dataFreshness: new Date().toLocaleTimeString('en-IN') + ' IST',
      },
      structured_report: sampleReport,
      status: 'completed',
      is_sample: true,
    });

    return {
      farm,
      crops: [crop1, crop2],
      advisory,
    };
  }

  async clearDemoData(ownerId: string): Promise<number> {
    let deletedCount = 0;

    // Delete sample advisories
    for (const [id, a] of memoryDb.advisories.entries()) {
      if (a.owner_id === ownerId && a.is_sample) {
        memoryDb.advisories.delete(id);
        deletedCount++;
      }
    }

    // Delete sample crops
    for (const [id, c] of memoryDb.crops.entries()) {
      if (c.owner_id === ownerId && c.is_sample) {
        memoryDb.crops.delete(id);
        deletedCount++;
      }
    }

    // Delete sample farms
    for (const [id, f] of memoryDb.farms.entries()) {
      if (f.owner_id === ownerId && f.is_sample) {
        memoryDb.farms.delete(id);
        deletedCount++;
      }
    }

    if (isLiveSupabaseConfigured) {
      try {
        await supabaseAdmin.from('advisories').delete().eq('owner_id', ownerId).eq('is_sample', true);
        await supabaseAdmin.from('crops').delete().eq('owner_id', ownerId).eq('is_sample', true);
        await supabaseAdmin.from('farms').delete().eq('owner_id', ownerId).eq('is_sample', true);
      } catch (err) {
        // Fallback
      }
    }

    return deletedCount;
  }
}

export const agriStore = new AgriStore();
