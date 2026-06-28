# Requirements Document

## Introduction

This feature covers deploying the Bambu Silver by Estela storefront (a Vite/React SPA) to an existing VPS running the Zenvix platform, and implementing full bidirectional integration between the storefront and Zenvix's order management, sales, notifications, marketing attribution, and audit systems.

The storefront currently syncs basic events to Zenvix (page views, cart actions, order placement notifications). This feature elevates the integration to full lifecycle management: orders created in the storefront are persisted in Zenvix, stage transitions are reflected as status updates, completed orders feed into Zenvix Sales, and the Zenvix admin dashboard can drive status changes back to the storefront.

## Glossary

- **Storefront**: The Bambu Silver by Estela Vite/React SPA that customers use to browse products and place orders
- **Zenvix_API**: The Zenvix Retail Module backend (NestJS) exposing REST endpoints at `/api/retail/public`
- **VPS**: The production server at IP 150.109.15.108 running Ubuntu with Docker Compose
- **Deployment_Container**: The Nginx Docker container serving the Storefront production build on the VPS
- **Auto_Deploy_Script**: A cron-triggered shell script that performs git pull and rebuilds/restarts the Docker container
- **Order_Sync_Service**: The client-side module responsible for creating and updating orders in Zenvix_API when order lifecycle events occur in the Storefront
- **Notification_Poller**: A client-side polling mechanism that checks Zenvix_API for order status updates and notifications
- **Event_Pipeline**: The existing event forwarding system (`zenvix-events.ts`) that sends user activity events to Zenvix_API with retry queue
- **Channel_Record_ID**: The unique identifier linking storefront events to the correct marketing channel in Zenvix analytics
- **Audit_Logger**: The component responsible for sending structured audit trail entries to Zenvix_API for every order-related action
- **Docker_Network**: The `bfs_default` Docker bridge network used by existing Zenvix services on the VPS
- **Order_Stage**: One of the defined order lifecycle states: Order_Submitted, Quotation_Pending, Quotation_Sent, Payment_Pending, Payment_Confirmed, Complete

## Requirements

### Requirement 1: Dockerized Storefront Deployment

**User Story:** As a developer, I want to deploy the Storefront as a Docker container on the VPS, so that it is served via Nginx alongside the existing Zenvix stack without port conflicts.

#### Acceptance Criteria

1. THE Deployment_Container SHALL serve the Vite production build (`dist/`) via Nginx on port 3020 of the VPS host
2. THE Deployment_Container SHALL NOT bind to ports 3001, 3010, 5433, or 9090 on the VPS host
3. THE Deployment_Container SHALL connect to the Docker_Network (`bfs_default`) to enable internal communication with Zenvix_API
4. WHEN the Deployment_Container starts, THE Deployment_Container SHALL serve the Storefront index.html for any request whose path does not match an existing static file in `dist/` (SPA fallback), and SHALL serve static assets (JavaScript, CSS, images, fonts) directly with their corresponding content types
5. THE Deployment_Container SHALL use a multi-stage Dockerfile that builds the Vite app and copies the output to an Nginx image
6. WHEN a production build is triggered, THE Deployment_Container SHALL inject environment variables via a runtime configuration file such that changing the configuration file and restarting the container (without rebuilding the image) reflects the updated values in the served application
7. WHEN an HTTP request is sent to port 3020 on the VPS host, THE Deployment_Container SHALL respond with an HTTP 200 status for the root path (`/`) within 5 seconds of container startup, confirming the Storefront is available

### Requirement 2: Automated Deployment Pipeline

**User Story:** As a developer, I want the Storefront to auto-deploy when code is pushed to the main branch, so that production stays in sync with the repository.

#### Acceptance Criteria

1. THE Auto_Deploy_Script SHALL be located at `/home/ubuntu/bambusilver/vps-auto-deploy.sh` on the VPS
2. WHEN the Auto_Deploy_Script executes, THE Auto_Deploy_Script SHALL record the current git revision, then perform a git pull from the main branch of the Storefront repository
3. WHEN the git revision after pull differs from the recorded revision before pull, THE Auto_Deploy_Script SHALL rebuild and restart the Deployment_Container using `docker compose up -d --build`
4. WHEN the git revision after pull matches the recorded revision before pull, THE Auto_Deploy_Script SHALL skip the rebuild step
5. THE Auto_Deploy_Script SHALL be executed by a cron job at 5-minute intervals
6. IF the Auto_Deploy_Script encounters a build failure, THEN THE Auto_Deploy_Script SHALL log a timestamped entry containing the error output to `/home/ubuntu/bambusilver/logs/deploy.log` and retain the previous running container without interruption
7. IF the Auto_Deploy_Script encounters a git pull failure, THEN THE Auto_Deploy_Script SHALL log a timestamped entry containing the failure reason to `/home/ubuntu/bambusilver/logs/deploy.log` and skip the rebuild step
8. IF a previous instance of the Auto_Deploy_Script is still running when a new cron execution triggers, THEN THE Auto_Deploy_Script SHALL exit immediately without performing any operations

