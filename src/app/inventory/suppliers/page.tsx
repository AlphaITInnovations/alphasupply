export const dynamic = "force-dynamic";

import { Factory } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSuppliers } from "@/queries/inventory";
import { SupplierForm } from "@/components/inventory/supplier-form";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lieferanten</h1>
        <SupplierForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Ansprechpartner</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead className="text-right">Artikel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Factory className="mx-auto mb-2 h-8 w-8" />
                  Keine Lieferanten vorhanden. Erstellen Sie den ersten Lieferanten.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
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
                  <TableCell className="text-right">
                    {supplier._count.articleSuppliers}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
