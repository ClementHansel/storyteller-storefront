import * as fc from "fast-check";
import { describe, it } from "vitest";
import { createAuditEntry, AuditAction, AuditActor } from "@/api/zenvix-audit-logger";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const uuidArb = fc.uuid();

const auditActorArb: fc.Arbitrary<AuditActor> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom("customer" as const, "admin" as const),
});

const stageTransitionMetadataArb = fc.record({
  from_stage: fc.constantFrom(
    "Order_Submitted",
    "Quotation_Pending",
    "Quotation_Sent",
    "Payment_Pending"
  ),
  to_stage: fc.constantFrom(
    "Quotation_Pending",
    "Quotation_Sent",
    "Payment_Pending",
    "Payment_Confirmed"
  ),
});

describe("Feature: vps-deployment-zenvix-integration, Property 21: Trace ID is consistent across an order's lifetime", () => {
  /**
   * **Validates: Requirements 10.4**
   *
   * Property 21: Trace ID is consistent across an order's lifetime
   * For any order, the trace_id generated at order creation SHALL be included
   * in every subsequent audit entry (stage transitions, payment, completion)
   * for that same order_id.
   */
  it("should use the same trace_id across all audit entries for a single order lifecycle", () => {
    fc.assert(
      fc.property(
        uuidArb, // orderId
        uuidArb, // traceId
        auditActorArb,
        fc.array(stageTransitionMetadataArb, { minLength: 1, maxLength: 4 }),
        fc.integer({ min: 100, max: 999999 }).map((n) => n / 100), // payment amount
        (orderId, traceId, actor, transitions, paymentAmount) => {
          const entries = [];

          // 1. order.created entry
          entries.push(createAuditEntry("order.created", orderId, traceId, actor));

          // 2. stage.transition entries (1-4 random transitions)
          for (const meta of transitions) {
            entries.push(
              createAuditEntry("stage.transition", orderId, traceId, actor, meta)
            );
          }

          // 3. payment.confirmed entry
          entries.push(
            createAuditEntry("payment.confirmed", orderId, traceId, actor, {
              amount: paymentAmount,
            })
          );

          // 4. order.completed entry
          entries.push(createAuditEntry("order.completed", orderId, traceId, actor));

          // Verify ALL entries use the same trace_id
          for (const entry of entries) {
            if (entry.trace_id !== traceId) return false;
          }

          // Verify ALL entries reference the same order_id
          for (const entry of entries) {
            if (entry.order_id !== orderId) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 10.4**
   *
   * Verifies that different orders with different trace_ids do not
   * cross-contaminate — each order's entries contain only its own trace_id.
   */
  it("should not cross-contaminate trace_ids between different orders", () => {
    fc.assert(
      fc.property(
        uuidArb, // orderId1
        uuidArb, // traceId1
        uuidArb, // orderId2
        uuidArb, // traceId2
        auditActorArb,
        fc.array(stageTransitionMetadataArb, { minLength: 1, maxLength: 3 }),
        fc.array(stageTransitionMetadataArb, { minLength: 1, maxLength: 3 }),
        (orderId1, traceId1, orderId2, traceId2, actor, transitions1, transitions2) => {
          // Skip cases where generated IDs happen to collide
          if (orderId1 === orderId2 || traceId1 === traceId2) return true;

          // Build lifecycle entries for order 1
          const order1Entries = [
            createAuditEntry("order.created", orderId1, traceId1, actor),
            ...transitions1.map((meta) =>
              createAuditEntry("stage.transition", orderId1, traceId1, actor, meta)
            ),
            createAuditEntry("payment.confirmed", orderId1, traceId1, actor, {
              amount: 50.0,
            }),
            createAuditEntry("order.completed", orderId1, traceId1, actor),
          ];

          // Build lifecycle entries for order 2
          const order2Entries = [
            createAuditEntry("order.created", orderId2, traceId2, actor),
            ...transitions2.map((meta) =>
              createAuditEntry("stage.transition", orderId2, traceId2, actor, meta)
            ),
            createAuditEntry("payment.confirmed", orderId2, traceId2, actor, {
              amount: 75.0,
            }),
            createAuditEntry("order.completed", orderId2, traceId2, actor),
          ];

          // Order 1 entries must all have traceId1 and orderId1
          for (const entry of order1Entries) {
            if (entry.trace_id !== traceId1) return false;
            if (entry.order_id !== orderId1) return false;
          }

          // Order 2 entries must all have traceId2 and orderId2
          for (const entry of order2Entries) {
            if (entry.trace_id !== traceId2) return false;
            if (entry.order_id !== orderId2) return false;
          }

          // No cross-contamination: order1 trace_id never appears in order2 entries
          for (const entry of order2Entries) {
            if (entry.trace_id === traceId1) return false;
          }

          // No cross-contamination: order2 trace_id never appears in order1 entries
          for (const entry of order1Entries) {
            if (entry.trace_id === traceId2) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
