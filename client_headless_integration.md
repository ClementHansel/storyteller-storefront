# Zenvix Retail Module — Headless Client Integration Guide

> **Version:** 1.0  
> **Last Updated:** February 2026  
> **Template:** Bambusilver Storefront

This document is the authoritative reference for integrating a headless ecommerce storefront with the Zenvix Retail Module. Follow this guide to configure credentials, understand the handshake protocol, map events, and deploy the template.

---

## 1. Technical Specs

| Paramet| Aspect | Specification |
| :--- | :--- |
| **Gateway Base URL** | `http://localhost:3001/api/retail/public` |
| **Catalog Endpoint** | `/products` _(GET)_ |
| **Events Endpoint** | `/events` _(POST)_ |
| **Authentication** | Header-based (`x-client-id`, `x-client-secret`) |
| **Catalog Format** | Direct Array `[...]` |
| **Event Format** | `{ type, timestamp, actor: { id, type }, payload: { ... } }` |
| **Client Credentials** | `znx_beffb9bb` / `sk_test_...` |
| **Data Fetching Method** | Catalog/Inventory calls use standard REST `GET` with query params |

### Required Environment Variables

| Variable | Description |
| :--- | :--- |
| `VITE_ZENVIX_TENANT_ID` | Tenant identifier (e.g., `comp-demo-a`) |
| `VITE_ZENVIX_BRANCH_ID` | Branch/location identifier (e.g., `branch_main`) |
| `VITE_ZENVIX_GATEWAY_URL` | Full path to the `/api/retail/events` endpoint |
| `VITE_ZENVIX_CLIENT_ID` | OAuth2 Client ID from Ecommerce Hub |
| `VITE_ZENVIX_CLIENT_SECRET` | OAuth2 Client Secret from Ecommerce Hub |
| `VITE_ZENVIX_API_KEY` | Static API key (fallback bearer token) |
| `VITE_ZENVIX_CHANNEL_RECORD_ID` | Channel Record ID for event attribution |

---

## 2. Handshake Protocol

The storefront uses a three-step handshake before every session:

### Step 1 — Token Acquisition

The client posts credentials to the auth endpoint. The resulting `accessToken` is cached in memory and reused until (TTL − 30 s).

```http
POST <base>/auth/token
Content-Type: application/json

{
  "clientId": "<VITE_ZENVIX_CLIENT_ID>",
  "clientSecret": "<VITE_ZENVIX_CLIENT_SECRET>"
}
```

**Success Response:**
```json
{
  "accessToken": "eyJhbGci...",
  "expiresIn": 3600
}
```

> If the auth endpoint is unavailable, the static `VITE_ZENVIX_API_KEY` is used as the fallback bearer token.

### Step 2 — Catalog/Inventory Bootstrap

With a valid token, the client fetches the product catalog and inventory snapshot on app mount:

```http
POST <base>/catalog/products
Authorization: Bearer <token>
X-Zenvix-Tenant: <tenantId>
X-Zenvix-Branch: <branchId>
Content-Type: application/json

{
  "tenantId": "<tenantId>",
  "branchId": "<branchId>",
  "pageSize": 50
}
```

Inventory is fetched in parallel:

```http
POST <base>/inventory/status
Authorization: Bearer <token>
X-Zenvix-Tenant: <tenantId>
X-Zenvix-Branch: <branchId>
Content-Type: application/json

{
  "tenantId": "<tenantId>",
  "branchId": "<branchId>",
  "productIds": ["<id1>", "<id2>"]
}
```

### Step 3 — Session Event

A `session.start` or `connection.test` event is sent to confirm the gateway is reachable and attribute the session to the correct channel:

```http
POST <gateway_url>
x-api-key: <apiKey>
x-tenant-id: <tenantId>
x-branch-id: <branchId>
Content-Type: application/json

{
  "type": "session.start",
  "timestamp": "<ISO-8601>",
  "actor": {
    "id": "<user-session-id>",
    "type": "user",
    "tenant_id": "<tenantId>",
    "branch_id": "<branchId>"
  },
  "context": {
    "channel": "ecommerce",
    "channel_record_id": "<VITE_ZENVIX_CHANNEL_RECORD_ID>",
    "source": "web-storefront"
  },
  "payload": {}
}
```

---

## 3. Event Mapping

All storefront interactions are forwarded to the Zenvix Events Gateway for analytics and attribution.

| Storefront Action | `type` (event) | Key Payload Fields |
| :--- | :--- | :--- |
| Page view | `page.view` | `url`, `title` |
| Product viewed | `product.view` | `product_id`, `product_name`, `price` |
| Add to cart | `cart.add` | `product_id`, `quantity`, `price` |
| Remove from cart | `cart.remove` | `product_id`, `quantity` |
| Cart updated | `cart.update` | `product_id`, `quantity` |
| Checkout initiated | `cart.checkout` | `items[]`, `total_price` |
| Order placed | `order.placed` | `order_id`, `items[]`, `total_price` |
| Search performed | `search.query` | `query`, `results_count` |

**Note:** Every event must include the `actor` and `context` objects for correct scoping and attribution. payload fields use `snake_case`.

### Implementation Reference

Events are dispatched via `src/api/zenvix-events.ts`, which wraps the raw client call with the channel record ID automatically.

---

## 4. Template Deployment

### Prerequisites

- Node.js 18+ or Bun
- A running **Zenvix Retail Module** backend (NestJS) with the Retail module enabled
- A Channel Record created in the **Ecommerce Hub** → **Channels** page with `Type: HEADLESS`

### Steps

**1. Clone the template**
```bash
git clone <this-repository> my-storefront
cd my-storefront
npm install
```

**2. Configure credentials**

Copy the production environment template and fill in your values:
```bash
cp .env.production .env.local
```

Edit `.env.local` with your Tenant ID, Branch ID, Client ID/Secret, and Gateway URL from the Ecommerce Hub.

**3. Verify the connection**

Run the built-in connection test script before starting the dev server:
```bash
npx tsx scripts/test-zenvix-connection.ts
```

A successful run looks like:
```
✓  1_AUTH_TOKEN         status=200
✓  2_CATALOG_PING       status=200
✓  3_EVENTS_PING        status=200

✅  All handshake steps passed — Gateway is reachable.
```

**4. Start development server**
```bash
npm run dev
```

Open `http://localhost:5173` and inspect the Network tab to confirm POST requests are reaching your Gateway URL with the correct Bearer token.

**5. Build for production**
```bash
npm run build
```

The output in `dist/` can be deployed to any static host (Vercel, Netlify, Nginx, CDN, etc.).

### Customising the Storefront

| What to modify | Where |
| :--- | :--- |
| Store branding, chapter text, hero copy | `src/config/store-config.ts` |
| Product display components | `src/components/` |
| All Zenvix data fetching hooks | `src/hooks/use-zenvix.ts` |
| Low-level API client | `src/api/zenvix-client.ts` |
| Event definitions | `src/api/zenvix-events.ts` |

---

*For support, refer to the Zenvix Retail Module API documentation or the internal Ecommerce Hub admin panel.*
