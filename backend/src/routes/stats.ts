// ==============================================================================
// AgriSage AI: Complete Agricultural & Document Processing Dashboard Stats
// ==============================================================================

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { documentStore } from '../services/db/documentStore.js';
import { agriStore } from '../services/db/agriStore.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Fetch agricultural stats (farms, crops, advisories, weather, primary farm)
    const agriStats = await agriStore.getAgriDashboardStats(userId);

    // Fetch document processing stats
    const docStats = await documentStore.getDashboardStats(userId);
    const { documents: recentDocs } = await documentStore.listDocuments(userId, {
      page: 1,
      limit: 5,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });

    res.status(200).json({
      success: true,
      data: {
        totalFarms: agriStats.totalFarms,
        totalActiveCrops: agriStats.totalActiveCrops,
        totalAdvisories: agriStats.totalAdvisories,
        totalDocuments: docStats.totalDocuments,
        completedDocuments: docStats.completedDocuments,
        needsReviewCount: docStats.needsReviewCount,
        primaryFarm: agriStats.primaryFarm,
        weather: agriStats.weather,
        recentAdvisories: agriStats.recentAdvisories,
        recentDocuments: recentDocs,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
