"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSupplier } from "@/actions/inventory";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function SupplierForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return createSupplier(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Lieferant erstellt");
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
          Neuer Lieferant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Lieferanten anlegen</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Firmenname *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Ansprechpartner</Label>
              <Input id="contactName" name="contactName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Wird erstellt..." : "Lieferant erstellen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
