import type { WhatsAppMessage, WhatsAppConnectorResult } from "@/types/order";
import { getWhatsAppOfficePhone } from "@/config/runtime-env";

/**
 * Maximum length for the encoded WhatsApp message text parameter.
 * If the encoded message exceeds this, truncation is applied.
 */
const MAX_MESSAGE_LENGTH = 1000;

/**
 * Composes a structured WhatsApp message from order data.
 *
 * The message includes section headers for customer info, shipping address,
 * items, subtotal, and order reference. If the encoded message exceeds
 * 1000 characters, item details are replaced with a summary while
 * preserving the order reference ID and subtotal.
 */
export function composeWhatsAppMessage(data: WhatsAppMessage): string {
  const fullMessage = buildFullMessage(data);

  if (encodeURIComponent(fullMessage).length <= MAX_MESSAGE_LENGTH) {
    return fullMessage;
  }

  // Truncation: replace item details with summary
  return buildTruncatedMessage(data);
}

function buildFullMessage(data: WhatsAppMessage): string {
  const itemLines = data.items
    .map((item) => `• ${item.title} × ${item.quantity} — $${formatPrice(item.unitPrice)}`)
    .join("\n");

  return [
    `🛒 *New Order — #${data.orderId}*`,
    "",
    `👤 *Customer*`,
    `Name: ${data.customerName}`,
    `Phone: ${data.customerPhone}`,
    `Email: ${data.customerEmail}`,
    "",
    `📍 *Shipping Address*`,
    data.shippingAddress,
    "",
    `📦 *Items*`,
    itemLines,
    "",
    `💰 *Subtotal: $${formatPrice(data.subtotal)}*`,
    "",
    `📋 Please provide a quotation including delivery costs.`,
  ].join("\n");
}

function buildTruncatedMessage(data: WhatsAppMessage): string {
  return [
    `🛒 *New Order — #${data.orderId}*`,
    "",
    `👤 *Customer*`,
    `Name: ${data.customerName}`,
    `Phone: ${data.customerPhone}`,
    `Email: ${data.customerEmail}`,
    "",
    `📍 *Shipping Address*`,
    data.shippingAddress,
    "",
    `📦 *Items*`,
    `(${data.items.length} items — see order #${data.orderId})`,
    "",
    `💰 *Subtotal: $${formatPrice(data.subtotal)}*`,
    "",
    `📋 Please provide a quotation including delivery costs.`,
  ].join("\n");
}

function formatPrice(value: number): string {
  return value.toFixed(2);
}

/**
 * Builds a WhatsApp deep link URL using the wa.me scheme.
 *
 * @param message - The pre-composed message text (will be URL-encoded)
 * @param officePhone - The office phone number (digits only, e.g. "6281234567890")
 * @returns The full wa.me URL with encoded message text parameter
 */
export function buildWhatsAppUrl(message: string, officePhone: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${officePhone}?text=${encodedMessage}`;
}

/**
 * Composes an order message, builds the WhatsApp URL, and opens it in a new tab.
 *
 * @param data - The order data to compose into a WhatsApp message
 * @param officePhone - Optional office phone override; defaults to VITE_WHATSAPP_OFFICE_PHONE env var
 * @returns WhatsAppConnectorResult with success status, URL, and truncation flag
 */
export function openWhatsAppCheckout(
  data: WhatsAppMessage,
  officePhone?: string
): WhatsAppConnectorResult {
  const phone = officePhone || getWhatsAppOfficePhone() || "";

  if (!phone) {
    console.warn("[WhatsApp] No office phone number configured (VITE_WHATSAPP_OFFICE_PHONE is empty)");
  }

  // Build the full (non-truncated) message to check original length
  const fullMessage = buildFullMessage(data);
  const truncated = encodeURIComponent(fullMessage).length > MAX_MESSAGE_LENGTH;

  // composeWhatsAppMessage handles truncation internally
  const message = composeWhatsAppMessage(data);
  const url = buildWhatsAppUrl(message, phone);

  window.open(url, "_blank");

  return {
    success: true,
    url,
    truncated,
  };
}
