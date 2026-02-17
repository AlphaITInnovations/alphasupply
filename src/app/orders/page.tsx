export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Send, UserCheck, Smartphone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders } from "@/queries/orders";
import { orderStatusLabels, orderStatusColors, deliveryMethodLabels } from "@/types/orders";
import { StockLight } from "@/components/orders/stock-light";
import { OrderSearch } from "@/components/orders/order-search";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const orders = await getOrders({ search });

  const activeOrders = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.computedStatus));
  const completedOrders = orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.computedStatus));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aufträge</h1>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Auftrag
          </Link>
        </Button>
      </div>

      {/* Suchfeld */}
      <OrderSearch defaultValue={search} />

      {/* Aktive Aufträge */}
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
                <TableCell colSpan={9} className="text-center py-12">
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="flex flex-col items-center py-4">
                      {search ? (
                        <>
                          <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-muted-foreground">Keine Aufträge gefunden für &ldquo;{search}&rdquo;.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground">Keine Aufträge vorhanden.</p>
                          <Button asChild size="sm" className="mt-3">
                            <Link href="/orders/new">
                              <Plus className="mr-2 h-3.5 w-3.5" />
                              Ersten Auftrag anlegen
                            </Link>
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {activeOrders.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}

                {/* Archiv-Sektion */}
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
    </div>
  );
}

function OrderRow({ order, opacity }: {
  order: Awaited<ReturnType<typeof getOrders>>[0];
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
