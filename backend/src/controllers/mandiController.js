import {
  selectFrom,
  selectWithDateRange,
  getLatestRow,
  getDistinctValues,
  isSupabaseConfigured,
} from '../config/db.js';

/**
 * GET /api/mandi/districts
 * Returns the list of Vidarbha districts that have price records.
 */
export async function getDistricts(_req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }
    const districts = await getDistinctValues('mandi_prices', 'district_id');
    res.json(districts);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mandi/crops
 * Optional: ?district=nagpur
 */
export async function getCrops(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }
    const filters = {};
    if (req.query.district) filters.district_id = req.query.district;
    const crops = await getDistinctValues('mandi_prices', 'crop_id', { filters });
    res.json(crops);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mandi/markets
 * Optional: ?district=nagpur
 */
export async function getMarkets(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }
    const filters = {};
    if (req.query.district) filters.district_id = req.query.district;
    const markets = await getDistinctValues('mandi_prices', 'mandi_name', { filters });
    res.json(markets);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mandi/latest
 * GET /api/mandi/prices
 * Query: district, commodity, market, fromDate, toDate, limit
 */
export async function getMandiPrices(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }

    const { district, commodity, market, fromDate, toDate } = req.query;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);

    const filters = {};
    if (district) filters.district_id = district;
    if (commodity) filters.crop_id = commodity;
    if (market) filters.mandi_id = market;

    let records;
    if (fromDate || toDate) {
      records = await selectWithDateRange('mandi_prices', {
        filters,
        dateColumn: 'price_date',
        dateFrom: fromDate,
        dateTo: toDate,
        order: { column: 'price_date' },
        ascending: false,
        limit,
      });
    } else {
      records = await selectFrom('mandi_prices', {
        filters,
        order: { column: 'price_date' },
        ascending: false,
        limit,
      });
    }

    res.json(records);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mandi/latest-date
 */
export async function getLatestPriceDate(_req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json({ priceDate: null });
    }
    const row = await getLatestRow('mandi_prices', {
      orderColumn: 'price_date',
      ascending: false,
    });
    res.json({ priceDate: row?.price_date ?? null });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mandi/history
 * Query: district, commodity, market, fromDate, toDate, days
 */
export async function getPriceHistory(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }

    const { district, commodity, market, fromDate, toDate, days } = req.query;

    if (!district || !commodity) {
      return res.status(400).json({ error: 'district and commodity are required' });
    }

    const filters = { district_id: district, crop_id: commodity };
    if (market) filters.mandi_id = market;

    let dateFrom = fromDate;
    if (!dateFrom && days) {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days, 10));
      dateFrom = since.toISOString().slice(0, 10);
    }

    const records = await selectWithDateRange('mandi_prices', {
      filters,
      dateColumn: 'price_date',
      dateFrom,
      dateTo: toDate,
      order: { column: 'price_date' },
      ascending: true,
    });

    res.json(records);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mandi/compare
 * Query: district, commodity, date
 * Returns latest records per market for comparison.
 */
export async function getComparison(req, res, next) {
  try {
    if (!isSupabaseConfigured()) {
      return res.json([]);
    }

    const { district, commodity, date } = req.query;

    if (!district || !commodity) {
      return res.status(400).json({ error: 'district and commodity are required' });
    }

    const filters = { district_id: district, crop_id: commodity };
    if (date) filters.price_date = date;

    const records = await selectFrom('mandi_prices', {
      filters,
      order: { column: 'price_date' },
      ascending: false,
    });

    // Keep only the most recent record per market
    const latestByMarket = new Map();
    for (const r of records) {
      if (!latestByMarket.has(r.mandi_id)) latestByMarket.set(r.mandi_id, r);
    }

    res.json(Array.from(latestByMarket.values()));
  } catch (err) {
    next(err);
  }
}
