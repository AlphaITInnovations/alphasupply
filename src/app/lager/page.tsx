import { db } from "@/lib/db";
import { StockOverview } from "@/components/lager/stock-overview";

export const dynamic = "force-dynamic";

export default async function LagerPage() {
  // Fetch articles with stock > 0 OR incoming > 0
  const articles = await db.article.findMany({
    where: {
      isActive: true,
      OR: [{ currentStock: { gt: 0 } }, { incomingStock: { gt: 0 } }],
    },
    include: {
      serialNumbers: {
        where: { status: "IN_STOCK" },
        select: { id: true, serialNo: true, status: true },
        orderBy: { serialNo: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // All active articles for the manual stock-in dialog
  const allArticles = await db.article.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, category: true, unit: true },
    orderBy: { name: "asc" },
  });

  // Serialize Decimal fields and shape for client component
  const serialized = articles.map((a) => ({
    id: a.id,
    name: a.name,
    sku: a.sku,
    category: a.category,
    unit: a.unit,
    currentStock: a.currentStock,
    incomingStock: a.incomingStock,
    minStockLevel: a.minStockLevel,
    serialNumbers: a.serialNumbers.map((sn) => ({
      id: sn.id,
      serialNo: sn.serialNo,
      status: sn.status,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lager</h1>
        <p className="text-muted-foreground">
          Lagerbestände und Verfügbarkeiten
        </p>
      </div>
      <StockOverview articles={serialized} allArticles={allArticles} />
    </div>
  );
}
