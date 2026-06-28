# Requirements Document

## Introduction

This feature replaces the existing instant payment gateway checkout with a manual WhatsApp-based quotation and payment flow for Bambu Silver by Estela. When a customer confirms checkout, the system initiates a WhatsApp conversation between the customer and the office, allowing the office to provide a final quotation (including delivery/cargo costs) before the customer approves and makes payment. A multi-stage order tracker keeps both parties informed of progress throughout the flow.

## Glossary

- **Checkout_System**: The frontend application module that manages the checkout flow, order state transitions, and UI stage display
- **WhatsApp_Connector**: The module responsible for composing and opening WhatsApp messages with pre-filled order details
- **Order_Tracker**: The UI component that displays current order stage, history, and details to the customer
- **Office**: The Bambu Silver staff who handle quotation, delivery pricing, and payment confirmation via WhatsApp
- **Customer**: The authenticated user placing an order on the storefront
- **Order_Stage**: One of the defined phases an order passes through: Order_Submitted, Quotation_Pending, Quotation_Sent, Payment_Pending, Payment_Confirmed, Complete
- **Zenvix_Sync**: The process of recording order events and stage transitions to the Zenvix Retail Module backend

## Requirements

### Requirement 1: Initiate WhatsApp Checkout on Order Confirmation

**User Story:** As a Customer, I want the checkout to send my order details to the office via WhatsApp, so that they can calculate delivery costs and provide a final quotation.

#### Acceptance Criteria

1. WHEN the Customer confirms checkout, THE Checkout_System SHALL create an order record with stage Order_Submitted and persist it locally
2. WHEN an order is created with stage Order_Submitted, THE WhatsApp_Connector SHALL compose a message containing: customer name, customer phone, customer email, shipping address, list of items with quantities and prices, and subtotal
3. WHEN the WhatsApp message is composed, THE WhatsApp_Connector SHALL open the WhatsApp deep link (wa.me) in a new browser tab targeting the office phone number
4. WHEN the WhatsApp link is opened, THE Checkout_System SHALL transition the order stage to Quotation_Pending
5. IF the WhatsApp deep link fails to open, THEN THE Checkout_System SHALL display an error message with the office phone number for manual contact

### Requirement 2: Order Stage Tracking

**User Story:** As a Customer, I want to see the current stage of my order and its history, so that I know what action is needed and what has been completed.

#### Acceptance Criteria

1. THE Order_Tracker SHALL display all defined Order_Stage values as a visual progress indicator
2. THE Order_Tracker SHALL highlight the current active stage distinctly from completed and pending stages
3. WHEN an order stage changes, THE Order_Tracker SHALL update the display within 2 seconds of the local state change
4. THE Order_Tracker SHALL display order details including: item list, subtotal, shipping address, and customer contact information
5. WHILE the order stage is Quotation_Pending, THE Order_Tracker SHALL display a message indicating the office is reviewing the order
6. WHILE the order stage is Payment_Pending, THE Order_Tracker SHALL display the final quoted amount including delivery costs

### Requirement 3: Office Quotation Update

**User Story:** As Office staff, I want the system to allow recording a final quotation amount, so that the customer can see the total with delivery costs and proceed to payment.

#### Acceptance Criteria

1. WHEN the Office provides a final quotation, THE Checkout_System SHALL accept the quoted delivery cost and total amount
2. WHEN a quotation is recorded, THE Checkout_System SHALL transition the order stage from Quotation_Pending to Quotation_Sent
3. WHEN the order stage transitions to Quotation_Sent, THE Order_Tracker SHALL display the quoted delivery cost and updated total to the Customer
4. WHEN the Customer approves the quotation, THE Checkout_System SHALL transition the order stage to Payment_Pending

### Requirement 4: Payment Confirmation

**User Story:** As Office staff, I want to mark an order as paid after receiving payment, so that the transaction is completed and both parties are informed.

#### Acceptance Criteria

1. WHEN payment is received and confirmed by the Office, THE Checkout_System SHALL transition the order stage to Payment_Confirmed
2. WHEN the order stage transitions to Payment_Confirmed, THE Checkout_System SHALL transition the order to Complete
3. WHEN the order stage is Complete, THE Order_Tracker SHALL display a confirmation message with the final paid amount and order reference

### Requirement 5: Order Persistence and Retrieval

**User Story:** As a Customer, I want my order to persist across browser sessions, so that I can return and check its status at any time.

#### Acceptance Criteria

1. THE Checkout_System SHALL persist order data (items, customer info, stage, timestamps, quotation) to local storage on every stage transition
2. WHEN the Customer navigates to the order tracking page, THE Order_Tracker SHALL load and display the most recent order from local storage
3. WHEN the Customer is authenticated, THE Checkout_System SHALL associate the order with the authenticated user ID
4. IF local storage is unavailable, THEN THE Checkout_System SHALL display a warning that order tracking may not persist across sessions

### Requirement 6: Zenvix Backend Synchronization

**User Story:** As a store operator, I want all checkout events synchronized to Zenvix, so that the backend system has a complete record of all transactions.

#### Acceptance Criteria

1. WHEN an order is created, THE Zenvix_Sync SHALL send an order creation event containing order ID, customer details, and item list to the Zenvix backend
2. WHEN an order stage transitions, THE Zenvix_Sync SHALL send a stage transition event containing order ID, previous stage, new stage, and timestamp
3. WHEN a quotation is recorded, THE Zenvix_Sync SHALL send a quotation event containing order ID, delivery cost, and final total
4. WHEN payment is confirmed, THE Zenvix_Sync SHALL send a payment confirmation event containing order ID, amount paid, and payment timestamp
5. IF Zenvix synchronization fails, THEN THE Zenvix_Sync SHALL queue the event for retry using the existing event retry pipeline

### Requirement 7: Checkout Form Adaptation

**User Story:** As a Customer, I want the checkout form to collect my details without requiring a payment method selection, so that the flow is appropriate for the WhatsApp quotation process.

#### Acceptance Criteria

1. THE Checkout_System SHALL collect customer name, email, phone, and shipping address on the checkout form
2. THE Checkout_System SHALL validate all required fields before allowing order submission
3. THE Checkout_System SHALL remove payment method selection from the checkout form
4. THE Checkout_System SHALL display a clear explanation that the office will provide a final quotation including delivery costs via WhatsApp
5. WHEN all required fields pass validation, THE Checkout_System SHALL enable the order confirmation button

### Requirement 8: WhatsApp Message Composition

**User Story:** As Office staff, I want the WhatsApp message to contain all order details in a structured readable format, so that I can quickly review and calculate delivery costs.

#### Acceptance Criteria

1. THE WhatsApp_Connector SHALL format the order message with clear section headers for customer info, shipping address, and order items
2. THE WhatsApp_Connector SHALL include each item's title, quantity, and unit price in the message
3. THE WhatsApp_Connector SHALL include the order subtotal at the end of the items section
4. THE WhatsApp_Connector SHALL include an order reference ID in the message for tracking
5. THE WhatsApp_Connector SHALL URL-encode the composed message for the wa.me deep link
6. IF the total message length exceeds the WhatsApp URL limit of 1000 characters, THEN THE WhatsApp_Connector SHALL truncate item details while preserving the order reference and subtotal
