"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, UserCheck, Check, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deliveryMethodLabels } from "@/types/orders";
import { finishTechWork } from "@/actions/techniker";
import { toast } from "sonner";
import type { OrderDetailFull } from "./order-detail";

export function OrderShipping({ order }: { order: OrderDetailFull }) {
  const router = useRouter();
  const [trackingNo, setTrackingNo] = useState(order.trackingNumber || "");
  const [isPending, startTransition] = useTransition();

  const isDone = !!order.techDoneAt || !!order.shippedAt;
  const allPicked = order.items.every(
    (i) => i.pickedQty >= i.quantity || !i.article
  );
  const allMfSetup = order.mobilfunk.every((mf) => mf.setupDone);
  const techName = order.technicianName || "";
  const canFinish =
    allPicked && allMfSetup && techName.trim().length > 0;

  function handleFinish() {
    if (!techName.trim()) {
      toast.error("Bitte zuerst Technikernamen eingeben.");
      return;
    }
    startTransition(async () => {
      const result = await finishTechWork({
        orderId: order.id,
        trackingNumber: trackingNo.trim() || undefined,
        technicianName: techName.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Versand abgeschlossen.");
        router.refresh();
      }
    });
  }

  const shippingFormatted =
    order.deliveryMethod === "SHIPPING"
      ? [
          order.shippingCompany,
          order.shippingStreet,
          [order.shippingZip, order.shippingCity].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ")
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {order.deliveryMethod === "SHIPPING" ? (
            <>
              <Send className="h-4 w-4" /> Versand
            </>
          ) : (
            <>
              <Truck className="h-4 w-4" /> Abholung
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery info */}
        <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
          {order.deliveryMethod === "SHIPPING" ? (
            <>
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Versandadresse</p>
                {order.shippingCompany && (
                  <p className="text-sm font-semibold">
                    {order.shippingCompany}
                  </p>
                )}
                {order.shippingStreet && (
                  <p className="text-sm">{order.shippingStreet}</p>
                )}
                <p className="text-sm">
                  {[order.shippingZip, order.shippingCity]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Abholer</p>
                <p className="text-sm font-semibold">
                  {order.pickupBy || "–"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Shipped state */}
        {isDone ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950">
            <Check className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {order.deliveryMethod === "SHIPPING"
                ? "Versendet"
                : "Abgeholt"}
            </p>
            {order.trackingNumber && (
              <p className="text-xs text-emerald-600 mt-1 font-mono">
                Sendungsnr: {order.trackingNumber}
              </p>
            )}
            {order.shippedBy && (
              <p className="text-xs text-muted-foreground mt-1">
                von {order.shippedBy}
                {order.shippedAt &&
                  ` am ${new Date(order.shippedAt).toLocaleDateString("de-DE")}`}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!canFinish && (
              <p className="text-sm text-muted-foreground">
                Bitte zuerst alle Artikel entnehmen
                {order.mobilfunk.length > 0 &&
                  " und Mobilfunk einrichten"}
                .
              </p>
            )}
            {order.deliveryMethod === "SHIPPING" && canFinish && (
              <div className="max-w-sm">
                <Label className="text-xs">Sendungsnummer (optional)</Label>
                <Input
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Tracking-Nummer..."
                  className="mt-1"
                />
              </div>
            )}
            <Button
              onClick={handleFinish}
              disabled={!canFinish || isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              {order.deliveryMethod === "SHIPPING"
                ? "Als versendet markieren"
                : "Als abgeholt markieren"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
