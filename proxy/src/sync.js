// ============================================================
// Zenvix → SQLite Sync Script
// ============================================================
// Fetches all products from Zenvix API, converts prices to USD
// with 10% markup, and stores in SQLite for fast serving.
// ============================================================

const { getDb } = require('./db');
const { CATEGORY_NAMES } = require('./categories');

const ZENVIX_API_URL = process.env.VITE_ZENVIX_API_URL || '';
const TENANT_ID = process.env.VITE_ZENVIX_TENANT_ID || '';
const CLIENT_ID = process.env.VITE_ZENVIX_CLIENT_ID || '';
const CLIENT_SECRET = process.env.VITE_ZENVIX_CLIENT_SECRET || '';
const API_KEY = process.env.VITE_ZENVIX_API_KEY || '';
const MARKUP_PERCENT = 10;
const FALLBACK_RATE = 0.0000625;

async function fetchExchangeRate() {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=IDR&to=USD',
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rate = data.rates?.USD;
    if (typeof rate !== 'number' || rate <= 0) throw new Error('Invalid');
    console.log(`[Sync] Exchange rate: 1 IDR = ${rate} USD`);
    return rate;
  } catch (err) {
    console.warn('[Sync] Rate fetch failed, using fallback:', err.message);
    return FALLBACK_RATE;
  }
}

async function fetchProducts() {
  const url = `${ZENVIX_API_URL}/products?pageSize=10000`;
  const headers = {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
    'x-client-id': CLIENT_ID,
    'x-client-secret': CLIENT_SECRET,
  };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

  console.log(`[Sync] Fetching products...`);
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(90000) });
  if (!res.ok) throw new Error(`Products API returned ${res.status}`);
  const products = await res.json();
  console.log(`[Sync] Received ${products.length} products`);
  return products;
}

function convertPrice(priceIDR, rate) {
  const baseUSD = priceIDR * rate;
  const withMarkup = baseUSD * (1 + MARKUP_PERCENT / 100);
  return Math.round(withMarkup * 100) / 100;
}

function makeSlug(sku) {
  return (sku || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function syncAll() {
  const startTime = Date.now();
  console.log('[Sync] Starting full catalog sync...');

  const [rate, products] = await Promise.all([
    fetchExchangeRate(),
    fetchProducts(),
  ]);

  const db = getDb();

  // Use a transaction for atomic insert
  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products
    (id, name, slug, sku, price_idr, price_usd, category_id, category_name, stock_status, max_quantity, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name, slug, product_count)
    VALUES (?, ?, ?, ?)
  `);

  const upsertMeta = db.prepare(`
    INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)
  `);

  // Count products per category
  const categoryCounts = {};
  for (const p of products) {
    const catId = p.category || 'uncategorized';
    categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
  }

  // Insert all in a transaction
  const syncTransaction = db.transaction(() => {
    // Clear old data
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM categories');

    // Insert products
    for (const p of products) {
      const catId = p.category || '';
      const catName = CATEGORY_NAMES[catId] || catId.slice(0, 8);
      insertProduct.run(
        p.id,
        p.name || '',
        makeSlug(p.sku),
        p.sku || '',
        Number(p.price) || 0,
        convertPrice(Number(p.price) || 0, rate),
        catId,
        catName,
        p.stock_levels || 'OUT_OF_STOCK',
        Number(p.maxQuantity) || 0
      );
    }

    // Insert categories
    for (const [catId, count] of Object.entries(categoryCounts)) {
      const name = CATEGORY_NAMES[catId] || catId.slice(0, 8);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      insertCategory.run(catId, name, slug, count);
    }

    // Store sync metadata
    upsertMeta.run('last_sync', new Date().toISOString());
    upsertMeta.run('product_count', String(products.length));
    upsertMeta.run('exchange_rate', String(rate));
    upsertMeta.run('category_count', String(Object.keys(categoryCounts).length));
  });

  syncTransaction();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Sync] Done! ${products.length} products, ${Object.keys(categoryCounts).length} categories synced in ${elapsed}s`);
}

// Run if called directly
if (require.main === module) {
  syncAll().catch((err) => {
    console.error('[Sync] FATAL:', err);
    process.exit(1);
  });
}

module.exports = { syncAll };
