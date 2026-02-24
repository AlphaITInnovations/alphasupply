"use client";

import { Check, Package, Wrench, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderDetailFull } from "./order-detail";

const steps = [
  { key: "commission", label: "Kommissionierung", icon: Package },
  { key: "setup", label: "Einrichtung", icon: Wrench },
  { key: "shipping", label: "Versand", icon: Send },
] as const;

function getStepState(
  order: OrderDetailFull,
  stepKey: string
): "completed" | "current" | "pending" {
  const allPicked = order.items.every((i) => i.pickedQty >= i.quantity);
  const allMfSetup = order.mobilfunk.every((mf) => mf.setupDone);
  const isShipped = !!order.trackingNumber || !!order.shippedAt;
  const setupDone = !!order.setupDoneAt;
  const hasItems = order.items.length > 0 || order.mobilfunk.length > 0;

  switch (stepKey) {
    case "commission":
      if (allPicked && hasItems) return "completed";
      if (order.items.some((i) => i.pickedQty > 0)) return "current";
      if (order.computedStatus === "NEW" && hasItems) return "current";
      return hasItems ? "current" : "completed";
    case "setup":
      if (setupDone || isShipped) return "completed";
      if (allPicked && allMfSetup && hasItems) return "current";
      if (allPicked && hasItems) return "current";
      return "pending";
    case "shipping":
      if (isShipped) return "completed";
      if (setupDone || (allPicked && allMfSetup && hasItems))
        return "current";
      return "pending";
    default:
      return "pending";
  }
}

export function OrderProgress({ order }: { order: OrderDetailFull }) {
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const pickedItems = order.items.reduce((sum, i) => sum + i.pickedQty, 0);
  const totalMf = order.mobilfunk.length;
  const setupMf = order.mobilfunk.filter((mf) => mf.setupDone).length;

  const isTerminal = ["COMPLETED", "CANCELLED"].includes(order.computedStatus);

  // Build progress text
  let progressText = "";
  const commissionState = getStepState(order, "commission");
  if (commissionState === "current" || commissionState === "completed") {
    progressText = `${pickedItems}/${totalItems} Artikel kommissioniert`;
    if (totalMf > 0) {
      progressText += `, ${setupMf}/${totalMf} Mobilfunk eingerichtet`;
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fortschritt</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const state = isTerminal
              ? "completed"
              : getStepState(order, step.key);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step circle */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      state === "completed"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : state === "current"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/30 bg-background text-muted-foreground/40"
                    }`}
                  >
                    {state === "completed" ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      state === "completed"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : state === "current"
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 rounded-full ${
                      state === "completed"
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress text */}
        {progressText && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            {progressText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
