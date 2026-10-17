// ==============================================================================
// AgriSage AI: AI Crop Advisory & Pest Diagnosis Routes
// ==============================================================================

import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { agriStore } from '../services/db/agriStore.js';
import { agriGeminiService } from '../services/ai/agriGeminiService.js';
import {
  GeneralAdvisoryRequestSchema,
  PestDiagnosisRequestSchema,
  CropSuitabilityRequestSchema,
} from '../shared/index.js';
import { env } from '../config/env.js';

const router = Router();

// Multer for pest/disease photograph uploads (up to 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024,
    files: 1,
  },
});

// ----------------------------------------------------------------------------
// 1. GENERAL CROP ADVISORY
// ----------------------------------------------------------------------------
router.post('/general', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const validated = GeneralAdvisoryRequestSchema.parse(req.body);

    // Fetch contextual farm and crop details if supplied
    let farm = null;
    let crop = null;

    if (validated.farmId) {
      farm = await agriStore.getFarm(validated.farmId, ownerId);
    }
    if (validated.cropId) {
      crop = await agriStore.getCrop(validated.cropId, ownerId);
    }

    const { report, weather } = await agriGeminiService.generateAdvisory({
      category: validated.category,
      userDescription: validated.userDescription,
      title: validated.title,
      cropName: crop?.crop_name,
      variety: crop?.variety || undefined,
      growthStage: validated.currentGrowthStage || crop?.growth_stage || undefined,
      farmName: farm?.name,
      state: farm?.state,
      district: farm?.district,
      soilType: farm?.soil_type,
      soilPh: farm?.soil_ph,
      irrigationMethod: farm?.irrigation_method,
      waterAvailability: farm?.water_availability,
      language: validated.language,
      weatherContext: validated.includeWeather ? undefined : null,
    });

    const title =
      validated.title ||
      `${crop?.crop_name ? `${crop.crop_name}: ` : ''}${report.summary.slice(0, 60)}...`;

    const saved = await agriStore.createAdvisory({
      owner_id: ownerId,
      farm_id: validated.farmId || null,
      crop_id: validated.cropId || null,
      category: validated.category,
      title,
      user_description: validated.userDescription,
      affected_plant_parts: [],
      duration_spread: null,
      image_url: null,
      language: validated.language,
      weather_context: weather,
      structured_report: report,
      status: 'completed',
      is_sample: false,
    });

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 2. PEST & DISEASE DIAGNOSIS (MULTIMODAL WITH OPTIONAL PHOTO)
// ----------------------------------------------------------------------------
router.post('/diagnose', requireAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const ownerId = req.user!.id;

    // Parse form fields (may be stringified JSON or multipart fields)
    let affectedPlantParts: string[] = [];
    if (req.body.affectedPlantParts) {
      try {
        affectedPlantParts = Array.isArray(req.body.affectedPlantParts)
          ? req.body.affectedPlantParts
          : JSON.parse(req.body.affectedPlantParts);
      } catch {
        affectedPlantParts = [req.body.affectedPlantParts];
      }
    }

    const payload = {
      farmId: req.body.farmId || null,
      cropId: req.body.cropId || null,
      cropName: req.body.cropName || null,
      userDescription: req.body.userDescription || '',
      affectedPlantParts,
      durationSpread: req.body.durationSpread || null,
      language: req.body.language || 'en',
    };

    const validated = PestDiagnosisRequestSchema.parse(payload);

    let farm = null;
    let crop = null;

    if (validated.farmId) {
      farm = await agriStore.getFarm(validated.farmId, ownerId);
    }
    if (validated.cropId) {
      crop = await agriStore.getCrop(validated.cropId, ownerId);
    }

    const effectiveCropName = crop?.crop_name || validated.cropName || 'Crop';

    // Image handling
    let imageBuffer: Buffer | null = null;
    let imageMimeType: string | null = null;
    let imageUrl: string | null = null;

    if (req.file) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype;
      // Convert small preview or data URI for client persistence if running locally
      imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const report = await agriGeminiService.diagnosePestAndDisease({
      userDescription: validated.userDescription,
      affectedPlantParts: validated.affectedPlantParts,
      durationSpread: validated.durationSpread,
      cropName: effectiveCropName,
      variety: crop?.variety || undefined,
      growthStage: crop?.growth_stage || undefined,
      state: farm?.state,
      district: farm?.district,
      language: validated.language,
      imageBuffer,
      imageMimeType,
    });

    const title = `Pest/Disease Diagnosis: ${effectiveCropName} (${report.possibleExplanations?.[0]?.cause || 'Symptom Analysis'})`;

    const saved = await agriStore.createAdvisory({
      owner_id: ownerId,
      farm_id: validated.farmId || null,
      crop_id: validated.cropId || null,
      category: 'disease_pest',
      title,
      user_description: validated.userDescription,
      affected_plant_parts: validated.affectedPlantParts,
      duration_spread: validated.durationSpread || null,
      image_url: imageUrl,
      language: validated.language,
      weather_context: null,
      structured_report: report,
      status: 'completed',
      is_sample: false,
    });

    res.status(201).json({
      success: true,
      data: saved,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 3. CROP SELECTION & SUITABILITY EVALUATION
// ----------------------------------------------------------------------------
router.post('/crop-suitability', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const validated = CropSuitabilityRequestSchema.parse(req.body);

    const report = await agriGeminiService.evaluateCropSuitability({
      state: validated.state,
      district: validated.district,
      season: validated.season,
      soilType: validated.soilType,
      soilPh: validated.soilPh,
      irrigationMethod: validated.irrigationMethod,
      waterAvailability: validated.waterAvailability,
      area: validated.area,
      farmerPreferences: validated.farmerPreferences,
      language: validated.language,
    });

    // Optionally save as an advisory record so farmer can revisit later
    const summary = `Crop Suitability for ${validated.district}, ${validated.state} (${validated.season.toUpperCase()})`;
    const structuredForSave = {
      summary: report.generalObservations,
      understandingOfSituation: `Evaluation for ${validated.soilType} soil with ${validated.irrigationMethod} irrigation. ${report.soilConditionSummary} ${report.waterBudgetAssessment}`,
      possibleExplanations: report.options.map((opt) => ({
        cause: opt.cropName,
        probability: (opt.suitabilityScore >= 80 ? 'high' : 'moderate') as 'high' | 'moderate' | 'low',
        description: opt.suitabilityReasons.join('; '),
        distinguishingFactors: `Constraints: ${opt.relevantConstraints.join(', ')}. Considerations: ${opt.cultivationConsiderations.join(', ')}`,
      })),
      immediateNextSteps: report.suggestedActionPlan,
      preventiveMeasures: report.options.flatMap((o) => o.potentialRisks).slice(0, 4),
      followUpQuestions: report.options.flatMap((o) => o.informationStillNeeded).slice(0, 3),
      riskLevel: 'low' as const,
      riskExplanation: 'Crop selection planning carries manageable risk when suitable varieties and tested seeds are chosen.',
      confidenceLevel: 'high' as const,
      uncertaintyReasons: ['Market prices and local micro-climate variations may impact final harvest outcomes.'],
      supportingSources: ['ICAR Crop Planning Framework', 'State Agricultural Department Cropping Pattern Advisories'],
      whenToConsultExpert: 'Verify local seed hub inventory and local KVK advisory before bulk purchasing seed stocks.',
      disclaimer: report.disclaimer,
    };

    const saved = await agriStore.createAdvisory({
      owner_id: ownerId,
      farm_id: validated.farmId || null,
      crop_id: null,
      category: 'crop_selection',
      title: summary,
      user_description: `Planning ${validated.season} cultivation for ${validated.area || ''} acres in ${validated.district}, ${validated.state}.`,
      affected_plant_parts: [],
      duration_spread: null,
      image_url: null,
      language: validated.language,
      weather_context: null,
      structured_report: structuredForSave,
      status: 'completed',
      is_sample: false,
    });

    res.status(201).json({
      success: true,
      data: {
        advisory: saved,
        suitabilityReport: report,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 4. LIST ADVISORY HISTORY (WITH FILTERS & SEARCH)
// ----------------------------------------------------------------------------
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const category = (req.query.category as string) || undefined;
    const farmId = (req.query.farmId as string) || undefined;
    const cropId = (req.query.cropId as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const list = await agriStore.listAdvisories(ownerId, { category, farmId, cropId, search });

    res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 5. GET SINGLE ADVISORY REPORT
// ----------------------------------------------------------------------------
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const item = await agriStore.getAdvisory(req.params.id, ownerId);

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Advisory report not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------------------------------
// 6. DELETE ADVISORY REPORT
// ----------------------------------------------------------------------------
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const deleted = await agriStore.deleteAdvisory(req.params.id, ownerId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Advisory report not found or already deleted' },
      });
      return;
    }

    res.json({
      success: true,
      data: { id: req.params.id, deleted: true },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
