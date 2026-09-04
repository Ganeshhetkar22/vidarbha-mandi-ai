/*
# Vidarbha Mandi AI — core schema

1. Purpose
   Stores mandi (APMC) price reports, weather snapshots, and ML price
   predictions for the 11 Vidarbha districts. This is a single-tenant,
   no-auth public-data application: the frontend reads mandi/weather/
   prediction data with the anon key, and an external data-ingestion
   job (Node backend / Python ML service) writes rows using the
   service-role key. No user accounts in this phase.

2. New Tables
   - `mandi_prices`
       id uuid PK
       district_id text NOT NULL        (e.g. 'nagpur')
       mandi_id   text NOT NULL         (e.g. 'nagpur-apmc')
       mandi_name text NOT NULL
       crop_id    text NOT NULL
       crop_name  text NOT NULL
       variety    text                  (nullable — not all reports have it)
       min_price  numeric               ₹/quintal
       max_price  numeric
       modal_price numeric
       price_date date NOT NULL
       source     text NOT NULL         (e.g. 'AGMARKNET', 'data.gov.in')
       source_url text
       fetched_at timestamptz NOT NULL default now()
   - `weather_snapshots`
       id uuid PK
       district_id text NOT NULL
       temp_c      numeric
       feels_like_c numeric
       humidity_pct numeric
       rainfall_mm numeric
       wind_kmph   numeric
       description text
       forecast_date date NOT NULL      (today for "current", future for forecast rows)
       is_forecast boolean NOT NULL default false
       source      text NOT NULL
       fetched_at  timestamptz NOT NULL default now()
   - `price_predictions`
       id uuid PK
       district_id text NOT NULL
       mandi_id    text NOT NULL
       crop_id     text NOT NULL
       target_date date NOT NULL
       predicted_price numeric NOT NULL
       confidence_pct  numeric          (0-100, nullable)
       trend       text                 ('up' | 'down' | 'stable')
       recommendation text              ('sell_today' | 'wait' | 'price_may_decrease')
       model_name  text
       model_version text
       created_at  timestamptz NOT NULL default now()
   - `data_sync_log`
       id uuid PK
       source      text NOT NULL
       entity      text NOT NULL         ('mandi_prices' | 'weather' | 'prediction')
       status      text NOT NULL         ('success' | 'error')
       rows_affected integer default 0
       message     text
       started_at  timestamptz NOT NULL default now()
       finished_at timestamptz

3. Indexes
   - mandi_prices: (district_id, crop_id, mandi_id, price_date desc)
   - mandi_prices: (crop_id, price_date desc)
   - weather_snapshots: (district_id, forecast_date desc)
   - price_predictions: (district_id, mandi_id, crop_id, target_date desc)
   - price_predictions: (crop_id, target_date desc)

4. Security
   - Enable RLS on every table.
   - This is a no-auth public-data app, so SELECT is allowed for
     anon + authenticated (USING true) — the data is intentionally
     public. INSERT/UPDATE/DELETE are restricted to authenticated
     only (the backend ingestion job). An anon visitor can never
     write prices, weather, or predictions.
*/

CREATE TABLE IF NOT EXISTS mandi_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id text NOT NULL,
  mandi_id text NOT NULL,
  mandi_name text NOT NULL,
  crop_id text NOT NULL,
  crop_name text NOT NULL,
  variety text,
  min_price numeric,
  max_price numeric,
  modal_price numeric,
  price_date date NOT NULL,
  source text NOT NULL,
  source_url text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandi_prices_lookup
  ON mandi_prices (district_id, crop_id, mandi_id, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_mandi_prices_crop_date
  ON mandi_prices (crop_id, price_date DESC);

CREATE TABLE IF NOT EXISTS weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id text NOT NULL,
  temp_c numeric,
  feels_like_c numeric,
  humidity_pct numeric,
  rainfall_mm numeric,
  wind_kmph numeric,
  description text,
  forecast_date date NOT NULL,
  is_forecast boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weather_district_date
  ON weather_snapshots (district_id, forecast_date DESC);

CREATE TABLE IF NOT EXISTS price_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id text NOT NULL,
  mandi_id text NOT NULL,
  crop_id text NOT NULL,
  target_date date NOT NULL,
  predicted_price numeric NOT NULL,
  confidence_pct numeric,
  trend text,
  recommendation text,
  model_name text,
  model_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_predictions_lookup
  ON price_predictions (district_id, mandi_id, crop_id, target_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_crop_date
  ON price_predictions (crop_id, target_date DESC);

CREATE TABLE IF NOT EXISTS data_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  entity text NOT NULL,
  status text NOT NULL,
  rows_affected integer DEFAULT 0,
  message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

-- RLS
ALTER TABLE mandi_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_log ENABLE ROW LEVEL SECURITY;

-- mandi_prices: public read, authenticated write
DROP POLICY IF EXISTS "anon_read_mandi_prices" ON mandi_prices;
CREATE POLICY "anon_read_mandi_prices" ON mandi_prices FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_mandi_prices" ON mandi_prices;
CREATE POLICY "auth_insert_mandi_prices" ON mandi_prices FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_mandi_prices" ON mandi_prices;
CREATE POLICY "auth_update_mandi_prices" ON mandi_prices FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_mandi_prices" ON mandi_prices;
CREATE POLICY "auth_delete_mandi_prices" ON mandi_prices FOR DELETE
  TO authenticated USING (true);

-- weather_snapshots: public read, authenticated write
DROP POLICY IF EXISTS "anon_read_weather" ON weather_snapshots;
CREATE POLICY "anon_read_weather" ON weather_snapshots FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_weather" ON weather_snapshots;
CREATE POLICY "auth_insert_weather" ON weather_snapshots FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_weather" ON weather_snapshots;
CREATE POLICY "auth_update_weather" ON weather_snapshots FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_weather" ON weather_snapshots;
CREATE POLICY "auth_delete_weather" ON weather_snapshots FOR DELETE
  TO authenticated USING (true);

-- price_predictions: public read, authenticated write
DROP POLICY IF EXISTS "anon_read_predictions" ON price_predictions;
CREATE POLICY "anon_read_predictions" ON price_predictions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_predictions" ON price_predictions;
CREATE POLICY "auth_insert_predictions" ON price_predictions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_predictions" ON price_predictions;
CREATE POLICY "auth_update_predictions" ON price_predictions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_predictions" ON price_predictions;
CREATE POLICY "auth_delete_predictions" ON price_predictions FOR DELETE
  TO authenticated USING (true);

-- data_sync_log: public read (operational transparency), authenticated write
DROP POLICY IF EXISTS "anon_read_sync_log" ON data_sync_log;
CREATE POLICY "anon_read_sync_log" ON data_sync_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sync_log" ON data_sync_log;
CREATE POLICY "auth_insert_sync_log" ON data_sync_log FOR INSERT
  TO authenticated WITH CHECK (true);
