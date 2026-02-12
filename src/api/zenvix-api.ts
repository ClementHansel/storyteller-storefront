// Zenvix API Mock Layer
// Replace the implementations in this file with real Zenvix API calls when ready.
// The interface stays the same — only the fetch logic changes.

import { Product } from '@/types';

const MOCK_PRODUCTS: Product[] = [
  // === The Craft (handmade, artisan) ===
  { id: 'p-01', title: 'Flame-Forged Cuff', slug: 'flame-forged-cuff', description: 'A bold cuff bracelet hand-forged over open flame, showcasing raw hammer marks and organic curves. Each piece carries unique fire-scale patterns.', price: 189, currency: 'USD', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'], tags: ['handmade', 'artisan', 'bracelet', 'cuff'], material: 'Sterling Silver', style: 'Rustic', inStock: true, stockQuantity: 8, createdAt: '2025-09-01', updatedAt: '2025-12-01' },
  { id: 'p-02', title: 'Artisan Twist Bangle', slug: 'artisan-twist-bangle', description: 'Three strands of silver wire twisted by hand into a seamless bangle. The organic twist pattern catches light from every angle.', price: 145, currency: 'USD', images: ['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80'], tags: ['handmade', 'artisan', 'bangle'], material: 'Sterling Silver', style: 'Artisan', inStock: true, stockQuantity: 12, createdAt: '2025-08-15', updatedAt: '2025-11-20' },
  { id: 'p-03', title: 'Hammered Disc Earrings', slug: 'hammered-disc-earrings', description: 'Hand-hammered silver discs with a textured matte finish. Lightweight and perfectly imperfect — the mark of true handcraft.', price: 68, currency: 'USD', images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'], tags: ['handmade', 'artisan', 'earrings'], material: 'Sterling Silver', style: 'Rustic', inStock: true, stockQuantity: 20, createdAt: '2025-07-10', updatedAt: '2025-11-15' },

  // === Silver & Soul (signature, silver) ===
  { id: 'p-04', title: 'Solace Pendant', slug: 'solace-pendant', description: 'A teardrop pendant in high-polish silver with a moonstone accent. Named for the calm it brings — our most iconic piece.', price: 135, currency: 'USD', images: ['https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80'], tags: ['signature', 'silver', 'pendant', 'necklace'], material: 'Sterling Silver & Moonstone', style: 'Elegant', inStock: true, stockQuantity: 15, createdAt: '2025-06-01', updatedAt: '2025-12-01' },
  { id: 'p-05', title: 'Ember Chain Necklace', slug: 'ember-chain-necklace', description: 'A delicate chain with subtly hammered links that glow with warm reflected light. Available in 16" and 18" lengths.', price: 95, currency: 'USD', images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'], tags: ['signature', 'silver', 'necklace', 'chain'], material: 'Sterling Silver', style: 'Minimal', inStock: true, stockQuantity: 25, createdAt: '2025-05-20', updatedAt: '2025-11-10' },
  { id: 'p-06', title: 'Meridian Hoops', slug: 'meridian-hoops', description: 'Medium-sized hoops with a half-polish, half-matte finish creating a beautiful visual divide. Our signature earring.', price: 78, currency: 'USD', images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80'], tags: ['signature', 'silver', 'earrings', 'hoops'], material: 'Sterling Silver', style: 'Contemporary', inStock: true, stockQuantity: 18, createdAt: '2025-04-15', updatedAt: '2025-10-05' },
  { id: 'p-07', title: 'Anchor Bracelet', slug: 'anchor-bracelet', description: 'A substantial chain bracelet with an anchor-shaped toggle clasp. Worn alone or stacked — always makes a statement.', price: 155, currency: 'USD', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'], tags: ['signature', 'silver', 'bracelet'], material: 'Sterling Silver', style: 'Bold', inStock: true, stockQuantity: 10, createdAt: '2025-03-01', updatedAt: '2025-09-20' },

  // === Heritage Rings (ring, heritage) ===
  { id: 'p-08', title: 'Viking Band', slug: 'viking-band', description: 'A wide, weighty band inspired by Norse arm rings. Deep oxidized channels highlight the braided pattern.', price: 125, currency: 'USD', images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'], tags: ['ring', 'heritage', 'band'], material: 'Sterling Silver', style: 'Bold', inStock: true, stockQuantity: 14, createdAt: '2025-06-10', updatedAt: '2025-11-30' },
  { id: 'p-09', title: 'Classic Signet Ring', slug: 'classic-signet-ring', description: 'A reimagined signet ring with a flat oval face, ready for custom engraving. Comfort-fit interior for all-day wear.', price: 165, compareAtPrice: 195, currency: 'USD', images: ['https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80'], tags: ['ring', 'heritage', 'signet'], material: 'Sterling Silver', style: 'Classic', inStock: true, stockQuantity: 9, createdAt: '2025-05-05', updatedAt: '2025-10-15' },
  { id: 'p-10', title: 'Stacker Trio', slug: 'stacker-trio', description: 'Three slim rings designed to be worn together: one polished, one matte, one with tiny bead detailing.', price: 98, currency: 'USD', images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'], tags: ['ring', 'heritage', 'stacker', 'minimal'], material: 'Sterling Silver', style: 'Minimal', inStock: true, stockQuantity: 22, createdAt: '2025-07-20', updatedAt: '2025-11-25' },
  { id: 'p-11', title: 'Posy Ring — "Always"', slug: 'posy-ring-always', description: 'A slim band with "Always" hand-engraved on the interior. Inspired by Georgian-era message rings.', price: 85, currency: 'USD', images: ['https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80'], tags: ['ring', 'heritage', 'engraved'], material: 'Sterling Silver', style: 'Romantic', inStock: true, stockQuantity: 30, createdAt: '2025-08-01', updatedAt: '2025-12-01' },

  // === Woven Stories (handcraft, woven, textile) ===
  { id: 'p-12', title: 'Linen & Silver Wrap', slug: 'linen-silver-wrap', description: 'Waxed Belgian linen cord woven with sterling silver tube beads. Wraps twice around the wrist with an adjustable slide knot.', price: 72, currency: 'USD', images: ['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80'], tags: ['handcraft', 'woven', 'textile', 'bracelet'], material: 'Sterling Silver & Linen', style: 'Bohemian', inStock: true, stockQuantity: 16, createdAt: '2025-04-01', updatedAt: '2025-10-10' },
  { id: 'p-13', title: 'Braided Silk Pendant', slug: 'braided-silk-pendant', description: 'A hand-braided silk cord in terracotta carrying a sterling silver leaf charm. Adjustable length.', price: 58, currency: 'USD', images: ['https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80'], tags: ['handcraft', 'woven', 'textile', 'pendant', 'necklace'], material: 'Sterling Silver & Silk', style: 'Bohemian', inStock: true, stockQuantity: 20, createdAt: '2025-03-15', updatedAt: '2025-09-01' },
  { id: 'p-14', title: 'Leather Cuff with Silver Rivets', slug: 'leather-cuff-silver-rivets', description: 'Vegetable-tanned leather cuff bracelet studded with hand-set sterling silver rivets. Rich patina develops over time.', price: 110, currency: 'USD', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'], tags: ['handcraft', 'woven', 'bracelet', 'leather'], material: 'Sterling Silver & Leather', style: 'Rugged', inStock: true, stockQuantity: 7, createdAt: '2025-06-20', updatedAt: '2025-11-05' },
  { id: 'p-15', title: 'Tassel Drop Earrings', slug: 'tassel-drop-earrings', description: 'Hammered silver discs with tiny hand-tied linen tassels in warm sand tones. Playful movement with artisan soul.', price: 55, currency: 'USD', images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'], tags: ['handcraft', 'textile', 'earrings'], material: 'Sterling Silver & Linen', style: 'Bohemian', inStock: true, stockQuantity: 24, createdAt: '2025-05-10', updatedAt: '2025-10-20' },

  // === The Everyday (minimal, everyday, daily) ===
  { id: 'p-16', title: 'Bar Studs', slug: 'bar-studs', description: 'Sleek silver bar studs — 12mm of clean, geometric elegance. Our most popular everyday earring.', price: 38, currency: 'USD', images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80'], tags: ['minimal', 'everyday', 'daily', 'earrings', 'studs'], material: 'Sterling Silver', style: 'Minimal', inStock: true, stockQuantity: 50, createdAt: '2025-01-10', updatedAt: '2025-11-01' },
  { id: 'p-17', title: 'Whisper Chain', slug: 'whisper-chain', description: 'An ultra-fine cable chain in 16" or 18". So delicate it almost disappears — but the quality is unmistakable.', price: 45, currency: 'USD', images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80'], tags: ['minimal', 'everyday', 'daily', 'necklace', 'chain'], material: 'Sterling Silver', style: 'Minimal', inStock: true, stockQuantity: 35, createdAt: '2025-02-01', updatedAt: '2025-10-15' },
  { id: 'p-18', title: 'Circle Stud Earrings', slug: 'circle-stud-earrings', description: 'Open circle studs in brushed matte silver. Geometric simplicity that works with everything.', price: 42, currency: 'USD', images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80'], tags: ['minimal', 'everyday', 'daily', 'earrings', 'studs'], material: 'Sterling Silver', style: 'Minimal', inStock: true, stockQuantity: 40, createdAt: '2025-01-20', updatedAt: '2025-09-10' },
  { id: 'p-19', title: 'Slim Band Ring', slug: 'slim-band-ring', description: 'A 2mm band ring in high polish. Stackable, comfortable, goes-with-everything essential.', price: 35, currency: 'USD', images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'], tags: ['minimal', 'everyday', 'daily', 'ring'], material: 'Sterling Silver', style: 'Minimal', inStock: true, stockQuantity: 45, createdAt: '2025-03-05', updatedAt: '2025-11-20' },

  // === Limited Editions (limited, special, seasonal) ===
  { id: 'p-20', title: 'Reticulated Cuff — Edition of 30', slug: 'reticulated-cuff-edition', description: 'A cuff bracelet with a reticulated surface — created by controlled melting that produces one-of-a-kind organic textures. Each piece is unique.', price: 285, currency: 'USD', images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80'], tags: ['limited', 'special', 'bracelet', 'cuff'], material: 'Sterling Silver', style: 'Avant-Garde', inStock: true, stockQuantity: 4, createdAt: '2025-11-01', updatedAt: '2025-12-01' },
  { id: 'p-21', title: 'Botanical Imprint Pendant', slug: 'botanical-imprint-pendant', description: 'Real fern leaves pressed into silver clay before kiln firing. Nature preserved in metal — edition of 25.', price: 195, currency: 'USD', images: ['https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80'], tags: ['limited', 'special', 'seasonal', 'pendant', 'necklace'], material: 'Fine Silver', style: 'Organic', inStock: true, stockQuantity: 6, createdAt: '2025-10-15', updatedAt: '2025-11-28' },
  { id: 'p-22', title: 'Porcelain & Silver Drops', slug: 'porcelain-silver-drops', description: 'Glazed porcelain beads in ocean blue set in hand-formed silver bezels. A collaboration with ceramicist Yuki Tanaka.', price: 148, currency: 'USD', images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'], tags: ['limited', 'special', 'earrings', 'collaboration'], material: 'Sterling Silver & Porcelain', style: 'Contemporary', inStock: true, stockQuantity: 10, createdAt: '2025-09-20', updatedAt: '2025-11-15' },
  { id: 'p-23', title: 'Solstice Ring — Winter 2025', slug: 'solstice-ring-winter', description: 'A wide band with a garnet cabochon set flush into the surface. Inspired by the warmth we seek in winter\'s darkest days. Edition of 20.', price: 225, currency: 'USD', images: ['https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80'], tags: ['limited', 'seasonal', 'ring', 'gemstone'], material: 'Sterling Silver & Garnet', style: 'Statement', inStock: true, stockQuantity: 3, createdAt: '2025-11-15', updatedAt: '2025-12-01' },
];

// Simulated network delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ============================================================
// Zenvix API Interface — replace these function bodies with
// real fetch() calls to your Zenvix Retail Module endpoints.
// ============================================================

export async function fetchAllProducts(): Promise<Product[]> {
  await delay(300);
  return MOCK_PRODUCTS;
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  await delay(200);
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  await delay(250);
  return MOCK_PRODUCTS.filter((p) => ids.includes(p.id));
}

export async function fetchProductsByTags(tags: string[]): Promise<Product[]> {
  await delay(250);
  return MOCK_PRODUCTS.filter((p) => p.tags.some((t) => tags.includes(t)));
}

/** Re-verify prices before checkout (Zenvix safety check) */
export async function verifyCartPrices(
  items: { productId: string; expectedPrice: number }[]
): Promise<{ valid: boolean; updates: { productId: string; currentPrice: number }[] }> {
  await delay(300);
  const updates: { productId: string; currentPrice: number }[] = [];
  for (const item of items) {
    const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
    if (product && product.price !== item.expectedPrice) {
      updates.push({ productId: product.id, currentPrice: product.price });
    }
  }
  return { valid: updates.length === 0, updates };
}

/** Simulate Zenvix checkout redirect URL generation */
export async function createCheckoutSession(
  items: { productId: string; quantity: number }[]
): Promise<{ checkoutUrl: string }> {
  await delay(400);
  // In production, this would return a real Zenvix hosted checkout URL
  const itemParams = items.map((i) => `${i.productId}x${i.quantity}`).join(',');
  return {
    checkoutUrl: `https://checkout.zenvix.com/session?items=${itemParams}`,
  };
}
