// ============================================================
// Store hooks — wired to Zenvix services with mock fallback
// ============================================================

import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  getCategories,
  CatalogProductNormalized,
  CatalogCategory,
} from "@/services/catalogService";
import { storyChapters } from "@/config/store-config";
import { Product, StoryChapter } from "@/types";
import { ZenvixApiError } from "@/lib/zenvixClient";

// ---- Mock fallback data ----
const MOCK_PRODUCTS: Product[] = [
  {
    id: "p-01",
    title: "Flame-Forged Cuff",
    slug: "flame-forged-cuff",
    description:
      "A bold cuff bracelet hand-forged over open flame, showcasing raw hammer marks and organic curves.",
    price: 189,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    ],
    tags: ["handmade", "artisan", "bracelet", "cuff"],
    material: "Sterling Silver",
    style: "Rustic",
    inStock: true,
    stockQuantity: 8,
    createdAt: "2025-09-01",
    updatedAt: "2025-12-01",
  },
  {
    id: "p-02",
    title: "Artisan Twist Bangle",
    slug: "artisan-twist-bangle",
    description:
      "Three strands of silver wire twisted by hand into a seamless bangle.",
    price: 145,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
    ],
    tags: ["handmade", "artisan", "bangle"],
    material: "Sterling Silver",
    style: "Artisan",
    inStock: true,
    stockQuantity: 12,
    createdAt: "2025-08-15",
    updatedAt: "2025-11-20",
  },
  {
    id: "p-03",
    title: "Hammered Disc Earrings",
    slug: "hammered-disc-earrings",
    description: "Hand-hammered silver discs with a textured matte finish.",
    price: 68,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    ],
    tags: ["handmade", "artisan", "earrings"],
    material: "Sterling Silver",
    style: "Rustic",
    inStock: true,
    stockQuantity: 20,
    createdAt: "2025-07-10",
    updatedAt: "2025-11-15",
  },
  {
    id: "p-04",
    title: "Solace Pendant",
    slug: "solace-pendant",
    description:
      "A teardrop pendant in high-polish silver with a moonstone accent.",
    price: 135,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80",
    ],
    tags: ["signature", "silver", "pendant", "necklace"],
    material: "Sterling Silver & Moonstone",
    style: "Elegant",
    inStock: true,
    stockQuantity: 15,
    createdAt: "2025-06-01",
    updatedAt: "2025-12-01",
  },
  {
    id: "p-05",
    title: "Ember Chain Necklace",
    slug: "ember-chain-necklace",
    description:
      "A delicate chain with subtly hammered links that glow with warm reflected light.",
    price: 95,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    ],
    tags: ["signature", "silver", "necklace", "chain"],
    material: "Sterling Silver",
    style: "Minimal",
    inStock: true,
    stockQuantity: 25,
    createdAt: "2025-05-20",
    updatedAt: "2025-11-10",
  },
  {
    id: "p-06",
    title: "Meridian Hoops",
    slug: "meridian-hoops",
    description: "Medium-sized hoops with a half-polish, half-matte finish.",
    price: 78,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
    ],
    tags: ["signature", "silver", "earrings", "hoops"],
    material: "Sterling Silver",
    style: "Contemporary",
    inStock: true,
    stockQuantity: 18,
    createdAt: "2025-04-15",
    updatedAt: "2025-10-05",
  },
  {
    id: "p-07",
    title: "Anchor Bracelet",
    slug: "anchor-bracelet",
    description:
      "A substantial chain bracelet with an anchor-shaped toggle clasp.",
    price: 155,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    ],
    tags: ["signature", "silver", "bracelet"],
    material: "Sterling Silver",
    style: "Bold",
    inStock: true,
    stockQuantity: 10,
    createdAt: "2025-03-01",
    updatedAt: "2025-09-20",
  },
  {
    id: "p-08",
    title: "Viking Band",
    slug: "viking-band",
    description: "A wide, weighty band inspired by Norse arm rings.",
    price: 125,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    ],
    tags: ["ring", "heritage", "band"],
    material: "Sterling Silver",
    style: "Bold",
    inStock: true,
    stockQuantity: 14,
    createdAt: "2025-06-10",
    updatedAt: "2025-11-30",
  },
  {
    id: "p-09",
    title: "Classic Signet Ring",
    slug: "classic-signet-ring",
    description: "A reimagined signet ring with a flat oval face.",
    price: 165,
    compareAtPrice: 195,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80",
    ],
    tags: ["ring", "heritage", "signet"],
    material: "Sterling Silver",
    style: "Classic",
    inStock: true,
    stockQuantity: 9,
    createdAt: "2025-05-05",
    updatedAt: "2025-10-15",
  },
  {
    id: "p-10",
    title: "Stacker Trio",
    slug: "stacker-trio",
    description: "Three slim rings designed to be worn together.",
    price: 98,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    ],
    tags: ["ring", "heritage", "stacker", "minimal"],
    material: "Sterling Silver",
    style: "Minimal",
    inStock: true,
    stockQuantity: 22,
    createdAt: "2025-07-20",
    updatedAt: "2025-11-25",
  },
  {
    id: "p-11",
    title: "Posy Ring - Always",
    slug: "posy-ring-always",
    description: 'A slim band with "Always" hand-engraved on the interior.',
    price: 85,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80",
    ],
    tags: ["ring", "heritage", "engraved"],
    material: "Sterling Silver",
    style: "Romantic",
    inStock: true,
    stockQuantity: 30,
    createdAt: "2025-08-01",
    updatedAt: "2025-12-01",
  },
  {
    id: "p-12",
    title: "Linen & Silver Wrap",
    slug: "linen-silver-wrap",
    description:
      "Waxed Belgian linen cord woven with sterling silver tube beads.",
    price: 72,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80",
    ],
    tags: ["handcraft", "woven", "textile", "bracelet"],
    material: "Sterling Silver & Linen",
    style: "Bohemian",
    inStock: true,
    stockQuantity: 16,
    createdAt: "2025-04-01",
    updatedAt: "2025-10-10",
  },
  {
    id: "p-13",
    title: "Braided Silk Pendant",
    slug: "braided-silk-pendant",
    description:
      "A hand-braided silk cord carrying a sterling silver leaf charm.",
    price: 58,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80",
    ],
    tags: ["handcraft", "woven", "textile", "pendant", "necklace"],
    material: "Sterling Silver & Silk",
    style: "Bohemian",
    inStock: true,
    stockQuantity: 20,
    createdAt: "2025-03-15",
    updatedAt: "2025-09-01",
  },
  {
    id: "p-14",
    title: "Leather Cuff with Silver Rivets",
    slug: "leather-cuff-silver-rivets",
    description:
      "Vegetable-tanned leather cuff with hand-set sterling silver rivets.",
    price: 110,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80",
    ],
    tags: ["handcraft", "woven", "bracelet", "leather"],
    material: "Sterling Silver & Leather",
    style: "Rugged",
    inStock: true,
    stockQuantity: 7,
    createdAt: "2025-06-20",
    updatedAt: "2025-11-05",
  },
  {
    id: "p-15",
    title: "Tassel Drop Earrings",
    slug: "tassel-drop-earrings",
    description: "Hammered silver discs with tiny hand-tied linen tassels.",
    price: 55,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    ],
    tags: ["handcraft", "textile", "earrings"],
    material: "Sterling Silver & Linen",
    style: "Bohemian",
    inStock: true,
    stockQuantity: 24,
    createdAt: "2025-05-10",
    updatedAt: "2025-10-20",
  },
  {
    id: "p-16",
    title: "Bar Studs",
    slug: "bar-studs",
    description: "Sleek silver bar studs for everyday wear.",
    price: 38,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
    ],
    tags: ["minimal", "everyday", "daily", "earrings", "studs"],
    material: "Sterling Silver",
    style: "Minimal",
    inStock: true,
    stockQuantity: 50,
    createdAt: "2025-01-10",
    updatedAt: "2025-11-01",
  },
  {
    id: "p-17",
    title: "Whisper Chain",
    slug: "whisper-chain",
    description: "An ultra-fine cable chain. So delicate it almost disappears.",
    price: 45,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    ],
    tags: ["minimal", "everyday", "daily", "necklace", "chain"],
    material: "Sterling Silver",
    style: "Minimal",
    inStock: true,
    stockQuantity: 35,
    createdAt: "2025-02-01",
    updatedAt: "2025-10-15",
  },
  {
    id: "p-18",
    title: "Circle Stud Earrings",
    slug: "circle-stud-earrings",
    description: "Open circle studs in brushed matte silver.",
    price: 42,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
    ],
    tags: ["minimal", "everyday", "daily", "earrings", "studs"],
    material: "Sterling Silver",
    style: "Minimal",
    inStock: true,
    stockQuantity: 40,
    createdAt: "2025-01-20",
    updatedAt: "2025-09-10",
  },
  {
    id: "p-19",
    title: "Slim Band Ring",
    slug: "slim-band-ring",
    description: "A 2mm band ring in high polish. Stackable essential.",
    price: 35,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    ],
    tags: ["minimal", "everyday", "daily", "ring"],
    material: "Sterling Silver",
    style: "Minimal",
    inStock: true,
    stockQuantity: 45,
    createdAt: "2025-03-05",
    updatedAt: "2025-11-20",
  },
  {
    id: "p-20",
    title: "Reticulated Cuff - Edition of 30",
    slug: "reticulated-cuff-edition",
    description:
      "A cuff with reticulated surface producing one-of-a-kind textures.",
    price: 285,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80",
    ],
    tags: ["limited", "special", "bracelet", "cuff"],
    material: "Sterling Silver",
    style: "Avant-Garde",
    inStock: true,
    stockQuantity: 4,
    createdAt: "2025-11-01",
    updatedAt: "2025-12-01",
  },
  {
    id: "p-21",
    title: "Botanical Imprint Pendant",
    slug: "botanical-imprint-pendant",
    description: "Real fern leaves pressed into silver clay. Edition of 25.",
    price: 195,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1515562141589-67f0d569b6c4?w=600&q=80",
    ],
    tags: ["limited", "special", "seasonal", "pendant", "necklace"],
    material: "Fine Silver",
    style: "Organic",
    inStock: true,
    stockQuantity: 6,
    createdAt: "2025-10-15",
    updatedAt: "2025-11-28",
  },
  {
    id: "p-22",
    title: "Porcelain & Silver Drops",
    slug: "porcelain-silver-drops",
    description: "Glazed porcelain beads set in hand-formed silver bezels.",
    price: 148,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    ],
    tags: ["limited", "special", "earrings", "collaboration"],
    material: "Sterling Silver & Porcelain",
    style: "Contemporary",
    inStock: true,
    stockQuantity: 10,
    createdAt: "2025-09-20",
    updatedAt: "2025-11-15",
  },
  {
    id: "p-23",
    title: "Solstice Ring - Winter 2025",
    slug: "solstice-ring-winter",
    description: "A wide band with a garnet cabochon. Edition of 20.",
    price: 225,
    currency: "USD",
    images: [
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80",
    ],
    tags: ["limited", "seasonal", "ring", "gemstone"],
    material: "Sterling Silver & Garnet",
    style: "Statement",
    inStock: true,
    stockQuantity: 3,
    createdAt: "2025-11-15",
    updatedAt: "2025-12-01",
  },
];

