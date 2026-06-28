# Implementation Plan: VPS Deployment & Zenvix Integration

## Overview

This plan implements the containerized Docker deployment of the Bambu Silver storefront on the VPS and the full bidirectional order lifecycle integration with Zenvix. Tasks are organized to build infrastructure first (Docker, deploy script, env config), then core integration modules (order sync, stage mapping, notification poller), followed by sales/marketing/audit modules, and finally wiring everything together with integration tests.

## Tasks

- [x] 1. Docker deployment infrastructure
  - [x] 1.1 Create the multi-stage Dockerfile
    - Create `Dockerfile` in project root with two stages: (1) `node:20-alpine` builder that runs `npm ci` and `npm run build`, (2) `nginx:alpine` that copies `dist/` to `/usr/share/nginx/html`
    - Copy custom `nginx.conf` and `docker-entrypoint.sh` into the image
    - Expose port 80
    - _Requirements: 1.1, 1.5, 1.7_

  - [x] 1.2 Create Nginx configuration for SPA serving
    - Create `nginx.conf` with `try_files $uri $uri/ /index.html` for SPA fallback
    - Add gzip compression for JS, CSS, HTML, and JSON content types
    - Add static asset caching headers (Cache-Control for assets in `/assets/`)
    - _Requirements: 1.4_

  - [x] 1.3 Create runtime environment injection script
    - Create `docker-entrypoint.sh` that generates `/usr/share/nginx/html/env-config.js` at container start
    - Script iterates over `VITE_*` environment variables and writes them as `window.__ENV__` properties
    - Add `<script src="/env-config.js"></script>` to `index.html` before the app bundle
    - _Requirements: 1.6, 3.3_

  - [x] 1.4 Create docker-compose.yml
    - Define `bambusilver-storefront` service with build context `.` and `Dockerfile`
    - Map port `3020:80`, set `container_name: bambusilver-storefront`
    - Join external network `bfs_default`, set restart policy `unless-stopped`
    - Bind mount `.env.production` as read-only volume
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 1.5 Create the auto-deploy script (`vps-auto-deploy.sh`)
    - Implement flock-based mutex to prevent concurrent executions
    - Record git revision before pull, perform `git pull origin main`
    - Compare revisions: if changed, run `docker compose up -d --build`; if same, skip
    - Log timestamped entries (success, skip, errors) to `/home/ubuntu/bambusilver/logs/deploy.log`
    - Handle build failures by logging error and retaining previous container
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7, 2.8_

  - [x] 1.6 Create cron job configuration file
    - Create a file documenting the cron entry: `*/5 * * * * /home/ubuntu/bambusilver/vps-auto-deploy.sh`
    - Include setup instructions for the VPS
    - _Requirements: 2.5_

- [x] 2. Runtime configuration and environment setup
  - [x] 2.1 Update the Storefront to read runtime config from `window.__ENV__`
    - Create a `src/config/runtime-env.ts` module that merges `window.__ENV__` values with `import.meta.env` (runtime takes precedence)
    - Export typed getters for all `VITE_*` variables
    - _Requirements: 3.1, 3.2_

  - [x] 2.2 Implement configuration validation and fallback behavior
    - In `runtime-env.ts`, add `isZenvixConfigured()` that checks for the 4 required env vars
    - If any are missing, log a console warning and return `false`
    - Update `zenvix-config.ts` to use the new runtime config module and fall back to mock data when `isZenvixConfigured()` returns false
    - Add 5-second timeout check on first API call; fall back to mock data if unreachable
    - _Requirements: 3.4, 3.5_

  - [x] 2.3 Write property test for configuration fallback (Property 22)
    - **Property 22: Configuration fallback on missing required variables**
    - Generate subsets of the 4 required env vars; verify `isZenvixConfigured()` returns false when any is missing
    - **Validates: Requirements 3.4**

  - [x] 2.4 Create `.env.production.example` template
    - Document all required and optional environment variables with placeholder values
    - Include comments explaining each variable's purpose
    - _Requirements: 3.1, 3.2_

