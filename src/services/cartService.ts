// ============================================================
// Zenvix Cart Service (requires Bearer token)
// ============================================================

import zenvixClient from "@/lib/zenvixClient";
import Decimal from "decimal.js";

export interface CartItemRaw {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface CartItemNormalized {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  price: Decimal;
  quantity: number;
  subtotal: Decimal;
  priceDisplay: string;
  subtotalDisplay: string;
}

export interface CartResponse {
  items: CartItemRaw[];
  total: string;
  currency: string;
  itemCount: number;
}

export interface CartNormalized {
  items: CartItemNormalized[];
  total: Decimal;
  totalDisplay: string;
  currency: string;
  itemCount: number;
}

function normalizeCartItem(item: CartItemRaw): CartItemNormalized {
  const price = new Decimal(item.price || "0");
  const subtotal = new Decimal(item.subtotal || "0");
  return {
    ...item,
    price,
    subtotal,
    priceDisplay: `$${price.toFixed(2)}`,
    subtotalDisplay: `$${subtotal.toFixed(2)}`,
  };
}

function normalizeCart(data: CartResponse): CartNormalized {
  const total = new Decimal(data.total || "0");
  return {
    items: data.items.map(normalizeCartItem),
    total,
    totalDisplay: `$${total.toFixed(2)}`,
    currency: data.currency,
    itemCount: data.itemCount,
  };
}

export async function getCart(): Promise<CartNormalized> {
  const { data } = await zenvixClient.get<CartResponse>("cart");
  return normalizeCart(data);
}

export async function addToCart(
  productId: string,
  quantity: number = 1,
): Promise<CartNormalized> {
  const { data } = await zenvixClient.post<CartResponse>("cart/items", {
    productId,
    quantity,
  });
  return normalizeCart(data);
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<CartNormalized> {
  const safeId = encodeURIComponent(itemId);
  const { data } = await zenvixClient.patch<CartResponse>(
    `cart/items/${safeId}`,
    { quantity },
  );
  return normalizeCart(data);
}

export async function removeCartItem(itemId: string): Promise<CartNormalized> {
  const safeId = encodeURIComponent(itemId);
  const { data } = await zenvixClient.delete<CartResponse>(
    `cart/items/${safeId}`,
  );
  return normalizeCart(data);
}
