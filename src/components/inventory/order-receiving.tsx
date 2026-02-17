"use client";

import { useState, useTransition } from "react";
import { Check, Package, Smartphone, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mobilfunkTypeLabels } from "@/types/orders";
import { receiveOrderItem, receiveFreeTextItem, receiveMobilfunk } from "@/actions/receiving";

type ReceivingOrder = {
  id: string;
  orderNumber: string;
  orderedFor: string;
  costCenter: string;
  totalPending: number;
  totalDone: number;
  totalItems: number;
  pendingItems: {
    id: string;
    articleId: string | null;
    freeText: string | null;
    quantity: number;
    receivedQty: number;
    supplierOrderNo: string | null;
    article: {
      id: string;
      name: string;
      sku: string;
      category: string;
      unit: string;
    } | null;
    supplier: { id: string; name: string } | null;
  }[];
  pendingMf: {
    id: string;
    type: string;
    phoneNote: string | null;
    providerOrderNo: string | null;
    received: boolean;
  }[];
};

export function OrderReceiving({ orders }: { orders: ReceivingOrder[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [performedBy, setPerformedBy] = useState("");

  // Per-item serial number input
  const [snInputs, setSnInputs] = useState<Record<string, { serialNo: string; isUsed: boolean }[]>>({});

  function toggleExpand(orderId: string) {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  }

  function handleReceiveItem(item: ReceivingOrder["pendingItems"][0], orderId: string) {
    setError(null);
    startTransition(async () => {
      if (!item.articleId) {
        const result = await receiveFreeTextItem({
          orderItemId: item.id,
          orderId,
          performedBy: performedBy || undefined,
        });
        if (result.error) setError(result.error);
        return;
      }

      const sns = item.article?.category === "SERIALIZED" ? (snInputs[item.id] || []) : undefined;
      const result = await receiveOrderItem({
        orderItemId: item.id,
        orderId,
        articleId: item.articleId,
        quantity: item.quantity,
        performedBy: performedBy || undefined,
        serialNumbers: sns?.filter((sn) => sn.serialNo.trim()) || undefined,
      });
      if (result.error) setError(result.error);
    });
  }

  function handleReceiveMf(mf: ReceivingOrder["pendingMf"][0], orderId: string) {
    setError(null);
    startTransition(async () => {
      const result = await receiveMobilfunk({
        mobilfunkId: mf.id,
        orderId,
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

  if (orders.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Auftragsbasierter Wareneingang</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-end gap-3 mb-4">
        <div>
          <Label className="text-xs text-muted-foreground">Bearbeiter</Label>
          <Input
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            placeholder="Name..."
            className="w-48"
          />
        </div>
      </div>

      {orders.map((order) => {
        const isExpanded = expanded[order.id] ?? true;

        return (
          <Card key={order.id}>
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleExpand(order.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {order.orderNumber}
                  <span className="text-sm font-normal text-muted-foreground">
                    {order.orderedFor} &middot; KSt {order.costCenter}
                  </span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {order.totalPending} offen
                </Badge>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-3">
                {order.pendingItems.map((item) => {
                  const isSerialized = item.article?.category === "SERIALIZED";
                  const sns = snInputs[item.id] || [];

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border p-3"
                    >
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
                          onClick={() => handleReceiveItem(item, order.id)}
                          disabled={isPending}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Empfangen
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {order.pendingMf.map((mf) => (
                  <div
                    key={mf.id}
                    className="rounded-lg border border-violet-200 bg-violet-50/30 p-3 dark:border-violet-800 dark:bg-violet-950/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-violet-500" />
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
                        onClick={() => handleReceiveMf(mf, order.id)}
                        disabled={isPending}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Empfangen
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
