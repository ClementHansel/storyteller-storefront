import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { OrderRecord } from '@/types/order';

// ---------------------------------------------------------------------------
// Mock: Zenvix events pipeline (trackEvent-based sync)
// ---------------------------------------------------------------------------
vi.mock('@/api/zenvix-events', () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
  processRetryQueue: vi.fn().mockResolvedValue(undefined),
  getQueueStats: vi.fn().mockReturnValue({ pending: 0, failed: 0, total: 0 }),
  clearEventQueue: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock: Runtime environment — all required vars configured
// ---------------------------------------------------------------------------
vi.mock('@/config/runtime-env', () => ({
  getZenvixApiUrl: vi.fn(() => 'http://localhost:3001/api/retail/public'),
  getZenvixTenantId: vi.fn(() => 'tenant-123'),
  getZenvixClientId: vi.fn(() => 'client-abc'),
  getZenvixClientSecret: vi.fn(() => 'secret-xyz'),
  getZenvixChannelRecordId: vi.fn(() => 'channel-rec-001'),
  getZenvixBranchId: vi.fn(() => 'branch-01'),
  getZenvixApiKey: vi.fn(() => 'api-key-test'),
  getWhatsAppOfficePhone: vi.fn(() => '+6281234567890'),
  isZenvixConfigured: vi.fn(() => true),
  getEnv: vi.fn((key: string) => {
    const map: Record<string, string> = {
      VITE_ZENVIX_API_URL: 'http://localhost:3001/api/retail/public',
      VITE_ZENVIX_TENANT_ID: 'tenant-123',
      VITE_ZENVIX_CLIENT_ID: 'client-abc',
      VITE_ZENVIX_CLIENT_SECRET: 'secret-xyz',
      VITE_ZENVIX_CHANNEL_RECORD_ID: 'channel-rec-001',
      VITE_ZENVIX_BRANCH_ID: 'branch-01',
      VITE_ZENVIX_API_KEY: 'api-key-test',
    };
    return map[key];
  }),
  checkZenvixReachable: vi.fn().mockResolvedValue(true),
  resetReachabilityCache: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock: Zenvix config
// ---------------------------------------------------------------------------
vi.mock('@/api/zenvix-config', () => ({
  getZenvixConfig: vi.fn(() => ({
    gatewayUrl: 'http://localhost:3001/api/retail/public',
    tenantId: 'tenant-123',
    clientId: 'client-abc',
    clientSecret: 'secret-xyz',
    apiKey: 'api-key-test',
    branchId: 'branch-01',
    channel: 'ecommerce',
  })),
  isZenvixConfigured: vi.fn(() => true),
  checkZenvixReachable: vi.fn().mockResolvedValue(true),
}));

// ---------------------------------------------------------------------------
// Mock: Notification poller (so we can import individual functions)
// ---------------------------------------------------------------------------
vi.mock('@/api/zenvix-notification-poller', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/zenvix-notification-poller')>();
  return {
    ...actual,
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
    setTrackerPageActive: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------
import { createOrder, getOrder, transitionStage } from '@/lib/order-store';
import { syncOrderCreation } from '@/api/zenvix-order-sync';
import { recordQuotation, confirmPayment } from '@/lib/order-admin-actions';
import { logAudit, createAuditEntry, getAuditQueue } from '@/api/zenvix-audit-logger';
import { applyStatusUpdate, getEligibleOrders, pollOrder } from '@/api/zenvix-notification-poller';

// ---------------------------------------------------------------------------
// Fetch mock helper
// ---------------------------------------------------------------------------

interface FetchCall {
  url: string;
  options: RequestInit;
  body: Record<string, unknown> | null;
}

const fetchCalls: FetchCall[] = [];

function createFetchMock() {
  return vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
    let body: Record<string, unknown> | null = null;
    if (options?.body) {
      try {
        body = JSON.parse(options.body as string);
      } catch {
        body = null;
      }
    }
    fetchCalls.push({ url: urlStr, options: options || {}, body });

    // Route-based responses
    if (urlStr.includes('/orders') && options?.method === 'POST' && !urlStr.includes('/transitions') && !urlStr.includes('/events') && !urlStr.includes('/status')) {
      // Order creation endpoint
      return new Response(JSON.stringify({ order_id: 'zenvix-order-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('/transitions')) {
      // Stage transition endpoint
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('/events/orders')) {
      // Events endpoint (quotation, payment, sales, audit)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (urlStr.includes('/status')) {
      // Status polling endpoint
      return new Response(JSON.stringify({ status: 'PAYMENT_PENDING' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default response
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bambu_whatsapp_orders';

function makeValidOrderData() {
  return {
    customerName: 'Maria Gonzalez',
    customerEmail: 'maria@example.com',
    customerPhone: '+6289876543210',
    shippingAddress: '789 Jalan Bamboo, Denpasar, Bali 80234, Indonesia',
    items: [
      { productId: 'prod-silver-001', title: 'Handcrafted Silver Bangle', quantity: 1, unitPrice: 120 },
      { productId: 'prod-bamboo-002', title: 'Bamboo Earrings Set', quantity: 2, unitPrice: 45 },
    ],
    subtotal: 210,
  };
}

function getStoredOrder(orderId: string): OrderRecord | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  return data.orders.find((o: OrderRecord) => o.id === orderId) ?? null;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Integration: End-to-End Order Lifecycle', () => {
  let fetchMock: ReturnType<typeof createFetchMock>;

  beforeEach(() => {
    localStorage.clear();
    fetchCalls.length = 0;
    vi.clearAllMocks();

    fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('1. Order creation and Zenvix sync', () => {
    it('creates an order with traceId and syncs to Zenvix, storing zenvixOrderId', async () => {
      // Step 1: Create a local order
      const order = createOrder(makeValidOrderData());

      // Verify order has a traceId (UUID format)
      expect(order.traceId).toBeDefined();
      expect(order.traceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(order.stage).toBe('Order_Submitted');

      // Step 2: Sync order creation to Zenvix
      await syncOrderCreation(order);

      // Step 3: Verify fetch was called with correct payload
      const createCall = fetchCalls.find(
        (c) => c.url.includes('/orders') && c.options.method === 'POST' && !c.url.includes('/transitions') && !c.url.includes('/events')
      );
      expect(createCall).toBeDefined();
      expect(createCall!.body).toMatchObject({
        items: [
          { sku: 'prod-silver-001', quantity: 1 },
          { sku: 'prod-bamboo-002', quantity: 2 },
        ],
        customer: { email: 'maria@example.com', name: 'Maria Gonzalez' },
        payment_status: 'PENDING',
        channel_record_id: 'channel-rec-001',
      });

      // Step 4: Verify zenvixOrderId is stored in localStorage
      const storedOrder = getStoredOrder(order.id);
      expect(storedOrder).not.toBeNull();
      expect(storedOrder!.zenvixOrderId).toBe('zenvix-order-123');
      expect(storedOrder!.syncStatus).toBe('synced');
    });
  });

  describe('2. Stage transitions with Zenvix sync', () => {
    it('transitions through quotation stages and syncs transitions to Zenvix', async () => {
      // Setup: Create and sync an order
      const order = createOrder(makeValidOrderData());
      await syncOrderCreation(order);
      fetchCalls.length = 0; // Clear creation calls

      // Transition to Quotation_Pending (local first)
      transitionStage(order.id, 'Quotation_Pending');

      // Record quotation (Quotation_Pending → Quotation_Sent → Payment_Pending)
      await recordQuotation(order.id, 25, 235);

      // Verify local order is at Payment_Pending
      const updatedOrder = getOrder(order.id);
      expect(updatedOrder).not.toBeNull();
      expect(updatedOrder!.stage).toBe('Payment_Pending');
      expect(updatedOrder!.quotedDeliveryCost).toBe(25);
      expect(updatedOrder!.quotedTotal).toBe(235);

      // Verify stage transition API calls were made
      const transitionCalls = fetchCalls.filter((c) => c.url.includes('/transitions'));
      expect(transitionCalls.length).toBeGreaterThanOrEqual(2); // Quotation_Pending→Quotation_Sent, Quotation_Sent→Payment_Pending

      // Verify quotation event was sent
      const eventCalls = fetchCalls.filter(
        (c) => c.url.includes('/events/orders') && c.body?.event_type === 'order.quotation_recorded'
      );
      expect(eventCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Payment confirmation and sales completion', () => {
    it('confirms payment, reaches Complete stage, and sends sales completion event', async () => {
      // Setup: Create, sync, and advance order to Payment_Pending
      const order = createOrder(makeValidOrderData());
      await syncOrderCreation(order);
      transitionStage(order.id, 'Quotation_Pending');
      await recordQuotation(order.id, 20, 230);
      fetchCalls.length = 0; // Clear previous calls

      // Confirm payment (Payment_Pending → Payment_Confirmed → Complete)
      await confirmPayment(order.id, 230);

      // Verify order is at Complete
      const finalOrder = getOrder(order.id);
      expect(finalOrder).not.toBeNull();
      expect(finalOrder!.stage).toBe('Complete');
      expect(finalOrder!.paidAmount).toBe(230);

      // Verify payment event was sent
      const paymentCalls = fetchCalls.filter(
        (c) => c.url.includes('/events/orders') && c.body?.event_type === 'payment.completed'
      );
      expect(paymentCalls.length).toBeGreaterThanOrEqual(1);
      if (paymentCalls.length > 0) {
        expect(paymentCalls[0].body).toMatchObject({
          event_type: 'payment.completed',
          amount: 230,
        });
      }

      // Verify sales completion event was sent
      const salesCalls = fetchCalls.filter(
        (c) => c.url.includes('/events/orders') && c.body?.event_type === 'sales.completion'
      );
      expect(salesCalls.length).toBeGreaterThanOrEqual(1);
      if (salesCalls.length > 0) {
        expect(salesCalls[0].body).toMatchObject({
          event_type: 'sales.completion',
          customer: { name: 'Maria Gonzalez', email: 'maria@example.com' },
          channel_record_id: 'channel-rec-001',
        });
        // Verify item-level detail
        expect(salesCalls[0].body!.items).toBeDefined();
        const items = salesCalls[0].body!.items as Array<{ product_id: string; quantity: number; unit_price: number }>;
        expect(items.length).toBe(2);
        expect(items[0]).toMatchObject({ product_id: 'prod-silver-001', quantity: 1, unit_price: 120 });
        expect(items[1]).toMatchObject({ product_id: 'prod-bamboo-002', quantity: 2, unit_price: 45 });
      }
    });
  });

  describe('4. Audit trail with trace_id consistency', () => {
    it('generates audit entries that all share the same trace_id for a given order', async () => {
      // Create and sync an order
      const order = createOrder(makeValidOrderData());
      await syncOrderCreation(order);
      const traceId = order.traceId!;

      // Log order.created audit
      const actor = { id: 'customer-001', type: 'customer' as const };
      await logAudit(createAuditEntry('order.created', order.id, traceId, actor));

      // Advance through stages
      transitionStage(order.id, 'Quotation_Pending');
      await logAudit(createAuditEntry('stage.transition', order.id, traceId, { id: 'admin-01', type: 'admin' }, { from_stage: 'Order_Submitted', to_stage: 'Quotation_Pending' }));

      await recordQuotation(order.id, 15, 225);
      await logAudit(createAuditEntry('stage.transition', order.id, traceId, { id: 'admin-01', type: 'admin' }, { from_stage: 'Quotation_Pending', to_stage: 'Payment_Pending' }));

      await confirmPayment(order.id, 225);
      await logAudit(createAuditEntry('payment.confirmed', order.id, traceId, { id: 'admin-01', type: 'admin' }, { amount: 225 }));
      await logAudit(createAuditEntry('order.completed', order.id, traceId, { id: 'admin-01', type: 'admin' }, { final_stage: 'Complete' }));

      // Verify all audit calls share the same trace_id
      const auditCalls = fetchCalls.filter(
        (c) => c.url.includes('/events/orders') && c.body?.trace_id !== undefined
      );
      expect(auditCalls.length).toBeGreaterThanOrEqual(5);

      for (const call of auditCalls) {
        expect(call.body!.trace_id).toBe(traceId);
        expect(call.body!.order_id).toBe(order.id);
      }

      // Verify different action types were logged
      const actions = auditCalls.map((c) => c.body!.event_type);
      expect(actions).toContain('audit.order.created');
      expect(actions).toContain('audit.stage.transition');
      expect(actions).toContain('audit.payment.confirmed');
      expect(actions).toContain('audit.order.completed');
    });
  });

  describe('5. Notification poller updates local order', () => {
    it('applies a forward stage update from the poller to the local order', () => {
      // Create an order and store it with a zenvixOrderId already
      const order = createOrder(makeValidOrderData());

      // Manually set the zenvixOrderId in localStorage (simulating successful sync)
      const raw = localStorage.getItem(STORAGE_KEY)!;
      const data = JSON.parse(raw);
      const idx = data.orders.findIndex((o: OrderRecord) => o.id === order.id);
      data.orders[idx].zenvixOrderId = 'zenvix-poll-order-456';
      data.orders[idx].syncStatus = 'synced';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Verify it's eligible for polling
      const eligible = getEligibleOrders();
      expect(eligible.length).toBeGreaterThanOrEqual(1);
      expect(eligible.some((o) => o.id === order.id)).toBe(true);

      // Apply a forward stage update (simulating what the poller does)
      // Order is at Order_Submitted, apply Payment_Pending (skipping stages is allowed from Zenvix)
      const applied = applyStatusUpdate(order.id, 'Payment_Pending');
      expect(applied).toBe(true);

      // Verify local order advanced
      const updatedOrder = getStoredOrder(order.id);
      expect(updatedOrder).not.toBeNull();
      expect(updatedOrder!.stage).toBe('Payment_Pending');

      // Verify stageHistory has the entry with source "zenvix_admin"
      const lastEntry = updatedOrder!.stageHistory[updatedOrder!.stageHistory.length - 1];
      expect(lastEntry.stage).toBe('Payment_Pending');
      expect(lastEntry.source).toBe('zenvix_admin');
    });

    it('discards a backward/same-stage update from the poller', () => {
      // Create an order and advance it to Payment_Pending
      const order = createOrder(makeValidOrderData());
      transitionStage(order.id, 'Quotation_Pending');
      transitionStage(order.id, 'Quotation_Sent');
      transitionStage(order.id, 'Payment_Pending');

      // Set zenvixOrderId
      const raw = localStorage.getItem(STORAGE_KEY)!;
      const data = JSON.parse(raw);
      const idx = data.orders.findIndex((o: OrderRecord) => o.id === order.id);
      data.orders[idx].zenvixOrderId = 'zenvix-poll-order-789';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Attempt to apply a backward update (Quotation_Sent < Payment_Pending)
      const applied = applyStatusUpdate(order.id, 'Quotation_Sent');
      expect(applied).toBe(false);

      // Verify order stays at Payment_Pending
      const storedOrder = getStoredOrder(order.id);
      expect(storedOrder!.stage).toBe('Payment_Pending');
    });

    it('excludes orders without zenvixOrderId or at Complete stage from polling', () => {
      // Order without zenvixOrderId
      createOrder(makeValidOrderData());

      // Order at Complete stage with zenvixOrderId
      const order2 = createOrder({
        ...makeValidOrderData(),
        customerName: 'Test User 2',
        customerEmail: 'test2@example.com',
      });
      transitionStage(order2.id, 'Quotation_Pending');
      transitionStage(order2.id, 'Quotation_Sent');
      transitionStage(order2.id, 'Payment_Pending');
      transitionStage(order2.id, 'Payment_Confirmed');
      transitionStage(order2.id, 'Complete');

      // Set zenvixOrderId on the Complete order
      const raw = localStorage.getItem(STORAGE_KEY)!;
      const data = JSON.parse(raw);
      const idx2 = data.orders.findIndex((o: OrderRecord) => o.id === order2.id);
      data.orders[idx2].zenvixOrderId = 'zenvix-complete-order';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Neither should be eligible
      const eligible = getEligibleOrders();
      // First order has no zenvixOrderId, second is Complete
      expect(eligible.length).toBe(0);
    });
  });
});
