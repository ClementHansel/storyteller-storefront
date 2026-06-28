// ============================================================
// Zenvix Gateway Configuration — localStorage based (dev mode)
// Replace with Cloud secrets in production.
// ============================================================

import type { ZenvixConfig } from "@/types/zenvix";
import {
  getZenvixApiUrl,
  getZenvixTenantId,
  getZenvixClientId,
  getZenvixClientSecret,
  getZenvixApiKey,
  getZenvixBranchId,
  isZenvixConfigured as isRuntimeConfigured,
  checkZenvixReachable,
} from "@/config/runtime-env";

const STORAGE_KEY = "zenvix_gateway_config";

const DEFAULT_CONFIG: ZenvixConfig = {
  gatewayUrl: getZenvixApiUrl(),
  tenantId: getZenvixTenantId(),
  clientId: getZenvixClientId(),
  clientSecret: getZenvixClientSecret(),
  apiKey: getZenvixApiKey() || undefined,
  branchId: getZenvixBranchId() || undefined,
  channel: "ecommerce",
};

export function getZenvixConfig(): ZenvixConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const local = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_CONFIG,
      ...local,
      // Always prioritize runtime env (window.__ENV__ > import.meta.env > localStorage)
      gatewayUrl: getZenvixApiUrl() || local.gatewayUrl || "",
      tenantId: getZenvixTenantId() || local.tenantId || "",
      clientId: getZenvixClientId() || local.clientId || "",
      clientSecret: getZenvixClientSecret() || local.clientSecret || "",
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
  return isRuntimeConfigured();
}

/**
 * Checks whether Zenvix API is reachable (5-second timeout).
 * Falls back to mock data if unreachable. Result is cached per page load.
 */
export { checkZenvixReachable };
