export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTechOrderById } from "@/queries/techniker";
import { orderStatusLabels, orderStatusColors, deliveryMethodLabels } from "@/types/orders";
import { TechOrderForm } from "@/components/techniker/tech-order-form";

export default async function TechnikerDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getTechOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/techniker">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-mono">{order.orderNumber}</h1>
            <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${orderStatusColors[order.computedStatus]}`}>
              {orderStatusLabels[order.computedStatus]}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {deliveryMethodLabels[order.deliveryMethod]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Empfänger: {order.orderedFor} &middot; KSt {order.costCenter}
          </p>
        </div>
      </div>

      <TechOrderForm order={order} />
    </div>
  );
}
