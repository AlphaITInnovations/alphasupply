"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleMobilfunkDelivered } from "@/actions/orders";
import { toast } from "sonner";

export function MobilfunkDeliveryToggle({
  id,
  delivered,
}: {
  id: string;
  delivered: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleMobilfunkDelivered(id, !delivered);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
        delivered
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-muted-foreground/30 hover:border-primary"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {delivered && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
