"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mobilfunkTypeLabels } from "@/types/orders";
import { markItemOrdered, markMobilfunkOrdered } from "@/actions/procurement";
import { TEAM_MEMBERS } from "@/lib/team-members";
import { toast } from "sonner";
import type { OrderDetailFull } from "./order-detail";

export function OrderProcurement({ order }: { order: OrderDetailFull }) {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [isPending, startTransition] = useTransition();

  const orderableItems = order.items.filter((i) => i.needsOrdering);
  const hasMobilfunk = order.mobilfunk.length > 0;

  // Per-item form state
  const [itemData, setItemData] = useState<
    Record<string, { supplierId: string; orderNo: string }>
  >(() => {
    const init: Record<string, { supplierId: string; orderNo: string }> = {};
    for (const item of order.items) {
      const preferred = item.article?.articleSuppliers?.[0]?.supplier;
      init[item.id] = {
        supplierId: item.supplier?.id || preferred?.id || "",
        orderNo: item.supplierOrderNo || "",
      };
    }
    return init;
  });

  // Per-mobilfunk form state
  const [mfData, setMfData] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const mf of order.mobilfunk) {
      init[mf.id] = mf.providerOrderNo || "";
    }
    return init;
  });

  // Don't render if no orderable items and no mobilfunk
  if (orderableItems.length === 0 && !hasMobilfunk) return null;

  const orderedCount = orderableItems.filter((i) => i.orderedAt).length;
  const orderedMfCount = order.mobilfunk.filter((mf) => mf.ordered).length;
  const totalOrderable = orderableItems.length + order.mobilfunk.length;
  const totalOrdered = orderedCount + orderedMfCount;

  function handleOrderItem(item: OrderDetailFull["items"][0]) {
    if (!buyerName.trim()) {
      toast.error("Bitte zuerst Bestellername eingeben.");
      return;
    }
    const data = itemData[item.id];
    const isFreeText = !item.article;
    // Supplier is required for article items, optional for freeText items
    if (!isFreeText && !data?.supplierId) {
      toast.error("Bitte Lieferant auswählen.");
      return;
    }
    startTransition(async () => {
      const result = await markItemOrdered({
        orderItemId: item.id,
        orderId: order.id,
        supplierId: data?.supplierId || undefined,
        supplierOrderNo: data?.orderNo || undefined,
        orderedBy: buyerName.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleOrderMf(mf: OrderDetailFull["mobilfunk"][0]) {
    if (!buyerName.trim()) {
      toast.error("Bitte zuerst Bestellername eingeben.");
      return;
    }
    startTransition(async () => {
      const result = await markMobilfunkOrdered({
        mobilfunkId: mf.id,
        orderId: order.id,
        providerOrderNo: mfData[mf.id] || "",
        orderedBy: buyerName.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Beschaffung
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalOrdered}/{totalOrderable} bestellt
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buyer name */}
        <div className="max-w-sm">
          <Label className="text-xs text-muted-foreground">Besteller</Label>
          <Select
            value={buyerName || undefined}
            onValueChange={(value) => setBuyerName(value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Wer bestellt?..." />
            </SelectTrigger>
            <SelectContent>
              {TEAM_MEMBERS.map((name) => (
                <SelectItem key={name} value={name} className="text-sm">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orderable items */}
        {orderableItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Artikel
            </h4>
            {orderableItems.map((item) => {
              const isOrdered = !!item.orderedAt;
              const data = itemData[item.id] || {
                supplierId: "",
                orderNo: "",
              };

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    isOrdered
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isOrdered && (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium">
                          {item.article?.name || item.freeText}
                        </span>
                        {item.article && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.article.sku}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Menge: {item.quantity} {item.article?.unit || "Stk"}
                        {isOrdered && item.orderedBy && (
                          <>
                            {" "}
                            &middot; Bestellt von {item.orderedBy} am{" "}
                            {new Date(item.orderedAt!).toLocaleDateString(
                              "de-DE"
                            )}
                          </>
                        )}
                        {isOrdered && item.supplierOrderNo && (
                          <> &middot; Best.Nr: {item.supplierOrderNo}</>
                        )}
                        {isOrdered && item.supplier && (
                          <> &middot; {item.supplier.name}</>
                        )}
                      </div>
                    </div>

                    {!isOrdered && (
                      <div className="flex flex-wrap items-end gap-2 shrink-0">
                        <div>
                          <Label className="text-[10px]">Lieferant</Label>
                          <Select
                            value={data.supplierId}
                            onValueChange={(v) =>
                              setItemData((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  supplierId: v,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-36 sm:w-40 h-8 text-xs">
                              <SelectValue placeholder="Lieferant..." />
                            </SelectTrigger>
                            <SelectContent>
                              {order.suppliers.map((s) => (
                                <SelectItem
                                  key={s.id}
                                  value={s.id}
                                  className="text-xs"
                                >
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[10px]">Bestellnr.</Label>
                          <Input
                            value={data.orderNo}
                            onChange={(e) =>
                              setItemData((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  orderNo: e.target.value,
                                },
                              }))
                            }
                            placeholder="Best.Nr..."
                            className="w-28 sm:w-32 h-8 text-xs"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOrderItem(item)}
                          disabled={isPending || (!!item.article && !data.supplierId)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Bestellt
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobilfunk procurement */}
        {hasMobilfunk && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-violet-500" />
              Mobilfunk
            </h4>
            {order.mobilfunk.map((mf) => {
              const isOrdered = mf.ordered;

              return (
                <div
                  key={mf.id}
                  className={`rounded-lg border p-3 ${
                    isOrdered
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isOrdered && (
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {mobilfunkTypeLabels[mf.type]}
                        </Badge>
                        {mf.phoneNote && (
                          <span className="text-xs text-muted-foreground">
                            {mf.phoneNote}
                          </span>
                        )}
                      </div>
                      {isOrdered && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Bestellt von {mf.orderedBy} am{" "}
                          {new Date(mf.orderedAt!).toLocaleDateString("de-DE")}
                          {mf.providerOrderNo && (
                            <> &middot; Best.Nr: {mf.providerOrderNo}</>
                          )}
                        </div>
                      )}
                    </div>

                    {!isOrdered && (
                      <div className="flex items-end gap-2 shrink-0">
                        <div>
                          <Label className="text-[10px]">Provider-Best.Nr</Label>
                          <Input
                            value={mfData[mf.id] || ""}
                            onChange={(e) =>
                              setMfData((prev) => ({
                                ...prev,
                                [mf.id]: e.target.value,
                              }))
                            }
                            placeholder="Best.Nr..."
                            className="w-40 h-8 text-xs"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOrderMf(mf)}
                          disabled={isPending}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Bestellt
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
