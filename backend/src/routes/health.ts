import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'intelligent-document-processor-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
