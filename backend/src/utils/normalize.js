/**
 * Vidarbha district reference data.
 * Used for filtering and normalizing official mandi records.
 * Must stay in sync with src/data/vidarbha.ts on the frontend.
 */

export const VIDARBHA_DISTRICTS = [
  'nagpur',
  'wardha',
  'bhandara',
  'gondia',
  'chandrapur',
  'gadchiroli',
  'amravati',
  'akola',
  'buldhana',
  'washim',
  'yavatmal',
];

// Maps various official spellings to our canonical district IDs
const DISTRICT_ALIASES = {
  nagpur: ['nagpur', 'nagpore'],
  wardha: ['wardha'],
  bhandara: ['bhandara'],
  gondia: ['gondia', 'gondiya'],
  chandrapur: ['chandrapur', 'chanda'],
  gadchiroli: ['gadchiroli'],
  amravati: ['amravati', 'amrawati'],
  akola: ['akola'],
  buldhana: ['buldhana'],
  washim: ['washim'],
  yavatmal: ['yavatmal', 'yeotmal'],
};

const aliasMap = new Map();
for (const [canonical, aliases] of Object.entries(DISTRICT_ALIASES)) {
  for (const a of aliases) aliasMap.set(a.toLowerCase().trim(), canonical);
}

export function normalizeDistrict(rawDistrict) {
  if (!rawDistrict) return null;
  const key = String(rawDistrict).toLowerCase().trim();
  return aliasMap.get(key) ?? null;
}

export function isVidarbhaDistrict(rawDistrict) {
  return normalizeDistrict(rawDistrict) !== null;
}

// Maps various commodity names from official data to our crop IDs
const COMMODITY_ALIASES = {
  soybean: ['soybean', 'soya bean', 'soyabean'],
  cotton: ['cotton', 'kapas', 'rui'],
  tur: ['tur', 'tur (arhar)', 'arhar', 'tur dal', 'red gram'],
  paddy: ['paddy', 'paddy (common)', 'paddy(d common)', 'rice', 'chawal'],
  wheat: ['wheat', 'gehun', 'gahu'],
  gram: ['gram', 'chana', 'bengal gram'],
  jowar: ['jowar', 'jwar', 'sorghum'],
  maize: ['maize', 'makka', 'corn'],
  groundnut: ['groundnut', 'bhui mogra', 'ground nut'],
  sunflower: ['sunflower', 'surajmukhi'],
  moong: ['moong', 'mung', 'green gram'],
  udid: ['udid', 'urad', 'black gram'],
  onion: ['onion', 'kanda'],
  tomato: ['tomato', 'tamatar'],
  orange: ['orange', 'santre', 'santra'],
};

const commodityMap = new Map();
for (const [canonical, aliases] of Object.entries(COMMODITY_ALIASES)) {
  for (const a of aliases) commodityMap.set(a.toLowerCase().trim(), canonical);
}

export function normalizeCommodity(rawCommodity) {
  if (!rawCommodity) return null;
  const key = String(rawCommodity).toLowerCase().trim();
  return commodityMap.get(key) ?? null;
}

// Market name normalization — strips suffixes like "APMC", "Market", "Mandi"
export function normalizeMarketName(rawMarket) {
  if (!rawMarket) return '';
  return String(rawMarket)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bMarket Committee\b/i, '')
    .replace(/\bAPMC\b/i, '')
    .replace(/\bMarket\b/i, '')
    .replace(/\bMandi\b/i, '')
    .trim();
}

/**
 * Parse a date that may be in DD/MM/YYYY, MM/DD/YYYY, or ISO format.
 * Returns YYYY-MM-DD or null if unparseable.
 */
export function normalizeDate(rawDate) {
  if (!rawDate) return null;
  const s = String(rawDate).trim();

  // ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // DD/MM/YYYY (common in Indian government data)
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // DD-MM-YYYY
  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyDash) {
    const [, dd, mm, yyyy] = dmyDash;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Parse a price value that may be a string or number.
 * Returns null for invalid/empty values.
 */
export function normalizePrice(rawPrice) {
  if (rawPrice == null) return null;
  if (typeof rawPrice === 'number') {
    return Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : null;
  }
  const s = String(rawPrice).trim().replace(/[₹,\s]/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Full normalization of a raw mandi record from any source.
 * Returns null if the record is not from Maharashtra/Vidarbha or has invalid data.
 */
export function normalizeRecord(raw) {
  const state = String(raw.state ?? '').trim();

  // Must be Maharashtra
  if (state.toLowerCase() !== 'maharashtra') return null;

  const districtId = normalizeDistrict(raw.district);
  if (!districtId) return null; // Not a Vidarbha district

  const cropId = normalizeCommodity(raw.commodity ?? raw.commodity_name);
  if (!cropId) return null; // Not a supported crop

  const marketName = normalizeMarketName(raw.market ?? raw.market_name ?? raw.mandi_name ?? '');
  if (!marketName) return null;

  const minPrice = normalizePrice(raw.min_price ?? raw.minPrice);
  const maxPrice = normalizePrice(raw.max_price ?? raw.maxPrice);
  const modalPrice = normalizePrice(raw.modal_price ?? raw.modalPrice);

  // At least modal price should be valid
  if (modalPrice == null && minPrice == null && maxPrice == null) return null;

  const arrivalDate = normalizeDate(raw.arrival_date ?? raw.price_date ?? raw.date);
  if (!arrivalDate) return null;

  return {
    state: 'Maharashtra',
    region: 'Vidarbha',
    districtId,
    districtName: String(raw.district).trim(),
    marketName,
    commodityId: cropId,
    commodityName: String(raw.commodity ?? raw.commodity_name ?? '').trim(),
    variety: raw.variety ? String(raw.variety).trim() || null : null,
    minPrice,
    maxPrice,
    modalPrice,
    unit: 'quintal',
    arrivalDate,
    source: raw.source ?? 'Government of India — Open Government Data / AGMARKNET',
    sourceUrl: raw.source_url ?? null,
    lastUpdated: raw.last_updated ?? new Date().toISOString(),
  };
}
