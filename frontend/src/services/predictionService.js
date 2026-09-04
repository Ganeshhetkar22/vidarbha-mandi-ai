import { supabase, isSupabaseConfigured } from './supabaseClient';
import { apiPost, isApiConfigured } from './apiConfig';

const mapRow = (r) => ({
  id: r.id,
  districtId: r.district_id,
  mandiId: r.mandi_id,
  cropId: r.crop_id,
  targetDate: r.target_date,
  predictedPrice: r.predicted_price,
  confidencePct: r.confidence_pct,
  trend: r.trend ?? null,
  recommendation: r.recommendation ?? null,
  modelName: r.model_name,
  modelVersion: r.model_version,
  createdAt: r.created_at,
});

export async function fetchPredictions(
  districtId,
  mandiId,
  cropId,
) {
  if (!isSupabaseConfigured || !supabase) return [];
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('price_predictions')
    .select('*')
    .eq('district_id', districtId)
    .eq('mandi_id', mandiId)
    .eq('crop_id', cropId)
    .gte('target_date', today)
    .order('target_date', { ascending: true })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r));
}

export async function triggerPrediction(
  districtId,
  mandiId,
  cropId,
) {
  if (!isApiConfigured) {
    return {
      available: false,
      message: 'Backend API not configured. Set VITE_API_BASE_URL to trigger predictions.',
    };
  }
  try {
    return await apiPost('/api/prediction/trigger', {
      district: districtId,
      mandi: mandiId,
      crop: cropId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to trigger prediction';
    return { available: false, message: msg };
  }
}
