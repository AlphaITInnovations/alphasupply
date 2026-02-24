export const dynamic = "force-dynamic";

import { getInventoryStats, getInventories } from "@/queries/inventur";
import { InventoryDashboard } from "@/components/inventur/inventory-dashboard";

export default async function InventurPage() {
  const [stats, inventories] = await Promise.all([
    getInventoryStats(),
    getInventories(),
  ]);

  // Serialize Decimal fields
  const serializedInventories = inventories.map((inv) => ({
    id: inv.id,
    name: inv.name,
    status: inv.status,
    startedBy: inv.startedBy,
    completedAt: inv.completedAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    totalItems: inv.items.length,
    checkedItems: inv.items.filter((i) => i.checked).length,
    deviations: inv.items.filter((i) => i.difference !== null && i.difference !== 0).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventur</h1>
        <p className="text-muted-foreground">
          Lagerbestände prüfen, Statistiken einsehen und Inventuren durchführen
        </p>
      </div>
      <InventoryDashboard stats={stats} inventories={serializedInventories} />
    </div>
  );
}
