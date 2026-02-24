"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, Calendar, Wrench, Ban, Check, Package, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEAM_MEMBERS } from "@/lib/team-members";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { orderStatusLabels, orderStatusColors, canCancelOrder } from "@/types/orders";
import { setTechnicianName } from "@/actions/techniker";
import { cancelOrder } from "@/actions/orders";
import { toast } from "sonner";
import type { OrderDetailFull } from "./order-detail";

const progressSteps = [
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

export function OrderHeader({ order }: { order: OrderDetailFull }) {
  const router = useRouter();
  const [techName, setTechName] = useState(order.technicianName || "");
  const [isPending, startTransition] = useTransition();

  // saveTechName is now handled inline in Select onValueChange

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelOrder(order.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Auftrag storniert.");
        router.refresh();
      }
    });
  }

  const showCancel = canCancelOrder(order as Parameters<typeof canCancelOrder>[0]);

  const isTerminal = ["COMPLETED", "CANCELLED"].includes(order.computedStatus);

  return (
    <div className="space-y-4">
      {/* Title row with inline progress */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            {order.orderNumber}
          </h1>
          <span
            className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold ${
              orderStatusColors[order.computedStatus]
            }`}
          >
            {orderStatusLabels[order.computedStatus]}
          </span>
        </div>

        {/* Inline progress stepper */}
        {!isTerminal && (
          <div className="flex items-center gap-1">
            {progressSteps.map((step, idx) => {
              const state = getStepState(order, step.key);
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                        state === "completed"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : state === "current"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted-foreground/30 bg-background text-muted-foreground/40"
                      }`}
                    >
                      {state === "completed" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium hidden lg:inline ${
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
                  {idx < progressSteps.length - 1 && (
                    <div
                      className={`w-6 h-0.5 mx-1 rounded-full ${
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
        )}

        {showCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950">
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                Stornieren
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Auftrag stornieren?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie den Auftrag {order.orderNumber} wirklich
                  stornieren? Dieser Vorgang kann nicht rückgängig gemacht
                  werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Stornieren
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Besteller</p>
                <p className="text-sm font-semibold">{order.orderedBy}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Empfänger</p>
                <p className="text-sm font-semibold">{order.orderedFor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">
                  Kostenstelle
                </p>
                <p className="text-sm font-semibold font-mono">
                  {order.costCenter}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Erstellt am</p>
                <p className="text-sm font-semibold">
                  {new Date(order.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Techniker */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground mb-1">
                Techniker
              </p>
              <Select
                value={techName || undefined}
                onValueChange={(value) => {
                  setTechName(value);
                  startTransition(async () => {
                    await setTechnicianName(order.id, value);
                    router.refresh();
                  });
                }}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 max-w-xs">
                  <SelectValue placeholder="Techniker zuweisen..." />
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
