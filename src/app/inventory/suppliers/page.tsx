export const dynamic = "force-dynamic";

import { getSuppliers } from "@/queries/inventory";
import { SupplierForm } from "@/components/inventory/supplier-form";
import { SupplierTable } from "@/components/inventory/supplier-table";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lieferanten</h1>
        <SupplierForm />
      </div>

      <SupplierTable suppliers={suppliers} />
    </div>
  );
}