/** Map catalog service product to app Product type */
function mapCatalogProduct(cp: CatalogProductNormalized): Product {
  return {
    id: cp.id,
    title: cp.title,
    slug: cp.slug,
    description: cp.description,
    price: cp.price.toNumber(),
    compareAtPrice: cp.compareAtPrice?.toNumber(),
    currency: cp.currency,
    images: cp.images,
    tags: cp.tags,
    material: cp.material,
    style: cp.style,
    inStock: cp.inStock,
    stockQuantity: cp.stockQuantity,
    createdAt: cp.createdAt,
    updatedAt: cp.updatedAt,
  };
}

async function fetchProductsSafe(): Promise<Product[]> {
  try {
    const res = await getProducts({ pageSize: 10000 });
    return res.products.map(mapCatalogProduct);
  } catch (err) {
    if (err instanceof ZenvixApiError && err.status === 0) {
      // Network error — use mock data
      console.warn("[Catalog] Zenvix unreachable, using mock data");
      return MOCK_PRODUCTS;
    }
    // For other errors, still fallback but log
    console.warn("[Catalog] API error, using mock data:", err);
    return MOCK_PRODUCTS;
  }
}

async function fetchProductByIdSafe(id: string): Promise<Product | undefined> {
  // Look up from the full catalog (already cached by useProducts)
  // This avoids a per-product API call and handles slug-based lookups
  try {
    const allProducts = await fetchProductsSafe();
    const found = allProducts.find((p) => p.id === id || p.slug === id);
    if (found) return found;
  } catch {
    // If catalog fetch fails, fall through
  }
  // Fallback to mock data
  return MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id);
}

