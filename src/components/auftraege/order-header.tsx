"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Building2, Calendar, Wrench, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export function OrderHeader({ order }: { order: OrderDetailFull }) {
  const router = useRouter();
  const [techName, setTechName] = useState(order.technicianName || "");
  const [isPending, startTransition] = useTransition();

  function saveTechName() {
    if (techName.trim() === (order.technicianName || "")) return;
    startTransition(async () => {
      await setTechnicianName(order.id, techName.trim());
      router.refresh();
    });
  }

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

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between">
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
              <Input
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                onBlur={saveTechName}
                placeholder="Technikername eingeben..."
                className="h-8 max-w-xs"
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