### Requirement 3: Production Environment Configuration

**User Story:** As a developer, I want the production environment to be correctly configured so that the Storefront communicates with the Zenvix_API on the same VPS.

#### Acceptance Criteria

1. THE Storefront SHALL read `VITE_ZENVIX_API_URL` pointing to `http://150.109.15.108:3001/api/retail/public` in the production environment
2. THE Storefront SHALL read `VITE_ZENVIX_TENANT_ID`, `VITE_ZENVIX_CLIENT_ID`, `VITE_ZENVIX_CLIENT_SECRET`, `VITE_ZENVIX_CHANNEL_RECORD_ID`, `VITE_ZENVIX_BRANCH_ID`, `VITE_ZENVIX_API_KEY`, and `VITE_WHATSAPP_OFFICE_PHONE` from the production environment file
3. THE Deployment_Container SHALL load environment variables from a `.env.production` file located in the project root on the VPS
4. IF any of the four required environment variables (`VITE_ZENVIX_API_URL`, `VITE_ZENVIX_TENANT_ID`, `VITE_ZENVIX_CLIENT_ID`, `VITE_ZENVIX_CLIENT_SECRET`) is missing or empty, THEN THE Storefront SHALL log a warning to the browser console at startup and return empty results for all Zenvix API queries, falling back to mock product data without displaying an error to the end user
5. IF `VITE_ZENVIX_API_URL` is present but the Zenvix_API is unreachable within 5 seconds, THEN THE Storefront SHALL fall back to mock product data and log the connection failure to the browser console

### Requirement 4: Order Creation Sync to Zenvix

**User Story:** As a store owner, I want orders placed in the Storefront to be created in Zenvix, so that I can manage all orders from the Zenvix dashboard.

#### Acceptance Criteria

1. WHEN an order is created in the Storefront, THE Order_Sync_Service SHALL send a POST request to `/orders` on Zenvix_API with the order items (each including SKU and quantity), customer information (email and name), and payment status set to "PENDING", within 10 seconds of the local order creation
2. WHEN Zenvix_API responds with a successful order creation (HTTP 2xx), THE Order_Sync_Service SHALL store the returned `order_id` from Zenvix alongside the local order record in localStorage
3. IF the order creation request to Zenvix_API fails due to a network error, timeout, or 5xx response, THEN THE Order_Sync_Service SHALL queue the request for retry using exponential backoff with a base delay of 2 seconds and a maximum of 5 attempts
4. IF the order creation request to Zenvix_API fails with a 4xx response, THEN THE Order_Sync_Service SHALL NOT retry the request and SHALL log the error for manual investigation
5. THE Order_Sync_Service SHALL include the Channel_Record_ID in the order creation payload for marketing attribution
6. IF all 5 retry attempts are exhausted without a successful response, THEN THE Order_Sync_Service SHALL mark the order's sync status as "sync_failed" in localStorage and preserve the local order without data loss

### Requirement 5: Order Stage Transition Sync

**User Story:** As a store owner, I want order stage changes in the Storefront to be reflected in Zenvix, so that the order status is consistent across both systems.

#### Acceptance Criteria

1. WHEN an order transitions from one Order_Stage to another in the Storefront, THE Order_Sync_Service SHALL send the stage transition to Zenvix_API as an order status update within 10 seconds of the local transition
2. THE Order_Sync_Service SHALL map each of the 6 Storefront Order_Stage values (Order_Submitted, Quotation_Pending, Quotation_Sent, Payment_Pending, Payment_Confirmed, Complete) to a corresponding Zenvix order status value, covering all stages without gaps
3. THE Order_Sync_Service SHALL include the previous stage, new stage, and an ISO 8601 UTC timestamp in every status update request
4. IF the stage transition sync fails due to network error, timeout, or non-2xx response, THEN THE Order_Sync_Service SHALL queue the transition event for retry using exponential backoff with a maximum of 5 attempts, without blocking the local stage transition
5. THE Order_Sync_Service SHALL send stage transitions in the order they occurred locally, processing queued retries for a given order sequentially so that no later transition is sent before an earlier one succeeds or exhausts its retries
6. IF the Zenvix order_id is not yet available when a stage transition occurs, THEN THE Order_Sync_Service SHALL queue the transition and defer sending until the order creation sync has completed successfully

