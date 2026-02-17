"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/actions/orders";
import { toast } from "sonner";
import { Play, CheckCircle2, XCircle, PackageCheck } from "lucide-react";

const transitions: Record<string, { label: string; next: string; icon: React.ElementType; variant?: "default" | "destructive" | "outline" }[]> = {
  NEW: [
    { label: "In Bearbeitung", next: "IN_PROGRESS", icon: Play },
    { label: "Stornieren", next: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  IN_PROGRESS: [
    { label: "Bereit", next: "READY", icon: PackageCheck },
    { label: "Stornieren", next: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  READY: [
    { label: "Abschließen", next: "COMPLETED", icon: CheckCircle2 },
    { label: "Stornieren", next: "CANCELLED", icon: XCircle, variant: "destructive" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function OrderStatusActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const actions = transitions[currentStatus] ?? [];

  if (actions.length === 0) return null;

  function handleAction(nextStatus: string, label: string) {
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.success) {
        toast.success(`Status geändert: ${label}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler");
      }
    });
  }

  return (
    <div className="flex gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.next}
            variant={action.variant ?? "default"}
            size="sm"
            disabled={isPending}
            onClick={() => handleAction(action.next, action.label)}
          >
            <Icon className="mr-1.5 h-3.5 w-3.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
