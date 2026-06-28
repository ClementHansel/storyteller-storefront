// ============================================================
// Zenvix Notification Poller — Client-side order status polling
// ============================================================
// Polls Zenvix API for order status updates at configurable intervals.
// Applies forward-only stage transitions from Zenvix-originated changes.
// Uses exponential backoff on errors and pauses after 5 consecutive failures.
// ============================================================

import type { OrderRecord, OrderStage } from '@/types/order';
import { getZenvixApiUrl } from '@/config/runtime-env';
import { getZenvixConfig, isZenvixConfigured } from '@/api/zenvix-config';
import { toOrderStage, isLaterStage } from '@/api/zenvix-stage-mapping';
import { calculateBackoffDelay } from '@/api/zenvix-order-sync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PollerConfig {
  defaultIntervalMs: number;      // 60000
  activeIntervalMs: number;       // 15000
  minIntervalMs: number;          // 10000
  maxIntervalMs: number;          // 300000
  maxConsecutiveFailures: number;  // 5
}

export interface PollerOrderState {
  localOrderId: string;
  zenvixOrderId: string;
  lastKnownStage: OrderStage;
  consecutiveFailures: number;
  paused: boolean;
}

export interface PollerState {
  activeOrders: Map<string, PollerOrderState>;
  isTrackerPageActive: boolean;
  currentInterval: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORDERS_STORAGE_KEY = 'bambu_whatsapp_orders';
const BACKOFF_CAP_MS = 120000;
const BASE_BACKOFF_MS = 2000;

const DEFAULT_POLLER_CONFIG: PollerConfig = {
  defaultIntervalMs: 60000,
  activeIntervalMs: 15000,
  minIntervalMs: 10000,
  maxIntervalMs: 300000,
  maxConsecutiveFailures: 5,
};

// ---------------------------------------------------------------------------
// Module State
// ---------------------------------------------------------------------------

let pollerConfig: PollerConfig = { ...DEFAULT_POLLER_CONFIG };
let pollerState: PollerState = {
  activeOrders: new Map(),
  isTrackerPageActive: false,
  currentInterval: DEFAULT_POLLER_CONFIG.defaultIntervalMs,
};
let pollingTimerId: ReturnType<typeof setTimeout> | null = null;
let isPollingActive = false;

// ---------------------------------------------------------------------------
// Interval Clamping
// ---------------------------------------------------------------------------

/**
 * Clamps a polling interval to the configured [minIntervalMs, maxIntervalMs] range.
 * Default range: [10000, 300000] ms.
 */
export function clampInterval(interval: number): number {
  return Math.max(pollerConfig.minIntervalMs, Math.min(pollerConfig.maxIntervalMs, interval));
}

// ---------------------------------------------------------------------------
// localStorage Helpers
// ---------------------------------------------------------------------------

interface PersistedOrderData {
  orders: OrderRecord[];
  version: number;
}

function loadOrders(): PersistedOrderData {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return { orders: [], version: 1 };
    return JSON.parse(raw) as PersistedOrderData;
  } catch {
    return { orders: [], version: 1 };
  }
}

function persistOrders(data: PersistedOrderData): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[Zenvix Poller] Failed to persist orders to localStorage.');
  }
}

// ---------------------------------------------------------------------------
// Auth Headers
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

// ---------------------------------------------------------------------------
// Eligible Orders
// ---------------------------------------------------------------------------

/**
 * Returns orders eligible for polling: those with a non-null zenvixOrderId
 * and a stage that is not "Complete".
 */
export function getEligibleOrders(): OrderRecord[] {
  const store = loadOrders();
  return store.orders.filter(
    (order) => order.zenvixOrderId != null && order.stage !== 'Complete'
  );
}

// ---------------------------------------------------------------------------
// Poll a Single Order
// ---------------------------------------------------------------------------

/**
 * Fetches the current status of an order from Zenvix API.
 * Returns the raw status string from the API response, or throws on failure.
 */
export async function pollOrder(
  localOrderId: string,
  zenvixOrderId: string,
): Promise<string | null> {
  const baseUrl = getZenvixApiUrl().replace(/\/$/, '');
  const url = `${baseUrl}/orders/${zenvixOrderId}/status`;
  const headers = buildAuthHeaders();

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Poll failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.status ?? null;
}

// ---------------------------------------------------------------------------
// Apply Status Update
// ---------------------------------------------------------------------------

/**
 * Updates the local order to a new stage and appends a stageHistory entry
 * with source = "zenvix_admin".
 *
 * Only applies if the newStage is later than the current stage (forward-only).
 * Returns true if the update was applied, false otherwise.
 */
export function applyStatusUpdate(localOrderId: string, newStage: OrderStage): boolean {
  const store = loadOrders();
  const orderIndex = store.orders.findIndex((o) => o.id === localOrderId);

  if (orderIndex === -1) {
    console.warn(`[Zenvix Poller] Order ${localOrderId} not found in localStorage.`);
    return false;
  }

  const order = store.orders[orderIndex];

  // Forward-only: only apply if newStage is later than current stage
  if (!isLaterStage(order.stage, newStage)) {
    return false;
  }

  // Update the order
  store.orders[orderIndex] = {
    ...order,
    stage: newStage,
    updatedAt: new Date().toISOString(),
    stageHistory: [
      ...order.stageHistory,
      {
        stage: newStage,
        timestamp: new Date().toISOString(),
        source: 'zenvix_admin',
      },
    ],
  };

  persistOrders(store);
  return true;
}

// ---------------------------------------------------------------------------
// Polling Loop
// ---------------------------------------------------------------------------

