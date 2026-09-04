import {
  selectFrom,
  selectWithDateRange,
  getLatestRow,
  isSupabaseConfigured,
} from '../config/db.js';

/**
 * GET /api/weather/current/:district
 * Returns the latest non-forecast weather row for a district.
 */
export async function getCurrentWeather(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json(null);
    }
    const { district } = req.params;
    if (!district) {
      return res.status(400).json({ error: 'district is required' });
    }

    const row = await getLatestRow('weather_snapshots', {
      filters: { district_id: district, is_forecast: false },
      orderColumn: 'fetched_at',
      ascending: false,
    });

    res.json(row);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/weather/forecast/:district
 * Returns the next 5 days of forecast rows for a district.
 */
export async function getWeatherForecast(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }
    const { district } = req.params;
    if (!district) {
      return res.status(400).json({ error: 'district is required' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const records = await selectWithDateRange('weather_snapshots', {
      filters: { district_id: district, is_forecast: true },
      dateColumn: 'forecast_date',
      dateFrom: today,
      order: { column: 'forecast_date' },
      ascending: true,
      limit: 5,
    });

    res.json(records);
  } catch (err) {
    next(err);
  }
}
