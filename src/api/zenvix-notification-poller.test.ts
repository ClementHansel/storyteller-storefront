import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { OrderRecord } from '@/types/order';

// Mock dependencies
vi.mock('@/config/runtime-env', () => ({
  getZenvixApiUrl: () => 'http://localhost:3001/api/retail/public',
  getZenvixChannelRecordId: () => 'channel-123',
}));

vi.mock('@/api/zenvix-config', () => ({
  getZenvixConfig: () => ({
    tenantId: 'tenant-1',
    clientId: 'client-1',
    clientSecret: 'secret-1',
    apiKey: 'key-1',
  }),
  isZenvixConfigured: () => true,
}));

import {
  clampInterval,
  getEligibleOrders,
  pollOrder,
  applyStatusUpdate,
  startPolling,
  stopPolling,
  setTrackerPageActive,
  getPollerState,
  getPollerConfig,
  resetPollerState,
} from './zenvix-notification-poller';

const ORDERS_STORAGE_KEY = 'bambu_whatsapp_orders';

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: 'order-1',
    stage: 'Quotation_Pending',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+1234567890',
    shippingAddress: '123 Test St',
    items: [{ productId: 'p1', title: 'Silver Ring', quantity: 1, unitPrice: 50 }],
    subtotal: 50,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    stageHistory: [{ stage: 'Order_Submitted', timestamp: '2024-01-01T00:00:00.000Z' }],
    zenvixOrderId: 'zenvix-order-abc',
    syncStatus: 'synced',
    traceId: 'trace-123',
    salesEventSent: false,
    ...overrides,
  };
}

function setOrdersInStorage(orders: OrderRecord[]): void {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify({ orders, version: 1 }));
}

function getOrdersFromStorage(): OrderRecord[] {
  const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw).orders;
}

describe('clampInterval', () => {
  beforeEach(() => {
    resetPollerState();
  });

  it('clamps values below minimum to 10000ms', () => {
    expect(clampInterval(5000)).toBe(10000);
    expect(clampInterval(0)).toBe(10000);
    expect(clampInterval(-100)).toBe(10000);
  });

  it('clamps values above maximum to 300000ms', () => {
    expect(clampInterval(500000)).toBe(300000);
    expect(clampInterval(999999)).toBe(300000);
  });

  it('returns the value unchanged when within range', () => {
    expect(clampInterval(10000)).toBe(10000);
    expect(clampInterval(60000)).toBe(60000);
    expect(clampInterval(300000)).toBe(300000);
    expect(clampInterval(150000)).toBe(150000);
  });
});

describe('getEligibleOrders', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns orders with non-null zenvixOrderId and stage !== Complete', () => {
    const eligible = makeOrder({ id: 'order-1', zenvixOrderId: 'z1', stage: 'Payment_Pending' });
    const completed = makeOrder({ id: 'order-2', zenvixOrderId: 'z2', stage: 'Complete' });
    const noZenvixId = makeOrder({ id: 'order-3', zenvixOrderId: undefined, stage: 'Order_Submitted' });

    setOrdersInStorage([eligible, completed, noZenvixId]);

    const result = getEligibleOrders();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('order-1');
  });

  it('returns empty array when no orders match criteria', () => {
    setOrdersInStorage([
      makeOrder({ id: 'order-1', zenvixOrderId: undefined }),
      makeOrder({ id: 'order-2', stage: 'Complete' }),
    ]);

    expect(getEligibleOrders()).toHaveLength(0);
  });

  it('returns empty array when localStorage is empty', () => {
    expect(getEligibleOrders()).toHaveLength(0);
  });
});

