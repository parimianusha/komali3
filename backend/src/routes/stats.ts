import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { documentStore } from '../services/db/documentStore.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const stats = await documentStore.getDashboardStats(req.user!.id);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
