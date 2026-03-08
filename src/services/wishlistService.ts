// ============================================================
// Zenvix Wishlist Service (requires Bearer token)
// ============================================================

import zenvixClient from '@/lib/zenvixClient';

export interface WishlistItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  price: string;
  addedAt: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}

export async function getWishlist(): Promise<WishlistResponse> {
  const { data } = await zenvixClient.get<WishlistResponse>('/wishlist');
  return data;
}

export async function addToWishlist(productId: string): Promise<WishlistResponse> {
  const { data } = await zenvixClient.post<WishlistResponse>('/wishlist/items', { productId });
  return data;
}

export async function removeWishlistItem(itemId: string): Promise<WishlistResponse> {
  const safeId = encodeURIComponent(itemId);
  const { data } = await zenvixClient.delete<WishlistResponse>(`/wishlist/items/${safeId}`);
  return data;
}
