import { useEffect } from "react";
import { OrderRecord, OrderStage } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { setTrackerPageActive } from "@/api/zenvix-notification-poller";

interface OrderTrackerProps {
  order: OrderRecord;
}

const STAGES: OrderStage[] = [
  "Order_Submitted",
  "Quotation_Pending",
  "Quotation_Sent",
  "Payment_Pending",
  "Payment_Confirmed",
  "Complete",
];

const STAGE_LABELS: Record<OrderStage, string> = {
  Order_Submitted: "Order Submitted",
  Quotation_Pending: "Quotation Pending",
  Quotation_Sent: "Quotation Sent",
  Payment_Pending: "Payment Pending",
  Payment_Confirmed: "Payment Confirmed",
  Complete: "Complete",
};

function getContextualMessage(order: OrderRecord): string {
  switch (order.stage) {
    case "Order_Submitted":
      return "Your order has been submitted successfully.";
    case "Quotation_Pending":
      return "Our office is reviewing your order and will provide a quotation shortly.";
    case "Quotation_Sent":
      return "A quotation has been sent. Please review the delivery costs.";
    case "Payment_Pending":
      return `Please complete payment of $${order.quotedTotal?.toFixed(2)}. Delivery cost: $${order.quotedDeliveryCost?.toFixed(2)}`;
    case "Payment_Confirmed":
      return "Payment confirmed! Your order is being processed.";
    case "Complete":
      return `Order complete! Paid $${order.paidAmount?.toFixed(2)}. Reference: #${order.id}`;
  }
}

function getStageStatus(
  stage: OrderStage,
  currentStage: OrderStage
): "completed" | "active" | "pending" {
  const currentIndex = STAGES.indexOf(currentStage);
  const stageIndex = STAGES.indexOf(stage);

  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "active";
  return "pending";
}

function getProgressValue(currentStage: OrderStage): number {
  const currentIndex = STAGES.indexOf(currentStage);
  // Progress is based on completed stages (current stage counts as in-progress)
  return Math.round((currentIndex / (STAGES.length - 1)) * 100);
}

export function OrderTracker({ order }: OrderTrackerProps) {
  useEffect(() => {
    setTrackerPageActive(true);
    return () => {
      setTrackerPageActive(false);
    };
  }, []);

  const progressValue = getProgressValue(order.stage);

  return (
    <div className="space-y-6">
      {/* Stage Progress Card */}
      <Card className="rounded-[2.5rem] border-black/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider text-lg">
            Order Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <Progress value={progressValue} className="h-2 rounded-full" />

          {/* Stage Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAGES.map((stage) => {
              const status = getStageStatus(stage, order.stage);
              return (
                <div
                  key={stage}
                  className="flex items-center gap-2"
                >
                  {status === "completed" && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                  )}
                  {status === "active" && (
                    <Circle className="h-4 w-4 shrink-0 text-primary animate-pulse" />
                  )}
                  {status === "pending" && (
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Badge
                    variant={
                      status === "completed"
                        ? "default"
                        : status === "active"
                          ? "default"
                          : "secondary"
                    }
                    className={
                      status === "completed"
                        ? "bg-green-600 text-white text-[10px] uppercase tracking-wider font-display"
                        : status === "active"
                          ? "bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-display animate-pulse"
                          : "bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-display"
                    }
                  >
                    {STAGE_LABELS[stage]}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Contextual Message */}
          <div className="rounded-[1.5rem] bg-black/[0.03] border border-black/5 p-4">
            <p className="text-sm font-medium text-foreground">
              {getContextualMessage(order)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Card */}
      <Card className="rounded-[2.5rem] border-black/5">
        <CardHeader>
          <CardTitle className="font-display uppercase tracking-wider text-lg">
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items List */}
          <div>
            <h4 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-3">
              Items
            </h4>
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productId}-${index}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between border-t border-black/5 pt-4">
            <span className="font-display uppercase tracking-wider text-xs text-muted-foreground">
              Subtotal
            </span>
            <span className="text-lg font-black">${order.subtotal.toFixed(2)}</span>
          </div>

          {/* Quoted Delivery Cost (if available) */}
          {order.quotedDeliveryCost != null && (
            <div className="flex items-center justify-between">
              <span className="font-display uppercase tracking-wider text-xs text-muted-foreground">
                Delivery Cost
              </span>
              <span className="text-sm font-semibold">
                ${order.quotedDeliveryCost.toFixed(2)}
              </span>
            </div>
          )}

          {/* Quoted Total (if available) */}
          {order.quotedTotal != null && (
            <div className="flex items-center justify-between border-t border-black/5 pt-4">
              <span className="font-display uppercase tracking-wider text-xs text-muted-foreground">
                Total
              </span>
              <span className="text-lg font-black">${order.quotedTotal.toFixed(2)}</span>
            </div>
          )}

          {/* Shipping Address */}
          <div className="border-t border-black/5 pt-4">
            <h4 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2">
              Shipping Address
            </h4>
            <p className="text-sm text-foreground">{order.shippingAddress}</p>
          </div>

          {/* Contact Info */}
          <div className="border-t border-black/5 pt-4">
            <h4 className="font-display uppercase tracking-wider text-xs text-muted-foreground mb-2">
              Contact
            </h4>
            <div className="space-y-1 text-sm text-foreground">
              <p>{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
