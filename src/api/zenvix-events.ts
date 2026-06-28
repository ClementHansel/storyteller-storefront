// ============================================================
// Zenvix Event Forwarding Pipeline
// ============================================================
// Sends user activity events to Zenvix. When the gateway is
// offline or unconfigured, events are queued in localStorage
// and retried automatically.
//
// Every event includes:
// - context.channel_record_id for marketing attribution
// - actor with id, type, tenant_id, branch_id
// - Session UUID for guest tracking
// ============================================================

import type { ZenvixUserEvent, ZenvixUserEventType, QueuedEvent } from '@/types/zenvix';
import { getZenvixConfig, isZenvixConfigured } from '@/api/zenvix-config';
import { sendUserEvent } from '@/api/zenvix-client';
import {
  getZenvixChannelRecordId,
  getZenvixTenantId,
  getZenvixBranchId,
} from '@/config/runtime-env';

const QUEUE_KEY = 'zenvix_event_queue';
const SESSION_KEY = 'zenvix_session_id';
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

// ---- Session management ----

/**
 * Returns the session UUID, generating one on first access and
 * persisting it in sessionStorage so it survives SPA navigations
 * but resets on new browser sessions.
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// ---- Public API ----

/**
 * Fire an event toward Zenvix. If the gateway is unreachable
 * or unconfigured, the event is queued for retry.
 *
 * Every event includes:
 * - context.channel_record_id from VITE_ZENVIX_CHANNEL_RECORD_ID
 * - actor.tenant_id and actor.branch_id
 * - actor.id = userId for customers, session UUID for guests
 */
export async function trackEvent(
  eventType: ZenvixUserEventType,
  userId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const config = getZenvixConfig();
  const sessionId = getSessionId();

  const actorId = userId || sessionId;
  const actorType = userId ? 'customer' : 'guest';

  const event: ZenvixUserEvent = {
    type: eventType,
    actor: {
      id: actorId,
      type: actorType,
      tenant_id: getZenvixTenantId(),
      branch_id: getZenvixBranchId(),
    },
    context: {
      channel_record_id: getZenvixChannelRecordId(),
    },
    timestamp: new Date().toISOString(),
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

/**
 * Send a `session.start` event on page load.
 * Includes channel, source, and document referrer for attribution.
 */
export async function sendSessionStart(): Promise<void> {
  await trackEvent('session.start', '', {
    channel: 'ecommerce',
    source: 'web-storefront',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
  });
}

/**
 * Send a `cart.checkout` event with the full cart payload.
 * Includes all items with product_id, quantity, and price,
 * the total cart value, and the session identifier.
 */
export async function sendCartCheckout(
  items: Array<{ product_id: string; quantity: number; price: number }>,
  totalValue: number,
): Promise<void> {
  await trackEvent('cart.checkout', '', {
    items,
    total_value: totalValue,
    session_id: getSessionId(),
  });
}
