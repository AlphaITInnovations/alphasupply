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
      avgPurchasePrice: true,
      unit: true,
    },
  });

  let warehouseValue = 0;
  let articleCount = 0;
  let totalStockUnits = 0;
  let articlesWithPrice = 0;
  let articlesWithoutPrice = 0;
  const categoryStats: Record<string, { count: number; stock: number; value: number }> = {};

  for (const a of articles) {
    articleCount++;
    totalStockUnits += a.currentStock;
    const price = a.avgPurchasePrice ? Number(a.avgPurchasePrice) : 0;
    const itemValue = a.currentStock * price;
    warehouseValue += itemValue;

    if (price > 0 && a.currentStock > 0) {
      articlesWithPrice++;
    } else if (a.currentStock > 0 && price === 0) {
      articlesWithoutPrice++;
    }

    if (!categoryStats[a.category]) {
      categoryStats[a.category] = { count: 0, stock: 0, value: 0 };
    }
    categoryStats[a.category].count++;
    categoryStats[a.category].stock += a.currentStock;
    categoryStats[a.category].value += itemValue;
  }

  // All articles with their value (for full list view)
  const allArticlesWithValue = articles
    .map((a) => ({
      id: a.id,
      name: a.name,
      sku: a.sku,
      category: a.category,
      currentStock: a.currentStock,
      unit: a.unit,
      avgPurchasePrice: a.avgPurchasePrice ? Number(a.avgPurchasePrice) : 0,
      totalValue: a.currentStock * (a.avgPurchasePrice ? Number(a.avgPurchasePrice) : 0),
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  return {
    articleCount,
    totalStockUnits,
    warehouseValue,
    articlesWithPrice,
    articlesWithoutPrice,
    categoryStats,
    allArticlesWithValue,
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
