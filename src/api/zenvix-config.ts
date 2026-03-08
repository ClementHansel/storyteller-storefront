// ============================================================
// Zenvix Gateway Configuration — localStorage based (dev mode)
// Replace with Cloud secrets in production.
// ============================================================

import type { ZenvixConfig } from "@/types/zenvix";

const STORAGE_KEY = "zenvix_gateway_config";

const DEFAULT_CONFIG: ZenvixConfig = {
  gatewayUrl: import.meta.env.VITE_ZENVIX_API_URL || "",
  tenantId: import.meta.env.VITE_ZENVIX_TENANT_ID || "",
  clientId: import.meta.env.VITE_ZENVIX_CLIENT_ID || "",
  clientSecret: import.meta.env.VITE_ZENVIX_CLIENT_SECRET || "",
  channel: "ecommerce",
};

export function getZenvixConfig(): ZenvixConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const local = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_CONFIG,
      ...local,
      // Always prioritize ENV if set
      gatewayUrl: import.meta.env.VITE_ZENVIX_API_URL || local.gatewayUrl || "",
      tenantId: import.meta.env.VITE_ZENVIX_TENANT_ID || local.tenantId || "",
      clientId: import.meta.env.VITE_ZENVIX_CLIENT_ID || local.clientId || "",
      clientSecret:
        import.meta.env.VITE_ZENVIX_CLIENT_SECRET || local.clientSecret || "",
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveZenvixConfig(config: Partial<ZenvixConfig>): ZenvixConfig {
  const current = getZenvixConfig();
  const updated = { ...current, ...config, channel: "ecommerce" as const };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearZenvixConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Returns true when gateway URL and all required IDs/Secrets are set */
export function isZenvixConfigured(): boolean {
  const cfg = getZenvixConfig();
  return !!(cfg.gatewayUrl && cfg.tenantId && cfg.clientId && cfg.clientSecret);
}
