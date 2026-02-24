"use client";

import { useState, useTransition } from "react";
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
import type { FullOrder } from "./order-tabs";

export function OrderProcurementTab({ order }: { order: FullOrder }) {
  const [buyerName, setBuyerName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const orderableItems = order.items.filter((i) => i.needsOrdering);
  const orderedCount = orderableItems.filter((i) => i.orderedAt).length;
  const orderedMfCount = order.mobilfunk.filter((mf) => mf.ordered).length;
  const totalOrderable = orderableItems.length + order.mobilfunk.length;
  const totalOrdered = orderedCount + orderedMfCount;

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

  function handleOrderItem(item: FullOrder["items"][0]) {
    if (!buyerName.trim()) {
      setError("Bitte zuerst Bestellername eingeben.");
      return;
    }
    const data = itemData[item.id];
    if (!data?.supplierId) {
      setError("Bitte Lieferant auswählen.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await markItemOrdered({
        orderItemId: item.id,
        orderId: order.id,
        supplierId: data.supplierId,
        supplierOrderNo: data.orderNo,
        orderedBy: buyerName.trim(),
      });
      if (result.error) setError(result.error);
    });
  }

  function handleOrderMf(mf: FullOrder["mobilfunk"][0]) {
    if (!buyerName.trim()) {
      setError("Bitte zuerst Bestellername eingeben.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await markMobilfunkOrdered({
        mobilfunkId: mf.id,
        orderId: order.id,
        providerOrderNo: mfData[mf.id] || "",
        orderedBy: buyerName.trim(),
      });
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Bestellername + Progress */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Besteller</Label>
              <Input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Wer bestellt?..."
                className="max-w-sm"
              />
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalOrdered}/{totalOrderable} bestellt
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Artikel */}
      {orderableItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Artikel bestellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderableItems.map((item) => {
              const isOrdered = !!item.orderedAt;
              const data = itemData[item.id] || { supplierId: "", orderNo: "" };

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
                        {isOrdered && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
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
                          <> &middot; Bestellt von {item.orderedBy} am {new Date(item.orderedAt!).toLocaleDateString("de-DE")}</>
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
                      <div className="flex items-end gap-2 shrink-0">
                        <div>
                          <Label className="text-[10px]">Lieferant</Label>
                          <Select
                            value={data.supplierId}
                            onValueChange={(v) =>
                              setItemData((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], supplierId: v },
                              }))
                            }
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Lieferant..." />
                            </SelectTrigger>
                            <SelectContent>
                              {order.suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="text-xs">
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
                                [item.id]: { ...prev[item.id], orderNo: e.target.value },
                              }))
                            }
                            placeholder="Best.Nr..."
                            className="w-32 h-8 text-xs"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOrderItem(item)}
                          disabled={isPending || !data.supplierId}
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
          </CardContent>
        </Card>
      )}

      {/* Mobilfunk */}
      {order.mobilfunk.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-violet-500" />
              Mobilfunk bestellen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                        {isOrdered && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                        <Badge variant="outline" className="text-[10px]">
                          {mobilfunkTypeLabels[mf.type]}
                        </Badge>
                        {mf.phoneNote && <span className="text-xs text-muted-foreground">{mf.phoneNote}</span>}
                      </div>
                      {isOrdered && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Bestellt von {mf.orderedBy} am {new Date(mf.orderedAt!).toLocaleDateString("de-DE")}
                          {mf.providerOrderNo && <> &middot; Best.Nr: {mf.providerOrderNo}</>}
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
                              setMfData((prev) => ({ ...prev, [mf.id]: e.target.value }))
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
