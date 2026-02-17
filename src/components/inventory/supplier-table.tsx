"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Factory, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SupplierForm } from "./supplier-form";
import { deleteSupplier } from "@/actions/inventory";
import { toast } from "sonner";

type SupplierRow = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  _count: { articleSuppliers: number };
};

export function SupplierTable({ suppliers }: { suppliers: SupplierRow[] }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const supplierToDelete = suppliers.find((s) => s.id === deleteId);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteSupplier(deleteId);
      if (result.success) {
        toast.success("Lieferant gelöscht");
        router.refresh();
      } else {
        toast.error(result.error ?? "Fehler beim Löschen");
      }
      setDeleteId(null);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Name</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Ansprechpartner</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">E-Mail</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider">Telefon</TableHead>
              <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-right">Artikel</TableHead>
              <TableHead className="py-3 w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Factory className="mx-auto mb-2 h-8 w-8" />
                  Keine Lieferanten vorhanden.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id} className="border-border/30 group">
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.contactName ?? "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.email ?? "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.phone ?? "–"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {supplier._count.articleSuppliers}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <SupplierForm
                        supplier={supplier}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-7 w-7">
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Lieferanten &quot;{supplierToDelete?.name}&quot; wirklich löschen?
              {(supplierToDelete?._count.articleSuppliers ?? 0) > 0 && (
                <span className="block mt-1 text-destructive font-medium">
                  Diesem Lieferanten sind {supplierToDelete?._count.articleSuppliers} Artikel zugeordnet.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