// ---- Hooks ----

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProductsSafe,
    staleTime: 10 * 60 * 1000, // 10 minutes — avoid refetching 10k+ products
    gcTime: 30 * 60 * 1000,    // Keep in cache for 30 minutes
  });
}

export function useProduct(id: string) {
  return useQuery<Product | undefined>({
    queryKey: ["product", id],
    queryFn: () => fetchProductByIdSafe(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery<CatalogCategory[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        return await getCategories();
      } catch {
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useChapters() {
  return useQuery<StoryChapter[]>({
    queryKey: ["chapters"],
    queryFn: async () =>
      storyChapters.sort((a, b) => a.narrativeOrder - b.narrativeOrder),
    staleTime: Infinity,
  });
}

export function useChapter(slug: string) {
  return useQuery<StoryChapter | undefined>({
    queryKey: ["chapter", slug],
    queryFn: async () => storyChapters.find((ch) => ch.slug === slug),
    staleTime: Infinity,
    enabled: !!slug,
  });
}

export function useChapterProducts(chapter: StoryChapter | undefined) {
  const tags = chapter?.productTags ?? [];
  const { data: allProducts } = useProducts();

  return useQuery<Product[]>({
    queryKey: ["chapterProducts", chapter?.id],
    queryFn: async () => {
      const products = allProducts ?? [];
      return products.filter((p) => p.tags.some((t) => tags.includes(t)));
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!chapter && !!allProducts,
  });
}
