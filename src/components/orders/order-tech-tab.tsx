"use client";

import { useState, useTransition } from "react";
import { Check, Package, Smartphone, Undo2, Send, Truck } from "lucide-react";
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
import {
  pickItem,
  unpickItem,
  setupMobilfunk,
  resetMobilfunkSetup,
  finishTechWork,
  setTechnicianName,
} from "@/actions/techniker";
import type { FullOrder } from "./order-tabs";

export function OrderTechTab({ order }: { order: FullOrder }) {
  const [techName, setTechName] = useState(order.technicianName || "");
  const [trackingNo, setTrackingNo] = useState(order.trackingNumber || "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Per-mobilfunk form state
  const [mfData, setMfData] = useState<Record<string, { imei: string; phoneNumber: string }>>(() => {
    const init: Record<string, { imei: string; phoneNumber: string }> = {};
    for (const mf of order.mobilfunk) {
      init[mf.id] = { imei: mf.imei || "", phoneNumber: mf.phoneNumber || "" };
    }
    return init;
  });

  // Per-item SN selection
  const [snSelection, setSnSelection] = useState<Record<string, string>>({});

  const isDone = !!order.techDoneAt;
  const allPicked = order.items.every((i) => i.pickedQty >= i.quantity || !i.article);
  const allMfSetup = order.mobilfunk.every((mf) => mf.setupDone);
  const canFinish = allPicked && allMfSetup && techName.trim().length > 0;

  function saveTechName() {
    if (!techName.trim()) return;
    startTransition(async () => {
      await setTechnicianName(order.id, techName.trim());
    });
  }

  function handlePick(item: FullOrder["items"][0]) {
    if (!techName.trim()) { setError("Bitte zuerst Technikernamen eingeben."); return; }
    setError(null);
    startTransition(async () => {
      const result = await pickItem({
        orderItemId: item.id,
        orderId: order.id,
        articleId: item.article!.id,
        quantity: item.quantity,
        serialNumberId: item.article!.category === "SERIALIZED" ? snSelection[item.id] : undefined,
        technicianName: techName.trim(),
      });
      if (result.error) setError(result.error);
    });
  }

  function handleUnpick(item: FullOrder["items"][0]) {
    setError(null);
    startTransition(async () => {
      const linkedSn = item.serialNumbers[0];
      const result = await unpickItem({
        orderItemId: item.id,
        orderId: order.id,
        articleId: item.article!.id,
        quantity: item.pickedQty,
        serialNumberId: linkedSn?.id,
        technicianName: techName.trim(),
      });
      if (result.error) setError(result.error);
    });
  }

  function handleMfSetup(mf: FullOrder["mobilfunk"][0]) {
    if (!techName.trim()) { setError("Bitte zuerst Technikernamen eingeben."); return; }
    setError(null);
    const data = mfData[mf.id];
    startTransition(async () => {
      const result = await setupMobilfunk({
        mobilfunkId: mf.id,
        orderId: order.id,
        imei: data?.imei || undefined,
        phoneNumber: data?.phoneNumber || undefined,
        technicianName: techName.trim(),
      });
      if (result.error) setError(result.error);
    });
  }

  function handleMfReset(mf: FullOrder["mobilfunk"][0]) {
    startTransition(async () => {
      const result = await resetMobilfunkSetup(mf.id, order.id);
      if (result.error) setError(result.error);
    });
  }

  function handleFinish() {
    startTransition(async () => {
      const result = await finishTechWork({
        orderId: order.id,
        trackingNumber: trackingNo.trim() || undefined,
        technicianName: techName.trim(),
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

      {/* Technikername */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Technikername</Label>
              <Input
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                placeholder="Name des Technikers..."
                disabled={isDone}
                onBlur={saveTechName}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {order.items.filter((i) => i.pickedQty >= i.quantity).length}
              </span>
              /{order.items.length} Artikel &middot;{" "}
              <span className="font-semibold text-foreground">
                {order.mobilfunk.filter((mf) => mf.setupDone).length}
              </span>
              /{order.mobilfunk.length} Mobilfunk
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artikelliste */}
      {order.items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Artikel entnehmen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => {
              const isPicked = item.pickedQty >= item.quantity;
              const isFreeText = !item.article;
              const isSerialized = item.article?.category === "SERIALIZED";
              const availableSNs = item.article?.serialNumbers || [];

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isPicked
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isPicked && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                        <span className="text-sm font-medium">
                          {item.article?.name || item.freeText}
                        </span>
                        {item.article && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.article.sku}
                          </Badge>
                        )}
                        {isFreeText && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            Freitext
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Menge: {item.quantity} {item.article?.unit || "Stk"}
                        {item.article && (
                          <> &middot; Lager: {item.article.currentStock} {item.article.unit}</>
                        )}
                        {isPicked && item.pickedBy && (
                          <> &middot; Entnommen von {item.pickedBy}</>
                        )}
                      </div>

                      {/* SN Selection for SERIALIZED */}
                      {isSerialized && !isPicked && !isDone && availableSNs.length > 0 && (
                        <div className="mt-2">
                          <Select
                            value={snSelection[item.id] || ""}
                            onValueChange={(v) =>
                              setSnSelection((prev) => ({ ...prev, [item.id]: v }))
                            }
                          >
                            <SelectTrigger className="w-64 h-8 text-xs">
                              <SelectValue placeholder="Seriennummer wählen..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSNs.map((sn) => (
                                <SelectItem key={sn.id} value={sn.id} className="text-xs">
                                  {sn.serialNo} {sn.isUsed ? "(gebraucht)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Show linked SN if picked */}
                      {isPicked && item.serialNumbers.length > 0 && (
                        <div className="mt-1 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                          SN: {item.serialNumbers.map((sn) => sn.serialNo).join(", ")}
                        </div>
                      )}
                    </div>

                    {!isFreeText && !isDone && (
                      <div>
                        {isPicked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnpick(item)}
                            disabled={isPending}
                          >
                            <Undo2 className="mr-1 h-3 w-3" />
                            Zurück
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handlePick(item)}
                            disabled={
                              isPending ||
                              (item.article ? item.article.currentStock < item.quantity : true) ||
                              (isSerialized && !snSelection[item.id])
                            }
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Entnehmen
                          </Button>
                        )}
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
              <Smartphone className="h-4 w-4" />
              Mobilfunk einrichten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.mobilfunk.map((mf) => {
              const needsImei = mf.type === "PHONE_AND_SIM" || mf.type === "PHONE_ONLY";
              const needsPhone = mf.type === "PHONE_AND_SIM" || mf.type === "SIM_ONLY";
              const data = mfData[mf.id] || { imei: "", phoneNumber: "" };

              return (
                <div
                  key={mf.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    mf.setupDone
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {mf.setupDone && <Check className="h-4 w-4 text-emerald-600" />}
                    <Badge variant="outline" className="text-[10px]">
                      {mobilfunkTypeLabels[mf.type]}
                    </Badge>
                    {mf.phoneNote && (
                      <span className="text-xs text-muted-foreground">Handy: {mf.phoneNote}</span>
                    )}
                    {mf.simNote && (
                      <span className="text-xs text-muted-foreground">SIM: {mf.simNote}</span>
                    )}
                  </div>

                  {!mf.setupDone && !isDone ? (
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        {needsImei && (
                          <div className="flex-1">
                            <Label className="text-xs">IMEI</Label>
                            <Input
                              value={data.imei}
                              onChange={(e) =>
                                setMfData((prev) => ({
                                  ...prev,
                                  [mf.id]: { ...prev[mf.id], imei: e.target.value },
                                }))
                              }
                              placeholder="IMEI-Nummer..."
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                        {needsPhone && (
                          <div className="flex-1">
                            <Label className="text-xs">Handynummer</Label>
                            <Input
                              value={data.phoneNumber}
                              onChange={(e) =>
                                setMfData((prev) => ({
                                  ...prev,
                                  [mf.id]: { ...prev[mf.id], phoneNumber: e.target.value },
                                }))
                              }
                              placeholder="Handynummer..."
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMfSetup(mf)}
                        disabled={isPending}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Einrichtung abgeschlossen
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {mf.imei && <div>IMEI: <span className="font-mono">{mf.imei}</span></div>}
                        {mf.phoneNumber && <div>Nr: <span className="font-mono">{mf.phoneNumber}</span></div>}
                        {mf.setupBy && <div>Eingerichtet von {mf.setupBy}</div>}
                      </div>
                      {!isDone && mf.setupDone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMfReset(mf)}
                          disabled={isPending}
                        >
                          <Undo2 className="mr-1 h-3 w-3" />
                          Zurück
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Versand / Abschließen */}
      {!isDone && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {order.deliveryMethod === "SHIPPING" ? (
                <><Send className="h-4 w-4" /> Versand</>
              ) : (
                <><Truck className="h-4 w-4" /> Auslieferung</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canFinish && (
              <p className="text-sm text-muted-foreground">
                Bitte zuerst alle Artikel entnehmen und Mobilfunk einrichten.
              </p>
            )}
            {order.deliveryMethod === "SHIPPING" && canFinish && (
              <div>
                <Label className="text-xs">Sendungsnummer (optional)</Label>
                <Input
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Tracking-Nummer..."
                  className="max-w-sm"
                />
              </div>
            )}
            <Button
              onClick={handleFinish}
              disabled={!canFinish || isPending}
              className="w-full sm:w-auto"
            >
              <Check className="mr-2 h-4 w-4" />
              Techniker-Arbeit abschließen
            </Button>
          </CardContent>
        </Card>
      )}

      {isDone && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950">
          <Check className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Techniker-Arbeit abgeschlossen
          </p>
          {order.trackingNumber && (
            <p className="text-xs text-emerald-600 mt-1 font-mono">
              Sendungsnr: {order.trackingNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