- [x] 3. Checkpoint - Deployment infrastructure review
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Stage mapping and core sync types
  - [x] 4.1 Implement bidirectional stage mapping module
    - Create `src/api/zenvix-stage-mapping.ts` with a `STAGE_TO_ZENVIX` map and a `ZENVIX_TO_STAGE` reverse map
    - Cover all 6 stages: Order_Submitted↔SUBMITTED, Quotation_Pending↔QUOTATION_PENDING, Quotation_Sent↔QUOTATION_SENT, Payment_Pending↔PAYMENT_PENDING, Payment_Confirmed↔PAYMENT_CONFIRMED, Complete↔COMPLETED
    - Export `toZenvixStatus(stage)` and `toOrderStage(status)` functions (latter returns `null` for unmapped strings)
    - Export `isLaterStage(current, candidate)` comparator using stage ordering
    - _Requirements: 5.2, 11.5_

  - [x] 4.2 Write property test for stage mapping completeness (Property 5)
    - **Property 5: Stage mapping is complete and bidirectional**
    - Enumerate all 6 OrderStage values; verify non-null Zenvix status; verify reverse mapping returns original stage
    - **Validates: Requirements 5.2**

  - [x] 4.3 Define sync queue types and extend OrderRecord
    - In `src/types/order.ts` (or relevant type file), add `zenvixOrderId`, `syncStatus`, `traceId`, and `salesEventSent` fields to `OrderRecord`
    - Define `SyncQueueEntry` interface with id, orderId, type, payload, retries, maxRetries, nextRetryAt, status, sequenceNumber, createdAt
    - Define `OrderSyncState` interface
    - _Requirements: 4.1, 4.2, 4.6_

- [x] 5. Order creation sync
  - [x] 5.1 Implement order creation sync in Order_Sync_Service
    - Extend `src/api/zenvix-order-sync.ts` with `syncOrderCreation(order: OrderRecord)` function
    - Build POST payload with items (SKU + quantity), customer (email + name), payment_status = "PENDING", channel_record_id from config
    - On 2xx response: store returned `order_id` as `zenvixOrderId` on the local OrderRecord in localStorage, set `syncStatus = 'synced'`
    - On 5xx/network error: queue for retry (exponential backoff, base 2s, max 5 attempts)
    - On 4xx: do NOT retry, log error, set `syncStatus = 'sync_failed'`
    - On all retries exhausted: mark `syncStatus = 'sync_failed'`, preserve order data
    - Generate and persist `traceId` (UUID) on the order at creation time
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.2 Write property test for order sync payload (Property 1)
    - **Property 1: Order sync payload contains all required fields**
    - Generate random valid OrderRecords; verify payload contains items with SKU/quantity, customer with email/name, payment_status = "PENDING", channel_record_id
    - **Validates: Requirements 4.1, 4.5**

  - [x] 5.3 Write property test for zenvix order_id persistence (Property 2)
    - **Property 2: Zenvix order_id is persisted on successful sync**
    - Generate successful responses with order_id strings; verify localStorage OrderRecord is updated with zenvixOrderId
    - **Validates: Requirements 4.2**

  - [x] 5.4 Write property test for exponential backoff (Property 3)
    - **Property 3: Exponential backoff produces correct delay**
    - Generate retry attempt numbers 0-4; verify delay = baseDelay × 2^N capped at maximum
    - **Validates: Requirements 4.3, 6.4, 7.4**

  - [x] 5.5 Write property test for terminal failure preservation (Property 4)
    - **Property 4: Terminal failure preserves event data**
    - Generate sync queue entries at max retries; verify status is "failed" and payload data is intact
    - **Validates: Requirements 4.6, 6.5, 8.6**

- [x] 6. Order stage transition sync
  - [x] 6.1 Implement stage transition sync with sequential ordering
    - Add `syncStageTransition(orderId, fromStage, toStage)` to the Order_Sync_Service
    - Build payload with order_id (zenvixOrderId), from_stage (mapped), to_stage (mapped), ISO 8601 UTC timestamp
    - Assign monotonically increasing `sequenceNumber` per order
    - Process queued transitions per-order sequentially (FIFO)
    - If `zenvixOrderId` is null, defer the transition (status = "deferred") until order creation completes
    - On sync failure: queue for retry without blocking local state change
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.2 Write property test for stage transition payload (Property 6)
    - **Property 6: Stage transition event payload correctness**
    - Generate valid stage pairs (S→T); verify payload contains order_id, from_stage, to_stage, valid ISO 8601 timestamp
    - **Validates: Requirements 5.1, 5.3**

  - [x] 6.3 Write property test for sequential ordering (Property 7)
    - **Property 7: Per-order sequential transition ordering**
    - Generate sequences of transitions for an order; verify processing in monotonically increasing sequence number order
    - **Validates: Requirements 5.5**

  - [x] 6.4 Write property test for deferred transitions (Property 8)
    - **Property 8: Deferred transitions until order_id available**
    - Generate orders without zenvixOrderId with queued transitions; verify none are sent until order_id is populated
    - **Validates: Requirements 5.6**

  - [x] 6.5 Write property test for non-blocking sync (Property 9)
    - **Property 9: Sync operations do not block local state changes**
    - Simulate sync failures during transitions; verify local state change completes regardless
    - **Validates: Requirements 5.4, 10.5**

