"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Factory,
  Globe,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/actions/inventory";
import { toast } from "sonner";
import { useActionState, useEffect } from "react";

type SupplierRow = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  articleCount: number;
};

export function SupplierList({ suppliers }: { suppliers: SupplierRow[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  const supplierToDelete = suppliers.find((s) => s.id === deleteId);

  function handleDelete() {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const result = await deleteSupplier(deleteId);
      if (result.success) {
        toast.success("Lieferant geloescht");
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler beim Loeschen");
      }
      setDeleteId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search + Summary */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Lieferant suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "Lieferant" : "Lieferanten"}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Ansprechpartner
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                E-Mail
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Telefon
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">
                Website
              </TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">
                Artikel
              </TableHead>
              <TableHead className="py-3 w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Factory className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      Keine Lieferanten gefunden
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {search.trim()
                        ? "Passen Sie die Suche an."
                        : "Erstellen Sie den ersten Lieferanten."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="border-border/30 group"
                >
                  <TableCell className="font-medium">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.contactName ? (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        {supplier.contactName}
                      </span>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.email ? (
                      <a
                        href={`mailto:${supplier.email}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        {supplier.email}
                      </a>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" />
                        {supplier.phone}
                      </span>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.website ? (
                      <a
                        href={
                          supplier.website.startsWith("http")
                            ? supplier.website
                            : `https://${supplier.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Globe className="h-3 w-3" />
                        {supplier.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {supplier.articleCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <SupplierFormDialog
                        supplier={supplier}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(supplier.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Moechten Sie den Lieferanten &quot;{supplierToDelete?.name}&quot;
              wirklich loeschen?
              {(supplierToDelete?.articleCount ?? 0) > 0 && (
                <span className="block mt-1 text-destructive font-medium">
                  Diesem Lieferanten sind {supplierToDelete?.articleCount}{" "}
                  Artikel zugeordnet.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Wird geloescht..." : "Loeschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Inline Supplier Form Dialog ────────────────────────────

function SupplierFormDialog({
  supplier,
  trigger,
}: {
  supplier?: SupplierRow;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const action = supplier ? updateSupplier : createSupplier;

  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      if (supplier) {
        formData.set("id", supplier.id);
      }
      return action(formData);
    },
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(
        supplier ? "Lieferant aktualisiert" : "Lieferant erstellt"
      );
      setOpen(false);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, supplier]);

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
            <Label htmlFor="sup-name">Firmenname *</Label>
            <Input
              id="sup-name"
              name="name"
              defaultValue={supplier?.name}
              required
            />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sup-contactName">Ansprechpartner</Label>
              <Input
                id="sup-contactName"
                name="contactName"
                defaultValue={supplier?.contactName ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-phone">Telefon</Label>
              <Input
                id="sup-phone"
                name="phone"
                defaultValue={supplier?.phone ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sup-email">E-Mail</Label>
              <Input
                id="sup-email"
                name="email"
                type="email"
                defaultValue={supplier?.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-website">Website</Label>
              <Input
                id="sup-website"
                name="website"
                defaultValue={supplier?.website ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sup-notes">Notizen</Label>
            <Textarea
              id="sup-notes"
              name="notes"
              rows={2}
              defaultValue={supplier?.notes ?? ""}
            />
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

export { SupplierFormDialog };
