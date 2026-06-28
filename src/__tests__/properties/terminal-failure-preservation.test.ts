import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { processSyncQueue, SYNC_QUEUE_STORAGE_KEY } from "@/api/zenvix-order-sync";
import type { SyncQueueEntry } from "@/types/order";

/**
 * Feature: vps-deployment-zenvix-integration, Property 4: Terminal failure preserves event data
 * **Validates: Requirements 4.6, 6.5, 8.6**
 */

// Mock zenvix-config to allow processSyncQueue to run
vi.mock("@/api/zenvix-config", () => ({
  isZenvixConfigured: () => true,
  getZenvixConfig: () => ({
    gatewayUrl: "http://localhost:3001/api",
    tenantId: "test-tenant",
    clientId: "test-client",
    clientSecret: "test-secret",
    apiKey: "test-key",
    branchId: "test-branch",
    channel: "ecommerce",
  }),
}));

// Mock runtime-env to provide valid config values
vi.mock("@/config/runtime-env", () => ({
  getZenvixApiUrl: () => "http://localhost:3001/api",
  getZenvixChannelRecordId: () => "channel-123",
  getZenvixTenantId: () => "test-tenant",
  getZenvixClientId: () => "test-client",
  getZenvixClientSecret: () => "test-secret",
  getZenvixApiKey: () => "test-key",
  getZenvixBranchId: () => "test-branch",
  isZenvixConfigured: () => true,
}));

// Generator for random payloads (JSON-safe values only to survive localStorage roundtrip)
const payloadArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.oneof(
    fc.string({ minLength: 0, maxLength: 50 }),
    fc.integer(),
    fc.double({ noNaN: true, noDefaultInfinity: true }),
    fc.boolean()
  ),
  { minKeys: 1, maxKeys: 10 }
) as fc.Arbitrary<Record<string, unknown>>;

// Generator for a valid SyncQueueEntry at one retry before max (so processing triggers terminal failure)
// Only generates 'order_create' type because processSyncQueue currently only handles that type.
const syncQueueEntryAtMaxRetriesArb = (index: number) =>
  fc.record({
    id: fc.constant(`entry-${index}-unique`),
    orderId: fc.uuid(),
    type: fc.constant("order_create" as const),
    payload: payloadArb,
    maxRetries: fc.constant(5),
    retries: fc.constant(4), // One retry away from max — next failure triggers terminal
    nextRetryAt: fc.constant(0), // Due for processing immediately
    status: fc.constant("pending" as const),
    sequenceNumber: fc.nat({ max: 1000 }),
    createdAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map((ts) => new Date(ts).toISOString()),
  });

// Generate an array of 1-5 entries with unique IDs
const syncQueueEntriesArb = fc
  .integer({ min: 1, max: 5 })
  .chain((count) =>
    fc.tuple(...Array.from({ length: count }, (_, i) => syncQueueEntryAtMaxRetriesArb(i)))
  );

describe("Property 4: Terminal failure preserves event data", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    // Mock fetch to always return 500 (server error) to trigger retry/failure path
    fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("entries at max retries have status 'failed' after processing", async () => {
    await fc.assert(
      fc.asyncProperty(
        syncQueueEntriesArb,
        async (entries) => {
          // Place entries in localStorage
          localStorage.setItem(
            SYNC_QUEUE_STORAGE_KEY,
            JSON.stringify(entries)
          );

          // Process the queue (fetch returns 500, so all entries fail)
          await processSyncQueue();

          // Read back the queue from localStorage
          const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
          expect(raw).not.toBeNull();
          const resultQueue: SyncQueueEntry[] = JSON.parse(raw!);

          // Find all entries that should have been terminal-failed
          for (const originalEntry of entries) {
            const resultEntry = resultQueue.find((e) => e.id === originalEntry.id);
            expect(resultEntry).toBeDefined();
            expect(resultEntry!.status).toBe("failed");
            expect(resultEntry!.retries).toBeGreaterThanOrEqual(resultEntry!.maxRetries);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("payload data remains intact after terminal failure", async () => {
    await fc.assert(
      fc.asyncProperty(
        syncQueueEntriesArb,
        async (entries) => {
          // Deep clone original payloads for comparison
          const originalPayloads = entries.map((e) => ({
            id: e.id,
            payload: JSON.parse(JSON.stringify(e.payload)),
          }));

          // Place entries in localStorage
          localStorage.setItem(
            SYNC_QUEUE_STORAGE_KEY,
            JSON.stringify(entries)
          );

          // Process the queue
          await processSyncQueue();

          // Read back the queue
          const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
          expect(raw).not.toBeNull();
          const resultQueue: SyncQueueEntry[] = JSON.parse(raw!);

          // Verify each entry's payload is unchanged
          for (const { id, payload } of originalPayloads) {
            const resultEntry = resultQueue.find((e) => e.id === id);
            expect(resultEntry).toBeDefined();
            expect(resultEntry!.payload).toEqual(payload);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