- [x] 7. Quotation and payment sync
  - [x] 7.1 Implement quotation and payment event sync
    - Add `syncQuotationRecorded(orderId, deliveryCost, total)` that sends "order.quotation_recorded" event with order_id, delivery_cost, total, timestamp
    - Add `syncPaymentCompleted(orderId, amount)` that sends "payment.completed" event with order_id, amount, timestamp
    - Both use exponential backoff retry (base 2s, max 5 attempts)
    - On all retries exhausted: mark event as "failed", preserve data
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Write property test for quotation/payment payload (Property 10)
    - **Property 10: Quotation and payment event payload correctness**
    - Generate delivery costs and totals; verify numeric ≤2 decimal places, presence of order_id and ISO 8601 timestamp
    - Generate payment amounts; verify order_id, amount, and timestamp
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Checkpoint - Core sync module review
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Notification poller
  - [x] 9.1 Implement the Notification_Poller module
    - Create `src/api/zenvix-notification-poller.ts` with configurable interval (default 60s, min 10s, max 300s)
    - Clamp any configured interval to [10000, 300000] ms range
    - Poll only orders with non-null `zenvixOrderId` and stage !== Complete
    - On response: use `toOrderStage()` to map status; if null (unmapped), ignore
    - If mapped stage is later than current (using `isLaterStage`): update local order, append stageHistory entry with source = "zenvix_admin"
    - If mapped stage is same or earlier: discard silently
    - On error: exponential backoff (base 2s, cap 120s), resume on success
    - After 5 consecutive failures for an order: pause polling for that order
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 11.1, 11.2, 11.3, 11.5_

  - [x] 9.2 Implement adaptive polling frequency
    - Detect when the order tracker page is active (e.g., via route or component mount)
    - Increase polling frequency to 15s when on tracker page; revert to default when leaving
    - _Requirements: 7.3, 11.4_

  - [x] 9.3 Write property test for interval clamping (Property 11)
    - **Property 11: Notification poller interval clamping**
    - Generate arbitrary interval values; verify effective interval is clamped to [10000, 300000]
    - **Validates: Requirements 7.1**

  - [x] 9.4 Write property test for forward-stage updates (Property 12)
    - **Property 12: Forward-stage poller updates are applied correctly**
    - Generate orders at stage S with Zenvix status mapping to later stage T; verify local order advances to T with correct stageHistory entry
    - **Validates: Requirements 7.2, 11.1, 11.3**

  - [x] 9.5 Write property test for backward/same-stage discard (Property 13)
    - **Property 13: Backward or same-stage poller updates are discarded**
    - Generate orders at stage S with Zenvix status mapping to same/earlier stage; verify no modification
    - **Validates: Requirements 7.6, 11.2**

  - [x] 9.6 Write property test for eligible order filtering (Property 14)
    - **Property 14: Poller only polls eligible orders**
    - Generate sets of orders (some with zenvixOrderId, some without, some at Complete); verify only eligible ones are polled
    - **Validates: Requirements 7.5**

  - [x] 9.7 Write property test for unmapped status handling (Property 15)
    - **Property 15: Unmapped Zenvix status is ignored**
    - Generate arbitrary strings not in the mapping; verify local order is unchanged
    - **Validates: Requirements 11.5**

- [x] 10. Sales module integration
  - [x] 10.1 Implement sales completion event sync
    - Add `syncSalesCompletion(order: OrderRecord)` to Order_Sync_Service
    - Check `salesEventSent` flag first; if true, return immediately (no-op)
    - Build payload with items (product_id, quantity, unit_price), total paid amount (including delivery), customer (name, email), channel_record_id
    - On success: set `salesEventSent = true` on OrderRecord in localStorage
    - On failure: queue for retry (max 5); on exhaustion mark as failed and log order ID
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 10.2 Write property test for sales payload (Property 16)
    - **Property 16: Sales completion event payload correctness**
    - Generate completed orders; verify payload contains items with product_id/quantity/unit_price, total including delivery, customer data, channel_record_id
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 10.3 Write property test for sales idempotency (Property 17)
    - **Property 17: Sales event is sent at most once per order**
    - Generate orders with salesEventSent = true; verify calling sync produces no new queue entries
    - **Validates: Requirements 8.5**

