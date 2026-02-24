export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderDetailFull } from "@/queries/orders";
import { orderStatusLabels, orderStatusColors, canCancelOrder } from "@/types/orders";
import { StockLight } from "@/components/orders/stock-light";
import { OrderStatusActions } from "@/components/orders/order-status-actions";
import { OrderTabs } from "@/components/orders/order-tabs";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetailFull(id);

  if (!order) {
    notFound();
  }

  const showCancel = canCancelOrder(order);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
            <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${orderStatusColors[order.computedStatus]}`}>
              {orderStatusLabels[order.computedStatus]}
            </span>
            <StockLight availability={order.stockAvailability} size="lg" showLabel />
          </div>
          <p className="ml-10 text-sm text-muted-foreground">
            {order.orderedFor} &middot; KSt {order.costCenter} &middot; Erstellt am {new Date(order.createdAt).toLocaleString("de-DE")}
          </p>
        </div>
        <OrderStatusActions orderId={order.id} currentStatus={order.computedStatus} canCancel={showCancel} />
      </div>

      {/* Tabs */}
      <OrderTabs order={order} />
    </div>
  );
}
