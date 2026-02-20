// ============================================================
// EcommerceHub API — BambuSilver ↔ Zenvix backend
// Calls the new retail/ecommerce-hub/* endpoints.
// ============================================================

import { getZenvixConfig } from './zenvix-config';

// ── Types ─────────────────────────────────────────────────────

export interface EcommerceConnectorRecord {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  platform: string;
  domain: string;
  status: 'active' | 'revoked' | 'suspended';
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorCreateResult {
  connector: EcommerceConnectorRecord;
  /** Shown ONCE — store securely */
  plainApiKey: string;
  warning: string;
}

export interface ChannelRecord {
  id: string;
  companyId: string;
  name: string;
  type: string;
  adapterType: string;
  status: string;
  syncFrequency: string;
  lastSyncAt?: string | null;
  webhookUrl?: string | null;
  credentials?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelCreateResult {
  channel: ChannelRecord;
  plainClientId: string;
  plainClientSecret: string;
  warning: string;
}

export interface CreateConnectorPayload {
  name: string;
  platform: string;
  domain: string;
  branchId?: string;
  settings?: Record<string, unknown>;
}

export interface CreateChannelPayload {
  name: string;
  type: string;
  adapterType?: string;
  syncFrequency?: string;
  webhookUrl?: string;
  settings?: Record<string, unknown>;
}

export interface TestResult {
  reachable: boolean;
  latencyMs: number;
  error?: string;
}

// ── Internal helpers ───────────────────────────────────────────

function buildHeaders(): HeadersInit {
  const cfg = getZenvixConfig();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.apiKey}`,
    'x-tenant-id': cfg.tenantId,
    'x-branch-id': cfg.branchId,
  };
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = getZenvixConfig();
  if (!cfg.gatewayUrl || !cfg.apiKey) {
    throw new Error('Zenvix gateway not configured — visit Admin settings first.');
  }
  const url = `${cfg.gatewayUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(`[EcommerceHub] ${res.status}: ${message}`);
  }
  const json = await res.json();
  return json.data as T;
}

// ── EcommerceConnector API ─────────────────────────────────────

export async function listConnectors(): Promise<EcommerceConnectorRecord[]> {
  return apiFetch<EcommerceConnectorRecord[]>('retail/ecommerce-hub/connectors');
}

export async function getConnector(id: string): Promise<EcommerceConnectorRecord> {
  return apiFetch<EcommerceConnectorRecord>(`retail/ecommerce-hub/connectors/${id}`);
}

export async function createConnector(payload: CreateConnectorPayload): Promise<ConnectorCreateResult> {
  return apiFetch<ConnectorCreateResult>('retail/ecommerce-hub/connectors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateConnector(
  id: string,
  payload: Partial<CreateConnectorPayload> & { status?: string },
): Promise<EcommerceConnectorRecord> {
  return apiFetch<EcommerceConnectorRecord>(`retail/ecommerce-hub/connectors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteConnector(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`retail/ecommerce-hub/connectors/${id}`, {
    method: 'DELETE',
  });
}

export async function rotateConnectorKey(id: string): Promise<{ plainApiKey: string; warning: string }> {
  return apiFetch<{ plainApiKey: string; warning: string }>(
    `retail/ecommerce-hub/connectors/${id}/rotate-key`,
    { method: 'POST' },
  );
}

export async function testConnector(id: string): Promise<TestResult> {
  return apiFetch<TestResult>(`retail/ecommerce-hub/connectors/${id}/test`, {
    method: 'POST',
  });
}

// ── RetailChannel API ──────────────────────────────────────────

export async function listChannels(): Promise<ChannelRecord[]> {
  return apiFetch<ChannelRecord[]>('retail/ecommerce-hub/channels');
}

export async function getChannel(id: string): Promise<ChannelRecord> {
  return apiFetch<ChannelRecord>(`retail/ecommerce-hub/channels/${id}`);
}

export async function createChannel(payload: CreateChannelPayload): Promise<ChannelCreateResult> {
  return apiFetch<ChannelCreateResult>('retail/ecommerce-hub/channels', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateChannel(
  id: string,
  payload: Partial<CreateChannelPayload> & { status?: string },
): Promise<ChannelRecord> {
  return apiFetch<ChannelRecord>(`retail/ecommerce-hub/channels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteChannel(id: string): Promise<{ deleted: boolean }> {
  return apiFetch<{ deleted: boolean }>(`retail/ecommerce-hub/channels/${id}`, {
    method: 'DELETE',
  });
}

export async function rotateChannelCredentials(
  id: string,
): Promise<{ plainClientId: string; plainClientSecret: string; warning: string }> {
  return apiFetch<{ plainClientId: string; plainClientSecret: string; warning: string }>(
    `retail/ecommerce-hub/channels/${id}/rotate-credentials`,
    { method: 'POST' },
  );
}

export async function revokeChannelCredentials(id: string): Promise<{ revoked: boolean }> {
  return apiFetch<{ revoked: boolean }>(
    `retail/ecommerce-hub/channels/${id}/revoke-credentials`,
    { method: 'POST' },
  );
}
