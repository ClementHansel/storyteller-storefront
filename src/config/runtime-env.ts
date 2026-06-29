/**
 * Runtime Environment Configuration
 *
 * Merges `window.__ENV__` (injected at container start via env-config.js)
 * with Vite's `import.meta.env`. Runtime values take precedence, enabling
 * configuration changes without rebuilding the Docker image.
 */

// ---------------------------------------------------------------------------
// Window augmentation for runtime-injected env vars
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __ENV__?: Record<string, string | undefined>;
  }
}

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Resolves an environment variable by checking `window.__ENV__` first
 * (runtime injection), then falling back to `import.meta.env` (build-time).
 */
export function getEnv(key: string): string | undefined {
  const runtime = typeof window !== "undefined" ? window.__ENV__?.[key] : undefined;
  if (runtime !== undefined && runtime !== "") {
    return runtime;
  }
  // Vite exposes env vars on import.meta.env as strings
  const buildTime = (import.meta.env as Record<string, string | undefined>)[key];
  return buildTime || undefined;
}

// ---------------------------------------------------------------------------
// Typed getters for all VITE_* variables used by the storefront
// ---------------------------------------------------------------------------

/** Zenvix API base URL (e.g. http://150.109.15.108:3001/api/retail/public) */
export function getZenvixApiUrl(): string {
  return getEnv("VITE_ZENVIX_API_URL") ?? "";
}

/** Zenvix tenant identifier */
export function getZenvixTenantId(): string {
  return getEnv("VITE_ZENVIX_TENANT_ID") ?? "";
}

/** Zenvix OAuth client ID */
export function getZenvixClientId(): string {
  return getEnv("VITE_ZENVIX_CLIENT_ID") ?? "";
}

/** Zenvix OAuth client secret */
export function getZenvixClientSecret(): string {
  return getEnv("VITE_ZENVIX_CLIENT_SECRET") ?? "";
}

/** Channel Record ID for marketing attribution */
export function getZenvixChannelRecordId(): string {
  return getEnv("VITE_ZENVIX_CHANNEL_RECORD_ID") ?? "";
}

/** Zenvix branch identifier */
export function getZenvixBranchId(): string {
  return getEnv("VITE_ZENVIX_BRANCH_ID") ?? "";
}

/** Zenvix API key for authenticated requests */
export function getZenvixApiKey(): string {
  return getEnv("VITE_ZENVIX_API_KEY") ?? "";
}

/** WhatsApp office phone number for customer support links */
export function getWhatsAppOfficePhone(): string {
  return getEnv("VITE_WHATSAPP_OFFICE_PHONE") ?? "";
}

// ---------------------------------------------------------------------------
// Configuration validation
// ---------------------------------------------------------------------------

/**
 * Returns `true` when all 4 required Zenvix env vars are present and non-empty.
 * Logs a console warning when configuration is incomplete.
 */
export function isZenvixConfigured(): boolean {
  const url = getZenvixApiUrl();
  const tenantId = getZenvixTenantId();
  const clientId = getZenvixClientId();
  const clientSecret = getZenvixClientSecret();

  const configured = !!(url && tenantId && clientId && clientSecret);
  if (!configured) {
    console.warn(
      '[Bambu Silver] Zenvix configuration incomplete. Missing required env vars. Falling back to mock data.'
    );
  }
  return configured;
}

// ---------------------------------------------------------------------------
// Reachability check (5-second timeout)
// ---------------------------------------------------------------------------

/** Cached reachability result so we only check once per page load */
let _reachabilityChecked = false;
let _isReachable = true;

/**
 * Attempts a lightweight GET request to the Zenvix API URL with a 5-second
 * timeout. Returns `true` if the API responds, `false` if unreachable.
 * The result is cached — subsequent calls return the cached value.
 */
export async function checkZenvixReachable(): Promise<boolean> {
  if (_reachabilityChecked) {
    return _isReachable;
  }

  const url = getZenvixApiUrl();
  if (!url) {
    _reachabilityChecked = true;
    _isReachable = false;
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const baseUrl = url.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/products?pageSize=1`, {
      method: 'GET',
      signal: controller.signal,
    });
    _isReachable = response.ok || response.status < 500;
  } catch {
    console.warn(
      '[Bambu Silver] Zenvix API unreachable (5s timeout). Falling back to mock data.'
    );
    _isReachable = false;
  } finally {
    clearTimeout(timeoutId);
    _reachabilityChecked = true;
  }

  return _isReachable;
}

/**
 * Resets the reachability cache. Useful for testing or when configuration changes.
 */
export function resetReachabilityCache(): void {
  _reachabilityChecked = false;
  _isReachable = true;
}
