-- Add indexes for efficient mandi price queries
-- These support the frontend's filter patterns: by district, crop, mandi, date

CREATE INDEX IF NOT EXISTS idx_mandi_prices_district_crop
  ON mandi_prices (district_id, crop_id, price_date DESC);

CREATE INDEX IF NOT EXISTS idx_mandi_prices_district_mandi_crop
  ON mandi_prices (district_id, mandi_id, crop_id, price_date DESC);

CREATE INDEX IF NOT EXISTS idx_mandi_prices_price_date
  ON mandi_prices (price_date DESC);

CREATE INDEX IF NOT EXISTS idx_mandi_prices_crop
  ON mandi_prices (crop_id);

-- Add a unique constraint to prevent duplicate records for the same
-- district + mandi + crop + date combination
CREATE UNIQUE INDEX IF NOT EXISTS uniq_mandi_prices_dmc_date
  ON mandi_prices (district_id, mandi_id, crop_id, price_date);
