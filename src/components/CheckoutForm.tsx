import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";

import { checkoutFormSchema } from "@/lib/checkout-validation";
import { createOrder, transitionStage } from "@/lib/order-store";
import { openWhatsAppCheckout } from "@/lib/whatsapp-connector";
import { syncOrderCreation, processSyncQueue } from "@/api/zenvix-order-sync";
import { logAudit, createAuditEntry } from "@/api/zenvix-audit-logger";
import { startPolling } from "@/api/zenvix-notification-poller";
import type { CheckoutFormData } from "@/types/order";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface CheckoutFormProps {
  items: Array<{ productId: string; title: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  onOrderCreated?: (orderId: string) => void;
}

export function CheckoutForm({ items, subtotal, onOrderCreated }: CheckoutFormProps) {
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onChange",
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
    },
  });

  const { formState } = form;
  const isSubmitting = formState.isSubmitting;

  async function onSubmit(data: CheckoutFormData) {
    // 1. Create order
    const order = createOrder({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
      items,
      subtotal,
    });

    // 2. Sync order creation to Zenvix (non-blocking for the user flow)
    syncOrderCreation(order).then(() => {
      // Log audit entry for order creation
      logAudit(
        createAuditEntry('order.created', order.id, order.traceId, {
          id: data.customerEmail || 'anonymous',
          type: 'customer',
        })
      );

      // Process any deferred stage transitions now that sync may have completed
      processSyncQueue();

      // Start notification polling (idempotent if already started)
      startPolling();
    });

    // 3. Open WhatsApp checkout
    try {
      const result = openWhatsAppCheckout({
        orderId: order.id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        shippingAddress: data.shippingAddress,
        items: items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        subtotal,
      });

      if (!result.success) {
        throw new Error("WhatsApp link failed to open");
      }

      // 4. Transition to Quotation_Pending on success
      transitionStage(order.id, "Quotation_Pending");
      onOrderCreated?.(order.id);
    } catch {
      const officePhone = import.meta.env.VITE_WHATSAPP_OFFICE_PHONE || "";
      const phoneDisplay = officePhone
        ? `+${officePhone.slice(0, 2)} ${officePhone.slice(2)}`
        : "our office";

      toast.error("Unable to open WhatsApp", {
        description: `Please contact us directly at ${phoneDisplay}`,
        duration: 8000,
      });
    }
  }

  return (
    <Card className="rounded-[2.5rem] border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl font-bold tracking-tight">
          Checkout
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* WhatsApp flow explanation */}
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-primary/5 p-4">
          <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your order details will be sent to our office via WhatsApp. We'll provide a
            quotation including delivery costs.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+62 812 3456 7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full shipping address including city and postal code"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full font-bold"
              disabled={!formState.isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Confirm & Send via WhatsApp
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
