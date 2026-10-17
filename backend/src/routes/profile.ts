// ==============================================================================
// AgriSage AI: Farmer Profile Routes
// ==============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { agriStore } from '../services/db/agriStore.js';
import { FarmerProfileUpdateSchema } from '../shared/index.js';

const router = Router();

// GET /api/v1/profile
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const profile = await agriStore.getProfile(userId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/profile
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const validated = FarmerProfileUpdateSchema.parse(req.body);

    const updated = await agriStore.updateProfile(userId, {
      display_name: validated.displayName,
      preferred_language: validated.preferredLanguage,
      country: validated.country,
      state: validated.state,
      district: validated.district,
      village: validated.village,
      preferred_units: validated.preferredUnits,
      phone: validated.phone,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
