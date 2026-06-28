# Implementation Plan: WhatsApp Checkout Flow

## Overview

Replace the existing payment gateway checkout with a WhatsApp-based quotation and payment flow. Implementation covers: checkout form refactoring, WhatsApp message composition and deep linking, client-side order state management with localStorage persistence, visual order stage tracker, and Zenvix backend event synchronization.

## Tasks

- [x] 1. Set up project structure and core interfaces
  - [x] 1.1 Create order types and interfaces
    - Create `src/types/order.ts` with `OrderStage`, `OrderRecord`, `PersistedOrderData`, `WhatsAppMessage`, `WhatsAppConnectorResult`, `CheckoutFormData`, and `WhatsAppConfig` interfaces/types
    - Define the `VALID_TRANSITIONS` stage transition map
    - _Requirements: 1.1, 2.1, 5.1, 8.1_

  - [x] 1.2 Install fast-check and set up property test infrastructure
    - Add `fast-check` as a dev dependency
    - Create `src/__tests__/helpers/order-generators.ts` with fast-check arbitraries for generating valid/invalid checkout form data, order records, item lists, and phone numbers
    - _Requirements: (testing infrastructure)_

- [x] 2. Implement WhatsApp connector module
  - [x] 2.1 Implement `composeWhatsAppMessage` function
    - Create `src/lib/whatsapp-connector.ts`
    - Implement message composition with structured format (section headers, item list, subtotal, order reference)
    - Implement truncation logic: if encoded message exceeds 1000 chars, trim item details to summary while preserving order ID and subtotal
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_

  - [x] 2.2 Implement `buildWhatsAppUrl` and `openWhatsAppCheckout` functions
    - Implement URL construction with `https://wa.me/{phone}?text={encodedMessage}` pattern
    - Implement `openWhatsAppCheckout` that composes message, builds URL, and opens via `window.open`
    - Read office phone from `VITE_WHATSAPP_OFFICE_PHONE` environment variable
    - _Requirements: 1.3, 8.5_

  - [x] 2.3 Write property tests for WhatsApp message completeness (Property 2)
    - **Property 2: WhatsApp message content completeness**
    - Generate random valid order data, verify composed message contains all required fields (customer name, phone, email, address, item details, subtotal, order reference ID)
    - **Validates: Requirements 1.2, 8.1, 8.2, 8.3, 8.4**

  - [x] 2.4 Write property tests for WhatsApp URL structure (Property 3)
    - **Property 3: WhatsApp URL structure validity**
    - Generate random messages and valid phone numbers (10-15 digits), verify URL matches `https://wa.me/{digits}?text={encoded}` pattern
    - **Validates: Requirements 1.3**

  - [x] 2.5 Write property test for URL encoding round-trip (Property 4)
    - **Property 4: URL encoding round-trip**
    - Generate arbitrary message strings, verify encoding then decoding produces the original message
    - **Validates: Requirements 8.5**

  - [x] 2.6 Write property test for message truncation (Property 5)
    - **Property 5: Message truncation preserves order reference and subtotal**
    - Generate orders with many items exceeding 1000 chars, verify truncated message is ≤1000 chars and still contains order ID and subtotal
    - **Validates: Requirements 8.6**

- [x] 3. Implement OrderStore with localStorage persistence
  - [x] 3.1 Implement OrderStore module
    - Create `src/lib/order-store.ts`
    - Implement `createOrder`: generates UUID, sets stage to `Order_Submitted`, persists to localStorage under key `bambu_whatsapp_orders`
    - Implement `transitionStage`: validates transition against `VALID_TRANSITIONS`, updates stage, appends to `stageHistory`, persists
    - Implement `getOrder`, `getLatestOrder`, `getAllOrders` retrieval methods
    - Handle localStorage unavailability gracefully (in-memory fallback with warning)
    - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Write property test for order creation persistence (Property 1)
    - **Property 1: Order creation produces a complete persisted record**
    - Generate random valid form data and item lists, verify created order has stage `Order_Submitted`, all fields preserved, valid timestamp
    - **Validates: Requirements 1.1**

  - [x] 3.3 Write property test for stage transition persistence (Property 6)
    - **Property 6: Stage transition persistence**
    - Generate random orders, apply valid transitions, verify localStorage reflects new stage, updated timestamp, and new stageHistory entry
    - **Validates: Requirements 5.1**

  - [x] 3.4 Write property test for invalid stage transition rejection (Property 8)
    - **Property 8: Invalid stage transitions are rejected**
    - Generate orders at various stages, attempt invalid transitions, verify error thrown and order unchanged
    - **Validates: Requirements 3.2, 4.1**

