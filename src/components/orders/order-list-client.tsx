"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Send,
  UserCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StockLight } from "@/components/orders/stock-light";
import {
  orderStatusLabels,
  orderStatusColors,
  deliveryMethodLabels,
} from "@/types/orders";
import { OrderForm } from "@/components/orders/order-form";
import type { getOrders } from "@/queries/orders";

type Article = {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
};

type Order = Awaited<ReturnType<typeof getOrders>>[0];

export function OrderListClient({
  activeOrders,
  completedOrders,
  articles,
}: {
  activeOrders: Order[];
  completedOrders: Order[];
  articles: Article[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aufträge</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Auftrag
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3 w-10" />
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Nr.</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Status</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Besteller</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Empfänger</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Kostenstelle</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Lieferung</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Positionen</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Datum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeOrders.length === 0 && completedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  Keine Aufträge vorhanden.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {activeOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
                {completedOrders.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell colSpan={9} className="py-2 bg-muted/20">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                          Archiv ({completedOrders.length})
                        </span>
                      </TableCell>
                    </TableRow>
                    {completedOrders.map((order) => (
                      <OrderRow key={order.id} order={order} opacity />
                    ))}
                  </>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Neuer Auftrag Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>Neuer Auftrag</DialogTitle>
            <DialogDescription>Auftrag manuell anlegen</DialogDescription>
          </DialogHeader>
          <OrderForm
            articles={articles}
            onSuccess={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
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
        <StockLight availability={order.stockAvailability} size={opacity ? "sm" : undefined} />
      </TableCell>
      <TableCell>
        <Link
          href={`/orders/${order.id}`}
          className={`font-mono text-xs text-primary hover:underline ${opacity ? "" : "font-semibold"}`}
        >
          {order.orderNumber}
        </Link>
      </TableCell>
      <TableCell>
        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${orderStatusColors[order.computedStatus]}`}>
          {orderStatusLabels[order.computedStatus]}
        </span>
      </TableCell>
      <TableCell className="text-sm">{order.orderedBy}</TableCell>
      <TableCell className="text-sm">{order.orderedFor}</TableCell>
      <TableCell className="font-mono text-sm">{order.costCenter}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {order.deliveryMethod === "SHIPPING" ? (
            <Send className="h-3.5 w-3.5" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          {deliveryMethodLabels[order.deliveryMethod]}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums text-sm">
        <div className="flex items-center justify-end gap-1.5">
          {order.items.length}
          {order.mobilfunk.length > 0 && (
            <Smartphone className="h-3.5 w-3.5 text-violet-500" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(order.createdAt).toLocaleDateString("de-DE")}
      </TableCell>
    </TableRow>
  );
}
