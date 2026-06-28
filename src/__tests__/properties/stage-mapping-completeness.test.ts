import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { OrderStage } from "@/types/order";
import {
  STAGE_TO_ZENVIX,
  ZENVIX_TO_STAGE,
  toZenvixStatus,
  toOrderStage,
  isLaterStage,
} from "@/api/zenvix-stage-mapping";

/**
 * Feature: vps-deployment-zenvix-integration, Property 5: Stage mapping is complete and bidirectional
 * **Validates: Requirements 5.2**
 */

const ALL_ORDER_STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

const VALID_ZENVIX_STATUSES = Object.keys(ZENVIX_TO_STAGE);

describe("Property 5: Stage mapping is complete and bidirectional", () => {
  it("toZenvixStatus returns a non-null string for every OrderStage", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ORDER_STAGES), (stage) => {
        const zenvixStatus = toZenvixStatus(stage);
        expect(zenvixStatus).not.toBeNull();
        expect(typeof zenvixStatus).toBe("string");
        expect(zenvixStatus.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("roundtrip: toOrderStage(toZenvixStatus(stage)) returns the original stage", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_ORDER_STAGES), (stage) => {
        const zenvixStatus = toZenvixStatus(stage);
        const roundtripped = toOrderStage(zenvixStatus);
        expect(roundtripped).toBe(stage);
      }),
      { numRuns: 100 }
    );
  });

  it("arbitrary strings NOT in the Zenvix status set return null from toOrderStage", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(
          (s) => !VALID_ZENVIX_STATUSES.includes(s)
        ),
        (arbitraryStatus) => {
          const result = toOrderStage(arbitraryStatus);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("isLaterStage preserves strict ordering of stages", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ORDER_STAGES),
        fc.constantFrom(...ALL_ORDER_STAGES),
        (stageA, stageB) => {
          const indexA = ALL_ORDER_STAGES.indexOf(stageA);
          const indexB = ALL_ORDER_STAGES.indexOf(stageB);

          if (indexB > indexA) {
            // B is later than A
            expect(isLaterStage(stageA, stageB)).toBe(true);
          } else {
            // B is same as or earlier than A
            expect(isLaterStage(stageA, stageB)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("STAGE_TO_ZENVIX covers all 6 OrderStage values", () => {
    expect(Object.keys(STAGE_TO_ZENVIX)).toHaveLength(6);
    for (const stage of ALL_ORDER_STAGES) {
      expect(STAGE_TO_ZENVIX[stage]).toBeDefined();
    }
  });

  it("ZENVIX_TO_STAGE covers all 6 Zenvix status values", () => {
    expect(Object.keys(ZENVIX_TO_STAGE)).toHaveLength(6);
    for (const status of VALID_ZENVIX_STATUSES) {
      expect(ZENVIX_TO_STAGE[status as keyof typeof ZENVIX_TO_STAGE]).toBeDefined();
    }
  });
});