- [x] 4. Checkpoint - Ensure core logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement CheckoutForm component
  - [x] 5.1 Create Zod validation schema for checkout form
    - Create `src/lib/checkout-validation.ts`
    - Define Zod schema: name non-empty, email valid format, phone ≥5 chars, address ≥10 chars
    - Export validation function and typed error messages
    - _Requirements: 7.1, 7.2_

  - [x] 5.2 Write property test for checkout form validation (Property 7)
    - **Property 7: Checkout form validation correctness**
    - Generate random field combinations (valid and invalid), verify validation returns true iff all conditions met, and returns appropriate error messages for failing fields
    - **Validates: Requirements 7.2**

  - [x] 5.3 Implement CheckoutForm React component
    - Create `src/components/CheckoutForm.tsx`
    - Use react-hook-form with Zod resolver for validation
    - Collect customer name, email, phone, and shipping address
    - Remove payment method selection entirely
    - Display WhatsApp flow explanation text (office will provide quotation including delivery costs)
    - Enable confirmation button only when validation passes
    - On submit: create order via OrderStore, trigger WhatsApp connector, transition to Quotation_Pending on success
    - Show error toast with office phone on WhatsApp link failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 5.4 Write unit tests for CheckoutForm component
    - Test form renders with all required fields and no payment method section
    - Test WhatsApp explanation text is visible
    - Test submit button is disabled until all validations pass
    - Test successful submission triggers order creation and WhatsApp link
    - Test WhatsApp link failure displays error toast with phone number
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 1.5_

- [x] 6. Implement OrderTracker component
  - [x] 6.1 Implement OrderTracker React component
    - Create `src/components/OrderTracker.tsx`
    - Display all 6 Order_Stage values as a visual progress indicator using shadcn/ui `Card`, `Badge`, `Progress` components
    - Highlight current active stage distinctly from completed and pending stages
    - Display order details: item list, subtotal, shipping address, customer contact info
    - Show contextual messages per stage (e.g., "Office is reviewing your order" for Quotation_Pending, quoted amount for Payment_Pending)
    - Show confirmation message with paid amount and order reference on Complete
    - Match existing design system: rounded-[2.5rem], font-display, uppercase tracking
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.3, 4.3_

  - [x] 6.2 Write unit tests for OrderTracker component
    - Test all 6 stages render with correct visual states
    - Test current stage is highlighted distinctly
    - Test contextual messages display correctly per stage
    - Test order details (items, subtotal, address) are displayed
    - Test quoted amount displays when stage is Payment_Pending
    - Test completion message with paid amount and reference
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 4.3_

- [x] 7. Implement Zenvix sync integration
  - [x] 7.1 Extend Zenvix event types and implement sync
    - Update `src/api/zenvix-events.ts` to add `order.stage_transition` and `order.quotation_recorded` to `ZenvixUserEventType` union
    - Create `src/lib/zenvix-order-sync.ts` with functions to fire events: `order.placed`, `order.stage_transition`, `order.quotation_recorded`, `payment.completed`
    - Each event includes order_id and timestamp for idempotency
    - Leverage existing `trackEvent` + retry queue infrastructure
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 7.2 Write unit tests for Zenvix sync events
    - Test `order.placed` event fires with correct payload on order creation
    - Test `order.stage_transition` event fires on stage changes
    - Test `order.quotation_recorded` event fires with delivery cost and total
    - Test `payment.completed` event fires with amount and timestamp
    - Test failed sync queues event for retry
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Wire components together and integrate into routing
  - [x] 9.1 Create checkout page and order tracking page
    - Create `src/pages/WhatsAppCheckoutPage.tsx` that integrates `CheckoutForm`, reads cart from existing store, passes items to order creation flow
    - Create `src/pages/OrderStatusPage.tsx` that loads latest order from `OrderStore` and renders `OrderTracker`
    - Wire Zenvix sync into OrderStore stage transitions (fire events on create and transition)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 5.2_

  - [x] 9.2 Update routing and navigation
    - Update `src/App.tsx` (or routing config) to replace old checkout route with new WhatsApp checkout page
    - Add order status/tracking route
    - Update any navigation links that reference the old checkout
    - _Requirements: 7.3, 7.4_

  - [x] 9.3 Integrate admin actions for quotation and payment confirmation
    - Add functions in OrderStore or a dedicated module for recording quotation (delivery cost + total) and confirming payment
    - Implement stage transitions: Quotation_Pending → Quotation_Sent → Payment_Pending on quotation record, Payment_Pending → Payment_Confirmed → Complete on payment confirm
    - Associate order with authenticated user ID when available
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.2, 5.3_

  - [x] 9.4 Write integration tests for end-to-end checkout flow
    - Test form submit → order created → WhatsApp link opened → stage transitions
    - Test quotation recording updates order and fires Zenvix event
    - Test payment confirmation completes order and fires Zenvix event
    - Test order persists and loads correctly across page navigation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 4.1, 5.1, 5.2, 6.1, 6.2_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses Vitest (already configured) with `fast-check` for property-based testing
- All components should use the existing shadcn/ui design system and Tailwind CSS utilities
- WhatsApp office phone number is configured via `VITE_WHATSAPP_OFFICE_PHONE` environment variable

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "5.2"] },
    { "id": 3, "tasks": ["2.4", "2.5", "2.6", "5.3", "6.1", "7.1"] },
    { "id": 4, "tasks": ["5.4", "6.2", "7.2"] },
    { "id": 5, "tasks": ["9.1", "9.2"] },
    { "id": 6, "tasks": ["9.3"] },
    { "id": 7, "tasks": ["9.4"] }
  ]
}
```