### Requirement 6: Quotation and Payment Data Sync

**User Story:** As a store owner, I want quotation and payment confirmations to be reflected in Zenvix, so that financial data is complete in both systems.

#### Acceptance Criteria

1. WHEN a quotation is recorded for an order in "Quotation_Pending" stage, THE Order_Sync_Service SHALL send the delivery cost (numeric value with up to 2 decimal places), quoted total (numeric value with up to 2 decimal places), the order_id, and a timestamp to Zenvix_API via an "order.quotation_recorded" event within 5 seconds of the recording action
2. WHEN a payment is confirmed for an order in "Payment_Pending" stage, THE Order_Sync_Service SHALL send the paid amount (numeric value with up to 2 decimal places), the order_id, and a timestamp to Zenvix_API via a "payment.completed" event within 5 seconds of the confirmation action
3. THE Order_Sync_Service SHALL include the local order_id (assigned during order creation) in all quotation and payment sync requests sent to Zenvix_API
4. IF the Zenvix_API is unreachable or returns a non-success response when sending a quotation or payment event, THEN THE Order_Sync_Service SHALL queue the event for retry using exponential backoff with a base delay of 2 seconds and a maximum of 5 retry attempts
5. IF all retry attempts for a quotation or payment sync event are exhausted, THEN THE Order_Sync_Service SHALL mark the event as "failed" in the local queue and preserve the event data for manual inspection

### Requirement 7: Notification Polling from Zenvix

**User Story:** As a store owner, I want the Storefront to detect order status changes made in the Zenvix dashboard, so that customers see up-to-date order status.

#### Acceptance Criteria

1. THE Notification_Poller SHALL poll Zenvix_API for order status updates at a configurable interval (default 60 seconds, minimum 10 seconds, maximum 300 seconds)
2. WHEN the Notification_Poller detects a status change from Zenvix_API that differs from the local Order_Stage and the new status is a valid next state according to the VALID_TRANSITIONS map, THE Notification_Poller SHALL update the local order record to the new status and append an entry to the order's stageHistory with the current timestamp
3. WHILE the Storefront is displaying the order tracker page, THE Notification_Poller SHALL increase polling frequency to every 15 seconds
4. IF the Notification_Poller receives an error response from Zenvix_API, THEN THE Notification_Poller SHALL apply exponential backoff starting at 2 seconds with a maximum backoff cap of 120 seconds, and resume normal polling after a successful response
5. THE Notification_Poller SHALL only poll for orders that have a stored Zenvix order_id and are not in the terminal `Complete` stage
6. IF the Notification_Poller detects a status change from Zenvix_API that does not follow the VALID_TRANSITIONS sequence for the current local Order_Stage, THEN THE Notification_Poller SHALL discard the update and log a warning without modifying the local order record
7. IF the Notification_Poller fails to receive a successful response after 5 consecutive retries, THEN THE Notification_Poller SHALL pause polling for that order and display an indication to the user that status synchronization is temporarily unavailable

### Requirement 8: Sales Module Integration

**User Story:** As a store owner, I want completed storefront orders to appear in the Zenvix Sales module, so that revenue reporting is accurate.

#### Acceptance Criteria

1. WHEN an order reaches the `Complete` stage in the Storefront, THE Order_Sync_Service SHALL send a sales completion event to Zenvix_API containing the order items, total paid amount (including delivery cost), and customer data (name and email)
2. THE Order_Sync_Service SHALL include item-level detail (product ID, quantity, unit price) in the sales completion payload
3. THE Order_Sync_Service SHALL include the Channel_Record_ID in sales data so that revenue is attributed to the storefront channel in Zenvix analytics
4. IF the sales completion event fails to send, THEN THE Order_Sync_Service SHALL retry the event using the existing retry queue mechanism (exponential backoff, maximum 5 attempts)
5. THE Order_Sync_Service SHALL send at most one sales completion event per order, preventing duplicate revenue entries if the `Complete` stage is reached more than once
6. IF all retry attempts for a sales completion event are exhausted, THEN THE Order_Sync_Service SHALL mark the event as failed in the retry queue and log the order ID for manual reconciliation

### Requirement 9: Marketing Attribution via Events

