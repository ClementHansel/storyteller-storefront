import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, Wallet, Building2 } from "lucide-react";
import { checkout, type CheckoutPayload } from "@/services/orderService";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, "Full name is required"),
  customerEmail: z.string().trim().email("Please enter a valid email"),
  customerPhone: z.string().trim().min(5, "Phone number is required"),
  shippingAddress: z.string().trim().min(10, "Please enter a complete shipping address"),
  paymentMethod: z.enum(["card", "bank_transfer", "e_wallet"]),
});

const PAYMENT_METHODS = [
  { value: "card", label: "Credit / Debit Card", icon: CreditCard, description: "Visa, Mastercard, AMEX" },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2, description: "BCA, Mandiri, BNI" },
  { value: "e_wallet", label: "E-Wallet", icon: Wallet, description: "GoPay, OVO, DANA" },
];

const CheckoutPage = () => {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: user?.phone || "",
    shippingAddress: "",
    paymentMethod: "card",
  });

  useDocumentTitle("Checkout — Bambu Silver");

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (items.length === 0) return <Navigate to="/cart" replace />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: CheckoutPayload = {
        customerName: result.data.customerName,
        customerEmail: result.data.customerEmail,
        customerPhone: result.data.customerPhone,
        shippingAddress: result.data.shippingAddress,
        paymentMethod: result.data.paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          price: String(i.product.price),
        })),
      };
      const order = await checkout(payload);
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
      } else {
        clearCart();
        toast.success(`Order placed successfully! Order #${order.orderId}`, { duration: 6000 });
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err?.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container min-h-screen pt-32 md:pt-40 pb-20">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 hover:text-primary transition-all mb-10"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Bag
        </Link>

        <h1 className="mb-12 font-display text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-none">
          SECURE <span className="text-primary italic">CHECKOUT.</span>
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
            {/* Left — Form */}
            <div className="space-y-10">
              {/* Contact */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 mb-6">Contact Information</h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                    <Input id="customerName" name="customerName" value={form.customerName} onChange={handleChange} className="rounded-xl h-12" placeholder="Your full name" />
                    {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="customerPhone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</Label>
                    <Input id="customerPhone" name="customerPhone" value={form.customerPhone} onChange={handleChange} className="rounded-xl h-12" placeholder="+62 XXX XXXX XXXX" />
                    {errors.customerPhone && <p className="text-xs text-destructive">{errors.customerPhone}</p>}
                  </div>
                </div>
                <div className="space-y-1.5 mt-5">
                  <Label htmlFor="customerEmail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input id="customerEmail" name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} className="rounded-xl h-12" placeholder="your@email.com" />
                  {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail}</p>}
                </div>
              </div>

              {/* Shipping */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 mb-6">Shipping Address</h2>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingAddress" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Address</Label>
                  <Textarea id="shippingAddress" name="shippingAddress" value={form.shippingAddress} onChange={handleChange} className="rounded-xl min-h-[120px]" placeholder="Street address, city, state, postal code, country" />
                  {errors.shippingAddress && <p className="text-xs text-destructive">{errors.shippingAddress}</p>}
                </div>
              </div>

              {/* Payment */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 mb-6">Payment Method</h2>
                <RadioGroup value={form.paymentMethod} onValueChange={(v) => setForm((p) => ({ ...p, paymentMethod: v }))}>
                  <div className="grid gap-4">
                    {PAYMENT_METHODS.map((pm) => (
                      <label
                        key={pm.value}
                        className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${form.paymentMethod === pm.value ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/30"}`}
                      >
                        <RadioGroupItem value={pm.value} />
                        <pm.icon className="h-5 w-5 text-foreground/60 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-wider text-foreground">{pm.label}</p>
                          <p className="text-xs text-muted-foreground">{pm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
                {errors.paymentMethod && <p className="text-xs text-destructive mt-2">{errors.paymentMethod}</p>}
              </div>
            </div>

            {/* Right — Order Summary */}
            <aside className="lg:sticky lg:top-32 h-fit">
              <div className="rounded-[2.5rem] border border-border bg-muted/20 p-8 md:p-10 space-y-6 shadow-2xl">
                <h2 className="font-display text-xl font-black text-foreground uppercase tracking-tighter">
                  Order Summary
                </h2>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-4 items-center">
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground truncate">{item.product.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-foreground whitespace-nowrap">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-foreground/40">Subtotal ({itemCount})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                    <span className="text-foreground/40">Shipping</span>
                    <span className="text-primary italic">FREE</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex justify-between items-end">
                  <span className="text-xs font-black text-foreground/40 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-foreground">${subtotal.toFixed(2)}</span>
                </div>

                <Button
                  type="submit"
                  className="w-full h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-xl"
                  size="lg"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Place Order — ${subtotal.toFixed(2)}
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-foreground/30 font-black uppercase tracking-widest">
                  Secure payment powered by Zenvix
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
