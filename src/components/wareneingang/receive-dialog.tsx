"use client";

import { useEffect, useState, useTransition } from "react";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { receiveOrderItem, receiveFreeTextItem } from "@/actions/receiving";
import { toast } from "sonner";

type ReceiveItem = {
  id: string;
  orderId: string;
  articleId: string | null;
  articleName: string;
  articleCategory: string | null;
  quantity: number;
  receivedQty: number;
  isFreeText: boolean;
};

export function ReceiveDialog({ item }: { item: ReceiveItem }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const remaining = item.quantity - item.receivedQty;
  const isHighTier = item.articleCategory === "HIGH_TIER";

  // Serial number fields for HIGH_TIER
  const [serialNumbers, setSerialNumbers] = useState<
    { serialNo: string; isUsed: boolean }[]
  >(() => Array.from({ length: remaining }, () => ({ serialNo: "", isUsed: false })));

  // Reset serial numbers when dialog opens
  useEffect(() => {
    if (open) {
      setSerialNumbers(
        Array.from({ length: remaining }, () => ({ serialNo: "", isUsed: false }))
      );
    }
  }, [open, remaining]);

  function updateSerial(index: number, field: "serialNo" | "isUsed", value: string | boolean) {
    setSerialNumbers((prev) =>
      prev.map((sn, i) =>
        i === index ? { ...sn, [field]: value } : sn
      )
    );
  }

  function handleSubmit() {
    // Validate HIGH_TIER serial numbers
    if (isHighTier) {
      const emptySerials = serialNumbers.some((sn) => !sn.serialNo.trim());
      if (emptySerials) {
        toast.error("Bitte alle Seriennummern ausfüllen.");
        return;
      }
      const duplicates = serialNumbers.filter(
        (sn, i, arr) =>
          arr.findIndex((s) => s.serialNo.trim() === sn.serialNo.trim()) !== i
      );
      if (duplicates.length > 0) {
        toast.error("Seriennummern müssen eindeutig sein.");
        return;
      }
    }

    startTransition(async () => {
      let result;

      if (item.isFreeText) {
        // Free text item - just mark as received
        result = await receiveFreeTextItem({
          orderItemId: item.id,
          orderId: item.orderId,
        });
      } else {
        // Regular article item
        result = await receiveOrderItem({
          orderItemId: item.id,
          orderId: item.orderId,
          articleId: item.articleId!,
          quantity: remaining,
          serialNumbers: isHighTier
            ? serialNumbers.map((sn) => ({
                serialNo: sn.serialNo.trim(),
                isUsed: sn.isUsed,
              }))
            : undefined,
        });
      }

      if (result.success) {
        toast.success(`${item.articleName} eingelagert`);
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
      <DialogContent className={isHighTier && remaining > 2 ? "max-w-lg" : ""}>
        <DialogHeader>
          <DialogTitle>Wareneingang erfassen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Article info */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-sm font-medium">{item.articleName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Erwartete Menge: <span className="font-semibold">{remaining}</span>
              {item.isFreeText && " (Freitext-Position)"}
            </p>
          </div>

          {/* HIGH_TIER: Serial number inputs */}
          {isHighTier && !item.isFreeText && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seriennummern
              </Label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {serialNumbers.map((sn, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder="Seriennummer eingeben..."
                      value={sn.serialNo}
                      onChange={(e) =>
                        updateSerial(index, "serialNo", e.target.value)
                      }
                      className="h-8 text-sm font-mono"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={sn.isUsed}
                        onCheckedChange={(checked) =>
                          updateSerial(index, "isUsed", checked)
                        }
                        size="sm"
                      />
                      <span className="text-[10px] text-muted-foreground w-12">
                        {sn.isUsed ? "Gebraucht" : "Neu"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MID_TIER / LOW_TIER: Quantity confirmation */}
          {!isHighTier && !item.isFreeText && (
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground text-lg tabular-nums">
                  {remaining}
                </span>{" "}
                Stück werden eingelagert
              </p>
            </div>
          )}

          {/* Free text confirmation */}
          {item.isFreeText && (
            <div className="rounded-lg border border-border/50 bg-muted/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Freitext-Position als empfangen markieren
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Wird eingelagert..." : "Wareneingang bestätigen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
