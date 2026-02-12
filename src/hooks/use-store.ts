import { useQuery } from '@tanstack/react-query';
import { fetchAllProducts, fetchProductById, fetchProductsByTags } from '@/api/zenvix-api';
import { storyChapters } from '@/config/store-config';
import { Product, StoryChapter } from '@/types';

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
