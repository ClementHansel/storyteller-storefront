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
  syncStageTransition,
  processSyncQueue,
  SYNC_QUEUE_STORAGE_KEY,
} from './zenvix-order-sync';

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

function setOrderInStorage(order: OrderRecord): void {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify({ orders: [order], version: 1 }));
}

function getSyncQueue() {
  const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

describe('syncStageTransition', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('sends stage transition payload with mapped stages and ISO timestamp on success', async () => {
    const order = makeOrder();
    setOrderInStorage(order);

    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

    await syncStageTransition('order-1', 'Order_Submitted', 'Quotation_Pending');

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('http://localhost:3001/api/retail/public/orders/zenvix-order-abc/transitions');
    
    const body = JSON.parse(options!.body as string);
    expect(body.order_id).toBe('zenvix-order-abc');
    expect(body.from_stage).toBe('SUBMITTED');
    expect(body.to_stage).toBe('QUOTATION_PENDING');
    // Verify ISO 8601 UTC timestamp
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('defers transition when zenvixOrderId is null', async () => {
    const order = makeOrder({ zenvixOrderId: undefined });
    setOrderInStorage(order);

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    await syncStageTransition('order-1', 'Order_Submitted', 'Quotation_Pending');

    // Should NOT have called fetch
    expect(fetchSpy).not.toHaveBeenCalled();

    // Should have added a deferred entry to the queue
    const queue = getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('stage_transition');
    expect(queue[0].status).toBe('deferred');
    expect(queue[0].orderId).toBe('order-1');
    expect(queue[0].payload.order_id).toBeNull();
    expect(queue[0].payload.from_stage).toBe('SUBMITTED');
    expect(queue[0].payload.to_stage).toBe('QUOTATION_PENDING');
  });

  it('assigns monotonically increasing sequence numbers per order', async () => {
    const order = makeOrder();
    setOrderInStorage(order);

    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await syncStageTransition('order-1', 'Order_Submitted', 'Quotation_Pending');
    
    // Simulate a failure on second call to get it queued
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network'));
    await syncStageTransition('order-1', 'Quotation_Pending', 'Quotation_Sent');

    const queue = getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].sequenceNumber).toBe(2);

    // Verify the sequence counter is persisted
    const seqKey = `zenvix_seq_order-1`;
    expect(localStorage.getItem(seqKey)).toBe('2');
  });

  it('queues for retry on network failure without blocking', async () => {
    const order = makeOrder();
    setOrderInStorage(order);

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network error'));

    // Should not throw — non-blocking
    await syncStageTransition('order-1', 'Order_Submitted', 'Quotation_Pending');

    const queue = getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('stage_transition');
    expect(queue[0].status).toBe('pending');
    expect(queue[0].retries).toBe(0);
  });

  it('queues for retry on 5xx response', async () => {
    const order = makeOrder();
    setOrderInStorage(order);

    const mockResponse = new Response('Server Error', { status: 500 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

    await syncStageTransition('order-1', 'Order_Submitted', 'Quotation_Pending');

    const queue = getSyncQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe('pending');
  });

  it('does nothing when order is not found in localStorage', async () => {
    // No order stored
    await syncStageTransition('non-existent', 'Order_Submitted', 'Quotation_Pending');

    expect(getSyncQueue()).toHaveLength(0);
  });
});

describe('processSyncQueue - stage transitions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('promotes deferred transitions when zenvixOrderId becomes available', async () => {
    // Start with a deferred entry (no zenvixOrderId at the time)
    const queue = [
      {
        id: 'entry-1',
        orderId: 'order-1',
        type: 'stage_transition',
        payload: { order_id: null, from_stage: 'SUBMITTED', to_stage: 'QUOTATION_PENDING', timestamp: '2024-01-01T00:00:00.000Z' },
        retries: 0,
        maxRetries: 5,
        nextRetryAt: 0,
        status: 'deferred',
        sequenceNumber: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));

    // Now the order has a zenvixOrderId
    const order = makeOrder({ zenvixOrderId: 'zenvix-abc' });
    setOrderInStorage(order);

    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

    await processSyncQueue();

    // The entry should have been promoted and sent
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/orders/zenvix-abc/transitions');
    
    const body = JSON.parse(options!.body as string);
    expect(body.order_id).toBe('zenvix-abc');
  });

  it('processes transitions in FIFO order (by sequence number)', async () => {
    const order = makeOrder({ zenvixOrderId: 'zenvix-abc' });
    setOrderInStorage(order);

    // Queue two transitions with different sequence numbers
    const queue = [
      {
        id: 'entry-2',
        orderId: 'order-1',
        type: 'stage_transition',
        payload: { order_id: 'zenvix-abc', from_stage: 'QUOTATION_PENDING', to_stage: 'QUOTATION_SENT', timestamp: '2024-01-01T00:01:00.000Z' },
        retries: 0,
        maxRetries: 5,
        nextRetryAt: 0,
        status: 'pending',
        sequenceNumber: 2,
        createdAt: '2024-01-01T00:01:00.000Z',
      },
      {
        id: 'entry-1',
        orderId: 'order-1',
        type: 'stage_transition',
        payload: { order_id: 'zenvix-abc', from_stage: 'SUBMITTED', to_stage: 'QUOTATION_PENDING', timestamp: '2024-01-01T00:00:00.000Z' },
        retries: 0,
        maxRetries: 5,
        nextRetryAt: 0,
        status: 'pending',
        sequenceNumber: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));

    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await processSyncQueue();

    // Only the first (sequence 1) should be processed in this pass
    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body.from_stage).toBe('SUBMITTED');
    expect(body.to_stage).toBe('QUOTATION_PENDING');
  });

  it('does not send deferred transitions that still lack zenvixOrderId', async () => {
    const order = makeOrder({ zenvixOrderId: undefined });
    setOrderInStorage(order);

    const queue = [
      {
        id: 'entry-1',
        orderId: 'order-1',
        type: 'stage_transition',
        payload: { order_id: null, from_stage: 'SUBMITTED', to_stage: 'QUOTATION_PENDING', timestamp: '2024-01-01T00:00:00.000Z' },
        retries: 0,
        maxRetries: 5,
        nextRetryAt: 0,
        status: 'deferred',
        sequenceNumber: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    await processSyncQueue();

    // Should not have called fetch — entry stays deferred
    expect(fetchSpy).not.toHaveBeenCalled();

    const updatedQueue = getSyncQueue();
    expect(updatedQueue).toHaveLength(1);
    expect(updatedQueue[0].status).toBe('deferred');
  });
});
