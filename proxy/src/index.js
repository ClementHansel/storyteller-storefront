// ============================================================
// Bambu Silver Catalog Proxy — Express + SQLite
// ============================================================
// Serves products and categories from a local SQLite database
// that is synced from Zenvix every 5 minutes.
// ============================================================

const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');
const { syncAll } = require('./sync');

const PORT = process.env.PROXY_PORT || 3025;
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const app = express();
app.use(cors());
app.use(express.json());

// --- Health check ---
app.get('/health', (req, res) => {
  const db = getDb();
  const meta = db.prepare("SELECT value FROM sync_meta WHERE key = 'last_sync'").get();
  const count = db.prepare("SELECT value FROM sync_meta WHERE key = 'product_count'").get();
  res.json({
    status: 'ok',
    lastSync: meta?.value || 'never',
    productCount: count?.value || '0',
  });
});

// --- Products (paginated, filterable) ---
app.get('/api/products', (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 24));
  const offset = (page - 1) * pageSize;
  const category = req.query.category || '';
  const search = req.query.search || '';
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
  const sort = req.query.sort || 'name';

  let where = 'WHERE 1=1';
  const params = [];

  if (category) {
    where += ' AND category_id = ?';
    params.push(category);
  }
  if (search) {
    where += ' AND (name LIKE ? OR sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (minPrice > 0) {
    where += ' AND price_usd >= ?';
    params.push(minPrice);
  }
  if (maxPrice < Infinity) {
    where += ' AND price_usd <= ?';
    params.push(maxPrice);
  }

  let orderBy = 'ORDER BY name ASC';
  if (sort === 'price-asc') orderBy = 'ORDER BY price_usd ASC';
  else if (sort === 'price-desc') orderBy = 'ORDER BY price_usd DESC';
  else if (sort === 'newest') orderBy = 'ORDER BY updated_at DESC';

  const total = db.prepare(`SELECT COUNT(*) as count FROM products ${where}`).get(...params).count;
  const products = db.prepare(
    `SELECT * FROM products ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  res.json({
    products: products.map(formatProduct),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// --- Single product by slug or ID ---
app.get('/api/products/:slugOrId', (req, res) => {
  const db = getDb();
  const { slugOrId } = req.params;

  const product = db.prepare(
    'SELECT * FROM products WHERE slug = ? OR id = ?'
  ).get(slugOrId, slugOrId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(formatProduct(product));
});

// --- Categories ---
app.get('/api/categories', (req, res) => {
  const db = getDb();
  const categories = db.prepare(
    'SELECT * FROM categories ORDER BY product_count DESC'
  ).all();
  res.json(categories);
});

// --- Sync status ---
app.get('/api/sync-status', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM sync_meta').all();
  const meta = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json(meta);
});

// --- Manual sync trigger ---
app.post('/api/sync', async (req, res) => {
  try {
    await syncAll();
    res.json({ success: true, message: 'Sync completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Format product for API response ---
function formatProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    price: row.price_usd,
    priceIDR: row.price_idr,
    currency: 'USD',
    categoryId: row.category_id,
    categoryName: row.category_name,
    stockStatus: row.stock_status,
    maxQuantity: row.max_quantity,
    inStock: row.stock_status !== 'OUT_OF_STOCK',
  };
}

// --- Start server + initial sync ---
async function start() {
  // Run initial sync if DB is empty
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  if (count === 0) {
    console.log('[Proxy] DB empty, running initial sync...');
    await syncAll();
  }

  // Start periodic sync
  setInterval(async () => {
    try {
      await syncAll();
    } catch (err) {
      console.error('[Proxy] Periodic sync failed:', err.message);
    }
  }, SYNC_INTERVAL_MS);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Proxy] Catalog API running on port ${PORT}`);
    console.log(`[Proxy] ${count} products in DB, syncing every 5 minutes`);
  });
}

start().catch((err) => {
  console.error('[Proxy] FATAL:', err);
  process.exit(1);
});
