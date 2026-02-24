"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Smartphone, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  mobilfunkTypeLabels,
  simTypeLabels,
  mobilfunkTariffLabels,
} from "@/types/orders";
import { setupMobilfunk, resetMobilfunkSetup } from "@/actions/techniker";
import { toast } from "sonner";
import type { OrderDetailFull } from "./order-detail";

export function OrderMobilfunk({ order }: { order: OrderDetailFull }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [mfData, setMfData] = useState<
    Record<string, { imei: string; phoneNumber: string }>
  >(() => {
    const init: Record<string, { imei: string; phoneNumber: string }> = {};
    for (const mf of order.mobilfunk) {
      init[mf.id] = {
        imei: mf.imei || "",
        phoneNumber: mf.phoneNumber || "",
      };
    }
    return init;
  });

  const isDone = !!order.techDoneAt;
  const techName = order.technicianName || "";

  if (order.mobilfunk.length === 0) return null;

  function handleSetup(mf: OrderDetailFull["mobilfunk"][0]) {
    if (!techName.trim()) {
      toast.error("Bitte zuerst Technikernamen eingeben.");
      return;
    }
    const data = mfData[mf.id];
    startTransition(async () => {
      const result = await setupMobilfunk({
        mobilfunkId: mf.id,
        orderId: order.id,
        imei: data?.imei || undefined,
        phoneNumber: data?.phoneNumber || undefined,
        technicianName: techName.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleReset(mf: OrderDetailFull["mobilfunk"][0]) {
    startTransition(async () => {
      const result = await resetMobilfunkSetup(mf.id, order.id);
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
        <CardTitle className="flex items-center gap-2 text-base">
          <Smartphone className="h-4 w-4" />
          Mobilfunk ({order.mobilfunk.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.mobilfunk.map((mf) => {
          const needsImei =
            mf.type === "PHONE_AND_SIM" || mf.type === "PHONE_ONLY";
          const needsPhone =
            mf.type === "PHONE_AND_SIM" || mf.type === "SIM_ONLY";
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
              {/* Header badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {mf.setupDone && (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
                <Badge
                  className={`text-[10px] ${
                    mf.type === "PHONE_AND_SIM"
                      ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800"
                      : mf.type === "PHONE_ONLY"
                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                        : "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800"
                  }`}
                  variant="outline"
                >
                  {mobilfunkTypeLabels[mf.type]}
                </Badge>
                {mf.simType && (
                  <Badge variant="outline" className="text-[10px]">
                    {simTypeLabels[mf.simType]}
                  </Badge>
                )}
                {mf.tariff && (
                  <Badge variant="outline" className="text-[10px]">
                    {mobilfunkTariffLabels[mf.tariff]}
                  </Badge>
                )}
                {mf.setupDone && (
                  <Badge
                    className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                    variant="outline"
                  >
                    Eingerichtet
                  </Badge>
                )}
              </div>

              {/* Notes */}
              {(mf.phoneNote || mf.simNote) && (
                <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                  {mf.phoneNote && (
                    <span>
                      <span className="font-medium text-foreground">
                        Handy:
                      </span>{" "}
                      {mf.phoneNote}
                    </span>
                  )}
                  {mf.simNote && (
                    <span>
                      <span className="font-medium text-foreground">SIM:</span>{" "}
                      {mf.simNote}
                    </span>
                  )}
                </div>
              )}

              {/* Setup form or result */}
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
                              [mf.id]: {
                                ...prev[mf.id],
                                imei: e.target.value,
                              },
                            }))
                          }
                          placeholder="IMEI-Nummer..."
                          className="h-8 text-xs mt-1"
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
                              [mf.id]: {
                                ...prev[mf.id],
                                phoneNumber: e.target.value,
                              },
                            }))
                          }
                          placeholder="Handynummer..."
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSetup(mf)}
                    disabled={isPending}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Einrichtung abgeschlossen
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {mf.imei && (
                      <div>
                        IMEI: <span className="font-mono">{mf.imei}</span>
                      </div>
                    )}
                    {mf.phoneNumber && (
                      <div>
                        Nr:{" "}
                        <span className="font-mono">{mf.phoneNumber}</span>
                      </div>
                    )}
                    {mf.setupBy && <div>Eingerichtet von {mf.setupBy}</div>}
                  </div>
                  {!isDone && mf.setupDone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReset(mf)}
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
  );
}
