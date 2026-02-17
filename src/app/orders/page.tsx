export const dynamic = "force-dynamic";

import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getOrders } from "@/queries/orders";
import { OrderSearch } from "@/components/orders/order-search";
import { OrderListClient } from "@/components/orders/order-list-client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const [orders, articles] = await Promise.all([
    getOrders({ search }),
    db.article.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, category: true, currentStock: true, unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeOrders = orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.computedStatus));
  const completedOrders = orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.computedStatus));

  return (
    <div className="space-y-6">
      <OrderListClient activeOrders={activeOrders} completedOrders={completedOrders} articles={articles} />

      <OrderSearch defaultValue={search} />

      {orders.length === 0 && search && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Keine Auftr&auml;ge gefunden f&uuml;r &ldquo;{search}&rdquo;.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
