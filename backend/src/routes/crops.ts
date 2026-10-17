// ==============================================================================
// AgriSage AI: Crop Management Routes
// ==============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { agriStore } from '../services/db/agriStore.js';
import { CropCreateSchema, CropUpdateSchema, INDIAN_CROP_CATALOG } from '../shared/index.js';

const router = Router();

// GET /api/v1/crops/catalog - Preloaded Indian Crop Catalogue
router.get('/catalog', (req, res) => {
  res.json({
    success: true,
    data: INDIAN_CROP_CATALOG,
  });
});

// GET /api/v1/crops
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const farmId = (req.query.farmId as string) || undefined;
    const crops = await agriStore.listCrops(ownerId, farmId);
    res.json({
      success: true,
      data: crops,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/crops
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const validated = CropCreateSchema.parse(req.body);

    const crop = await agriStore.createCrop({
      farm_id: validated.farmId,
      owner_id: ownerId,
      crop_name: validated.cropName,
      variety: validated.variety || null,
      sowing_date: validated.sowingDate,
      growth_stage: validated.growthStage,
      season: validated.season,
      irrigation_details: validated.irrigationDetails || null,
      field_observations: validated.fieldObservations || null,
      status: validated.status,
      is_sample: false,
    });

    res.status(201).json({
      success: true,
      data: crop,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/crops/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const crop = await agriStore.getCrop(req.params.id, ownerId);

    if (!crop) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crop record not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: crop,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/crops/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const validated = CropUpdateSchema.parse(req.body);

    const updated = await agriStore.updateCrop(req.params.id, ownerId, {
      crop_name: validated.cropName,
      variety: validated.variety,
      sowing_date: validated.sowingDate,
      growth_stage: validated.growthStage,
      season: validated.season,
      irrigation_details: validated.irrigationDetails,
      field_observations: validated.fieldObservations,
      status: validated.status,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crop record not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/crops/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const deleted = await agriStore.deleteCrop(req.params.id, ownerId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Crop record not found or already deleted' },
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
