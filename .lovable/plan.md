

# Silver Jewelry & Handcraft Storefront — "Story-First" E-Commerce

A warm, artisanal React storefront for selling silver jewelry and handcraft items, built with a "Story Chapters" merchandising concept. The Zenvix API layer will be mocked with realistic sample data, structured so you can swap in real Zenvix endpoints later.

---

## 1. Foundation & Design System

- **Warm & Artisanal theme**: Earthy color palette (warm beige, terracotta, deep brown, muted gold), serif headings, handcraft-inspired textures
- **Responsive layout** with a clean, editorial feel — large product imagery, generous whitespace
- **Reusable design tokens** for colors, typography, and spacing

## 2. Store Configuration & Data Layer

- **`store-config.ts`** — A configuration file where you define Story Chapters and whitelist products by ID or tag. Each chapter has a name, slug, description, narrative order, and a 500-word story block
- **Mock Zenvix API service** — Sample silver jewelry products (rings, necklaces, bracelets, earrings, handcraft items) with prices, stock, images, tags, and descriptions. Structured behind a clean API interface (`zenvix-api.ts`) so swapping to real endpoints is a one-file change
- **React Query integration** — All data fetching uses TanStack React Query with caching, stale-while-revalidate, and error/loading states

## 3. Pages & Routing

- **Home page** — Hero section with brand story, featured chapters preview, highlighted products
- **Chapters listing** (`/chapters`) — Browse all Story Chapters with cover images and short descriptions
- **Individual Chapter page** (`/chapters/:slug`) — Full 500-word story block for SEO, followed by curated product grid, unique meta tags per chapter
- **Product detail page** (`/products/:id`) — Large product images, description, price, stock status, "Add to Cart" button
- **Search results page** — Displays filtered results from Fast Search
- **Cart page** — Full cart experience with quantity controls, subtotal, and "Proceed to Checkout" button (redirects to mock Zenvix checkout, ready to swap)

## 4. Advanced Search & Discovery

- **Fast Search component** (Fuse.js) — Instant search across product titles, descriptions, and tags with a dropdown results preview
- **Smart Filter sidebar** on chapter/search pages:
  - Dynamic category filters based on Story Chapters
  - Sort options: Price Low→High, Price High→Low, Narrative/Custom Order, Newest
  - Multi-select attribute filters (material, style, etc.)

## 5. Product Image Component

- **`ProductImage` component** — Lazy loading with intersection observer, blur-up placeholder effect, WebP-first with fallback, responsive sizing
- Sample product images using placeholder/stock jewelry photos

## 6. Cart & Checkout Flow (Mocked, Swap-Ready)

- **Client-side cart** with add/remove/update quantity
- **Price re-verification step** — Before checkout, the cart re-fetches current prices from the (mock) Zenvix API to confirm accuracy
- **Checkout redirect** — "Proceed to Checkout" button simulates redirect to Zenvix Hosted Checkout (toast notification in mock mode, ready to swap to real URL)

## 7. SEO & Performance

- **Per-chapter meta tags** — Dynamic document title and meta description for each chapter route
- **Story content blocks** — Each chapter page includes a rich 500-word narrative block (sample content provided, editable in config)
- **React Query caching** — Cached data shown if API is slow, background refetch on stale data

## 8. Sample Content

- **5–8 Story Chapters** pre-configured with sample data:
  - "The Craft" — Artisan process & handmade pieces
  - "Silver & Soul" — Signature silver collection
  - "Heritage Rings" — Traditional ring designs
  - "Woven Stories" — Handcraft accessories
  - "The Everyday" — Minimal daily-wear pieces
  - "Limited Editions" — Seasonal/special pieces
- ~20-30 mock products distributed across chapters with realistic jewelry data

