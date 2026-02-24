export const dynamic = "force-dynamic";

import { getSuppliers } from "@/queries/inventory";
import { SupplierList, SupplierFormDialog } from "@/components/lieferanten/supplier-list";

export default async function LieferantenPage() {
  const suppliers = await getSuppliers();

  // Serialize for client component
  const serialized = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactName: s.contactName,
    email: s.email,
    phone: s.phone,
    website: s.website,
    notes: s.notes,
    articleCount: s._count.articleSuppliers,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lieferanten</h1>
          <p className="text-muted-foreground">
            Lieferantenstammdaten und Zuordnungen
          </p>
        </div>
        <SupplierFormDialog />
      </div>

      <SupplierList suppliers={serialized} />
    </div>
  );
}
