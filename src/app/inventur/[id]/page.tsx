export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getInventoryById } from "@/queries/inventur";
import { InventorySession } from "@/components/inventur/inventory-session";

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inventory = await getInventoryById(id);

  if (!inventory) {
    notFound();
  }

  // Serialize for client component
  const serialized = {
    id: inventory.id,
    name: inventory.name,
    status: inventory.status as "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    startedBy: inventory.startedBy,
    completedAt: inventory.completedAt?.toISOString() ?? null,
    createdAt: inventory.createdAt.toISOString(),
    notes: inventory.notes,
    items: inventory.items.map((item) => ({
      id: item.id,
      articleId: item.articleId,
      expectedQty: item.expectedQty,
      countedQty: item.countedQty,
      difference: item.difference,
      checked: item.checked,
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt?.toISOString() ?? null,
      notes: item.notes,
      article: {
        id: item.article.id,
        name: item.article.name,
        sku: item.article.sku,
        category: item.article.category,
        unit: item.article.unit,
        currentStock: item.article.currentStock,
        avgPurchasePrice: item.article.avgPurchasePrice
          ? Number(item.article.avgPurchasePrice)
          : 0,
      },
    })),
  };

  return <InventorySession inventory={serialized} />;
}
