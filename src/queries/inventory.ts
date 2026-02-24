import { db } from "@/lib/db";
import { ArticleCategory } from "@/generated/prisma/client";
import { computeAvailability, type Availability } from "@/queries/techniker";
import { computeOrderStatus } from "@/types/orders";

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

export async function getNextArticleNumber(): Promise<string> {
  const latest = await db.article.findFirst({
    where: { sku: { startsWith: "ART-" } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });

  if (!latest) return "ART-001";

  const num = parseInt(latest.sku.replace("ART-", ""), 10);
  return `ART-${String(num + 1).padStart(3, "0")}`;
}

export async function getArticleGroupSuggestions() {
  const [groups, subGroups] = await Promise.all([
    db.article.findMany({
      where: { isActive: true, productGroup: { not: null } },
      select: { productGroup: true },
      distinct: ["productGroup"],
      orderBy: { productGroup: "asc" },
    }),
    db.article.findMany({
      where: { isActive: true, productSubGroup: { not: null } },
      select: { productSubGroup: true },
      distinct: ["productSubGroup"],
      orderBy: { productSubGroup: "asc" },
    }),
  ]);
  return {
    groups: groups.map((g) => g.productGroup!),
    subGroups: subGroups.map((s) => s.productSubGroup!),
  };
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

export async function getArticlesForReceiving() {
  return db.article.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      unit: true,
    },
    orderBy: { name: "asc" },
  });
}

// ─── Pipeline Dashboard ──────────────────────────────────

export type PipelineOrder = {
  id: string;
  orderNumber: string;
  orderedFor: string;
  costCenter: string;
  createdAt: Date;
  itemCount: number;
  mobilfunkCount: number;
  availability: Availability;
};

export type PipelineData = {
  pipeline: {
    neu: PipelineOrder[];
    einrichten: PipelineOrder[];
    bestellen: PipelineOrder[];
    wareneingang: PipelineOrder[];
    versandbereit: PipelineOrder[];
  };
  completedCount: number;
  lowStockArticles: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
  }[];
};

export async function getPipelineOrders(): Promise<PipelineData> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [orders, completedCount, lowStockArticles] = await Promise.all([
    db.order.findMany({
      where: { status: { notIn: ["CANCELLED", "COMPLETED"] } },
      include: {
        items: {
          include: {
            article: { select: { currentStock: true } },
          },
        },
        mobilfunk: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.order.count({
      where: {
        status: "COMPLETED",
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.article.findMany({
      where: {
        isActive: true,
        minStockLevel: { gt: 0 },
        currentStock: { lte: db.article.fields.minStockLevel },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        minStockLevel: true,
      },
      orderBy: { currentStock: "asc" },
    }),
  ]);

  const pipeline: PipelineData["pipeline"] = {
    neu: [],
    einrichten: [],
    bestellen: [],
    wareneingang: [],
    versandbereit: [],
  };

  for (const order of orders) {
    const computed = computeOrderStatus(order);
    const availability = computeAvailability(order.items);

    const card: PipelineOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      orderedFor: order.orderedFor,
      costCenter: order.costCenter,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      mobilfunkCount: order.mobilfunk.length,
      availability,
    };

    if (computed === "NEW") {
      pipeline.neu.push(card);
      continue;
    }

    if (computed === "READY") {
      pipeline.versandbereit.push(card);
      continue;
    }

    // IN_PROGRESS → most actionable column
    const needsTech = !order.techDoneAt;
    const stockOk = availability !== "red";

    const needsOrdering =
      order.items.some((i) => i.needsOrdering && !i.orderedAt) ||
      order.mobilfunk.some((mf) => !mf.ordered);

    const awaitingReceipt =
      order.items.some(
        (i) => i.needsOrdering && !!i.orderedAt && i.receivedQty < i.quantity
      ) || order.mobilfunk.some((mf) => mf.ordered && !mf.received);

    if (needsTech && stockOk) {
      pipeline.einrichten.push(card);
    } else if (needsOrdering) {
      pipeline.bestellen.push(card);
    } else if (awaitingReceipt) {
      pipeline.wareneingang.push(card);
    } else if (needsTech) {
      pipeline.bestellen.push(card);
    } else {
      pipeline.versandbereit.push(card);
    }
  }

  return { pipeline, completedCount, lowStockArticles };
}

export async function getDashboardStats() {
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    lowStockArticles,
    recentMovements,
    openOrders,
    techPendingOrders,
    procPendingOrders,
    incomingArticles,
  ] = await Promise.all([
    db.article.findMany({
      where: {
        isActive: true,
        minStockLevel: { gt: 0 },
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
    // Last 48h movements for scrollable log
    db.stockMovement.findMany({
      where: { createdAt: { gte: since48h } },
      include: {
        article: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Open orders (NEW or IN_PROGRESS)
    db.order.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    // Orders needing technician work — load items to compute availability
    db.order.findMany({
      where: {
        status: { in: ["NEW", "IN_PROGRESS"] },
        techDoneAt: null,
      },
      select: {
        items: {
          select: {
            quantity: true,
            pickedQty: true,
            article: { select: { currentStock: true } },
          },
        },
      },
    }),
    // Orders with pending procurement (items needing ordering that haven't been ordered)
    db.order.count({
      where: {
        status: { in: ["NEW", "IN_PROGRESS"] },
        OR: [
          { items: { some: { needsOrdering: true, orderedAt: null } } },
          { mobilfunk: { some: { ordered: false } } },
        ],
      },
    }),
    // Articles with incoming stock (ordered, awaiting delivery)
    db.article.count({
      where: { isActive: true, incomingStock: { gt: 0 } },
    }),
  ]);

  // Count only orders where all hardware is available (green/yellow)
  const techReadyOrders = techPendingOrders.filter(
    (o) => computeAvailability(o.items) !== "red"
  ).length;

  return {
    lowStockArticles,
    recentMovements,
    openOrders,
    techPendingOrders: techReadyOrders,
    procPendingOrders,
    incomingArticles,
  };
}
