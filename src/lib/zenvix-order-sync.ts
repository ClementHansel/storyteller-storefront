// ============================================================
// Zenvix Order Sync — Event Forwarding for Order Lifecycle
// ============================================================
// Fires Zenvix events when orders are created, stages transition,
// quotations are recorded, and payments are confirmed.
// Leverages the existing trackEvent + retry queue infrastructure.
// Each event includes order_id and timestamp for idempotency.
// ============================================================

import { trackEvent } from '@/api/zenvix-events';
import type { OrderRecord, OrderStage } from '@/types/order';

/**
 * Fire when an order is created (order.placed event).
 * Includes customer info, items, and subtotal.
 */
export async function syncOrderPlaced(order: OrderRecord): Promise<void> {
  await trackEvent('order.placed', order.userId || 'anonymous', {
    order_id: order.id,
    timestamp: order.createdAt,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    subtotal: order.subtotal,
  });
}

/**
 * Fire when an order stage transitions (order.stage_transition event).
 * Includes the previous and new stages.
 */
export async function syncStageTransition(
  orderId: string,
  fromStage: OrderStage,
  toStage: OrderStage,
  userId?: string,
): Promise<void> {
  await trackEvent('order.stage_transition', userId || 'anonymous', {
    order_id: orderId,
    timestamp: new Date().toISOString(),
    from_stage: fromStage,
    to_stage: toStage,
  });
}

/**
 * Fire when a quotation is recorded (order.quotation_recorded event).
 * Includes delivery cost and quoted total.
 */
export async function syncQuotationRecorded(
  orderId: string,
  deliveryCost: number,
  total: number,
  userId?: string,
): Promise<void> {
  await trackEvent('order.quotation_recorded', userId || 'anonymous', {
    order_id: orderId,
    timestamp: new Date().toISOString(),
    delivery_cost: deliveryCost,
    total,
  });
}

/**
 * Fire when payment is confirmed (payment.completed event).
 * Includes the paid amount.
 */
export async function syncPaymentCompleted(
  orderId: string,
  amount: number,
  userId?: string,
): Promise<void> {
  await trackEvent('payment.completed', userId || 'anonymous', {
    order_id: orderId,
    timestamp: new Date().toISOString(),
    amount,
  });
}
