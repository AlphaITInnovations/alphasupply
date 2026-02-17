"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/actions/orders";
import { toast } from "sonner";
import { XCircle } from "lucide-react";

export function OrderStatusActions({
  orderId,
  currentStatus,
  canCancel,
}: {
  orderId: string;
  currentStatus: string;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Status is now auto-computed. Only manual action: cancel
  if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") return null;
  if (!canCancel) return null;

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result.success) {
        toast.success("Auftrag storniert");
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleCancel}
      >
        <XCircle className="mr-1.5 h-3.5 w-3.5" />
        Stornieren
      </Button>
    </div>
  );
}
