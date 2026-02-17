"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createStockMovement } from "@/actions/inventory";
import { stockMovementTypeLabels } from "@/types/inventory";
import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Article = { id: string; name: string; sku: string };

export function StockMovementForm({
  articles,
  preselectedArticleId,
}: {
  articles: Article[];
  preselectedArticleId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return createStockMovement(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Lagerbewegung erfasst");
      setOpen(false);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Lagerbewegung
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lagerbewegung erfassen</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="articleId">Artikel *</Label>
            <Select name="articleId" defaultValue={preselectedArticleId}>
              <SelectTrigger>
                <SelectValue placeholder="Artikel wählen..." />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.sku} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Art *</Label>
              <Select name="type" defaultValue="IN">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stockMovementTypeLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Menge *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Grund</Label>
            <Input id="reason" name="reason" placeholder="z.B. Nachlieferung, Auftrag #123..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="performedBy">Durchgeführt von</Label>
            <Input id="performedBy" name="performedBy" placeholder="Name des Technikers..." />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Wird gespeichert..." : "Lagerbewegung buchen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