describe('pollOrder', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches order status from Zenvix API', async () => {
    const mockResponse = new Response(JSON.stringify({ status: 'PAYMENT_PENDING' }), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

    const result = await pollOrder('order-1', 'zenvix-abc');

    expect(result).toBe('PAYMENT_PENDING');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/retail/public/orders/zenvix-abc/status',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-tenant-id': 'tenant-1',
          'x-client-id': 'client-1',
          'x-client-secret': 'secret-1',
        }),
      }),
    );
  });

  it('throws on non-OK response', async () => {
    const mockResponse = new Response('Not Found', { status: 404 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

    await expect(pollOrder('order-1', 'zenvix-abc')).rejects.toThrow('Poll failed with status 404');
  });

  it('returns null when response has no status field', async () => {
    const mockResponse = new Response(JSON.stringify({}), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

    const result = await pollOrder('order-1', 'zenvix-abc');
    expect(result).toBeNull();
  });
});

describe('applyStatusUpdate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('applies forward stage update and appends stageHistory with source zenvix_admin', () => {
    const order = makeOrder({ stage: 'Quotation_Pending' });
    setOrdersInStorage([order]);

    const result = applyStatusUpdate('order-1', 'Payment_Pending');

    expect(result).toBe(true);

    const orders = getOrdersFromStorage();
    expect(orders[0].stage).toBe('Payment_Pending');
    expect(orders[0].stageHistory).toHaveLength(2);
    expect(orders[0].stageHistory[1].stage).toBe('Payment_Pending');
    expect(orders[0].stageHistory[1].source).toBe('zenvix_admin');
    expect(orders[0].stageHistory[1].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('discards same-stage update (returns false)', () => {
    const order = makeOrder({ stage: 'Payment_Pending' });
    setOrdersInStorage([order]);

    const result = applyStatusUpdate('order-1', 'Payment_Pending');

    expect(result).toBe(false);

    const orders = getOrdersFromStorage();
    expect(orders[0].stage).toBe('Payment_Pending');
    expect(orders[0].stageHistory).toHaveLength(1); // Unchanged
  });

  it('discards earlier-stage update (returns false)', () => {
    const order = makeOrder({ stage: 'Payment_Confirmed' });
    setOrdersInStorage([order]);

    const result = applyStatusUpdate('order-1', 'Quotation_Pending');

    expect(result).toBe(false);

    const orders = getOrdersFromStorage();
    expect(orders[0].stage).toBe('Payment_Confirmed');
  });

  it('returns false when order not found', () => {
    setOrdersInStorage([]);

    const result = applyStatusUpdate('non-existent', 'Payment_Pending');
    expect(result).toBe(false);
  });

  it('allows skipping stages forward (e.g., from Quotation_Pending to Payment_Confirmed)', () => {
    const order = makeOrder({ stage: 'Quotation_Pending' });
    setOrdersInStorage([order]);

    const result = applyStatusUpdate('order-1', 'Payment_Confirmed');

    expect(result).toBe(true);
    const orders = getOrdersFromStorage();
    expect(orders[0].stage).toBe('Payment_Confirmed');
  });
});

describe('startPolling / stopPolling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    resetPollerState();
  });

  afterEach(() => {
    stopPolling();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('starts polling and schedules next poll cycle', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'QUOTATION_SENT' }), { status: 200 }),
    );

    setOrdersInStorage([makeOrder()]);
    startPolling();

    const state = getPollerState();
    expect(state.currentInterval).toBe(60000);
  });

  it('stops polling when stopPolling is called', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'QUOTATION_SENT' }), { status: 200 }),
    );

    startPolling();
    stopPolling();

    // Advancing timers should not trigger more polls
    const fetchCallsBefore = vi.mocked(fetch).mock.calls.length;
    vi.advanceTimersByTime(120000);
    // No additional fetches after stop (the initial cycle may have run once)
    expect(vi.mocked(fetch).mock.calls.length).toBeLessThanOrEqual(fetchCallsBefore);
  });

  it('clamps configured intervals', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    startPolling({ defaultIntervalMs: 5000, activeIntervalMs: 1000 });

    const config = getPollerConfig();
    expect(config.defaultIntervalMs).toBe(10000);
    expect(config.activeIntervalMs).toBe(10000);
  });
});

describe('setTrackerPageActive', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    resetPollerState();
  });

  afterEach(() => {
    stopPolling();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('switches to active interval when set to true', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    startPolling();
    setTrackerPageActive(true);

    const state = getPollerState();
    expect(state.isTrackerPageActive).toBe(true);
    expect(state.currentInterval).toBe(15000);
  });

  it('reverts to default interval when set to false', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    startPolling();
    setTrackerPageActive(true);
    setTrackerPageActive(false);

    const state = getPollerState();
    expect(state.isTrackerPageActive).toBe(false);
    expect(state.currentInterval).toBe(60000);
  });
});
