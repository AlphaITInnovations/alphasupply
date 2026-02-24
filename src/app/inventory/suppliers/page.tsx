export const dynamic = "force-dynamic";

import { getSuppliers } from "@/queries/inventory";
import { SupplierForm } from "@/components/inventory/supplier-form";
import { SupplierTable } from "@/components/inventory/supplier-table";
import { PageHeader } from "@/components/layout/page-header";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Lieferanten" description="Lieferantenstammdaten verwalten" />
        <SupplierForm />
      </div>

      <SupplierTable suppliers={suppliers} />
    </div>
  );
}
