import express from 'express';
import { getCurrentWeather, getWeatherForecast } from '../controllers/weatherController.js';

const router = express.Router();

router.get('/current/:district', getCurrentWeather);
router.get('/forecast/:district', getWeatherForecast);

export default router;
