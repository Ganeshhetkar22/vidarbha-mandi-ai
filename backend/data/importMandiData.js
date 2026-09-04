/**
 * CSV import utility for official mandi price data.
 *
 * Usage:
 *   node backend/data/importMandiData.js <path-to-csv> [--dry-run]
 *
 * The CSV should be downloaded from data.gov.in / AGMARKNET and contain
 * columns like: state, district, market, commodity, variety, arrival_date,
 * min_price, max_price, modal_price
 *
 * The import process:
 * 1. Reads CSV
 * 2. Normalizes columns
 * 3. Filters to Maharashtra
 * 4. Filters to the 11 Vidarbha districts
 * 5. Validates prices
 * 6. Normalizes dates
 * 7. Removes duplicates
 * 8. Inserts/updates Supabase records via the Supabase service role
 * 9. Prints import statistics
 *
 * This script uses the Supabase REST API directly (not the JS client)
 * so it has zero external dependencies beyond Node 18+ (built-in fetch).
 */

import { readFileSync } from 'node:fs';
import {
  normalizeRecord,
  isVidarbhaDistrict,
} from '../src/utils/normalize.js';

// Minimal CSV parser — handles quoted fields and commas inside quotes
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = parseCSVLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

async function upsertToSupabase(records) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  }

  // Insert in batches of 500
  const batchSize = 500;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    // Use upsert with on-conflict to avoid duplicates
    const response = await fetch(`${supabaseUrl}/rest/v1/mandi_prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
        'Content-Profile': 'public',
        'On-Conflict': 'district_id,mandi_id,crop_id,price_date',
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Supabase insert failed (${response.status}):`, text.substring(0, 200));
      skipped += batch.length;
      continue;
    }

    const result = await response.json();
    inserted += Array.isArray(result) ? result.length : 0;
  }

  return { inserted, updated, skipped };
}

async function importCSV(csvPath, { dryRun = false } = {}) {
  console.log(`\n  Vidarbha Mandi AI — CSV Import`);
  console.log(`  ==============================\n`);
  console.log(`  File: ${csvPath}`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}\n`);

  const text = readFileSync(csvPath, 'utf-8');
  const rawRows = parseCSV(text);

  let stats = {
    recordsRead: rawRows.length,
    maharashtraRecords: 0,
    vidarbhaRecords: 0,
    validRecords: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  // Step 1-2: Parse and normalize
  console.log(`  Records read: ${stats.recordsRead}`);

  // Step 3: Filter Maharashtra
  const mhRows = rawRows.filter((r) => {
    const state = String(r.state ?? '').trim().toLowerCase();
    return state === 'maharashtra';
  });
  stats.maharashtraRecords = mhRows.length;
  console.log(`  Maharashtra records: ${stats.maharashtraRecords}`);

  // Step 4-6: Filter Vidarbha, validate, normalize
  const normalized = [];
  for (const row of mhRows) {
    const rec = normalizeRecord({
      state: row.state,
      district: row.district,
      market: row.market ?? row.market_name,
      commodity: row.commodity ?? row.commodity_name,
      variety: row.variety,
      min_price: row.min_price,
      max_price: row.max_price,
      modal_price: row.modal_price,
      arrival_date: row.arrival_date,
      source: 'Government of India — Open Government Data / AGMARKNET',
    });

    if (rec) {
      normalized.push(rec);
    }
  }
  stats.vidarbhaRecords = normalized.length;
  console.log(`  Vidarbha records: ${stats.vidarbhaRecords}`);

  // Step 7: Remove duplicates (same district + market + commodity + date)
  const seen = new Set();
  const deduped = [];
  for (const rec of normalized) {
    const key = `${rec.districtId}|${rec.marketName.toLowerCase()}|${rec.commodityId}|${rec.arrivalDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(rec);
  }
  stats.validRecords = deduped.length;
  console.log(`  Valid records (after dedup): ${stats.validRecords}`);

  if (deduped.length === 0) {
    console.log('\n  No valid Vidarbha records found in this file.\n');
    return stats;
  }

  // Map to Supabase schema
  const dbRecords = deduped.map((r) => ({
    district_id: r.districtId,
    mandi_id: r.marketName.toLowerCase().replace(/\s+/g, '-'),
    mandi_name: r.marketName,
    crop_id: r.commodityId,
    crop_name: r.commodityName,
    variety: r.variety,
    min_price: r.minPrice,
    max_price: r.maxPrice,
    modal_price: r.modalPrice,
    price_date: r.arrivalDate,
    source: r.source,
    source_url: r.sourceUrl,
  }));

  // Step 8: Insert/update
  if (dryRun) {
    console.log('\n  [DRY RUN] Skipping database writes.');
    console.log(`  Would insert/update: ${dbRecords.length} records.\n`);
    return stats;
  }

  console.log('\n  Writing to Supabase...');
  const writeResult = await upsertToSupabase(dbRecords);
  stats.inserted = writeResult.inserted;
  stats.updated = writeResult.updated;
  stats.skipped = writeResult.skipped;

  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Updated: ${stats.updated}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log('\n  Import complete.\n');

  return stats;
}

// CLI entry point
const csvPath = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!csvPath) {
  console.error('Usage: node backend/data/importMandiData.js <path-to-csv> [--dry-run]');
  process.exit(1);
}

importCSV(csvPath, { dryRun }).catch((err) => {
  console.error('\n  Import failed:', err.message);
  process.exit(1);
});
