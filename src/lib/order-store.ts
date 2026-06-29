import { OrderRecord, OrderStage, PersistedOrderData, VALID_TRANSITIONS } from "@/types/order";

const STORAGE_KEY = "bambu_whatsapp_orders";

let useInMemoryFallback = false;
let inMemoryStore: PersistedOrderData = { orders: [], version: 1 };

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function initStorage(): void {
  if (!isLocalStorageAvailable()) {
    useInMemoryFallback = true;
    console.warn(
      "[OrderStore] localStorage is unavailable. Orders will be stored in memory only and will not persist across sessions."
    );
  }
}

function loadOrders(): PersistedOrderData {
  if (useInMemoryFallback) {
    return inMemoryStore;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { orders: [], version: 1 };
    }
    const parsed = JSON.parse(raw) as PersistedOrderData;
    return parsed;
  } catch {
    return { orders: [], version: 1 };
  }
}

function persistOrders(data: PersistedOrderData): void {
  if (useInMemoryFallback) {
    inMemoryStore = data;
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // If persistence fails (e.g., quota exceeded), fall back to in-memory
    useInMemoryFallback = true;
    inMemoryStore = data;
    console.warn(
      "[OrderStore] Failed to persist to localStorage. Falling back to in-memory storage."
    );
  }
}

// Initialize storage detection on module load
initStorage();

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a new order with stage Order_Submitted and persists it.
 * Generates a traceId (UUID) for audit trail correlation across all events for this order.
 */
export function createOrder(
  data: Omit<OrderRecord, "id" | "stage" | "createdAt" | "updatedAt" | "stageHistory" | "traceId">
): OrderRecord {
  const now = new Date().toISOString();
  const order: OrderRecord = {
    ...data,
    id: generateUUID(),
    traceId: generateUUID(),
    stage: "Order_Submitted",
    createdAt: now,
    updatedAt: now,
    stageHistory: [{ stage: "Order_Submitted", timestamp: now }],
  };

  const store = loadOrders();
  store.orders.push(order);
  persistOrders(store);

  return order;
}

/**
 * Transitions an order to a new stage. Validates the transition is allowed.
 * Optionally merges additional metadata into the order record.
 * Throws an error if the transition is invalid or the order is not found.
 */
export function transitionStage(
  orderId: string,
  newStage: OrderStage,
  metadata?: Partial<OrderRecord>
): OrderRecord {
  const store = loadOrders();
  const orderIndex = store.orders.findIndex((o) => o.id === orderId);

  if (orderIndex === -1) {
    throw new Error(`[OrderStore] Order not found: ${orderId}`);
  }

  const order = store.orders[orderIndex];
  const allowedNextStage = VALID_TRANSITIONS[order.stage];

  if (allowedNextStage === null || allowedNextStage !== newStage) {
    throw new Error(
      `[OrderStore] Invalid stage transition: ${order.stage} → ${newStage}. ` +
        `Allowed: ${order.stage} → ${allowedNextStage ?? "none (terminal stage)"}`
    );
  }

  const now = new Date().toISOString();
  const updatedOrder: OrderRecord = {
    ...order,
    ...metadata,
    id: order.id, // Prevent metadata from overwriting id
    stage: newStage,
    updatedAt: now,
    stageHistory: [...order.stageHistory, { stage: newStage, timestamp: now }],
  };

  store.orders[orderIndex] = updatedOrder;
  persistOrders(store);

  return updatedOrder;
}

/**
 * Retrieves a single order by ID.
 */
export function getOrder(orderId: string): OrderRecord | null {
  const store = loadOrders();
  return store.orders.find((o) => o.id === orderId) ?? null;
}

/**
 * Retrieves the most recently created order.
 */
export function getLatestOrder(): OrderRecord | null {
  const store = loadOrders();
  if (store.orders.length === 0) {
    return null;
  }
  // Orders are appended chronologically, so the last one is the latest
  return store.orders[store.orders.length - 1];
}

/**
 * Retrieves all orders.
 */
export function getAllOrders(): OrderRecord[] {
  const store = loadOrders();
  return store.orders;
}