**User Story:** As a marketing manager, I want all storefront events to include proper channel attribution, so that marketing analytics in Zenvix accurately reflect storefront performance.

#### Acceptance Criteria

1. THE Event_Pipeline SHALL include the Channel_Record_ID (from `VITE_ZENVIX_CHANNEL_RECORD_ID`) in the `context.channel_record_id` field of every event sent to Zenvix_API
2. THE Event_Pipeline SHALL include a session identifier (a UUID generated at session start and stored in sessionStorage) in the `actor.id` field of every event to enable session-level analytics
3. WHEN a `cart.checkout` event is sent, THE Event_Pipeline SHALL include the cart items (product_id, quantity, price for each), total cart value, and the session identifier in the payload
4. THE Event_Pipeline SHALL send a `session.start` event on page load that includes the channel ("ecommerce"), source ("web-storefront"), and document referrer in the payload
5. THE Event_Pipeline SHALL include a consistent `actor` object in every event containing: `id` (authenticated user ID or session UUID), `type` ("customer" or "guest"), `tenant_id`, and `branch_id`

### Requirement 10: Audit Trail Logging

**User Story:** As an administrator, I want all order-related actions logged to Zenvix's audit system, so that there is a complete traceable history of every order change.

#### Acceptance Criteria

1. WHEN an order is created, THE Audit_Logger SHALL send an audit entry to Zenvix_API containing the action type ("order.created"), actor (customer or admin with their ID), ISO 8601 UTC timestamp, and order_id
2. WHEN an order stage transition occurs, THE Audit_Logger SHALL send an audit entry containing the order_id, from_stage, to_stage, actor, and ISO 8601 UTC timestamp
3. WHEN a payment is confirmed, THE Audit_Logger SHALL send an audit entry containing the order_id, payment amount, actor, and ISO 8601 UTC timestamp
4. WHEN an order is created, THE Audit_Logger SHALL generate a trace_id (UUID) and include it in that entry and in every subsequent audit entry for the same order_id
5. IF an audit log entry fails to send, THEN THE Audit_Logger SHALL queue the entry for retry using exponential backoff, up to a maximum of 5 attempts, without blocking or failing the primary operation
6. IF an audit log entry has exhausted all 5 retry attempts, THEN THE Audit_Logger SHALL mark the entry as permanently failed and retain it in the local queue for administrative review

### Requirement 11: Bidirectional Order Status Sync

**User Story:** As a store owner, I want to update order status from the Zenvix dashboard and have customers see the change, so that manual interventions are reflected in the customer-facing Storefront.

#### Acceptance Criteria

1. WHEN the Notification_Poller detects a Zenvix order status that maps to a later Order_Stage than the current local stage, THE Storefront SHALL advance the local order to the corresponding stage, even if the new stage is not the immediate next stage in the transition sequence
2. IF the Notification_Poller detects a Zenvix order status that maps to the same or earlier Order_Stage than the current local stage, THEN THE Storefront SHALL discard the update and leave the local order unchanged
3. WHEN the local order is updated from a Zenvix status change, THE Storefront SHALL record the update source as "zenvix_admin" and the timestamp of the detected change in the stage history entry
4. WHILE the Storefront is displaying the order tracker page, THE Storefront SHALL reflect a Zenvix-originated stage advancement within 15 seconds of the Notification_Poller detecting the change
5. IF the Notification_Poller receives a Zenvix order status that has no defined mapping to any local Order_Stage, THEN THE Storefront SHALL ignore the unrecognized status and retain the current local stage without error

### Requirement 12: Docker Compose Configuration

**User Story:** As a developer, I want a Docker Compose file for the Storefront that integrates with the existing VPS infrastructure, so that deployment is consistent and reproducible.

#### Acceptance Criteria

1. THE Storefront SHALL have a `docker-compose.yml` file in its project root that defines the Deployment_Container service with a build context pointing to the project root directory and using the project's Dockerfile
2. THE Deployment_Container service SHALL join the external Docker_Network (`bfs_default`) which SHALL be declared as an external network in the Docker Compose configuration's top-level `networks` section
3. THE Deployment_Container service SHALL mount the `.env.production` file from the project root as a bind mount into the container for runtime configuration
4. THE Deployment_Container service SHALL define a restart policy of `unless-stopped` to recover from crashes
5. THE Deployment_Container service SHALL expose only port 3020 on the host, mapped to port 80 inside the container
6. THE Deployment_Container service SHALL specify an explicit container name to enable deterministic reference by the Auto_Deploy_Script
