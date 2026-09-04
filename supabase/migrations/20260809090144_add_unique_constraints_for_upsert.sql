-- Unique constraints to support UPSERT conflict resolution.
-- The sync edge function uses On-Conflict: district_id,mandi_id,crop_id,price_date
-- and the prediction controller uses On-Conflict: district_id,mandi_id,crop_id,target_date.
-- Without these constraints, merge-duplicates upserts silently fail or insert duplicates.

CREATE UNIQUE INDEX IF NOT EXISTS uq_mandi_prices_d_m_c_date
  ON mandi_prices (district_id, mandi_id, crop_id, price_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_price_predictions_d_m_c_date
  ON price_predictions (district_id, mandi_id, crop_id, target_date);

-- Unique constraint for weather_snapshots: one current + one forecast per district per date
CREATE UNIQUE INDEX IF NOT EXISTS uq_weather_district_date_forecast
  ON weather_snapshots (district_id, forecast_date, is_forecast);
