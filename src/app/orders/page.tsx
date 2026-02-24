export const dynamic = "force-dynamic";

import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { getOrders } from "@/queries/orders";
import { OrderSearch } from "@/components/orders/order-search";
import { OrderListClient } from "@/components/orders/order-list-client";
import { OrderFilterTabs } from "@/components/orders/order-filter-tabs";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; filter?: string }>;
}) {
  const { search, filter } = await searchParams;
  const validFilter = filter === "tech" || filter === "proc" ? filter : undefined;

  const [orders, articles] = await Promise.all([
    getOrders({ search, filter: validFilter }),
    db.article.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, category: true, currentStock: true, unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeOrders = validFilter
    ? orders
    : orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.computedStatus));
  const completedOrders = validFilter
    ? []
    : orders.filter((o) => ["COMPLETED", "CANCELLED"].includes(o.computedStatus));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 justify-between">
        <OrderFilterTabs current={validFilter} />
        <OrderSearch defaultValue={search} />
      </div>

      <OrderListClient activeOrders={activeOrders} completedOrders={completedOrders} articles={articles} />

      {orders.length === 0 && search && (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Keine Aufträge gefunden für &ldquo;{search}&rdquo;.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
