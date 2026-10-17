// ==============================================================================
// AgriSage AI: Zod Validation Schemas
// ==============================================================================

import { z } from 'zod';
import {
  SUPPORTED_LANGUAGES,
  SOIL_TYPES,
  IRRIGATION_METHODS,
  WATER_AVAILABILITY,
  GROWTH_STAGES,
  SEASONS,
  ADVISORY_CATEGORIES,
} from '../agriculture.js';

// ------------------------------------------------------------------------------
// Farmer Profile Schemas
// ------------------------------------------------------------------------------
export const FarmerProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  preferredLanguage: z.enum(SUPPORTED_LANGUAGES).default('en'),
  country: z.string().trim().min(2).max(50).default('India'),
  state: z.string().trim().min(2, 'Please select or enter a state').max(100).optional().nullable(),
  district: z.string().trim().min(2, 'Please select or enter a district').max(100).optional().nullable(),
  village: z.string().trim().max(100).optional().nullable(),
  preferredUnits: z.enum(['metric', 'imperial', 'traditional']).default('metric'),
  phone: z.string().trim().max(20).optional().nullable(),
});

export type FarmerProfileUpdateInput = z.infer<typeof FarmerProfileUpdateSchema>;

// ------------------------------------------------------------------------------
// Farm Schemas
// ------------------------------------------------------------------------------
export const FarmCreateSchema = z.object({
  name: z.string().trim().min(2, 'Farm name must be at least 2 characters').max(150),
  approximateLocation: z.string().trim().max(255).optional().nullable(),
  state: z.string().trim().min(2, 'State is required').max(100),
  district: z.string().trim().min(2, 'District is required').max(100),
  area: z.coerce.number().positive('Farm area must be greater than zero'),
  areaUnit: z.enum(['acres', 'hectares', 'bigha', 'guntha']).default('acres'),
  soilType: z.enum(SOIL_TYPES).default('alluvial'),
  soilPh: z.coerce
    .number()
    .min(2.0, 'Soil pH must be between 2.0 and 12.0')
    .max(12.0, 'Soil pH must be between 2.0 and 12.0')
    .optional()
    .nullable(),
  organicCarbon: z.string().trim().max(50).optional().nullable(),
  nitrogenStatus: z.enum(['low', 'medium', 'high', 'unknown']).default('unknown'),
  phosphorusStatus: z.enum(['low', 'medium', 'high', 'unknown']).default('unknown'),
  potassiumStatus: z.enum(['low', 'medium', 'high', 'unknown']).default('unknown'),
  irrigationMethod: z.enum(IRRIGATION_METHODS).default('drip'),
  waterAvailability: z.enum(WATER_AVAILABILITY).default('moderate'),
  growingSeason: z.enum(SEASONS).default('kharif'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const FarmUpdateSchema = FarmCreateSchema.partial();
export type FarmCreateInput = z.infer<typeof FarmCreateSchema>;
export type FarmUpdateInput = z.infer<typeof FarmUpdateSchema>;

// ------------------------------------------------------------------------------
// Crop Schemas
// ------------------------------------------------------------------------------
export const CropCreateSchema = z.object({
  farmId: z.string().uuid('Please select a valid farm'),
  cropName: z.string().trim().min(2, 'Crop name is required').max(100),
  variety: z.string().trim().max(100).optional().nullable(),
  sowingDate: z.string().min(8, 'Valid sowing date is required'),
  growthStage: z.enum(GROWTH_STAGES).default('vegetative'),
  season: z.enum(SEASONS).default('kharif'),
  irrigationDetails: z.string().trim().max(255).optional().nullable(),
  fieldObservations: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['active', 'harvested', 'planned', 'failed']).default('active'),
});

export const CropUpdateSchema = CropCreateSchema.partial();
export type CropCreateInput = z.infer<typeof CropCreateSchema>;
export type CropUpdateInput = z.infer<typeof CropUpdateSchema>;

// ------------------------------------------------------------------------------
// Advisory Requests
// ------------------------------------------------------------------------------
export const GeneralAdvisoryRequestSchema = z.object({
  farmId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  category: z.enum(ADVISORY_CATEGORIES).default('general_management'),
  title: z.string().trim().max(255).optional(),
  userDescription: z.string().trim().min(8, 'Please provide more details about your crop inquiry').max(3000),
  currentGrowthStage: z.enum(GROWTH_STAGES).optional().nullable(),
  language: z.enum(SUPPORTED_LANGUAGES).default('en'),
  includeWeather: z.boolean().default(true),
});

export const PestDiagnosisRequestSchema = z.object({
  farmId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid().optional().nullable(),
  cropName: z.string().trim().max(100).optional().nullable(),
  userDescription: z.string().trim().min(8, 'Please describe the observed symptoms').max(3000),
  affectedPlantParts: z.array(z.string()).default([]),
  durationSpread: z.string().trim().max(255).optional().nullable(),
  language: z.enum(SUPPORTED_LANGUAGES).default('en'),
});

export const CropSuitabilityRequestSchema = z.object({
  farmId: z.string().uuid().optional().nullable(),
  state: z.string().trim().min(2),
  district: z.string().trim().min(2),
  season: z.enum(SEASONS).default('kharif'),
  soilType: z.enum(SOIL_TYPES).default('alluvial'),
  soilPh: z.coerce.number().min(2).max(12).optional().nullable(),
  irrigationMethod: z.enum(IRRIGATION_METHODS).default('drip'),
  waterAvailability: z.enum(WATER_AVAILABILITY).default('moderate'),
  area: z.coerce.number().positive().optional().nullable(),
  farmerPreferences: z.string().trim().max(1000).optional().nullable(),
  language: z.enum(SUPPORTED_LANGUAGES).default('en'),
});

// ------------------------------------------------------------------------------
// Structured AI Output Schemas
// ------------------------------------------------------------------------------
export const PossibleExplanationSchema = z.object({
  cause: z.string(),
  probability: z.enum(['high', 'moderate', 'low']),
  description: z.string(),
  distinguishingFactors: z.string(),
});

export const StructuredAdvisoryReportSchema = z.object({
  summary: z.string(),
  understandingOfSituation: z.string(),
  possibleExplanations: z.array(PossibleExplanationSchema).default([]),
  immediateNextSteps: z.array(z.string()).default([]),
  preventiveMeasures: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  riskLevel: z.enum(['low', 'moderate', 'high', 'critical']),
  riskExplanation: z.string(),
  confidenceLevel: z.enum(['high', 'moderate', 'low']),
  uncertaintyReasons: z.array(z.string()).default([]),
  supportingSources: z.array(z.string()).default([]),
  whenToConsultExpert: z.string(),
  disclaimer: z.string(),
});

export const CropSuitabilityOptionSchema = z.object({
  cropName: z.string(),
  suitabilityScore: z.number().min(0).max(100),
  season: z.string(),
  suitabilityReasons: z.array(z.string()),
  relevantConstraints: z.array(z.string()),
  informationStillNeeded: z.array(z.string()),
  cultivationConsiderations: z.array(z.string()),
  potentialRisks: z.array(z.string()),
  suggestedVerificationSteps: z.array(z.string()),
});

export const CropSuitabilityReportSchema = z.object({
  options: z.array(CropSuitabilityOptionSchema).min(1),
  generalObservations: z.string(),
  soilConditionSummary: z.string(),
  waterBudgetAssessment: z.string(),
  suggestedActionPlan: z.array(z.string()),
  disclaimer: z.string(),
});
