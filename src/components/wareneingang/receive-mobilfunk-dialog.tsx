"use client";

import { useState, useTransition } from "react";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { receiveMobilfunk } from "@/actions/receiving";
import { mobilfunkTypeLabels } from "@/types/orders";
import { toast } from "sonner";

type MobilfunkItem = {
  id: string;
  orderId: string;
  type: string;
  received: boolean;
};

export function ReceiveMobilfunkDialog({
  mobilfunk,
}: {
  mobilfunk: MobilfunkItem;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (mobilfunk.received) {
    return null;
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await receiveMobilfunk({
        mobilfunkId: mobilfunk.id,
        orderId: mobilfunk.orderId,
      });

      if (result.success) {
        toast.success("Mobilfunk als empfangen markiert");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Fehler beim Wareneingang");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="shrink-0">
          <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
          Einlagern
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mobilfunk-Wareneingang</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-sm font-medium">
              {mobilfunkTypeLabels[mobilfunk.type] ?? mobilfunk.type}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mobilfunk-Position als empfangen markieren
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Wird bestaetigt..." : "Wareneingang bestaetigen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
