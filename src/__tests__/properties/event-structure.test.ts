/**
 * Property 18: Event pipeline structure consistency
 *
 * For any event sent through the Event_Pipeline, the event object SHALL contain:
 * - context.channel_record_id (matching configured value)
 * - actor.id (session UUID or user ID)
 * - actor.type ("customer" or "guest")
 * - actor.tenant_id
 * - actor.branch_id
 *
 * **Validates: Requirements 9.1, 9.2, 9.5**
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import type { ZenvixUserEvent } from '@/types/zenvix';

// ---------------------------------------------------------------------------
// Configuration constants for assertions
// ---------------------------------------------------------------------------
const TEST_CHANNEL_RECORD_ID = 'test-channel-record-456';
const TEST_TENANT_ID = 'test-tenant-789';
const TEST_BRANCH_ID = 'test-branch-012';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Capture the event object passed to sendUserEvent
let capturedEvent: ZenvixUserEvent | null = null;

vi.mock('@/api/zenvix-client', () => ({
  sendUserEvent: vi.fn(async (_config: unknown, event: ZenvixUserEvent) => {
    capturedEvent = event;
    return { success: true };
  }),
}));

vi.mock('@/api/zenvix-config', () => ({
  getZenvixConfig: () => ({
    gatewayUrl: 'http://localhost:3001/api/retail/public',
    tenantId: TEST_TENANT_ID,
    clientId: 'client-1',
    clientSecret: 'secret-1',
    apiKey: 'key-1',
    branchId: TEST_BRANCH_ID,
    channel: 'ecommerce',
  }),
  isZenvixConfigured: () => true,
}));

vi.mock('@/config/runtime-env', () => ({
  getZenvixChannelRecordId: () => TEST_CHANNEL_RECORD_ID,
  getZenvixTenantId: () => TEST_TENANT_ID,
  getZenvixBranchId: () => TEST_BRANCH_ID,
}));

import { trackEvent } from '@/api/zenvix-events';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const eventTypeArb = fc.constantFrom(
  'session.start' as const,
  'page.view' as const,
  'product.view' as const,
  'search.query' as const,
  'user.register' as const,
  'user.login' as const,
  'user.logout' as const,
  'wishlist.add' as const,
  'wishlist.remove' as const,
  'cart.add' as const,
  'cart.remove' as const,
  'cart.update' as const,
  'cart.checkout' as const,
  'checkout.start' as const,
  'payment.completed' as const,
  'order.placed' as const,
  'order.stage_transition' as const,
  'order.quotation_recorded' as const,
  'chat.initiated' as const,
);

/**
 * Generates a userId: either an empty string (guest) or a non-empty string (customer).
 * This tests both paths through the actor logic.
 */
const userIdArb = fc.oneof(
  fc.constant(''),                                       // guest path
  fc.string({ minLength: 1, maxLength: 36 }),           // customer path
);

const payloadArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 10 }),
  fc.oneof(fc.string(), fc.integer(), fc.boolean()),
);

// ---------------------------------------------------------------------------
// Property Test
// ---------------------------------------------------------------------------

describe('Property 18: Event pipeline structure consistency', () => {
  beforeEach(() => {
    capturedEvent = null;
    // Set up sessionStorage for session UUID generation
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('every event has context.channel_record_id matching the configured value', async () => {
    await fc.assert(
      fc.asyncProperty(eventTypeArb, userIdArb, payloadArb, async (eventType, userId, payload) => {
        capturedEvent = null;

        await trackEvent(eventType, userId, payload);

        expect(capturedEvent).not.toBeNull();
        expect(capturedEvent!.context.channel_record_id).toBe(TEST_CHANNEL_RECORD_ID);
      }),
      { numRuns: 100 },
    );
  });

  it('actor.id is userId when provided, otherwise a valid session UUID', async () => {
    await fc.assert(
      fc.asyncProperty(eventTypeArb, userIdArb, payloadArb, async (eventType, userId, payload) => {
        capturedEvent = null;

        await trackEvent(eventType, userId, payload);

        expect(capturedEvent).not.toBeNull();

        if (userId) {
          // Customer path: actor.id should be the provided userId
          expect(capturedEvent!.actor.id).toBe(userId);
        } else {
          // Guest path: actor.id should be a non-empty session UUID
          expect(capturedEvent!.actor.id).toBeTruthy();
          expect(typeof capturedEvent!.actor.id).toBe('string');
          expect(capturedEvent!.actor.id.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('actor.type is "customer" when userId is provided, "guest" otherwise', async () => {
    await fc.assert(
      fc.asyncProperty(eventTypeArb, userIdArb, payloadArb, async (eventType, userId, payload) => {
        capturedEvent = null;

        await trackEvent(eventType, userId, payload);

        expect(capturedEvent).not.toBeNull();

        if (userId) {
          expect(capturedEvent!.actor.type).toBe('customer');
        } else {
          expect(capturedEvent!.actor.type).toBe('guest');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('actor.tenant_id and actor.branch_id are always present and match config', async () => {
    await fc.assert(
      fc.asyncProperty(eventTypeArb, userIdArb, payloadArb, async (eventType, userId, payload) => {
        capturedEvent = null;

        await trackEvent(eventType, userId, payload);

        expect(capturedEvent).not.toBeNull();
        expect(capturedEvent!.actor.tenant_id).toBe(TEST_TENANT_ID);
        expect(capturedEvent!.actor.branch_id).toBe(TEST_BRANCH_ID);
      }),
      { numRuns: 100 },
    );
  });
});
