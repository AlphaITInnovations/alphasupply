"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSerialNumber } from "@/actions/inventory";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function SerialNumberForm({ articleId }: { articleId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      formData.set("articleId", articleId);
      return createSerialNumber(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Seriennummer erfasst");
      setOpen(false);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Seriennummer hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seriennummer erfassen</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serialNo">Seriennummer *</Label>
            <Input id="serialNo" name="serialNo" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Input id="notes" name="notes" />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Wird gespeichert..." : "Seriennummer speichern"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
