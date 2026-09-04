/**
 * data.gov.in OGD API client.
 *
 * Official dataset: "Current Daily Price of Various Commodities
 * from Various Markets (Mandi)"
 * Resource ID: 9ef84268-d588-465a-a308-a864a43d0070
 *
 * API endpoint: https://api.data.gov.in/resource/{resource_id}
 * Required params:
 *   api-key  — free key from https://data.gov.in (request one)
 *   format   — json
 * Optional params:
 *   offset   — pagination start (default 0)
 *   limit    — records per page (max 1000)
 *   filters[field] — filter by field value, e.g. filters[state]=Maharashtra
 *
 * The API key is read from DATA_GOV_API_KEY env var and NEVER exposed
 * to the frontend.
 */

import { VIDARBHA_DISTRICTS } from '../utils/normalize.js';

const DEFAULT_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = 'https://api.data.gov.in/resource';

export async function fetchMandiDataFromGov({ districts, commodity, limit = 1000, offset = 0 } = {}) {
  const apiKey = process.env.DATA_GOV_API_KEY;
  const resourceId = process.env.DATA_GOV_RESOURCE_ID || DEFAULT_RESOURCE_ID;

  if (!apiKey) {
    return {
      available: false,
      message: 'DATA_GOV_API_KEY not configured. Request a free key at https://data.gov.in',
    };
  }

  const url = new URL(`${BASE_URL}/${resourceId}`);
  url.searchParams.set('api-key', apiKey);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));

  // Always filter to Maharashtra
  url.searchParams.set('filters[state]', 'Maharashtra');

  if (commodity) {
    url.searchParams.set('filters[commodity]', commodity);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`data.gov.in API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.records || !Array.isArray(data.records)) {
    return { available: true, records: [], total: 0 };
  }

  // Further filter to Vidarbha districts if specified
  let records = data.records;
  if (districts && districts.length > 0) {
    const districtSet = new Set(districts.map((d) => d.toLowerCase()));
    records = records.filter((r) => {
      const d = String(r.district ?? '').toLowerCase().trim();
      return districtSet.has(d);
    });
  }

  return {
    available: true,
    records,
    total: data.total ?? records.length,
    offset,
    limit,
  };
}

/**
 * Fetch all pages for Maharashtra, filtering to Vidarbha districts.
 * Returns an array of raw records.
 */
export async function fetchAllVidarbhaRecords({ onProgress } = {}) {
  const allRecords = [];
  let offset = 0;
  const limit = 1000;
  let total = Infinity;

  while (offset < total) {
    const result = await fetchMandiDataFromGov({
      limit,
      offset,
      districts: VIDARBHA_DISTRICTS,
    });
    if (!result.available) {
      return { available: false, message: result.message, records: [] };
    }

    total = result.total;
    allRecords.push(...result.records);

    if (onProgress) onProgress({ fetched: allRecords.length, total });

    offset += limit;
    if (result.records.length === 0) break;
  }

  return { available: true, records: allRecords, total: allRecords.length };
}
