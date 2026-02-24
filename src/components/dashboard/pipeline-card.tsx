"use client";

import Link from "next/link";
import { ArrowRight, Smartphone } from "lucide-react";
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

const hoverCta: Record<string, string> = {
  tech: "Einrichten",
  proc: "Bestellen",
  recv: "Empfangen",
};

export function PipelineCard({ order, tab }: { order: PipelineOrder; tab?: string }) {
  const href = tab
    ? `/orders/${order.id}?tab=${tab}`
    : `/orders/${order.id}`;
  const cta = tab ? hoverCta[tab] : undefined;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border/50 bg-card p-3.5 shadow-sm transition-all duration-200 hover:border-border hover:shadow-elevated hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
        <StockLight availability={order.availability} size="sm" />
      </div>
      <p className="mt-1.5 truncate text-sm font-medium text-foreground/80">
        {order.orderedFor}
      </p>

      {/* Metadata chips */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          KS {order.costCenter}
        </span>
        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {order.itemCount} Pos.
        </span>
        {order.mobilfunkCount > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <Smartphone className="h-2.5 w-2.5" />
            {order.mobilfunkCount}
          </span>
        )}
      </div>

      {/* Timestamp + CTA */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <span className={cta ? "group-hover:hidden" : ""}>
          {formatRelative(order.createdAt)}
        </span>
        {cta && (
          <span className="hidden items-center gap-1 font-medium text-primary group-hover:inline-flex">
            {cta}
            <ArrowRight className="h-3 w-3" />
          </span>
        )}
        {!cta && <span />}
      </div>
    </Link>
  );
}
