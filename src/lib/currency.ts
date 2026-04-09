/**
 * Derives currency info from browser geolocation (GPS → reverse geocode)
 * or falls back to Intl timezone detection.
 * No API keys required for either path.
 * Defaults to Indian Rupee (INR) when everything fails.
 */

export interface CurrencyInfo {
  code: string;    // e.g. "INR"
  symbol: string;  // e.g. "₹"
  region: string;  // e.g. "India"
  country: string; // e.g. "IN"
}

// ── Country code → currency ──────────────────────────────────────────────────
const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  IN: { code: 'INR', symbol: '₹',   region: 'India',          country: 'IN' },
  US: { code: 'USD', symbol: '$',   region: 'USA',            country: 'US' },
  CA: { code: 'CAD', symbol: 'C$',  region: 'Canada',         country: 'CA' },
  GB: { code: 'GBP', symbol: '£',   region: 'UK',             country: 'GB' },
  AU: { code: 'AUD', symbol: 'A$',  region: 'Australia',      country: 'AU' },
  NZ: { code: 'NZD', symbol: 'NZ$', region: 'New Zealand',    country: 'NZ' },
  JP: { code: 'JPY', symbol: '¥',   region: 'Japan',          country: 'JP' },
  CN: { code: 'CNY', symbol: '¥',   region: 'China',          country: 'CN' },
  HK: { code: 'HKD', symbol: 'HK$', region: 'Hong Kong',      country: 'HK' },
  KR: { code: 'KRW', symbol: '₩',   region: 'South Korea',    country: 'KR' },
  SG: { code: 'SGD', symbol: 'S$',  region: 'Singapore',      country: 'SG' },
  AE: { code: 'AED', symbol: 'AED', region: 'UAE',            country: 'AE' },
  SA: { code: 'SAR', symbol: 'SAR', region: 'Saudi Arabia',   country: 'SA' },
  ID: { code: 'IDR', symbol: 'Rp',  region: 'Indonesia',      country: 'ID' },
  TH: { code: 'THB', symbol: '฿',   region: 'Thailand',       country: 'TH' },
  MY: { code: 'MYR', symbol: 'RM',  region: 'Malaysia',       country: 'MY' },
  PH: { code: 'PHP', symbol: '₱',   region: 'Philippines',    country: 'PH' },
  PK: { code: 'PKR', symbol: '₨',   region: 'Pakistan',       country: 'PK' },
  BD: { code: 'BDT', symbol: '৳',   region: 'Bangladesh',     country: 'BD' },
  LK: { code: 'LKR', symbol: '₨',   region: 'Sri Lanka',      country: 'LK' },
  NP: { code: 'NPR', symbol: '₨',   region: 'Nepal',          country: 'NP' },
  BR: { code: 'BRL', symbol: 'R$',  region: 'Brazil',         country: 'BR' },
  MX: { code: 'MXN', symbol: 'MX$', region: 'Mexico',         country: 'MX' },
  AR: { code: 'ARS', symbol: '$',   region: 'Argentina',      country: 'AR' },
  ZA: { code: 'ZAR', symbol: 'R',   region: 'South Africa',   country: 'ZA' },
  NG: { code: 'NGN', symbol: '₦',   region: 'Nigeria',        country: 'NG' },
  KE: { code: 'KES', symbol: 'KSh', region: 'Kenya',          country: 'KE' },
  EG: { code: 'EGP', symbol: '£',   region: 'Egypt',          country: 'EG' },
  // Euro-zone
  DE: { code: 'EUR', symbol: '€',   region: 'Germany',        country: 'DE' },
  FR: { code: 'EUR', symbol: '€',   region: 'France',         country: 'FR' },
  ES: { code: 'EUR', symbol: '€',   region: 'Spain',          country: 'ES' },
  IT: { code: 'EUR', symbol: '€',   region: 'Italy',          country: 'IT' },
  NL: { code: 'EUR', symbol: '€',   region: 'Netherlands',    country: 'NL' },
  BE: { code: 'EUR', symbol: '€',   region: 'Belgium',        country: 'BE' },
  AT: { code: 'EUR', symbol: '€',   region: 'Austria',        country: 'AT' },
  PT: { code: 'EUR', symbol: '€',   region: 'Portugal',       country: 'PT' },
  IE: { code: 'EUR', symbol: '€',   region: 'Ireland',        country: 'IE' },
  FI: { code: 'EUR', symbol: '€',   region: 'Finland',        country: 'FI' },
  GR: { code: 'EUR', symbol: '€',   region: 'Greece',         country: 'GR' },
  SE: { code: 'SEK', symbol: 'kr',  region: 'Sweden',         country: 'SE' },
  NO: { code: 'NOK', symbol: 'kr',  region: 'Norway',         country: 'NO' },
  DK: { code: 'DKK', symbol: 'kr',  region: 'Denmark',        country: 'DK' },
  CH: { code: 'CHF', symbol: 'Fr',  region: 'Switzerland',    country: 'CH' },
  RU: { code: 'RUB', symbol: '₽',   region: 'Russia',         country: 'RU' },
  PL: { code: 'PLN', symbol: 'zł',  region: 'Poland',         country: 'PL' },
  CZ: { code: 'CZK', symbol: 'Kč',  region: 'Czech Republic', country: 'CZ' },
};

const DEFAULT_CURRENCY: CurrencyInfo = {
  code: 'INR', symbol: '₹', region: 'India', country: 'IN',
};

// ── Timezone fallback map ─────────────────────────────────────────────────────
const TIMEZONE_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT', 'Europe/Warsaw': 'PL', 'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK',
  'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
  'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA', 'Asia/Jakarta': 'ID', 'Asia/Bangkok': 'TH',
  'Asia/Kuala_Lumpur': 'MY', 'Asia/Manila': 'PH', 'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU', 'Pacific/Auckland': 'NZ',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
  'America/Argentina/Buenos_Aires': 'AR',
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE', 'Africa/Cairo': 'EG',
};

function fromTimezone(): CurrencyInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cc = TIMEZONE_COUNTRY[tz] ?? '';
    const found = cc.length > 0 ? COUNTRY_CURRENCY_MAP[cc] : undefined;
    return found ?? DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

// ── Geolocation + reverse-geocode (bigdatacloud, free, no API key) ────────────
async function fromGeolocation(): Promise<CurrencyInfo> {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      resolve(fromTimezone());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('geocode failed');
          const data = await res.json();
          const cc: string = data.countryCode?.toUpperCase() ?? '';
          const found = cc.length > 0 ? COUNTRY_CURRENCY_MAP[cc] : undefined;
          resolve(found ?? fromTimezone());
        } catch {
          resolve(fromTimezone());
        }
      },
      () => resolve(fromTimezone()),   // permission denied → timezone fallback
      { timeout: 6000, maximumAge: 300_000 }
    );
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Synchronous best-guess from Intl timezone. */
export function detectCurrency(): CurrencyInfo {
  return fromTimezone();
}

/**
 * Async: tries GPS geolocation first, falls back to timezone, then INR.
 * Call this on page load and cache the result.
 */
export async function resolveLocationCurrency(): Promise<CurrencyInfo> {
  return fromGeolocation();
}
