// ============================================================
// Zenvix Audit Logger — Structured Audit Trail for Order Actions
// ============================================================
// Sends structured audit entries to the Zenvix API for all order
// lifecycle events. Non-blocking: failures are queued silently
// without affecting primary operations.
//
// Requirements: 10.1, 10.2, 10.3, 10.5, 10.6
// ============================================================

import { getZenvixApiUrl } from '@/config/runtime-env';
import { getZenvixConfig, isZenvixConfigured } from '@/api/zenvix-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'order.created'
  | 'stage.transition'
  | 'payment.confirmed'
  | 'order.completed';

export interface AuditActor {
  id: string;
  type: 'customer' | 'admin';
}

export interface AuditEntry {
  action: AuditAction;
  order_id: string;
  trace_id: string;
  actor: AuditActor;
  timestamp: string; // ISO 8601 UTC
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIT_QUEUE_KEY = 'zenvix_audit_queue';
const BASE_DELAY_MS = 2000;
const MAX_RETRIES = 5;

// ---------------------------------------------------------------------------
// UUID Generation
// ---------------------------------------------------------------------------

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Exponential Backoff
// ---------------------------------------------------------------------------

/**
 * Calculates the delay for a retry attempt using exponential backoff.
 * Returns baseDelay × 2^retries.
 */
export function calculateAuditBackoffDelay(retries: number, baseDelay = BASE_DELAY_MS): number {
  return baseDelay * Math.pow(2, retries);
}

// ---------------------------------------------------------------------------
// Audit Queue Entry
// ---------------------------------------------------------------------------

export interface AuditQueueEntry {
  id: string;
  entry: AuditEntry;
  retries: number;
  maxRetries: number;
  nextRetryAt: number; // Timestamp (ms since epoch)
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Audit Queue Management
// ---------------------------------------------------------------------------

function loadAuditQueue(): AuditQueueEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAuditQueue(queue: AuditQueueEntry[]): void {
  try {
    localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.warn('[Zenvix Audit Logger] Failed to persist audit queue to localStorage.');
  }
}

function addToAuditQueue(entry: AuditEntry): void {
  const queue = loadAuditQueue();
  queue.push({
    id: generateUUID(),
    entry,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + calculateAuditBackoffDelay(0),
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  saveAuditQueue(queue);
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------

function buildAuthHeaders(): Record<string, string> {
  const config = getZenvixConfig();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': config.tenantId,
    'x-client-id': config.clientId,
    'x-client-secret': config.clientSecret,
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  return headers;
}

function getAuditEndpoint(): string {
  const baseUrl = getZenvixApiUrl().replace(/\/$/, '');
  return `${baseUrl}/events/orders`;
}

// ---------------------------------------------------------------------------
// Core: logAudit
// ---------------------------------------------------------------------------

/**
 * Sends an audit entry to the Zenvix API.
 *
 * - Non-blocking: catches all errors and queues silently
 * - On success: entry is sent and discarded
 * - On failure: entry is added to the audit queue for retry
 * - Never throws — safe to call in any context without try/catch
 *
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  // If Zenvix is not configured, queue for later
  if (!isZenvixConfigured()) {
    addToAuditQueue(entry);
    return;
  }

  const url = getAuditEndpoint();
  const headers = buildAuthHeaders();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event_type: `audit.${entry.action}`,
        ...entry,
      }),
    });

    if (response.ok) {
      // Audit entry sent successfully
      return;
    }

    // Non-2xx response — queue for retry
    addToAuditQueue(entry);
  } catch {
    // Network error — queue for retry silently
    addToAuditQueue(entry);
  }
}

// ---------------------------------------------------------------------------
// Factory: createAuditEntry
// ---------------------------------------------------------------------------

/**
 * Factory function that creates a well-formed AuditEntry with ISO 8601 UTC
 * timestamp and structured actor.
 *
 * @param action - The audit action type
 * @param orderId - The local order ID
 * @param traceId - The trace ID (UUID) for correlation across order events
 * @param actor - The actor performing the action
 * @param metadata - Optional action-specific metadata (from_stage/to_stage, amount, etc.)
 */
export function createAuditEntry(
  action: AuditAction,
  orderId: string,
  traceId: string,
  actor: AuditActor,
  metadata?: Record<string, unknown>,
): AuditEntry {
  return {
    action,
    order_id: orderId,
    trace_id: traceId,
    actor,
    timestamp: new Date().toISOString(),
    ...(metadata !== undefined ? { metadata } : {}),
  };
}

// ---------------------------------------------------------------------------
// Queue Accessor
// ---------------------------------------------------------------------------

/**
 * Returns the current audit queue from localStorage.
 * Useful for administrative review of pending/failed entries.
 */
export function getAuditQueue(): AuditQueueEntry[] {
  return loadAuditQueue();
}

// ---------------------------------------------------------------------------
// Queue Processing
// ---------------------------------------------------------------------------

/**
 * Processes all pending audit queue entries that are due for retry.
 *
 * - Uses exponential backoff (base 2s, max 5 retries)
 * - On success: marks entry as 'sent' and removes from queue
 * - On exhaustion (5 retries): marks entry as permanently 'failed',
 *   retains in queue for administrative review
 *
 * Requirements: 10.5, 10.6
 */
export async function processAuditQueue(): Promise<void> {
  if (!isZenvixConfigured()) return;

  const queue = loadAuditQueue();
  const now = Date.now();
  let changed = false;

  for (const queueEntry of queue) {
    if (queueEntry.status !== 'pending') continue;
    if (queueEntry.nextRetryAt > now) continue;

    changed = true;

    const url = getAuditEndpoint();
    const headers = buildAuthHeaders();

    let success = false;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event_type: `audit.${queueEntry.entry.action}`,
          ...queueEntry.entry,
        }),
      });
      success = response.ok;
    } catch {
      success = false;
    }

    if (success) {
      queueEntry.status = 'sent';
    } else {
      queueEntry.retries += 1;
      if (queueEntry.retries >= queueEntry.maxRetries) {
        // Permanently failed — retain in queue for administrative review
        queueEntry.status = 'failed';
      } else {
        queueEntry.nextRetryAt = now + calculateAuditBackoffDelay(queueEntry.retries);
      }
    }
  }

  if (changed) {
    // Keep pending and failed entries; remove sent entries
    saveAuditQueue(queue.filter((e) => e.status === 'pending' || e.status === 'failed'));
  }
}
