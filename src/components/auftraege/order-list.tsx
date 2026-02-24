"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockLight } from "@/components/auftraege/stock-light";
import {
  orderStatusLabels,
  orderStatusColors,
} from "@/types/orders";
import type { getOrders } from "@/queries/orders";

type Order = Awaited<ReturnType<typeof getOrders>>[0];

export function OrderList({
  orders,
  search: initialSearch,
}: {
  orders: Order[];
  search?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialSearch ?? "");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const activeOrders = orders.filter(
    (o) => !["COMPLETED", "CANCELLED"].includes(o.computedStatus)
  );
  const completedOrders = orders.filter((o) =>
    ["COMPLETED", "CANCELLED"].includes(o.computedStatus)
  );

  function handleSearch(value: string) {
    setSearchValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    const qs = params.toString();
    router.push(`/auftraege${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Suche nach Nr., Empfänger, Besteller..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3 w-10" />
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Nr.
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Empfänger
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">
                Kostenstelle
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right hidden md:table-cell">
                Positionen
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                Erstellt
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">
                Techniker
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeOrders.length === 0 && completedOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  Keine Aufträge gefunden.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {activeOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}

                {/* Archive Section */}
                {completedOrders.length > 0 && (
                  <>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setArchiveOpen(!archiveOpen)}
                    >
                      <TableCell colSpan={8} className="py-2 bg-muted/20">
                        <div className="flex items-center gap-1.5">
                          {archiveOpen ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            Archiv ({completedOrders.length})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {archiveOpen &&
                      completedOrders.map((order) => (
                        <OrderRow key={order.id} order={order} opacity />
                      ))}
                  </>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  opacity,
}: {
  order: Order;
  opacity?: boolean;
}) {
  return (
    <TableRow className={`border-border/30 ${opacity ? "opacity-60" : ""}`}>
      <TableCell>
        <StockLight
          availability={order.stockAvailability}
          size={opacity ? "sm" : undefined}
        />
      </TableCell>
      <TableCell>
        <Link
          href={`/auftraege/${order.id}`}
          className={`font-mono text-xs text-primary hover:underline ${
            opacity ? "" : "font-semibold"
          }`}
        >
          {order.orderNumber}
        </Link>
      </TableCell>
      <TableCell className="text-sm">{order.orderedFor}</TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="outline" className="text-[10px] font-mono">
          {order.costCenter}
        </Badge>
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
            orderStatusColors[order.computedStatus]
          }`}
        >
          {orderStatusLabels[order.computedStatus]}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm hidden md:table-cell">
        <div className="flex items-center justify-end gap-1.5">
          {order.items.length}
          {order.mobilfunk.length > 0 && (
            <Smartphone className="h-3.5 w-3.5 text-violet-500" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
        {new Date(order.createdAt).toLocaleDateString("de-DE")}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
        {order.technicianName || "–"}
      </TableCell>
    </TableRow>
  );
}
