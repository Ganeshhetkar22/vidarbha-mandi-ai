/**
 * Supabase REST API client for the backend.
 *
 * Uses the service role key (server-side only — never exposed to frontend)
 * to read/write data in Supabase Postgres tables.
 *
 * The frontend also reads directly from Supabase using the anon key,
 * but the backend needs the service role to:
 *   1. Upsert mandi price data from data.gov.in
 *   2. Trigger and store ML predictions
 *   3. Sync weather data
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — backend DB operations will fail');
}

const baseHeaders = {
  'Content-Type': 'application/json',
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Profile': 'public',
};

/**
 * SELECT rows from a table with optional filters and ordering.
 */
export async function selectFrom(table, { filters = {}, order, limit, ascending = true } = {}) {
  const params = new URLSearchParams();
  const columns = '*';

  let filterQuery = '';
  for (const [key, value] of Object.entries(filters)) {
    if (value != null) {
      filterQuery += `&${key}=eq.${encodeURIComponent(value)}`;
    }
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}${filterQuery}`;
  let finalUrl = url;
  if (order) {
    finalUrl += `&order=${order.column}.${ascending ? 'asc' : 'desc'}`;
  }
  if (limit) {
    finalUrl += `&limit=${limit}`;
  }

  const response = await fetch(finalUrl, { headers: baseHeaders });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase SELECT ${table} failed (${response.status}): ${text.substring(0, 200)}`);
  }
  return await response.json();
}

/**
 * SELECT with a date range filter (gte/lte).
 */
export async function selectWithDateRange(table, { filters = {}, dateColumn, dateFrom, dateTo, order, limit, ascending = true } = {}) {
  const columns = '*';
  let filterQuery = '';

  for (const [key, value] of Object.entries(filters)) {
    if (value != null) {
      filterQuery += `&${key}=eq.${encodeURIComponent(value)}`;
    }
  }

  if (dateFrom) {
    filterQuery += `&${dateColumn}=gte.${dateFrom}`;
  }
  if (dateTo) {
    filterQuery += `&${dateColumn}=lte.${dateTo}`;
  }

  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}${filterQuery}`;
  if (order) {
    url += `&order=${order.column}.${ascending ? 'asc' : 'desc'}`;
  }
  if (limit) {
    url += `&limit=${limit}`;
  }

  const response = await fetch(url, { headers: baseHeaders });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase SELECT ${table} failed (${response.status}): ${text.substring(0, 200)}`);
  }
  return await response.json();
}

/**
 * UPSERT rows into a table with conflict resolution.
 */
export async function upsertToTable(table, rows, conflictColumns) {
  const headers = {
    ...baseHeaders,
    Prefer: 'resolution=merge-duplicates',
  };
  if (conflictColumns) {
    headers['On-Conflict'] = conflictColumns.join(',');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase UPSERT ${table} failed (${response.status}): ${text.substring(0, 200)}`);
  }

  return response.status === 204 ? [] : await response.json().catch(() => []);
}

/**
 * DELETE rows matching filters.
 */
export async function deleteFrom(table, filters) {
  let filterQuery = '';
  for (const [key, value] of Object.entries(filters)) {
    if (value != null) {
      filterQuery += `&${key}=eq.${encodeURIComponent(value)}`;
    }
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${filterQuery.slice(1)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: baseHeaders,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase DELETE ${table} failed (${response.status}): ${text.substring(0, 200)}`);
  }
}

/**
 * Get a single row (latest by some column) or null.
 */
export async function getLatestRow(table, { filters = {}, orderColumn, ascending = false } = {}) {
  const params = new URLSearchParams();
  let filterQuery = '';
  for (const [key, value] of Object.entries(filters)) {
    if (value != null) {
      filterQuery += `&${key}=eq.${encodeURIComponent(value)}`;
    }
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1${filterQuery}&order=${orderColumn}.${ascending ? 'asc' : 'desc'}`;
  const response = await fetch(url, { headers: baseHeaders });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase SELECT ${table} failed (${response.status}): ${text.substring(0, 200)}`);
  }
  const rows = await response.json();
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get distinct values for a column.
 */
export async function getDistinctValues(table, column, { filters = {} } = {}) {
  let filterQuery = '';
  for (const [key, value] of Object.entries(filters)) {
    if (value != null) {
      filterQuery += `&${key}=eq.${encodeURIComponent(value)}`;
    }
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${column}${filterQuery}`;
  const response = await fetch(url, { headers: baseHeaders });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase SELECT ${table} failed (${response.status}): ${text.substring(0, 200)}`);
  }
  const rows = await response.json();
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const val = row[column];
    if (val != null && !seen.has(val)) {
      seen.add(val);
      result.push(val);
    }
  }
  return result;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}
