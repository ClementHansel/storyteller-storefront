import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncOrderPlaced,
  syncStageTransition,
  syncQuotationRecorded,
  syncPaymentCompleted,
} from './zenvix-order-sync';
import type { OrderRecord } from '@/types/order';

// Mock the trackEvent function
vi.mock('@/api/zenvix-events', () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

import { trackEvent } from '@/api/zenvix-events';

const mockTrackEvent = vi.mocked(trackEvent);

describe('zenvix-order-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncOrderPlaced', () => {
    it('fires order.placed event with correct payload', async () => {
      const order: OrderRecord = {
        id: 'ORD-001',
        stage: 'Order_Submitted',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '6281234567890',
        shippingAddress: '123 Main St, City',
        items: [
          { productId: 'p1', title: 'Silver Ring', quantity: 2, unitPrice: 50 },
          { productId: 'p2', title: 'Necklace', quantity: 1, unitPrice: 120 },
        ],
        subtotal: 220,
        userId: 'user-123',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        stageHistory: [{ stage: 'Order_Submitted', timestamp: '2024-01-15T10:00:00.000Z' }],
      };

      await syncOrderPlaced(order);

      expect(mockTrackEvent).toHaveBeenCalledOnce();
      expect(mockTrackEvent).toHaveBeenCalledWith('order.placed', 'user-123', {
        order_id: 'ORD-001',
        timestamp: '2024-01-15T10:00:00.000Z',
        customer: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '6281234567890',
        },
        items: [
          { productId: 'p1', title: 'Silver Ring', quantity: 2, unitPrice: 50 },
          { productId: 'p2', title: 'Necklace', quantity: 1, unitPrice: 120 },
        ],
        subtotal: 220,
      });
    });

    it('uses anonymous when userId is not set', async () => {
      const order: OrderRecord = {
        id: 'ORD-002',
        stage: 'Order_Submitted',
        customerName: 'Guest',
        customerEmail: 'guest@example.com',
        customerPhone: '62899999',
        shippingAddress: '456 Other Ave, Town',
        items: [{ productId: 'p3', title: 'Bracelet', quantity: 1, unitPrice: 80 }],
        subtotal: 80,
        createdAt: '2024-01-16T12:00:00.000Z',
        updatedAt: '2024-01-16T12:00:00.000Z',
        stageHistory: [{ stage: 'Order_Submitted', timestamp: '2024-01-16T12:00:00.000Z' }],
      };

      await syncOrderPlaced(order);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'order.placed',
        'anonymous',
        expect.objectContaining({ order_id: 'ORD-002' }),
      );
    });
  });

  describe('syncStageTransition', () => {
    it('fires order.stage_transition event with from/to stages', async () => {
      await syncStageTransition('ORD-001', 'Order_Submitted', 'Quotation_Pending', 'user-123');

      expect(mockTrackEvent).toHaveBeenCalledOnce();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'order.stage_transition',
        'user-123',
        expect.objectContaining({
          order_id: 'ORD-001',
          from_stage: 'Order_Submitted',
          to_stage: 'Quotation_Pending',
        }),
      );
    });

    it('includes a timestamp for idempotency', async () => {
      await syncStageTransition('ORD-001', 'Quotation_Pending', 'Quotation_Sent');

      const payload = mockTrackEvent.mock.calls[0][2] as Record<string, unknown>;
      expect(payload.timestamp).toBeDefined();
      expect(typeof payload.timestamp).toBe('string');
    });

    it('uses anonymous when userId is not provided', async () => {
      await syncStageTransition('ORD-003', 'Payment_Pending', 'Payment_Confirmed');

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'order.stage_transition',
        'anonymous',
        expect.objectContaining({ order_id: 'ORD-003' }),
      );
    });
  });

  describe('syncQuotationRecorded', () => {
    it('fires order.quotation_recorded event with delivery cost and total', async () => {
      await syncQuotationRecorded('ORD-001', 15, 235, 'user-123');

      expect(mockTrackEvent).toHaveBeenCalledOnce();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'order.quotation_recorded',
        'user-123',
        expect.objectContaining({
          order_id: 'ORD-001',
          delivery_cost: 15,
          total: 235,
        }),
      );
    });

    it('includes a timestamp for idempotency', async () => {
      await syncQuotationRecorded('ORD-001', 10, 100);

      const payload = mockTrackEvent.mock.calls[0][2] as Record<string, unknown>;
      expect(payload.timestamp).toBeDefined();
      expect(typeof payload.timestamp).toBe('string');
    });

    it('uses anonymous when userId is not provided', async () => {
      await syncQuotationRecorded('ORD-004', 20, 300);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'order.quotation_recorded',
        'anonymous',
        expect.objectContaining({ order_id: 'ORD-004' }),
      );
    });
  });

  describe('syncPaymentCompleted', () => {
    it('fires payment.completed event with amount', async () => {
      await syncPaymentCompleted('ORD-001', 235, 'user-123');

      expect(mockTrackEvent).toHaveBeenCalledOnce();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'payment.completed',
        'user-123',
        expect.objectContaining({
          order_id: 'ORD-001',
          amount: 235,
        }),
      );
    });

    it('includes a timestamp for idempotency', async () => {
      await syncPaymentCompleted('ORD-001', 100);

      const payload = mockTrackEvent.mock.calls[0][2] as Record<string, unknown>;
      expect(payload.timestamp).toBeDefined();
      expect(typeof payload.timestamp).toBe('string');
    });

    it('uses anonymous when userId is not provided', async () => {
      await syncPaymentCompleted('ORD-005', 500);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'payment.completed',
        'anonymous',
        expect.objectContaining({ order_id: 'ORD-005' }),
      );
    });
  });

  describe('failed sync queues event for retry (Requirement 6.5)', () => {
    it('propagates the error when trackEvent rejects', async () => {
      mockTrackEvent.mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        syncOrderPlaced({
          id: 'ORD-ERR-001',
          stage: 'Order_Submitted',
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '628000000',
          shippingAddress: '789 Error Blvd, Failtown',
          items: [{ productId: 'p1', title: 'Ring', quantity: 1, unitPrice: 50 }],
          subtotal: 50,
          userId: 'user-err',
          createdAt: '2024-02-01T08:00:00.000Z',
          updatedAt: '2024-02-01T08:00:00.000Z',
          stageHistory: [{ stage: 'Order_Submitted', timestamp: '2024-02-01T08:00:00.000Z' }],
        }),
      ).rejects.toThrow('Network failure');

      expect(mockTrackEvent).toHaveBeenCalledOnce();
    });

    it('propagates the error from syncStageTransition when trackEvent rejects', async () => {
      mockTrackEvent.mockRejectedValueOnce(new Error('Timeout'));

      await expect(
        syncStageTransition('ORD-ERR-002', 'Order_Submitted', 'Quotation_Pending', 'user-err'),
      ).rejects.toThrow('Timeout');

      expect(mockTrackEvent).toHaveBeenCalledOnce();
    });
  });
});
