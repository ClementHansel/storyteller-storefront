import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/config/runtime-env', () => ({
  getZenvixApiUrl: () => 'http://localhost:3001/api/retail/public',
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
  logAudit,
  createAuditEntry,
  getAuditQueue,
  processAuditQueue,
  calculateAuditBackoffDelay,
} from './zenvix-audit-logger';
import type { AuditEntry } from './zenvix-audit-logger';

const AUDIT_QUEUE_KEY = 'zenvix_audit_queue';

function makeAuditEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    action: 'order.created',
    order_id: 'order-1',
    trace_id: 'trace-abc-123',
    actor: { id: 'customer-1', type: 'customer' },
    timestamp: '2024-01-15T10:30:00.000Z',
    ...overrides,
  };
}

describe('zenvix-audit-logger', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('logAudit', () => {
    it('sends audit entry to Zenvix API on success', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const entry = makeAuditEntry();
      await logAudit(entry);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe('http://localhost:3001/api/retail/public/events/orders');
      expect(options?.method).toBe('POST');

      const body = JSON.parse(options?.body as string);
      expect(body.event_type).toBe('audit.order.created');
      expect(body.order_id).toBe('order-1');
      expect(body.trace_id).toBe('trace-abc-123');
      expect(body.actor).toEqual({ id: 'customer-1', type: 'customer' });
      expect(body.timestamp).toBe('2024-01-15T10:30:00.000Z');
    });

    it('queues entry on API failure without throwing', async () => {
      const mockResponse = new Response('Server Error', { status: 500 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const entry = makeAuditEntry();

      // Should not throw
      await expect(logAudit(entry)).resolves.toBeUndefined();

      const queue = getAuditQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].entry.action).toBe('order.created');
      expect(queue[0].entry.order_id).toBe('order-1');
      expect(queue[0].status).toBe('pending');
      expect(queue[0].retries).toBe(0);
    });

    it('queues entry on network error without throwing', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const entry = makeAuditEntry();
      await expect(logAudit(entry)).resolves.toBeUndefined();

      const queue = getAuditQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].entry.order_id).toBe('order-1');
      expect(queue[0].status).toBe('pending');
    });

    it('includes metadata in the sent payload', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const entry = makeAuditEntry({
        action: 'stage.transition',
        metadata: { from_stage: 'Order_Submitted', to_stage: 'Quotation_Pending' },
      });
      await logAudit(entry);

      const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1]?.body) as string);
      expect(body.metadata).toEqual({ from_stage: 'Order_Submitted', to_stage: 'Quotation_Pending' });
    });

    it('includes payment amount in metadata for payment.confirmed', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const entry = makeAuditEntry({
        action: 'payment.confirmed',
        metadata: { amount: 150.50 },
      });
      await logAudit(entry);

      const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1]?.body) as string);
      expect(body.event_type).toBe('audit.payment.confirmed');
      expect(body.metadata.amount).toBe(150.50);
    });

    it('sends correct auth headers', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      await logAudit(makeAuditEntry());

      const options = vi.mocked(fetch).mock.calls[0][1];
      const headers = options?.headers as Record<string, string>;
      expect(headers['x-tenant-id']).toBe('tenant-1');
      expect(headers['x-client-id']).toBe('client-1');
      expect(headers['x-client-secret']).toBe('secret-1');
      expect(headers['Authorization']).toBe('Bearer key-1');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('createAuditEntry', () => {
    it('creates a well-formed audit entry with ISO 8601 UTC timestamp', () => {
      const before = new Date().toISOString();
      const entry = createAuditEntry(
        'order.created',
        'order-42',
        'trace-xyz',
        { id: 'user-1', type: 'customer' },
      );
      const after = new Date().toISOString();

      expect(entry.action).toBe('order.created');
      expect(entry.order_id).toBe('order-42');
      expect(entry.trace_id).toBe('trace-xyz');
      expect(entry.actor).toEqual({ id: 'user-1', type: 'customer' });
      expect(entry.timestamp >= before).toBe(true);
      expect(entry.timestamp <= after).toBe(true);
      // Verify ISO 8601 format
      expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
      expect(entry.metadata).toBeUndefined();
    });

    it('includes metadata when provided', () => {
      const entry = createAuditEntry(
        'stage.transition',
        'order-7',
        'trace-aaa',
        { id: 'admin-1', type: 'admin' },
        { from_stage: 'Payment_Pending', to_stage: 'Payment_Confirmed' },
      );

      expect(entry.metadata).toEqual({
        from_stage: 'Payment_Pending',
        to_stage: 'Payment_Confirmed',
      });
    });

    it('supports all action types', () => {
      const actions = ['order.created', 'stage.transition', 'payment.confirmed', 'order.completed'] as const;

      for (const action of actions) {
        const entry = createAuditEntry(action, 'o-1', 't-1', { id: 'u-1', type: 'customer' });
        expect(entry.action).toBe(action);
      }
    });
  });

  describe('calculateAuditBackoffDelay', () => {
    it('returns baseDelay × 2^retries', () => {
      expect(calculateAuditBackoffDelay(0)).toBe(2000);
      expect(calculateAuditBackoffDelay(1)).toBe(4000);
      expect(calculateAuditBackoffDelay(2)).toBe(8000);
      expect(calculateAuditBackoffDelay(3)).toBe(16000);
      expect(calculateAuditBackoffDelay(4)).toBe(32000);
    });

    it('supports custom base delay', () => {
      expect(calculateAuditBackoffDelay(0, 1000)).toBe(1000);
      expect(calculateAuditBackoffDelay(2, 1000)).toBe(4000);
    });
  });

  describe('getAuditQueue', () => {
    it('returns empty array when no entries exist', () => {
      expect(getAuditQueue()).toEqual([]);
    });

    it('returns queued entries after failed logAudit calls', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await logAudit(makeAuditEntry({ order_id: 'order-a' }));
      await logAudit(makeAuditEntry({ order_id: 'order-b' }));

      const queue = getAuditQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].entry.order_id).toBe('order-a');
      expect(queue[1].entry.order_id).toBe('order-b');
    });
  });

  describe('processAuditQueue', () => {
    it('retries pending entries and marks as sent on success', async () => {
      // Manually seed the queue with a ready-to-retry entry
      const entry: AuditEntry = makeAuditEntry();
      localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify([
        {
          id: 'q-1',
          entry,
          retries: 0,
          maxRetries: 5,
          nextRetryAt: Date.now() - 1000, // Already due
          status: 'pending',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ]));

      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      await processAuditQueue();

      // After successful send, entry should be removed (sent entries are filtered out)
      const queue = getAuditQueue();
      expect(queue).toHaveLength(0);
    });

    it('increments retries on failure and calculates next backoff', async () => {
      const entry: AuditEntry = makeAuditEntry();
      const now = Date.now();
      localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify([
        {
          id: 'q-2',
          entry,
          retries: 1,
          maxRetries: 5,
          nextRetryAt: now - 1000,
          status: 'pending',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ]));

      const mockResponse = new Response('Error', { status: 500 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      await processAuditQueue();

      const queue = getAuditQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retries).toBe(2);
      expect(queue[0].status).toBe('pending');
      // Next retry should be at least 8000ms (2000 * 2^2) from now
      expect(queue[0].nextRetryAt).toBeGreaterThanOrEqual(now + 8000 - 100);
    });

    it('marks as permanently failed after max retries and retains in queue', async () => {
      const entry: AuditEntry = makeAuditEntry();
      localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify([
        {
          id: 'q-3',
          entry,
          retries: 4, // One more failure will exhaust
          maxRetries: 5,
          nextRetryAt: Date.now() - 1000,
          status: 'pending',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ]));

      const mockResponse = new Response('Error', { status: 500 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      await processAuditQueue();

      const queue = getAuditQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].status).toBe('failed');
      expect(queue[0].retries).toBe(5);
      // Entry is retained for administrative review
      expect(queue[0].entry.order_id).toBe('order-1');
    });

    it('skips entries that are not yet due for retry', async () => {
      const entry: AuditEntry = makeAuditEntry();
      localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify([
        {
          id: 'q-4',
          entry,
          retries: 0,
          maxRetries: 5,
          nextRetryAt: Date.now() + 60000, // Not due yet
          status: 'pending',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ]));

      vi.spyOn(globalThis, 'fetch');

      await processAuditQueue();

      expect(fetch).not.toHaveBeenCalled();
      const queue = getAuditQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retries).toBe(0);
    });

    it('does not process already-failed entries', async () => {
      const entry: AuditEntry = makeAuditEntry();
      localStorage.setItem(AUDIT_QUEUE_KEY, JSON.stringify([
        {
          id: 'q-5',
          entry,
          retries: 5,
          maxRetries: 5,
          nextRetryAt: Date.now() - 1000,
          status: 'failed',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ]));

      vi.spyOn(globalThis, 'fetch');

      await processAuditQueue();

      expect(fetch).not.toHaveBeenCalled();
      // Entry is retained
      const queue = getAuditQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].status).toBe('failed');
    });
  });
});
