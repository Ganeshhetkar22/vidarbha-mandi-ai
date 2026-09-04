import express from 'express';
import {
  getMandiPrices,
  getLatestPriceDate,
  getPriceHistory,
  getDistricts,
  getCrops,
  getMarkets,
  getComparison,
} from '../controllers/mandiController.js';

const router = express.Router();

router.get('/districts', getDistricts);
router.get('/crops', getCrops);
router.get('/markets', getMarkets);
router.get('/latest-date', getLatestPriceDate);
router.get('/latest', getMandiPrices);
router.get('/prices', getMandiPrices);
router.get('/history', getPriceHistory);
router.get('/compare', getComparison);

export default router;
