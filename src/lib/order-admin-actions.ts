import { transitionStage, getOrder } from './order-store';
import { syncStageTransition, syncQuotationRecorded, syncPaymentCompleted } from './zenvix-order-sync';
import { syncStageTransition as syncStageTransitionApi, syncSalesCompletion, syncQuotationRecorded as syncQuotationRecordedApi, syncPaymentCompleted as syncPaymentCompletedApi } from '@/api/zenvix-order-sync';
import { logAudit, createAuditEntry } from '@/api/zenvix-audit-logger';
import type { OrderRecord, PersistedOrderData } from '@/types/order';

const STORAGE_KEY = "bambu_whatsapp_orders";

/**
 * Records a quotation from the office (delivery cost + total).
 * Transitions: Quotation_Pending → Quotation_Sent → Payment_Pending
 * Fires Zenvix events for the transitions and quotation.
 */
export async function recordQuotation(
  orderId: string,
  deliveryCost: number,
  total: number,
  userId?: string
): Promise<void> {
  const order = getOrder(orderId);
  if (!order) {
    throw new Error(`[OrderAdminActions] Order not found: ${orderId}`);
  }
  if (order.stage !== 'Quotation_Pending') {
    throw new Error(
      `[OrderAdminActions] Cannot record quotation: order is at stage "${order.stage}", expected "Quotation_Pending"`
    );
  }

  const actor = { id: userId || 'admin', type: 'admin' as const };

  // Transition to Quotation_Sent with quotation metadata (local state first)
  transitionStage(orderId, 'Quotation_Sent', {
    quotedDeliveryCost: deliveryCost,
    quotedTotal: total,
  });
  // Fire-and-forget sync & audit (non-blocking)
  syncStageTransition(orderId, 'Quotation_Pending', 'Quotation_Sent', userId).catch(() => {});
  syncStageTransitionApi(orderId, 'Quotation_Pending', 'Quotation_Sent').catch(() => {});
  logAudit(createAuditEntry('stage.transition', orderId, order.traceId || '', actor, { from_stage: 'Quotation_Pending', to_stage: 'Quotation_Sent' })).catch(() => {});
  syncQuotationRecorded(orderId, deliveryCost, total, userId).catch(() => {});
  syncQuotationRecordedApi(orderId, deliveryCost, total).catch(() => {});

  // Transition to Payment_Pending (local state first)
  transitionStage(orderId, 'Payment_Pending');
  // Fire-and-forget sync & audit (non-blocking)
  syncStageTransition(orderId, 'Quotation_Sent', 'Payment_Pending', userId).catch(() => {});
  syncStageTransitionApi(orderId, 'Quotation_Sent', 'Payment_Pending').catch(() => {});
  logAudit(createAuditEntry('stage.transition', orderId, order.traceId || '', actor, { from_stage: 'Quotation_Sent', to_stage: 'Payment_Pending' })).catch(() => {});
}

/**
 * Confirms payment from the office.
 * Transitions: Payment_Pending → Payment_Confirmed → Complete
 * Fires Zenvix events for the transitions and payment.
 */
export async function confirmPayment(
  orderId: string,
  paidAmount: number,
  userId?: string
): Promise<void> {
  const order = getOrder(orderId);
  if (!order) {
    throw new Error(`[OrderAdminActions] Order not found: ${orderId}`);
  }
  if (order.stage !== 'Payment_Pending') {
    throw new Error(
      `[OrderAdminActions] Cannot confirm payment: order is at stage "${order.stage}", expected "Payment_Pending"`
    );
  }

  const actor = { id: userId || 'admin', type: 'admin' as const };

  // Transition to Payment_Confirmed with paid amount metadata (local state first)
  transitionStage(orderId, 'Payment_Confirmed', { paidAmount });
  // Fire-and-forget sync & audit (non-blocking)
  syncStageTransition(orderId, 'Payment_Pending', 'Payment_Confirmed', userId).catch(() => {});
  syncStageTransitionApi(orderId, 'Payment_Pending', 'Payment_Confirmed').catch(() => {});
  logAudit(createAuditEntry('stage.transition', orderId, order.traceId || '', actor, { from_stage: 'Payment_Pending', to_stage: 'Payment_Confirmed' })).catch(() => {});
  syncPaymentCompleted(orderId, paidAmount, userId).catch(() => {});
  syncPaymentCompletedApi(orderId, paidAmount).catch(() => {});
  logAudit(createAuditEntry('payment.confirmed', orderId, order.traceId || '', actor, { amount: paidAmount })).catch(() => {});

  // Transition to Complete (local state first)
  transitionStage(orderId, 'Complete');
  // Fire-and-forget sync & audit (non-blocking)
  syncStageTransition(orderId, 'Payment_Confirmed', 'Complete', userId).catch(() => {});
  syncStageTransitionApi(orderId, 'Payment_Confirmed', 'Complete').catch(() => {});
  logAudit(createAuditEntry('stage.transition', orderId, order.traceId || '', actor, { from_stage: 'Payment_Confirmed', to_stage: 'Complete' })).catch(() => {});

  // Sales completion on reaching Complete stage
  syncSalesCompletion(order).catch(() => {});
  logAudit(createAuditEntry('order.completed', orderId, order.traceId || '', actor, { final_stage: 'Complete' })).catch(() => {});
}

/**
 * Associates a user ID with an existing order.
 * Directly updates the persisted order's userId field in localStorage.
 */
export function associateUser(orderId: string, userId: string): void {
  const order = getOrder(orderId);
  if (!order) {
    throw new Error(`[OrderAdminActions] Order not found: ${orderId}`);
  }

  // Directly update the order in localStorage since there's no stage change
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    throw new Error(`[OrderAdminActions] No order data in storage`);
  }

  const data: PersistedOrderData = JSON.parse(raw);
  const orderIndex = data.orders.findIndex((o: OrderRecord) => o.id === orderId);
  if (orderIndex === -1) {
    throw new Error(`[OrderAdminActions] Order not found in storage: ${orderId}`);
  }

  data.orders[orderIndex] = {
    ...data.orders[orderIndex],
    userId,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
