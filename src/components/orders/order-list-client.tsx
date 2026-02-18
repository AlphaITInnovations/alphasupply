"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Send,
  UserCheck,
  Smartphone,
  Loader2,
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
import { fetchOrderDetail } from "@/actions/orders";
import { OrderForm } from "@/components/orders/order-form";
import { OrderDetailContent } from "@/components/orders/order-detail-content";
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
type OrderDetail = NonNullable<Awaited<ReturnType<typeof fetchOrderDetail>>>;

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
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  async function handleOrderClick(id: string) {
    setLoading(true);
    setDetailOpen(true);
    const detail = await fetchOrderDetail(id);
    setSelectedOrder(detail);
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auftr&auml;ge</h1>
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
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Empf&auml;nger</TableHead>
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
                  Keine Auftr&auml;ge vorhanden.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {activeOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onClick={handleOrderClick} />
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
                      <OrderRow key={order.id} order={order} onClick={handleOrderClick} opacity />
                    ))}
                  </>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail-Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedOrder ? (
            <OrderDetailContent order={selectedOrder} onClose={() => setDetailOpen(false)} />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Auftrag nicht gefunden.
            </div>
          )}
        </DialogContent>
      </Dialog>

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
  onClick,
  opacity,
}: {
  order: Order;
  onClick: (id: string) => void;
  opacity?: boolean;
}) {
  return (
    <TableRow className={`border-border/30 ${opacity ? "opacity-60" : ""}`}>
      <TableCell>
        <StockLight availability={order.stockAvailability} size={opacity ? "sm" : undefined} />
      </TableCell>
      <TableCell>
        <button
          type="button"
          onClick={() => onClick(order.id)}
          className={`font-mono text-xs text-primary hover:underline cursor-pointer ${opacity ? "" : "font-semibold"}`}
        >
          {order.orderNumber}
        </button>
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
