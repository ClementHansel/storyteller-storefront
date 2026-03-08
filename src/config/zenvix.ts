/**
 * Zenvix Retail Module Configuration
 * Centralized credentials for the ecommerce storefront.
 */

export const ZENVIX_CONFIG = {
  tenantId: import.meta.env.VITE_ZENVIX_TENANT_ID || '',
  branchId: import.meta.env.VITE_ZENVIX_BRANCH_ID || '',
  gatewayUrl: import.meta.env.VITE_ZENVIX_GATEWAY_URL || 'http://localhost:8081/api/retail/events',
  clientId: import.meta.env.VITE_ZENVIX_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_ZENVIX_CLIENT_SECRET || '',
  apiKey: import.meta.env.VITE_ZENVIX_API_KEY || '',
  channelRecordId: import.meta.env.VITE_ZENVIX_CHANNEL_RECORD_ID || '441b1602-e2aa-45a8-bb4e-589fa6ec89ad',
  channel: 'ecommerce' as const,
};

export const isZenvixReady = !!(
  ZENVIX_CONFIG.tenantId &&
  ZENVIX_CONFIG.gatewayUrl &&
  ZENVIX_CONFIG.clientId &&
  ZENVIX_CONFIG.clientSecret
);
