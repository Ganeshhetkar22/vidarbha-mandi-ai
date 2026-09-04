import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getDistrict, getMandi, getCrop } from '@/data/vidarbha';

const mapRow = (r) => ({
  id: r.id,
  districtId: r.district_id,
  mandiId: r.mandi_id,
  mandiName: r.mandi_name,
  cropId: r.crop_id,
  cropName: r.crop_name,
  variety: r.variety,
  minPrice: r.min_price,
  maxPrice: r.max_price,
  modalPrice: r.modal_price,
  priceDate: r.price_date,
  source: r.source,
  sourceUrl: r.source_url,
  fetchedAt: r.fetched_at,
});

export async function fetchMandiPrices(query = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { records: [], requestedDate: query.date || null, usedDate: null, usedFallback: false };
  }
  const filters = (q) => {
    if (query.districtId) q = q.eq('district_id', query.districtId);
    if (query.cropId) q = q.eq('crop_id', query.cropId);
    if (query.mandiId) q = q.eq('mandi_id', query.mandiId);
    return q;
  };

  const queryDate = (date) => {
    let q = supabase
      .from('mandi_prices')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(query.limit ?? 100);
    q = filters(q);
    if (date) q = q.eq('price_date', date);
    return q;
  };

  const requestedDate = query.date || null;
  let { data, error } = requestedDate
    ? await queryDate(requestedDate)
    : { data: [], error: null };
  if (error) throw error;

  let usedDate = requestedDate;
  let usedFallback = false;
  if (!data?.length) {
    const { data: latestRow, error: latestError } = await filters(
      supabase
        .from('mandi_prices')
        .select('price_date')
        .order('price_date', { ascending: false })
        .limit(1),
    ).maybeSingle();
    if (latestError) throw latestError;

    usedDate = latestRow?.price_date ?? null;
    usedFallback = Boolean(requestedDate && usedDate);
    if (usedDate) {
      ({ data, error } = await queryDate(usedDate));
      if (error) throw error;
    }
  }

  return {
    records: (data ?? []).map(mapRow),
    requestedDate,
    usedDate,
    usedFallback,
  };
}

export async function fetchMandiAvailability(districtId, cropId) {
  if (!isSupabaseConfigured || !supabase) {
    return { crops: [], mandis: [] };
  }

  let query = supabase
    .from('mandi_prices')
    .select('crop_id, crop_name, mandi_id, mandi_name')
    .eq('district_id', districtId);

  if (cropId) query = query.eq('crop_id', cropId);

  const { data, error } = await query;
  if (error) throw error;

  const crops = new Map();
  const mandis = new Map();
  for (const row of data ?? []) {
    if (row.crop_id && !crops.has(row.crop_id)) {
      crops.set(row.crop_id, {
        ...getCrop(row.crop_id),
        id: row.crop_id,
        name: row.crop_name ?? getCrop(row.crop_id)?.name ?? row.crop_id,
      });
    }
    if (row.mandi_id && !mandis.has(row.mandi_id)) {
      mandis.set(row.mandi_id, {
        ...getMandi(row.mandi_id),
        id: row.mandi_id,
        name: row.mandi_name ?? getMandi(row.mandi_id)?.name ?? row.mandi_id,
      });
    }
  }

  return { crops: Array.from(crops.values()), mandis: Array.from(mandis.values()) };
}

export async function fetchLatestPriceDate() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('mandi_prices')
    .select('price_date')
    .order('price_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.price_date ?? null;
}

export async function fetchPriceHistory(
  districtId,
  mandiId,
  cropId,
  days = 30,
) {
  if (!isSupabaseConfigured || !supabase) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('mandi_prices')
    .select('*')
    .eq('district_id', districtId)
    .eq('mandi_id', mandiId)
    .eq('crop_id', cropId)
    .gte('price_date', sinceStr)
    .order('price_date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function fetchComparisonForCrop(
  districtId,
  cropId,
) {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('mandi_prices')
    .select('*')
    .eq('district_id', districtId)
    .eq('crop_id', cropId)
    .order('price_date', { ascending: false })
    .order('mandi_id', { ascending: true });

  if (error) throw error;
  const rows = (data ?? []).map(mapRow);
  // keep only the most recent record per mandi
  const latestByMandi = new Map();
  for (const row of rows) {
    if (!latestByMandi.has(row.mandiId)) latestByMandi.set(row.mandiId, row);
  }
  return Array.from(latestByMandi.values());
}

export function formatPrice(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export { getDistrict, getMandi, getCrop };
