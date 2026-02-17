export const dynamic = "force-dynamic";

import Link from "next/link";
import { Wrench, ChevronRight, Package, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getTechOrders } from "@/queries/techniker";
import { orderStatusLabels, orderStatusColors, deliveryMethodLabels } from "@/types/orders";
import { StockLight } from "@/components/orders/stock-light";

export default async function TechnikerPage() {
  const orders = await getTechOrders();

  // Sort: red first (urgent), then yellow, then green
  const sortOrder = { red: 0, yellow: 1, green: 2 };
  const sorted = [...orders].sort(
    (a, b) => sortOrder[a.availability] - sortOrder[b.availability]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Techniker - Auftragsbearbeitung</h1>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Wrench className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              Keine offenen Aufträge
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
              Aktuell gibt es keine Aufträge zur Bearbeitung.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((order) => (
            <Link
              key={order.id}
              href={`/techniker/${order.id}`}
              className="block"
            >
              <Card className="transition-all hover:shadow-md hover:border-primary/30">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
