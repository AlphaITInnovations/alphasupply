export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/queries/orders";
import { OrderList } from "@/components/auftraege/order-list";
import { OrderFilters } from "@/components/auftraege/order-filters";

// Map URL filter params to status values for the query
const filterStatusMap: Record<string, string> = {
  setup: "IN_SETUP",
  ready: "READY_TO_SHIP",
};

export default async function AuftraegePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; search?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter;
  const search = params.search;

  // Determine query options based on filter
  let orders;
  if (filter === "procurement") {
    orders = await getOrders({ filter: "proc", search });
  } else if (filter === "commission") {
    orders = await getOrders({ filter: "commission", search });
  } else if (filter && filterStatusMap[filter]) {
    orders = await getOrders({ status: filterStatusMap[filter], search });
  } else {
    orders = await getOrders({ search });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aufträge</h1>
          <p className="text-muted-foreground">
            Alle Aufträge verwalten und nachverfolgen
          </p>
        </div>
        <Button asChild>
          <Link href="/auftraege/neu">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Auftrag
          </Link>
        </Button>
      </div>

      <OrderFilters current={filter} />

      <OrderList orders={orders} search={search} />
    </div>
  );
}
