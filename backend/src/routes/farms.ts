// ==============================================================================
// AgriSage AI: Farm Management Routes
// ==============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { agriStore } from '../services/db/agriStore.js';
import { FarmCreateSchema, FarmUpdateSchema } from '../shared/index.js';

const router = Router();

// GET /api/v1/farms
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const farms = await agriStore.listFarms(ownerId);
    res.json({
      success: true,
      data: farms,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/farms
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const validated = FarmCreateSchema.parse(req.body);

    const farm = await agriStore.createFarm({
      owner_id: ownerId,
      name: validated.name,
      approximate_location: validated.approximateLocation || null,
      state: validated.state,
      district: validated.district,
      area: validated.area,
      area_unit: validated.areaUnit,
      soil_type: validated.soilType,
      soil_ph: validated.soilPh ?? null,
      organic_carbon: validated.organicCarbon || null,
      nitrogen_status: validated.nitrogenStatus,
      phosphorus_status: validated.phosphorusStatus,
      potassium_status: validated.potassiumStatus,
      irrigation_method: validated.irrigationMethod,
      water_availability: validated.waterAvailability,
      growing_season: validated.growingSeason,
      notes: validated.notes || null,
      is_sample: false,
    });

    res.status(201).json({
      success: true,
      data: farm,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/farms/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const farm = await agriStore.getFarm(req.params.id, ownerId);

    if (!farm) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Farm record not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: farm,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/farms/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const validated = FarmUpdateSchema.parse(req.body);

    const updated = await agriStore.updateFarm(req.params.id, ownerId, {
      name: validated.name,
      approximate_location: validated.approximateLocation,
      state: validated.state,
      district: validated.district,
      area: validated.area,
      area_unit: validated.areaUnit,
      soil_type: validated.soilType,
      soil_ph: validated.soilPh,
      organic_carbon: validated.organicCarbon,
      nitrogen_status: validated.nitrogenStatus,
      phosphorus_status: validated.phosphorusStatus,
      potassium_status: validated.potassiumStatus,
      irrigation_method: validated.irrigationMethod,
      water_availability: validated.waterAvailability,
      growing_season: validated.growingSeason,
      notes: validated.notes,
    });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Farm record not found' },
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

// DELETE /api/v1/farms/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const ownerId = req.user!.id;
    const deleted = await agriStore.deleteFarm(req.params.id, ownerId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Farm record not found or already deleted' },
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
