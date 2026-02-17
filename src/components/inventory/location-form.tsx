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
import { createWarehouseLocation } from "@/actions/inventory";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LocationForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return createWarehouseLocation(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Lagerort erstellt");
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
          Neuer Lagerort
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuen Lagerort anlegen</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" placeholder="z.B. Regal A-1, Raum 201..." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input id="description" name="description" placeholder="Optionale Beschreibung..." />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Wird erstellt..." : "Lagerort erstellen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
