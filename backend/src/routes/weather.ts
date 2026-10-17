// ==============================================================================
// AgriSage AI: Weather Routes (Live Verified Meteorological Data)
// ==============================================================================

import { Router } from 'express';
import { weatherService } from '../services/weather/weatherService.js';

const router = Router();

// GET /api/v1/weather/current
router.get('/current', async (req, res, next) => {
  try {
    const state = (req.query.state as string) || undefined;
    const district = (req.query.district as string) || undefined;
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

    const weather = await weatherService.getWeather({ state, district, lat, lon });

    if (!weather) {
      res.json({
        success: true,
        data: null,
        message: 'Live meteorological observations are currently unavailable for this region.',
      });
      return;
    }

    res.json({
      success: true,
      data: weather,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
