// ============================================================
// Currency Conversion — IDR to USD with markup
// ============================================================
// Fetches the exchange rate from frankfurter.app once per 24 hours,
// caches in localStorage, and provides conversion utilities.
// Adds a configurable markup (default 10%) to the converted price.
// ============================================================

const CACHE_KEY = "bambu_exchange_rate";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MARKUP_PERCENT = 10; // 10% markup on converted price
const FALLBACK_RATE = 0.0000625; // ~1 USD = 16,000 IDR (safety fallback)

interface CachedRate {
  rate: number; // IDR → USD rate (e.g., 0.0000625 means 1 IDR = 0.0000625 USD)
  fetchedAt: number; // timestamp ms
}

/**
 * Get the cached exchange rate from localStorage.
 * Returns null if not cached or expired.
 */
function getCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedRate = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

/**
 * Save exchange rate to localStorage cache.
 */
function setCachedRate(rate: number): void {
  try {
    const cached: CachedRate = { rate, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // localStorage full or unavailable — non-critical
  }
}

/**
 * Fetch the IDR→USD exchange rate from frankfurter.app.
 * Uses cache-first strategy: returns cached value if fresh (< 24h),
 * otherwise fetches a new rate.
 *
 * On fetch failure, returns the fallback rate (hardcoded approximate).
 */
let _ratePromise: Promise<number> | null = null;

export async function getExchangeRate(): Promise<number> {
  // Return cached rate if fresh
  const cached = getCachedRate();
  if (cached) return cached.rate;

  // Deduplicate concurrent requests
  if (_ratePromise) return _ratePromise;

  _ratePromise = fetchRate();
  const rate = await _ratePromise;
  _ratePromise = null;
  return rate;
}

async function fetchRate(): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      "https://api.frankfurter.app/latest?from=IDR&to=USD",
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const rate = data.rates?.USD;

    if (typeof rate !== "number" || rate <= 0) {
      throw new Error("Invalid rate received");
    }

    setCachedRate(rate);
    return rate;
  } catch (err) {
    console.warn("[Currency] Failed to fetch exchange rate, using fallback:", err);
    // Use fallback but still cache it so we don't hammer the API
    setCachedRate(FALLBACK_RATE);
    return FALLBACK_RATE;
  }
}

/**
 * Convert an IDR price to USD with markup.
 * @param priceIDR - Price in Indonesian Rupiah
 * @param rate - IDR to USD exchange rate
 * @returns Price in USD (rounded to 2 decimal places) with markup applied
 */
export function convertIDRtoUSD(priceIDR: number, rate: number): number {
  const baseUSD = priceIDR * rate;
  const withMarkup = baseUSD * (1 + MARKUP_PERCENT / 100);
  return Math.round(withMarkup * 100) / 100; // Round to 2 decimal places
}

/**
 * Format a USD price for display.
 */
export function formatUSD(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Get the current exchange rate synchronously (from cache only).
 * Returns fallback if not cached. Use getExchangeRate() for async fresh fetch.
 */
export function getExchangeRateSync(): number {
  const cached = getCachedRate();
  return cached?.rate ?? FALLBACK_RATE;
}
