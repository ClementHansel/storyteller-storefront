# Bambu Silver by Estela — Headless Ecommerce Storefront

A production-ready headless ecommerce storefront for **Bambu Silver by Estela**, an artisan sterling silver jewelry brand based in Bali. Built with React + TypeScript and powered by the **Zenvix Retail Module** backend.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **Vite** — Build tool with fast HMR
- **TanStack React Query** — Server state management and caching
- **React Router v6** — Client-side routing with lazy-loaded pages
- **Tailwind CSS** + **shadcn/ui** — Design system and utility CSS
- **Axios** — HTTP client with JWT interceptors
- **Zod** — Runtime validation for forms and API data
- **Decimal.js** — Precise financial calculations
- **Fuse.js** — Client-side fuzzy search

## Architecture

```
src/
├── api/            # Zenvix gateway clients (catalog, events, webhooks)
├── assets/         # Static images (logo, hero)
├── components/     # Reusable UI components
├── config/         # Store configuration (chapters, branding)
├── contexts/       # React contexts (Auth, Cart)
├── hooks/          # Custom hooks (Zenvix data, session)
├── lib/            # Axios client, token manager
├── pages/          # Route pages (lazy-loaded)
├── services/       # Business logic (auth, cart, orders)
└── types/          # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A running Zenvix Retail Module backend (or use mock mode)

### Installation

```bash
git clone <repository-url>
cd bambusilver-by-estela
npm install
```

### Configuration

Copy the environment template and fill in your Zenvix credentials:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `VITE_ZENVIX_API_URL` | Zenvix Retail Gateway URL |
| `VITE_ZENVIX_TENANT_ID` | Your tenant identifier |
| `VITE_ZENVIX_CLIENT_ID` | OAuth2 Client ID |
| `VITE_ZENVIX_CLIENT_SECRET` | OAuth2 Client Secret |
| `VITE_ZENVIX_CHANNEL_RECORD_ID` | Channel attribution ID |

### Development

```bash
npm run dev
```

Open http://localhost:8080. The app runs in mock mode if Zenvix credentials are not configured.

### Verify Zenvix Connection

```bash
npx tsx scripts/test-zenvix-connection.ts
```

### Production Build

```bash
npm run build
```

Output is in `dist/` — deploy to any static host (Netlify, Vercel, Cloudflare Pages).

## Deployment (Netlify)

The project includes `netlify.toml` with SPA routing, caching headers, and security headers pre-configured. Push to your Git provider and connect to Netlify.

## Key Features

- **Story-first merchandising** — Products organized into narrative "chapters" with rich SEO content
- **Dual-mode API** — Auto-switches between mock data and live Zenvix gateway
- **Session persistence** — JWT tokens + refresh flow survive page reloads
- **Event forwarding** — All user actions (views, cart, checkout) sent to Zenvix with retry queue
- **Optimistic UI** — Cart updates are instant with background sync
- **Structured data** — JSON-LD schema markup for products, organization, and breadcrumbs
- **Full SEO** — Server-rendered meta tags, sitemap, Open Graph, Twitter Cards

## License

Proprietary — Bambu Silver by Estela. All rights reserved.
