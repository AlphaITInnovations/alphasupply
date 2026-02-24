"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Package,
  PackageCheck,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderStatusLabels, orderStatusColors, mobilfunkTypeLabels } from "@/types/orders";
import { articleCategoryLabels } from "@/types/inventory";
import { ReceiveDialog } from "./receive-dialog";
import { ReceiveMobilfunkDialog } from "./receive-mobilfunk-dialog";

type PendingItem = {
  id: string;
  orderId: string;
  articleId: string | null;
  freeText: string | null;
  quantity: number;
  receivedQty: number;
  supplierId: string | null;
  supplierOrderNo: string | null;
  orderedAt: string | null;
  orderedBy: string | null;
  article: {
    id: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
  } | null;
  supplier: {
    id: string;
    name: string;
  } | null;
};

type PendingMobilfunk = {
  id: string;
  orderId: string;
  type: string;
  simType: string | null;
  tariff: string | null;
  phoneNote: string | null;
  simNote: string | null;
  ordered: boolean;
  received: boolean;
  providerOrderNo: string | null;
  orderedAt: string | null;
  orderedBy: string | null;
};

type PendingOrder = {
  id: string;
  orderNumber: string;
  status: string;
  orderedFor: string;
  costCenter: string;
  createdAt: string;
  pendingItems: PendingItem[];
  pendingMf: PendingMobilfunk[];
  totalPending: number;
  totalDone: number;
  totalItems: number;
};

const tierBadgeColors: Record<string, string> = {
  HIGH_TIER:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  MID_TIER:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  LOW_TIER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

export function PendingDeliveries({ orders }: { orders: PendingOrder[] }) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(
    new Set(orders.length > 0 ? [orders[0].id] : [])
  );

  function toggleOrder(id: string) {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-12 text-center shadow-sm">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <PackageCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">
            Keine ausstehenden Lieferungen
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Alle bestellten Artikel wurden bereits eingelagert.
          </p>
        </div>
      </div>
    );
  }

  const totalPending = orders.reduce((sum, o) => sum + o.totalPending, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{orders.length}</span>{" "}
          {orders.length === 1 ? "Auftrag" : "Auftraege"} mit offenen Lieferungen
        </span>
        <span>
          <span className="font-semibold text-foreground">{totalPending}</span>{" "}
          {totalPending === 1 ? "Position" : "Positionen"} ausstehend
        </span>
      </div>

      {orders.map((order) => {
        const isExpanded = expandedOrders.has(order.id);

        return (
          <div
            key={order.id}
            className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm"
          >
            {/* Order Header */}
            <button
              onClick={() => toggleOrder(order.id)}
              className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/30"
            >
              <div className="flex h-5 w-5 items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <div className="flex flex-1 items-center gap-3">
                <span className="font-mono text-xs font-semibold text-primary">
                  {order.orderNumber}
                </span>
                <span className="text-sm">{order.orderedFor}</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {order.costCenter}
                </Badge>
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                    orderStatusColors[order.status] ?? ""
                  }`}
                >
                  {orderStatusLabels[order.status] ?? order.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {order.totalDone}/{order.totalItems} erledigt
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        order.totalItems > 0
                          ? (order.totalDone / order.totalItems) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </button>

            {/* Order Items */}
            {isExpanded && (
              <div className="border-t border-border/30">
                {/* Article items */}
                {order.pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 border-b border-border/20 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {item.article?.name ?? item.freeText ?? "Unbekannt"}
                        </span>
                        {item.article && (
                          <span
                            className={`inline-flex items-center rounded-md border px-1.5 py-0 text-[9px] font-semibold ${
                              tierBadgeColors[item.article.category] ?? ""
                            }`}
                          >
                            {articleCategoryLabels[item.article.category]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {item.supplier && (
                          <span>Lieferant: {item.supplier.name}</span>
                        )}
                        {item.supplierOrderNo && (
                          <span>Bestellnr: {item.supplierOrderNo}</span>
                        )}
                        {item.orderedAt && (
                          <span>
                            Bestellt:{" "}
                            {new Date(item.orderedAt).toLocaleDateString("de-DE")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-sm tabular-nums mr-2">
                      <span className="text-muted-foreground">
                        {item.receivedQty}
                      </span>
                      <span className="text-muted-foreground/50"> / </span>
                      <span className="font-semibold">{item.quantity}</span>
                      {item.article && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          {item.article.unit}
                        </span>
                      )}
                    </div>

                    <ReceiveDialog
                      item={{
                        id: item.id,
                        orderId: item.orderId,
                        articleId: item.articleId,
                        articleName: item.article?.name ?? item.freeText ?? "Unbekannt",
                        articleCategory: item.article?.category ?? null,
                        quantity: item.quantity,
                        receivedQty: item.receivedQty,
                        isFreeText: !item.articleId,
                      }}
                    />
                  </div>
                ))}

                {/* Mobilfunk items */}
                {order.pendingMf.map((mf) => (
                  <div
                    key={mf.id}
                    className="flex items-center gap-4 border-b border-border/20 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                      <Smartphone className="h-4 w-4 text-violet-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {mobilfunkTypeLabels[mf.type] ?? mf.type}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300"
                        >
                          Mobilfunk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {mf.providerOrderNo && (
                          <span>Bestellnr: {mf.providerOrderNo}</span>
                        )}
                        {mf.orderedAt && (
                          <span>
                            Bestellt:{" "}
                            {new Date(mf.orderedAt).toLocaleDateString("de-DE")}
                          </span>
                        )}
                        {mf.phoneNote && <span>{mf.phoneNote}</span>}
                      </div>
                    </div>

                    <div className="text-right text-sm mr-2">
                      <span
                        className={
                          mf.received
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {mf.received ? "Empfangen" : "Ausstehend"}
                      </span>
                    </div>

                    <ReceiveMobilfunkDialog
                      mobilfunk={{
                        id: mf.id,
                        orderId: mf.orderId,
                        type: mf.type,
                        received: mf.received,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
