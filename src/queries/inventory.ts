import { db } from "@/lib/db";
import { ArticleCategory } from "@/generated/prisma/client";

export async function getArticles(options?: {
  category?: ArticleCategory;
  search?: string;
  activeOnly?: boolean;
}) {
  const { category, search, activeOnly = true } = options ?? {};

  return db.article.findMany({
    where: {
      ...(category && { category }),
      ...(activeOnly && { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: {
        select: { serialNumbers: true, articleSuppliers: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getArticleById(id: string) {
  return db.article.findUnique({
    where: { id },
    include: {
      serialNumbers: {
        include: { location: true },
        orderBy: { createdAt: "desc" },
      },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      articleSuppliers: {
        include: { supplier: true },
        orderBy: { isPreferred: "desc" },
      },
      stockLocations: {
        include: { location: true },
      },
    },
  });
}

export async function getWarehouseLocations() {
  return db.warehouseLocation.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { stockLocations: true, serialNumbers: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getStockMovements(options?: {
  articleId?: string;
  type?: "IN" | "OUT" | "ADJUSTMENT";
  limit?: number;
}) {
  const { articleId, type, limit = 50 } = options ?? {};

  return db.stockMovement.findMany({
    where: {
      ...(articleId && { articleId }),
      ...(type && { type }),
    },
    include: {
      article: { select: { name: true, sku: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSuppliers() {
  return db.supplier.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { articleSuppliers: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getStockArticles() {
  return db.article.findMany({
    where: {
      isActive: true,
      currentStock: { gt: 0 },
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
}

export async function getDashboardStats() {
  const [
    totalArticles,
    lowStockArticles,
    recentMovements,
    totalSerialNumbers,
  ] = await Promise.all([
    db.article.count({ where: { isActive: true } }),
    db.article.findMany({
      where: {
        isActive: true,
        currentStock: { lte: db.article.fields.minStockLevel },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStockLevel: true,
        category: true,
      },
      orderBy: { currentStock: "asc" },
    }),
    db.stockMovement.findMany({
      include: {
        article: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.serialNumber.count({ where: { status: "IN_STOCK" } }),
  ]);

  return {
    totalArticles,
    lowStockArticles,
    recentMovements,
    totalSerialNumbers,
  };
}
