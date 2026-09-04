import {
  selectFrom,
  selectWithDateRange,
  upsertToTable,
  isSupabaseConfigured,
} from '../config/db.js';
import { fetchPredictionFromML } from '../services/mlClient.js';

/**
 * GET /api/prediction/:district/:mandi/:crop
 * Returns stored predictions for the next 30 days from today.
 */
export async function getPredictions(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }
    const { district, mandi, crop } = req.params;

    if (!district || !mandi || !crop) {
      return res.status(400).json({ error: 'district, mandi, and crop are required' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const records = await selectWithDateRange('price_predictions', {
      filters: { district_id: district, mandi_id: mandi, crop_id: crop },
      dateColumn: 'target_date',
      dateFrom: today,
      order: { column: 'target_date' },
      ascending: true,
      limit: 30,
    });

    res.json(records);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/prediction/trigger
 * Body: { district, mandi, crop }
 * Calls the ML service and persists the result.
 */
export async function triggerPrediction(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { district, mandi, crop } = req.body ?? {};
    if (!district || !mandi || !crop) {
      return res.status(400).json({ error: 'district, mandi, and crop are required' });
    }

    const mlResult = await fetchPredictionFromML({ district, mandi, crop });

    if (!mlResult.available) {
      return res.json(mlResult);
    }

    // Persist predictions to Supabase if the ML service returned data
    if (mlResult.predictions && Array.isArray(mlResult.predictions) && mlResult.predictions.length > 0) {
      const rows = mlResult.predictions.map((p) => ({
        district_id: district,
        mandi_id: mandi,
        crop_id: crop,
        target_date: p.target_date,
        predicted_price: p.predicted_price,
        confidence_pct: mlResult.confidence_pct ?? null,
        trend: mlResult.trend ?? null,
        recommendation: mlResult.recommendation ?? null,
        model_name: mlResult.model_name ?? null,
        model_version: mlResult.model_version ?? 'unknown',
      }));

      await upsertToTable('price_predictions', rows, ['district_id', 'mandi_id', 'crop_id', 'target_date']);
    }

    res.json(mlResult);
  } catch (err) {
    next(err);
  }
}
