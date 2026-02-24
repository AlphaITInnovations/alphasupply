"use client";

import { Separator } from "@/components/ui/separator";
import { OrderHeader } from "./order-header";
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
  return (
    <div className="space-y-6">
      {/* Header: Order number, status, progress, info grid, technician */}
      <OrderHeader order={order} />

      <Separator />

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
