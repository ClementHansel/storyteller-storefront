// ============================================================
// Bidirectional stage mapping between Storefront OrderStage
// and Zenvix order status strings.
// ============================================================

import type { OrderStage } from "@/types/order";

/**
 * Zenvix status string type — the remote representation of order stages.
 */
export type ZenvixStatus =
  | "SUBMITTED"
  | "QUOTATION_PENDING"
  | "QUOTATION_SENT"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "ORDER_PREPARED"
  | "DELIVERY"
  | "COMPLETED";

/**
 * Ordered list of stages from earliest to latest.
 * Used for comparison in `isLaterStage`.
 */
const STAGE_ORDER: readonly OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Order_Prepared",
  "Delivery",
  "Complete",
] as const;

/**
 * Maps each local OrderStage to its corresponding Zenvix status string.
 */
export const STAGE_TO_ZENVIX: Record<OrderStage, ZenvixStatus> = {
  Order_Submitted: "SUBMITTED",
  Quotation_Pending: "QUOTATION_PENDING",
  Quotation_Sent: "QUOTATION_SENT",
  Payment_Pending: "PAYMENT_PENDING",
  Payment_Confirmed: "PAYMENT_CONFIRMED",
  Order_Prepared: "ORDER_PREPARED",
  Delivery: "DELIVERY",
  Complete: "COMPLETED",
};

/**
 * Reverse map: Zenvix status string → local OrderStage.
 */
export const ZENVIX_TO_STAGE: Record<ZenvixStatus, OrderStage> = {
  SUBMITTED: "Order_Submitted",
  QUOTATION_PENDING: "Quotation_Pending",
  QUOTATION_SENT: "Quotation_Sent",
  PAYMENT_PENDING: "Payment_Pending",
  PAYMENT_CONFIRMED: "Payment_Confirmed",
  ORDER_PREPARED: "Order_Prepared",
  DELIVERY: "Delivery",
  COMPLETED: "Complete",
};

/**
 * Convert a local OrderStage to its Zenvix status string.
 */
export function toZenvixStatus(stage: OrderStage): ZenvixStatus {
  return STAGE_TO_ZENVIX[stage];
}

/**
 * Convert a Zenvix status string to the corresponding local OrderStage.
 * Returns `null` if the status string is not recognized.
 */
export function toOrderStage(status: string): OrderStage | null {
  if (Object.hasOwn(ZENVIX_TO_STAGE, status)) {
    return (ZENVIX_TO_STAGE as Record<string, OrderStage>)[status];
  }
  return null;
}

/**
 * Returns true if `candidate` is a later stage than `current`
 * in the order lifecycle sequence.
 */
export function isLaterStage(current: OrderStage, candidate: OrderStage): boolean {
  const currentIndex = STAGE_ORDER.indexOf(current);
  const candidateIndex = STAGE_ORDER.indexOf(candidate);
  return candidateIndex > currentIndex;
}
