"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import type { PipelineOrder } from "@/queries/inventory";
import { StockLight } from "@/components/orders/stock-light";

function formatRelative(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "gestern";
  return `vor ${days} Tagen`;
}

export function PipelineCard({ order }: { order: PipelineOrder }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="group block rounded-lg border border-border/50 bg-card p-3 transition-all hover:border-border hover:shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
        <StockLight availability={order.availability} size="sm" />
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {order.orderedFor}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>KS {order.costCenter}</span>
        <span>&middot;</span>
        <span>{order.itemCount} Pos.</span>
        {order.mobilfunkCount > 0 && <Smartphone className="h-3 w-3" />}
        <span className="ml-auto">{formatRelative(order.createdAt)}</span>
      </div>
    </Link>
  );
}
