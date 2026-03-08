/**
 * Zenvix Gateway Connection Test
 * ================================
 * Run with:  npx tsx scripts/test-zenvix-connection.ts
 *
 * Verifies three handshake steps:
 *  1. Events gateway ping  (POST /api/retail/events   — x-api-key auth)
 *  2. Products catalog     (GET  /api/retail/products — x-api-key auth)
 *  3. Public events ping   (POST /api/retail/public/events — no auth required)
 *
 * Auth: The backend uses header-based auth, NOT OAuth2 bearer tokens.
 *   Required header → one of: x-api-key | x-ecommerce-key | x-client-secret
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env file — prefer .env.local, fall back to .env
const envLocal = path.resolve(process.cwd(), '.env.local');
const envFile  = path.resolve(process.cwd(), '.env');
dotenv.config({ path: fs.existsSync(envLocal) ? envLocal : envFile });

// ── Configuration ─────────────────────────────────────────────
const TENANT_ID     = process.env.VITE_ZENVIX_TENANT_ID     || 'comp-demo-a';
const BRANCH_ID     = process.env.VITE_ZENVIX_BRANCH_ID     || 'branch_main';
const GATEWAY_URL   = 'http://localhost:3001/api/retail/public/events';
const BASE_URL      = 'http://localhost:3001/api/retail/public';
const CLIENT_ID     = 'znx_beffb9bb';
const CLIENT_SECRET = 'sk_test_07db50ed3b344ea8';
const API_KEY       = process.env.VITE_ZENVIX_API_KEY       || '';
const TEST_USER_ID  = 'test-user-123';
const REAL_PRODUCT_ID = '10d4e0e0-deed-48b2-a566-0281b4ecbc40';
const CHANNEL_RECORD_ID = '441b1603-e2aa-45a8-bb4e-589fa6ec8123';

type Result = { step: string; ok: boolean; status?: number; data?: unknown; error?: string };

async function safeRequest(
  label: string,
  method: 'GET' | 'POST',
  url: string,
  payload: object | null,
  headers: Record<string, string>,
): Promise<Result> {
  console.log(`\n[${label}] ${method} ${url}`);
  try {
    const init: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    if (payload !== null) init.body = JSON.stringify(payload);

    const res = await fetch(url, init);
    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }
    const ok = res.ok;
    console.log(`  → status: ${res.status} | ok: ${ok}`);
    if (ok) console.log('  → response:', JSON.stringify(data, null, 2).slice(0, 400));
    else console.warn('  ⚠ error body:', text.slice(0, 400));
    return { step: label, ok, status: res.status, data };
  } catch (err: any) {
    console.error(`  ✗ Network error: ${err.message}`);
    return { step: label, ok: false, error: err.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('  Zenvix Gateway — Connection Test');
  console.log('='.repeat(60));
  console.log(`  Tenant    : ${TENANT_ID}`);
  console.log(`  Branch    : ${BRANCH_ID}`);
  console.log(`  Gateway   : ${GATEWAY_URL}`);
  console.log(`  Base URL  : ${BASE_URL}`);
  console.log(`  Auth via  : x-api-key header`);
  console.log('='.repeat(60));

  if (!API_KEY && !CLIENT_SECRET) {
    console.error('\n✗  FATAL: Neither VITE_ZENVIX_API_KEY nor VITE_ZENVIX_CLIENT_SECRET is set.\n');
    process.exit(1);
  }

  // Header-based auth — the backend requires x-client-id + x-client-secret for events
  const authHeaders: Record<string, string> = {
    'x-tenant-id': TENANT_ID,
    'x-branch-id': BRANCH_ID,
  };
  if (CLIENT_ID)     authHeaders['x-client-id']     = CLIENT_ID;
  if (CLIENT_SECRET) authHeaders['x-client-secret'] = CLIENT_SECRET;
  if (API_KEY)       authHeaders['x-api-key']       = API_KEY;

  // Public endpoint also needs x-tenant-id + client credentials
  const publicHeaders: Record<string, string> = {
    'x-tenant-id': TENANT_ID,
    'x-branch-id': BRANCH_ID,
  };
  if (CLIENT_ID)     publicHeaders['x-client-id']     = CLIENT_ID;
  if (CLIENT_SECRET) publicHeaders['x-client-secret'] = CLIENT_SECRET;

  const results: Result[] = [];

  const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
  const REAL_PRODUCT_ID = '10d4e0e0-deed-48b2-a566-0281b4ecbc40';

  // ── Step 1: Events Gateway (Public) ──────────────────────────
  const eventsResult = await safeRequest(
    '1_EVENTS_GATEWAY',
    'POST',
    `${BASE_URL}/events`,
    {
      type: 'heartbeat',
      actor: { id: 'browser-test', type: 'client' },
      timestamp: new Date().toISOString(),
      payload: { source: 'connection-test', test: true }
    },
    authHeaders,
  );
  results.push(eventsResult);

  // ── Step 2: Product Catalog (Public) ─────────────────────────
  const catalogResult = await safeRequest(
    '2_PRODUCTS_CATALOG',
    'GET',
    `${BASE_URL}/products`,
    null,
    authHeaders,
  );
  results.push(catalogResult);

  // ── Step 3: Public Event (Cart Add Simulation) ───────────────
  const publicEventsResult = await safeRequest(
    '3_CART_EVENT_TEST',
    'POST',
    `${BASE_URL}/events`,
    {
      type: 'cart.add',
      timestamp: new Date().toISOString(),
      actor: {
        id: TEST_USER_ID,
        type: 'guest',
        tenant_id: TENANT_ID,
        branch_id: BRANCH_ID
      },
      payload: {
        productId: REAL_PRODUCT_ID,
        quantity: 1,
        price: 150000
      }
    },
    authHeaders,
  );
  results.push(publicEventsResult);

  // ── Step 4: Categories Check (Expected 404 based on contract) ──
  const categoriesResult = await safeRequest(
    '4_CATEGORIES',
    'GET',
    `${BASE_URL}/categories`,
    null,
    authHeaders,
  );
  results.push(categoriesResult);

  // ── Step 5: Promotions Check (Expected 404 based on contract) ──
  const promotionsResult = await safeRequest(
    '5_PROMOTIONS',
    'GET',
    `${BASE_URL}/promotions`,
    null,
    authHeaders,
  );
  results.push(promotionsResult);

  // ── Step 6: Auth - Register (Public) ─────────────────────────
  const registerResult = await safeRequest(
    '6_AUTH_REGISTER',
    'POST',
    `${BASE_URL}/auth/register`,
    {
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'SecurePassword123',
      phone: '+628123456789'
    },
    authHeaders,
  );
  results.push(registerResult);

  // ── Step 7: Auth - Login (Public) ────────────────────────────
  const loginResult = await safeRequest(
    '7_AUTH_LOGIN',
    'POST',
    `${BASE_URL}/auth/login`,
    {
      email: registerResult.ok ? (registerResult.data as any).customer.email : 'test@example.com',
      password: 'SecurePassword123'
    },
    authHeaders,
  );
  results.push(loginResult);

  const jwtToken = loginResult.ok ? (loginResult.data as any).accessToken || (loginResult.data as any).token : null;
  const bearerHeaders = { ...authHeaders, 'Authorization': `Bearer ${jwtToken}` };

  // ── Step 8: Shopping Cart (Authenticated) ────────────────────
  const cartResult = await safeRequest(
    '8_GET_CART',
    'GET',
    `${BASE_URL}/cart`,
    null,
    jwtToken ? bearerHeaders : authHeaders,
  );
  results.push(cartResult);

  // ── Step 9: Create Order (Authenticated) ──────────────────────
  const orderResult = await safeRequest(
    '9_CREATE_ORDER',
    'POST',
    `${BASE_URL}/orders`,
    {
      externalReference: `WEB-${Date.now()}`,
      items: [{ sku: 'CLOTH-TSHIRT-BLK', quantity: 1 }],
      paymentMethod: 'card',
      paymentStatus: 'PAID',
      customer: {
        name: 'Test User',
        email: registerResult.ok ? (registerResult.data as any).customer.email : 'test@example.com'
      }
    },
    jwtToken ? bearerHeaders : authHeaders,
  );
  results.push(orderResult);

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  Test Summary');
  console.log('='.repeat(60));
  let allPassed = true;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`  ${icon}  ${r.step.padEnd(22)} status=${r.status ?? 'ERR'}`);
    if (!r.ok) allPassed = false;
  }
  console.log('='.repeat(60));

  if (allPassed) {
    console.log('\n✅  All handshake steps passed — Gateway is reachable.\n');
    process.exit(0);
  } else {
    console.warn('\n⚠️  One or more steps failed. Check Gateway logs and credentials.\n');
    process.exit(1);
  }
}

main();
