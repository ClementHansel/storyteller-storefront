// ============================================================
// Zenvix Order Service (requires Bearer token)
// ============================================================

import zenvixClient from '@/lib/zenvixClient';
import Decimal from 'decimal.js';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: string;
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  paymentMethod: string;
}

export interface OrderResponse {
  orderId: string;
  status: string;
  total: string;
  currency: string;
  createdAt: string;
  paymentUrl?: string;
}

export interface OrderNormalized extends Omit<OrderResponse, 'total'> {
  total: Decimal;
  totalDisplay: string;
}

export async function checkout(payload: CheckoutPayload): Promise<OrderNormalized> {
  const { data } = await zenvixClient.post<OrderResponse>('/orders', payload);
  const total = new Decimal(data.total || '0');
  return {
    ...data,
    total,
    totalDisplay: `$${total.toFixed(2)}`,
  };
}
