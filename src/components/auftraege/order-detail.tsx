"use client";

import { Separator } from "@/components/ui/separator";
import { OrderHeader } from "./order-header";
import { OrderProgress } from "./order-progress";
import { OrderPositions } from "./order-positions";
import { OrderProcurement } from "./order-procurement";
import { OrderShipping } from "./order-shipping";
import { OrderMobilfunk } from "./order-mobilfunk";
import { OrderNotes } from "./order-notes";
import type { getOrderDetailFull } from "@/queries/orders";

export type OrderDetailFull = NonNullable<
  Awaited<ReturnType<typeof getOrderDetailFull>>
>;

export function OrderDetail({ order }: { order: OrderDetailFull }) {
  const isTerminal = ["COMPLETED", "CANCELLED"].includes(order.computedStatus);

  return (
    <div className="space-y-6">
      {/* Header: Order number, status, info grid, technician */}
      <OrderHeader order={order} />

      <Separator />

      {/* Progress stepper */}
      {!isTerminal && <OrderProgress order={order} />}

      {/* Positions / Commissioning */}
      <OrderPositions order={order} />

      {/* Mobilfunk */}
      <OrderMobilfunk order={order} />

      {/* Procurement */}
      <OrderProcurement order={order} />

      {/* Shipping */}
      <OrderShipping order={order} />

      {/* Notes */}
      <OrderNotes notes={order.notes} />
    </div>
  );
}
