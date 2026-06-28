// Types for the WhatsApp checkout flow order system

export type OrderStage =
  | "Order_Submitted"
  | "Quotation_Pending"
  | "Quotation_Sent"
  | "Payment_Pending"
  | "Payment_Confirmed"
  | "Complete";

/** Sync status for Zenvix order creation */
export type SyncStatus = 'pending' | 'synced' | 'sync_failed';

/** Types of entries that can be queued for Zenvix sync */
export type SyncQueueEntryType =
  | 'order_create'
  | 'stage_transition'
  | 'quotation'
  | 'payment'
  | 'sales_complete'
  | 'audit';

/** Status of a sync queue entry */
export type SyncQueueEntryStatus = 'pending' | 'sent' | 'failed' | 'deferred';

export interface OrderRecord {
  id: string;
  stage: OrderStage;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: Array<{ productId: string; title: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  quotedDeliveryCost?: number;
  quotedTotal?: number;
  paidAmount?: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  stageHistory: Array<{ stage: OrderStage; timestamp: string; source?: 'local' | 'zenvix_admin' }>;

  // Zenvix sync fields
  /** The order_id returned by Zenvix after successful order creation sync */
  zenvixOrderId?: string;
  /** Current sync status with Zenvix */
  syncStatus?: SyncStatus;
  /** UUID for audit trail correlation across all events for this order */
  traceId?: string;
  /** Prevents duplicate sales completion events from being sent */
  salesEventSent?: boolean;
}

/**
 * Represents a queued transition waiting to be sent to Zenvix.
 * Used when the zenvixOrderId is not yet available (deferred state).
 */
export interface QueuedTransition {
  fromStage: OrderStage;
  toStage: OrderStage;
  timestamp: string;
  sequenceNumber: number;
}

/**
 * Represents an entry in the sync queue for Zenvix API calls.
 * Each entry tracks its own retry state and ordering metadata.
 */
export interface SyncQueueEntry {
  /** Unique identifier for this queue entry */
  id: string;
  /** Local order ID this entry belongs to */
  orderId: string;
  /** The type of sync operation */
  type: SyncQueueEntryType;
  /** The payload to send to Zenvix API */
  payload: Record<string, unknown>;
  /** Number of retry attempts made so far */
  retries: number;
  /** Maximum number of retries allowed (default: 5) */
  maxRetries: number;
  /** Timestamp (ms since epoch) for when the next retry should be attempted */
  nextRetryAt: number;
  /** Current status of this queue entry */
  status: SyncQueueEntryStatus;
  /** Sequence number for per-order ordering of events */
  sequenceNumber: number;
  /** ISO 8601 timestamp of when this entry was created */
  createdAt: string;
}

/**
 * Tracks the sync state for an individual order with Zenvix.
 * Used by the Order_Sync_Service to manage deferred transitions and
 * prevent duplicate events.
 */
export interface OrderSyncState {
  /** The Zenvix order_id, or null if order creation hasn't synced yet */
  zenvixOrderId: string | null;
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Transitions queued while waiting for zenvixOrderId */
  pendingTransitions: QueuedTransition[];
  /** Whether the sales completion event has been sent for this order */
  salesEventSent: boolean;
}

export interface PersistedOrderData {
  orders: OrderRecord[];
  version: 1;
}

export interface CheckoutFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
}

export interface WhatsAppMessage {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  subtotal: number;
}

export interface WhatsAppConnectorResult {
  success: boolean;
  url: string;
  truncated: boolean;
}

export interface WhatsAppConfig {
  officePhone: string;
  maxMessageLength: number;
}

export const VALID_TRANSITIONS: Record<OrderStage, OrderStage | null> = {
  Order_Submitted: "Quotation_Pending",
  Quotation_Pending: "Quotation_Sent",
  Quotation_Sent: "Payment_Pending",
  Payment_Pending: "Payment_Confirmed",
  Payment_Confirmed: "Complete",
  Complete: null,
};
