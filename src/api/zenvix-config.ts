// ============================================================
// Zenvix Gateway Configuration — localStorage based (dev mode)
// Replace with Cloud secrets in production.
// ============================================================

import type { ZenvixConfig } from '@/types/zenvix';

const STORAGE_KEY = 'zenvix_gateway_config';

const DEFAULT_CONFIG: ZenvixConfig = {
  gatewayUrl: '',
  apiKey: '',
  tenantId: '',
  branchId: '',
  channel: 'ecommerce',
};

export function getZenvixConfig(): ZenvixConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveZenvixConfig(config: Partial<ZenvixConfig>): ZenvixConfig {
  const current = getZenvixConfig();
  const updated = { ...current, ...config, channel: 'ecommerce' as const };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearZenvixConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Returns true when gateway URL and API key are both set */
export function isZenvixConfigured(): boolean {
  const cfg = getZenvixConfig();
  return !!(cfg.gatewayUrl && cfg.apiKey && cfg.tenantId && cfg.branchId);
}
