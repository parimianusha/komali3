// ==============================================================================
// AgriSage AI: Complete Application Types
// ==============================================================================

import {
  SupportedLanguage,
  SoilType,
  IrrigationMethod,
  WaterAvailability,
  GrowthStage,
  CropSeason,
  AdvisoryCategory,
  AgriDocumentCategory,
} from '../agriculture.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    requestId?: string;
  };
}

// ------------------------------------------------------------------------------
// Farmer Profile
// ------------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  email?: string;
  display_name: string | null;
  preferred_language: SupportedLanguage;
  country: string;
  state: string | null;
  district: string | null;
  village: string | null;
  preferred_units: 'metric' | 'imperial' | 'traditional';
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------------------
// Farm Model
// ------------------------------------------------------------------------------
export interface FarmRecord {
  id: string;
  owner_id: string;
  name: string;
  approximate_location?: string | null;
  state: string;
  district: string;
  area: number;
  area_unit: 'acres' | 'hectares' | 'bigha' | 'guntha';
  soil_type: SoilType;
  soil_ph?: number | null;
  organic_carbon?: string | null;
  nitrogen_status?: 'low' | 'medium' | 'high' | 'unknown';
  phosphorus_status?: 'low' | 'medium' | 'high' | 'unknown';
  potassium_status?: 'low' | 'medium' | 'high' | 'unknown';
  irrigation_method: IrrigationMethod;
  water_availability: WaterAvailability;
  growing_season: CropSeason;
  notes?: string | null;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
  crop_count?: number;
}

// ------------------------------------------------------------------------------
// Crop Model
// ------------------------------------------------------------------------------
export interface CropRecord {
  id: string;
  farm_id: string;
  farm_name?: string;
  owner_id: string;
  crop_name: string;
  variety?: string | null;
  sowing_date: string;
  growth_stage: GrowthStage;
  season: CropSeason;
  irrigation_details?: string | null;
  field_observations?: string | null;
  status: 'active' | 'harvested' | 'planned' | 'failed';
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------------------
// Structured AI Advisory Report
// ------------------------------------------------------------------------------
export interface PossibleExplanation {
  cause: string;
  probability: 'high' | 'moderate' | 'low';
  description: string;
  distinguishingFactors: string;
}

export interface StructuredAdvisoryReport {
  summary: string;
  understandingOfSituation: string;
  possibleExplanations: PossibleExplanation[];
  immediateNextSteps: string[];
  preventiveMeasures: string[];
  followUpQuestions: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskExplanation: string;
  confidenceLevel: 'high' | 'moderate' | 'low';
  uncertaintyReasons: string[];
  supportingSources: string[];
  whenToConsultExpert: string;
  disclaimer: string;
}

export interface AdvisoryRecord {
  id: string;
  owner_id: string;
  farm_id?: string | null;
  crop_id?: string | null;
  farm_name?: string | null;
  crop_name?: string | null;
  category: AdvisoryCategory;
  title: string;
  user_description: string;
  affected_plant_parts?: string[];
  duration_spread?: string | null;
  image_url?: string | null;
  language: SupportedLanguage;
  weather_context?: WeatherReport | null;
  structured_report: StructuredAdvisoryReport;
  status: 'completed' | 'processing' | 'failed';
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------------------
// Crop Suitability Recommendation
// ------------------------------------------------------------------------------
export interface CropSuitabilityOption {
  cropName: string;
  suitabilityScore: number;
  season: string;
  suitabilityReasons: string[];
  relevantConstraints: string[];
  informationStillNeeded: string[];
  cultivationConsiderations: string[];
  potentialRisks: string[];
  suggestedVerificationSteps: string[];
}

export interface CropSuitabilityReport {
  options: CropSuitabilityOption[];
  generalObservations: string;
  soilConditionSummary: string;
  waterBudgetAssessment: string;
  suggestedActionPlan: string[];
  disclaimer: string;
}

// ------------------------------------------------------------------------------
// Live Weather Report (Open-Meteo Provider)
// ------------------------------------------------------------------------------
export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface WeatherReport {
  locationName: string;
  state?: string;
  district?: string;
  observationTime: string;
  temperature: number;
  apparentTemperature?: number;
  humidity?: number;
  precipitation?: number;
  windSpeed?: number;
  weatherCode: number;
  weatherDescription: string;
  isForecast: boolean;
  dailyForecasts?: DailyForecast[];
  providerAttribution: string;
  dataFreshness: string;
}

export interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  needsReviewCount: number;
  categoriesCount: Record<string, number>;
}

// ------------------------------------------------------------------------------
// Agricultural Dashboard Stats
// ------------------------------------------------------------------------------
export interface AgriDashboardStats {
  totalFarms: number;
  totalActiveCrops: number;
  totalAdvisories: number;
  totalDocuments: number;
  recentAdvisories: AdvisoryRecord[];
  recentDocuments: any[];
  weather?: WeatherReport | null;
  primaryFarm?: FarmRecord | null;
}