- [x] 11. Event pipeline enhancements
  - [x] 11.1 Enhance Event_Pipeline with marketing attribution and session tracking
    - Add `context.channel_record_id` (from `VITE_ZENVIX_CHANNEL_RECORD_ID`) to all events
    - Generate session UUID on first load, store in sessionStorage, include as `actor.id` for guests
    - Add consistent `actor` object: `id`, `type` ("customer"/"guest"), `tenant_id`, `branch_id`
    - Implement `session.start` event on page load with channel, source, referrer
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

  - [x] 11.2 Implement cart.checkout event with full payload
    - On checkout, send `cart.checkout` event with items (product_id, quantity, price), total cart value, session identifier
    - _Requirements: 9.3_

  - [x] 11.3 Write property test for event structure (Property 18)
    - **Property 18: Event pipeline structure consistency**
    - Generate various events; verify context.channel_record_id, actor.id, actor.type, actor.tenant_id, actor.branch_id are present and correct
    - **Validates: Requirements 9.1, 9.2, 9.5**

  - [x] 11.4 Write property test for cart checkout payload (Property 19)
    - **Property 19: Cart checkout event payload completeness**
    - Generate cart states with N items; verify all items included with fields, total value correct, session identifier present
    - **Validates: Requirements 9.3**

- [x] 12. Audit trail logging
  - [x] 12.1 Implement Audit_Logger module
    - Create `src/api/zenvix-audit-logger.ts` with `logAudit(entry: AuditEntry)` function
    - Support action types: "order.created", "stage.transition", "payment.confirmed", "order.completed"
    - Include order_id, trace_id, actor (id + type), ISO 8601 UTC timestamp
    - Include action-specific metadata (from_stage/to_stage for transitions, amount for payments)
    - Async, non-blocking: failures don't affect primary operations
    - Queue failed entries for retry (exponential backoff, max 5 attempts)
    - On exhaustion: mark permanently failed, retain in local queue
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

  - [x] 12.2 Integrate trace_id generation and propagation
    - Generate trace_id (UUID) at order creation, persist on OrderRecord
    - Pass trace_id to all subsequent audit entries for the same order
    - _Requirements: 10.4_

  - [x] 12.3 Write property test for audit entry fields (Property 20)
    - **Property 20: Audit entry contains required fields per action type**
    - Generate audit entries for each action type; verify order_id, trace_id (UUID format), actor, timestamp, and action-specific metadata
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 12.4 Write property test for trace_id consistency (Property 21)
    - **Property 21: Trace ID is consistent across an order's lifetime**
    - Generate order lifecycle sequences; verify all audit entries for same order use the same trace_id
    - **Validates: Requirements 10.4**

- [x] 13. Checkpoint - All modules review
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integration wiring and end-to-end flow
  - [x] 14.1 Wire order creation flow end-to-end
    - In the checkout completion handler, call `syncOrderCreation`, then `logAudit("order.created")`
    - Start the Notification_Poller for the new order once `zenvixOrderId` is available
    - Process any deferred stage transitions after order creation sync succeeds
    - _Requirements: 4.1, 4.2, 5.6, 10.1_

  - [x] 14.2 Wire stage transition flow end-to-end
    - In every stage transition handler, call `syncStageTransition` then `logAudit("stage.transition")`
    - On transition to Complete: call `syncSalesCompletion` and `logAudit("order.completed")`
    - Ensure local state updates first, sync is non-blocking
    - _Requirements: 5.1, 5.4, 8.1, 10.2_

  - [x] 14.3 Wire quotation and payment flows
    - In quotation recording handler: call `syncQuotationRecorded` and log audit
    - In payment confirmation handler: call `syncPaymentCompleted` and `logAudit("payment.confirmed")`
    - _Requirements: 6.1, 6.2, 10.3_

  - [x] 14.4 Initialize Event_Pipeline and Notification_Poller on app startup
    - Fire `session.start` event on page load
    - Start Notification_Poller for all eligible orders in localStorage
    - Register tracker page active/inactive detection for adaptive polling
    - _Requirements: 9.4, 7.3, 7.5_

  - [x] 14.5 Write integration tests for end-to-end order lifecycle
    - Test full flow: order creation → sync → stage transitions → poller updates → sales completion
    - Use mocked Zenvix API responses
    - Verify all audit entries are generated with correct trace_id
    - _Requirements: 4.1, 5.1, 7.2, 8.1, 10.4_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript with Vite, React, Vitest, and fast-check (already configured)
- Docker/shell script tasks (1.1–1.6) create files that will be deployed to the VPS
- All Zenvix communication is client-side via fetch; there is no server-side component in this app

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.5", "1.6", "4.1", "4.3"] },
    { "id": 1, "tasks": ["1.4", "2.1", "4.2"] },
    { "id": 2, "tasks": ["2.2", "2.4"] },
    { "id": 3, "tasks": ["2.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "5.5", "6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "6.5", "7.2", "9.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 8, "tasks": ["11.2", "11.3", "11.4", "12.1"] },
    { "id": 9, "tasks": ["12.2", "12.3", "12.4"] },
    { "id": 10, "tasks": ["14.1", "14.2", "14.3", "14.4"] },
    { "id": 11, "tasks": ["14.5"] }
  ]
}
```
