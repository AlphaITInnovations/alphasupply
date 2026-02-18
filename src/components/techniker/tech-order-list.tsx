"use client";

import { useState } from "react";
import { Wrench, ChevronRight, Package, Smartphone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { StockLight } from "@/components/orders/stock-light";
import { orderStatusLabels, orderStatusColors, deliveryMethodLabels } from "@/types/orders";
import { fetchOrderDetail } from "@/actions/orders";
import { OrderDetailContent } from "@/components/orders/order-detail-content";

type TechOrder = {
  id: string;
  orderNumber: string;
  orderedFor: string;
  costCenter: string;
  deliveryMethod: string;
  computedStatus: string;
  availability: "green" | "yellow" | "red";
  totalItems: number;
  pickedItems: number;
  totalMf: number;
  setupMf: number;
};

export function TechOrderList({ orders }: { orders: TechOrder[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Awaited<ReturnType<typeof fetchOrderDetail>> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleOrderClick(id: string) {
    setLoading(true);
    setDetailOpen(true);
    const detail = await fetchOrderDetail(id);
    setSelectedOrder(detail);
    setLoading(false);
  }

  // Sort: green first (ready to work), then yellow
  const sortOrder = { green: 0, yellow: 1, red: 2 };
  const sorted = [...orders].sort(
    (a, b) => sortOrder[a.availability] - sortOrder[b.availability]
  );

  return (
    <>
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Wrench className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Keine offenen Auftr&auml;ge
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
              Aktuell gibt es keine Auftr&auml;ge zur Bearbeitung.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => handleOrderClick(order.id)}
              className="block w-full text-left"
            >
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <StockLight availability={order.availability} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-primary">
                          {order.orderNumber}
                        </span>
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${orderStatusColors[order.computedStatus]}`}>
                          {orderStatusLabels[order.computedStatus]}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {deliveryMethodLabels[order.deliveryMethod]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {order.orderedFor} &middot; KSt {order.costCenter}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {order.pickedItems}/{order.totalItems} entnommen
                        </span>
                        {order.totalMf > 0 && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {order.setupMf}/{order.totalMf} eingerichtet
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

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
    </>
  );
}
