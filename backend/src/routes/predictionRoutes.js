import express from 'express';
import { getPredictions, triggerPrediction } from '../controllers/predictionController.js';

const router = express.Router();

router.get('/:district/:mandi/:crop', getPredictions);
router.post('/trigger', triggerPrediction);

export default router;
