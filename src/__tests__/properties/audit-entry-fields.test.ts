import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createAuditEntry } from "@/api/zenvix-audit-logger";
import type { AuditAction, AuditActor } from "@/api/zenvix-audit-logger";

/**
 * Feature: vps-deployment-zenvix-integration, Property 20: Audit entry contains required fields per action type
 * **Validates: Requirements 10.1, 10.2, 10.3**
 */

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ISO 8601 regex pattern
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

// All valid audit action types
const AUDIT_ACTIONS: AuditAction[] = [
  "order.created",
  "stage.transition",
  "payment.confirmed",
  "order.completed",
];

// Generator for actor type
const actorTypeArb = fc.constantFrom<AuditActor["type"]>("customer", "admin");

// Generator for actor
const actorArb = fc.record({
  id: fc.uuid(),
  type: actorTypeArb,
});

describe("Property 20: Audit entry contains required fields per action type", () => {
  it("audit entry contains order_id, trace_id (UUID format), actor, and valid ISO 8601 timestamp for all action types", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...AUDIT_ACTIONS),
        fc.uuid(),
        fc.uuid(),
        actorArb,
        (action, orderId, traceId, actor) => {
          const entry = createAuditEntry(action, orderId, traceId, actor);

          // Verify order_id matches input
          expect(entry.order_id).toBe(orderId);

          // Verify trace_id matches input and is UUID format
          expect(entry.trace_id).toBe(traceId);
          expect(entry.trace_id).toMatch(UUID_REGEX);

          // Verify actor matches input
          expect(entry.actor).toEqual(actor);
          expect(entry.actor.id).toBe(actor.id);
          expect(entry.actor.type).toBe(actor.type);

          // Verify timestamp is valid ISO 8601
          expect(typeof entry.timestamp).toBe("string");
          expect(entry.timestamp).toMatch(ISO_8601_REGEX);
          const parsedDate = new Date(entry.timestamp);
          expect(parsedDate.getTime()).not.toBeNaN();

          // Verify action matches
          expect(entry.action).toBe(action);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("stage.transition entries include metadata with from_stage and to_stage", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        actorArb,
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (orderId, traceId, actor, fromStage, toStage) => {
          const metadata = { from_stage: fromStage, to_stage: toStage };
          const entry = createAuditEntry("stage.transition", orderId, traceId, actor, metadata);

          // Verify metadata is present
          expect(entry.metadata).toBeDefined();
          expect(entry.metadata!.from_stage).toBe(fromStage);
          expect(entry.metadata!.to_stage).toBe(toStage);

          // Verify base fields still correct
          expect(entry.order_id).toBe(orderId);
          expect(entry.trace_id).toBe(traceId);
          expect(entry.trace_id).toMatch(UUID_REGEX);
          expect(entry.actor).toEqual(actor);
          expect(entry.timestamp).toMatch(ISO_8601_REGEX);
          expect(entry.action).toBe("stage.transition");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("payment.confirmed entries include metadata with amount", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        actorArb,
        fc.double({ min: 0.01, max: 100000, noNaN: true }),
        (orderId, traceId, actor, amount) => {
          const metadata = { amount };
          const entry = createAuditEntry("payment.confirmed", orderId, traceId, actor, metadata);

          // Verify metadata is present with amount
          expect(entry.metadata).toBeDefined();
          expect(entry.metadata!.amount).toBe(amount);

          // Verify base fields still correct
          expect(entry.order_id).toBe(orderId);
          expect(entry.trace_id).toBe(traceId);
          expect(entry.trace_id).toMatch(UUID_REGEX);
          expect(entry.actor).toEqual(actor);
          expect(entry.timestamp).toMatch(ISO_8601_REGEX);
          expect(entry.action).toBe("payment.confirmed");
        }
      ),
      { numRuns: 100 }
    );
  });
});
