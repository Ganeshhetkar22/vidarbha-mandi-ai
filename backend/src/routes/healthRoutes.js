import express from 'express';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vidarbha-mandi-ai-backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;
