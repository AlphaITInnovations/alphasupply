"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Wrench, ShoppingCart, PackagePlus, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrderOverviewTab } from "./order-overview-tab";
import { OrderTechTab } from "./order-tech-tab";
import { OrderProcurementTab } from "./order-procurement-tab";
import { OrderReceivingTab } from "./order-receiving-tab";
import type { getOrderDetailFull } from "@/queries/orders";

export type FullOrder = NonNullable<Awaited<ReturnType<typeof getOrderDetailFull>>>;

const tabConfig = [
  { value: "overview", label: "Übersicht", icon: FileText },
  { value: "tech", label: "Einrichten", icon: Wrench },
  { value: "proc", label: "Bestellen", icon: ShoppingCart },
  { value: "recv", label: "Wareneingang", icon: PackagePlus },
] as const;

export function OrderTabs({ order }: { order: FullOrder }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "overview";

  // Determine tab visibility
  const hasNeedsOrdering = order.items.some((i) => i.needsOrdering);
  const hasMobilfunk = order.mobilfunk.length > 0;
  const hasPendingReceiving =
    order.items.some((i) => i.needsOrdering && i.orderedAt && i.receivedQty < i.quantity) ||
    order.mobilfunk.some((mf) => mf.ordered && !mf.received);
  const isRedAvailability = order.stockAvailability === "red";
  const isCompleted = ["COMPLETED", "CANCELLED"].includes(order.computedStatus);

  function onTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const qs = params.toString();
    router.replace(`/orders/${order.id}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  return (
    <Tabs value={currentTab} onValueChange={onTabChange}>
      <TabsList variant="line" className="w-full justify-start border-b border-border/50 overflow-x-auto">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isDisabled =
            (tab.value === "tech" && isRedAvailability && !isCompleted) ||
            (tab.value === "recv" && !hasPendingReceiving && !isCompleted);
          const isHidden =
            (tab.value === "proc" && !hasNeedsOrdering && !hasMobilfunk) ||
            (tab.value === "recv" && !hasPendingReceiving && !isCompleted);

          if (isHidden) return null;

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={isDisabled}
              className="gap-1.5 data-[state=active]:text-primary"
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.value === "tech" && isDisabled && (
                <span className="text-[10px] text-muted-foreground ml-1">(Artikel fehlen)</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <OrderOverviewTab order={order} />
      </TabsContent>

      <TabsContent value="tech" className="mt-4">
        <OrderTechTab order={order} />
      </TabsContent>

      {(hasNeedsOrdering || hasMobilfunk) && (
        <TabsContent value="proc" className="mt-4">
          <OrderProcurementTab order={order} />
        </TabsContent>
      )}

      {(hasPendingReceiving || isCompleted) && (
        <TabsContent value="recv" className="mt-4">
          <OrderReceivingTab order={order} />
        </TabsContent>
      )}
    </Tabs>
  );
}