/**
 * Executes one polling cycle: fetches status for all eligible orders,
 * applies forward updates, handles errors with backoff.
 */
async function pollCycle(): Promise<void> {
  if (!isZenvixConfigured()) {
    scheduleNextPoll();
    return;
  }

  const eligibleOrders = getEligibleOrders();

  // Refresh active orders map
  const currentOrderIds = new Set(eligibleOrders.map((o) => o.id));

  // Remove orders no longer eligible
  for (const [orderId] of pollerState.activeOrders) {
    if (!currentOrderIds.has(orderId)) {
      pollerState.activeOrders.delete(orderId);
    }
  }

  // Add/update eligible orders
  for (const order of eligibleOrders) {
    if (!pollerState.activeOrders.has(order.id)) {
      pollerState.activeOrders.set(order.id, {
        localOrderId: order.id,
        zenvixOrderId: order.zenvixOrderId!,
        lastKnownStage: order.stage,
        consecutiveFailures: 0,
        paused: false,
      });
    } else {
      // Update lastKnownStage from current localStorage state
      const state = pollerState.activeOrders.get(order.id)!;
      state.lastKnownStage = order.stage;
    }
  }

  // Poll each non-paused order
  for (const [orderId, orderState] of pollerState.activeOrders) {
    if (orderState.paused) continue;

    try {
      const statusString = await pollOrder(orderState.localOrderId, orderState.zenvixOrderId);

      if (statusString === null) {
        // No status returned, skip
        continue;
      }

      // Map Zenvix status string to local OrderStage
      const mappedStage = toOrderStage(statusString);

      if (mappedStage === null) {
        // Unmapped status — silently ignore (Requirement 11.5)
        continue;
      }

      // Check if the mapped stage is later than current
      if (isLaterStage(orderState.lastKnownStage, mappedStage)) {
        // Apply the forward update
        const applied = applyStatusUpdate(orderState.localOrderId, mappedStage);
        if (applied) {
          orderState.lastKnownStage = mappedStage;
        }
      }
      // If same or earlier stage — discard silently (Requirement 11.2)

      // Reset consecutive failures on success
      orderState.consecutiveFailures = 0;
    } catch (error) {
      // Error polling this order
      orderState.consecutiveFailures += 1;

      if (orderState.consecutiveFailures >= pollerConfig.maxConsecutiveFailures) {
        // Pause polling for this order (Requirement 7.7)
        orderState.paused = true;
        console.warn(
          `[Zenvix Poller] Order ${orderId} paused after ${pollerConfig.maxConsecutiveFailures} consecutive failures.`
        );
      } else {
        // Calculate backoff delay (capped at 120s)
        const backoffDelay = Math.min(
          calculateBackoffDelay(orderState.consecutiveFailures - 1, BASE_BACKOFF_MS),
          BACKOFF_CAP_MS,
        );
        console.debug(
          `[Zenvix Poller] Error polling order ${orderId}. Retry ${orderState.consecutiveFailures}. Backoff: ${backoffDelay}ms.`,
          error,
        );
      }
    }
  }

  scheduleNextPoll();
}

/**
 * Schedules the next poll cycle based on current interval settings.
 */
function scheduleNextPoll(): void {
  if (!isPollingActive) return;

  const interval = pollerState.isTrackerPageActive
    ? clampInterval(pollerConfig.activeIntervalMs)
    : clampInterval(pollerConfig.defaultIntervalMs);

  pollerState.currentInterval = interval;

  pollingTimerId = setTimeout(() => {
    pollCycle();
  }, interval);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts the notification polling loop.
 * Accepts optional partial config to override defaults.
 */
export function startPolling(config?: Partial<PollerConfig>): void {
  if (isPollingActive) {
    // Already running — update config if provided
    if (config) {
      pollerConfig = { ...pollerConfig, ...config };
    }
    return;
  }

  if (config) {
    pollerConfig = { ...DEFAULT_POLLER_CONFIG, ...config };
  }

  // Clamp the configured intervals
  pollerConfig.defaultIntervalMs = clampInterval(pollerConfig.defaultIntervalMs);
  pollerConfig.activeIntervalMs = clampInterval(pollerConfig.activeIntervalMs);

  isPollingActive = true;

  // Start first cycle immediately
  pollCycle();
}

/**
 * Stops the notification polling loop.
 */
export function stopPolling(): void {
  isPollingActive = false;

  if (pollingTimerId !== null) {
    clearTimeout(pollingTimerId);
    pollingTimerId = null;
  }
}

/**
 * Sets whether the tracker page is active.
 * When active, polling frequency increases to activeIntervalMs (default 15s).
 * When inactive, reverts to defaultIntervalMs (default 60s).
 */
export function setTrackerPageActive(active: boolean): void {
  pollerState.isTrackerPageActive = active;

  // If polling is active, reschedule with the new interval
  if (isPollingActive && pollingTimerId !== null) {
    clearTimeout(pollingTimerId);
    scheduleNextPoll();
  }
}

// ---------------------------------------------------------------------------
// Testing Utilities
// ---------------------------------------------------------------------------

/**
 * Returns the current poller state (for testing and debugging).
 */
export function getPollerState(): PollerState {
  return pollerState;
}

/**
 * Returns the current poller config (for testing and debugging).
 */
export function getPollerConfig(): PollerConfig {
  return pollerConfig;
}

/**
 * Resets poller state (for testing).
 */
export function resetPollerState(): void {
  stopPolling();
  pollerConfig = { ...DEFAULT_POLLER_CONFIG };
  pollerState = {
    activeOrders: new Map(),
    isTrackerPageActive: false,
    currentInterval: DEFAULT_POLLER_CONFIG.defaultIntervalMs,
  };
}
