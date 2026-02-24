"use client";

import { useState, useTransition } from "react";
import { Check, Package, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mobilfunkTypeLabels } from "@/types/orders";
import { receiveOrderItem, receiveFreeTextItem, receiveMobilfunk } from "@/actions/receiving";
import type { FullOrder } from "./order-tabs";

export function OrderReceivingTab({ order }: { order: FullOrder }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [performedBy, setPerformedBy] = useState("");

  // Per-item serial number input
  const [snInputs, setSnInputs] = useState<Record<string, { serialNo: string; isUsed: boolean }[]>>({});

  // Filter to items that are ordered but not fully received
  const pendingItems = order.items.filter(
    (i) => i.needsOrdering && i.orderedAt && i.receivedQty < i.quantity
  );
  const pendingMf = order.mobilfunk.filter((mf) => mf.ordered && !mf.received);
  const totalPending = pendingItems.length + pendingMf.length;

  function handleReceiveItem(item: FullOrder["items"][0]) {
    setError(null);
    startTransition(async () => {
      if (!item.articleId) {
        const result = await receiveFreeTextItem({
          orderItemId: item.id,
          orderId: order.id,
          performedBy: performedBy || undefined,
        });
        if (result.error) setError(result.error);
        return;
      }

      const sns = item.article?.category === "HIGH_TIER" ? (snInputs[item.id] || []) : undefined;
      const result = await receiveOrderItem({
        orderItemId: item.id,
        orderId: order.id,
        articleId: item.articleId,
        quantity: item.quantity,
        performedBy: performedBy || undefined,
        serialNumbers: sns?.filter((sn) => sn.serialNo.trim()) || undefined,
      });
      if (result.error) setError(result.error);
    });
  }

  function handleReceiveMf(mf: FullOrder["mobilfunk"][0]) {
    setError(null);
    startTransition(async () => {
      const result = await receiveMobilfunk({
        mobilfunkId: mf.id,
        orderId: order.id,
      });
      if (result.error) setError(result.error);
    });
  }

  function addSnField(itemId: string) {
    setSnInputs((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), { serialNo: "", isUsed: false }],
    }));
  }

  if (totalPending === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <Check className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Alle Artikel empfangen
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Bearbeiter + Status */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Bearbeiter</Label>
              <Input
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="Name..."
                className="w-48"
              />
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalPending} offen
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Artikel empfangen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.map((item) => {
              const isSerialized = item.article?.category === "HIGH_TIER";
              const sns = snInputs[item.id] || [];

              return (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                        {item.supplier && <> &middot; {item.supplier.name}</>}
                        {item.supplierOrderNo && <> &middot; Best.Nr: {item.supplierOrderNo}</>}
                      </div>

                      {/* SN fields for SERIALIZED */}
                      {isSerialized && (
                        <div className="mt-2 space-y-1">
                          {sns.map((sn, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Input
                                value={sn.serialNo}
                                onChange={(e) => {
                                  const updated = [...sns];
                                  updated[idx] = { ...updated[idx], serialNo: e.target.value };
                                  setSnInputs((prev) => ({ ...prev, [item.id]: updated }));
                                }}
                                placeholder={`SN ${idx + 1}...`}
                                className="w-48 h-7 text-xs"
                              />
                              <label className="flex items-center gap-1 text-xs">
                                <input
                                  type="checkbox"
                                  checked={sn.isUsed}
                                  onChange={(e) => {
                                    const updated = [...sns];
                                    updated[idx] = { ...updated[idx], isUsed: e.target.checked };
                                    setSnInputs((prev) => ({ ...prev, [item.id]: updated }));
                                  }}
                                />
                                Gebraucht
                              </label>
                            </div>
                          ))}
                          {sns.length < item.quantity && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addSnField(item.id)}
                            >
                              + Seriennummer
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleReceiveItem(item)}
                      disabled={isPending}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Empfangen
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Pending Mobilfunk */}
      {pendingMf.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-violet-500" />
              Mobilfunk empfangen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMf.map((mf) => (
              <div
                key={mf.id}
                className="rounded-lg border border-violet-200 bg-violet-50/30 p-3 dark:border-violet-800 dark:bg-violet-950/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {mobilfunkTypeLabels[mf.type]}
                    </Badge>
                    {mf.phoneNote && <span className="text-xs text-muted-foreground">{mf.phoneNote}</span>}
                    {mf.providerOrderNo && (
                      <span className="text-xs text-muted-foreground">Best.Nr: {mf.providerOrderNo}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleReceiveMf(mf)}
                    disabled={isPending}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Empfangen
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
