// ============================================================
// Zenvix Event Forwarding Pipeline (Stubbed)
// ============================================================
// Sends user activity events to Zenvix. When the gateway is
// offline or unconfigured, events are queued in localStorage
// and retried automatically.
// ============================================================

import type { ZenvixUserEvent, ZenvixUserEventType, QueuedEvent } from '@/types/zenvix';
import { getZenvixConfig, isZenvixConfigured } from '@/api/zenvix-config';
import { sendUserEvent } from '@/api/zenvix-client';

const QUEUE_KEY = 'zenvix_event_queue';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

// ---- Queue helpers ----

function loadQueue(): QueuedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedEvent[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Public API ----

/**
 * Fire an event toward Zenvix. If the gateway is unreachable
 * or unconfigured, the event is queued for retry.
 */
export async function trackEvent(
  eventType: ZenvixUserEventType,
  userId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const config = getZenvixConfig();

  const event: ZenvixUserEvent = {
    tenantId: config.tenantId || 'dev',
    branchId: config.branchId || 'dev',
    channel: 'ecommerce',
    userId,
    timestamp: new Date().toISOString(),
    eventType,
    payload,
  };

  if (!isZenvixConfigured()) {
    // In dev/mock mode — log and queue silently
    console.debug('[Zenvix Events] Gateway not configured, queuing:', eventType, payload);
    enqueue(event);
    return;
  }

  try {
    await sendUserEvent(config, event);
  } catch (err) {
    console.warn('[Zenvix Events] Send failed, queuing for retry:', err);
    enqueue(event);
  }
}

function enqueue(event: ZenvixUserEvent): void {
  const queue = loadQueue();
  queue.push({
    id: generateId(),
    event,
    retries: 0,
    maxRetries: MAX_RETRIES,
    nextRetryAt: Date.now() + BASE_DELAY_MS,
    status: 'pending',
  });
  saveQueue(queue);
}

/**
 * Process the retry queue. Call periodically (e.g. every 30s)
 * or on page load.
 */
export async function processRetryQueue(): Promise<void> {
  if (!isZenvixConfigured()) return;

  const config = getZenvixConfig();
  const queue = loadQueue();
  const now = Date.now();
  let changed = false;

  for (const item of queue) {
    if (item.status !== 'pending') continue;
    if (item.nextRetryAt > now) continue;

    try {
      await sendUserEvent(config, item.event);
      item.status = 'sent';
      changed = true;
    } catch {
      item.retries += 1;
      if (item.retries >= item.maxRetries) {
        item.status = 'failed';
      } else {
        // Exponential backoff
        item.nextRetryAt = now + BASE_DELAY_MS * Math.pow(2, item.retries);
      }
      changed = true;
    }
  }

  if (changed) {
    // Keep only pending items
    saveQueue(queue.filter((q) => q.status === 'pending'));
  }
}

/** Get queue stats for the admin panel */
export function getQueueStats(): { pending: number; failed: number; total: number } {
  const queue = loadQueue();
  return {
    pending: queue.filter((q) => q.status === 'pending').length,
    failed: queue.filter((q) => q.status === 'failed').length,
    total: queue.length,
  };
}

/** Clear all queued events */
export function clearEventQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
