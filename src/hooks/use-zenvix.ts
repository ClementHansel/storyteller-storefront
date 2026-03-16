import { useQuery } from '@tanstack/react-query';
import type { Product, StoryChapter } from '@/types';
import type {
  ZenvixCategory,
  ZenvixPromotion,
  ZenvixInventoryStatus,
} from '@/types/zenvix';
import { storyChapters } from '@/config/store-config';
import { isZenvixConfigured, getZenvixConfig } from '@/api/zenvix-config';
import {
  fetchAllProducts,
  fetchProductById,
  fetchProductsByTags,
  fetchProductsByIds,
} from '@/api/zenvix-api';
import {
  fetchCatalogCategories,
  fetchCatalogPromotions,
  fetchInventoryStatus,
} from '@/api/zenvix-client';

// ── Products ──────────────────────────────────────────────────

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchAllProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery<Product | undefined>({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useProductsByIds(ids: string[]) {
  return useQuery<Product[]>({
    queryKey: ['products', 'byIds', ids],
    queryFn: () => fetchProductsByIds(ids),
    staleTime: 5 * 60 * 1000,
    enabled: ids.length > 0,
  });
}

export function useProductsByTags(tags: string[]) {
  return useQuery<Product[]>({
    queryKey: ['products', 'byTags', tags],
    queryFn: () => fetchProductsByTags(tags),
    staleTime: 5 * 60 * 1000,
    enabled: tags.length > 0,
  });
}

// ── Chapters (local) ─────────────────────────────────────────

export function useChapters() {
  return useQuery<StoryChapter[]>({
    queryKey: ['chapters'],
    queryFn: async () => storyChapters.sort((a, b) => a.narrativeOrder - b.narrativeOrder),
    staleTime: Infinity,
  });
}

export function useChapter(slug: string) {
  return useQuery<StoryChapter | undefined>({
    queryKey: ['chapter', slug],
    queryFn: async () => storyChapters.find((ch) => ch.slug === slug),
    staleTime: Infinity,
    enabled: !!slug,
  });
}

export function useChapterProducts(chapter: StoryChapter | undefined) {
  const tags = chapter?.productTags ?? [];
  return useQuery<Product[]>({
    queryKey: ['chapterProducts', chapter?.id],
    queryFn: () => fetchProductsByTags(tags),
    staleTime: 5 * 60 * 1000,
    enabled: !!chapter,
  });
}

// ── Categories ───────────────────────────────────────────────

export function useCategories() {
  return useQuery<ZenvixCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!isZenvixConfigured()) return [];
      const res = await fetchCatalogCategories(getZenvixConfig());
      return res.categories;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Promotions ────────────────────────────────────────────────

export function usePromotions() {
  return useQuery<ZenvixPromotion[]>({
    queryKey: ['promotions'],
    queryFn: async () => {
      if (!isZenvixConfigured()) return [];
      const res = await fetchCatalogPromotions(getZenvixConfig());
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Inventory ─────────────────────────────────────────────────

export function useInventory(productIds?: string[]) {
  return useQuery<ZenvixInventoryStatus[]>({
    queryKey: ['inventory', productIds],
    queryFn: async () => {
      if (!isZenvixConfigured()) return [];
      const res = await fetchInventoryStatus(getZenvixConfig(), productIds);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: isZenvixConfigured(),
  });
}

// ── Connection status ─────────────────────────────────────────

export function useZenvixStatus() {
  return {
    isConfigured: isZenvixConfigured(),
    config: getZenvixConfig(),
  };
}
