import { db } from "@/lib/db";

export async function getInventoryStats() {
  const articles = await db.article.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      currentStock: true,
      incomingStock: true,
      minStockLevel: true,
      avgPurchasePrice: true,
      unit: true,
    },
  });

  // Calculate total warehouse value
  let warehouseValue = 0;
  let articleCount = 0;
  let totalStockUnits = 0;
  const categoryStats: Record<string, { count: number; stock: number; value: number }> = {};

  for (const a of articles) {
    articleCount++;
    totalStockUnits += a.currentStock;
    const price = a.avgPurchasePrice ? Number(a.avgPurchasePrice) : 0;
    const itemValue = a.currentStock * price;
    warehouseValue += itemValue;

    if (!categoryStats[a.category]) {
      categoryStats[a.category] = { count: 0, stock: 0, value: 0 };
    }
    categoryStats[a.category].count++;
    categoryStats[a.category].stock += a.currentStock;
    categoryStats[a.category].value += itemValue;
  }

  // Low stock articles
  const lowStockArticles = articles.filter(
    (a) => a.minStockLevel > 0 && a.currentStock <= a.minStockLevel
  );

  // Top value articles
  const topValueArticles = articles
    .map((a) => ({
      ...a,
      totalValue: a.currentStock * (a.avgPurchasePrice ? Number(a.avgPurchasePrice) : 0),
      avgPurchasePrice: a.avgPurchasePrice ? Number(a.avgPurchasePrice) : 0,
    }))
    .filter((a) => a.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return {
    articleCount,
    totalStockUnits,
    warehouseValue,
    categoryStats,
    lowStockArticles,
    topValueArticles,
  };
}

export async function getInventories() {
  return db.inventory.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          id: true,
          checked: true,
          difference: true,
        },
      },
    },
  });
}

export async function getInventoryById(id: string) {
  return db.inventory.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          article: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              unit: true,
              currentStock: true,
              avgPurchasePrice: true,
            },
          },
        },
        orderBy: { article: { name: "asc" } },
      },
    },
  });
}
