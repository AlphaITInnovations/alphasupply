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
import { createSupplier, updateSupplier } from "@/actions/inventory";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type SupplierData = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
};

export function SupplierForm({
  supplier,
  trigger,
  onSuccess,
}: {
  supplier?: SupplierData;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const action = supplier ? updateSupplier : createSupplier;
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      if (supplier) {
        formData.set("id", supplier.id);
      }
      return action(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(supplier ? "Lieferant aktualisiert" : "Lieferant erstellt");
      setOpen(false);
      onSuccess?.();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, supplier, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Lieferant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Lieferant bearbeiten" : "Neuen Lieferanten anlegen"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Firmenname *</Label>
            <Input id="name" name="name" defaultValue={supplier?.name} required />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Ansprechpartner</Label>
              <Input id="contactName" name="contactName" defaultValue={supplier?.contactName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" defaultValue={supplier?.website ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={supplier?.notes ?? ""} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Wird gespeichert..."
              : supplier
                ? "Aktualisieren"
                : "Lieferant erstellen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
