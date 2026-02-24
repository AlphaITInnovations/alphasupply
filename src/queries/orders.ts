import { db } from "@/lib/db";
import type { StockAvailability } from "@/types/orders";
import { computeOrderStatus } from "@/types/orders";

export async function getOrders(options?: {
  status?: string;
  search?: string;
  filter?: "tech" | "proc";
}) {
  const { status, search, filter } = options ?? {};

  const orders = await db.order.findMany({
    where: {
      ...(status && status !== "ALL" && { status: status as "NEW" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED" }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { orderedBy: { contains: search, mode: "insensitive" } },
          { orderedFor: { contains: search, mode: "insensitive" } },
          { costCenter: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      items: {
        include: {
          article: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              currentStock: true,
              incomingStock: true,
              unit: true,
            },
          },
        },
      },
      mobilfunk: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const enriched = orders.map((order) => {
    const computed = computeOrderStatus(order);
    return {
      ...order,
      computedStatus: computed,
      stockAvailability: calculateStockAvailability(order.items),
    };
  });

  if (filter === "tech") {
    // Techniker: only orders with green availability (all items in stock)
    return enriched.filter((o) => o.stockAvailability === "green" && !["COMPLETED", "CANCELLED"].includes(o.computedStatus));
  }

  if (filter === "proc") {
    // Beschaffung: orders that have items needing ordering
    return enriched.filter((o) => {
      const needsOrdering = o.items.some((item) => item.article && !item.orderedAt);
      const needsMobilfunkOrdering = (o.mobilfunk ?? []).some((m: { ordered: boolean }) => !m.ordered);
      return (needsOrdering || needsMobilfunkOrdering) && !["COMPLETED", "CANCELLED"].includes(o.computedStatus);
    });
  }

  return enriched;
}

export async function getOrderById(id: string) {
  const order = await db.order.findUnique({
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
              currentStock: true,
              incomingStock: true,
              unit: true,
              productGroup: true,
              productSubGroup: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          serialNumbers: {
            select: {
              id: true,
              serialNo: true,
              status: true,
            },
          },
        },
      },
      mobilfunk: true,
    },
  });

  if (!order) return null;

  const computed = computeOrderStatus(order);
  return {
    ...order,
    computedStatus: computed,
    stockAvailability: calculateStockAvailability(order.items),
  };
}

export async function getOrderDetailFull(id: string) {
  const [order, suppliers, allArticles] = await Promise.all([
    db.order.findUnique({
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
                currentStock: true,
                incomingStock: true,
                unit: true,
                productGroup: true,
                productSubGroup: true,
                serialNumbers: {
                  where: { status: "IN_STOCK" },
                  select: { id: true, serialNo: true, isUsed: true },
                  orderBy: { serialNo: "asc" },
                },
                articleSuppliers: {
                  where: { isPreferred: true },
                  include: {
                    supplier: { select: { id: true, name: true } },
                  },
                  take: 1,
                },
              },
            },
            supplier: {
              select: { id: true, name: true },
            },
            serialNumbers: {
              select: { id: true, serialNo: true },
            },
          },
        },
        mobilfunk: true,
      },
    }),
    db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.article.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, category: true },
    }),
  ]);

  if (!order) return null;

  const computed = computeOrderStatus(order);
  return {
    ...order,
    computedStatus: computed,
    stockAvailability: calculateStockAvailability(order.items),
    suppliers,
    allArticles,
  };
}

export async function getNextOrderNumber(): Promise<string> {
  const latest = await db.order.findFirst({
    where: { orderNumber: { startsWith: "BES-" } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  if (!latest) return "BES-001";

  const num = parseInt(latest.orderNumber.replace("BES-", ""), 10);
  return `BES-${String(num + 1).padStart(3, "0")}`;
}

function calculateStockAvailability(
  items: { quantity: number; articleId: string | null; freeText: string | null; article: { currentStock: number; incomingStock: number } | null }[]
): StockAvailability {
  if (items.length === 0) return "green";

  // Free text items without article = always red (not in system)
  const hasFreeTextOnly = items.some((item) => !item.article && item.freeText);
  if (hasFreeTextOnly) return "red";

  const articleItems = items.filter((item) => item.article != null);

  const allInStock = articleItems.every(
    (item) => item.article!.currentStock >= item.quantity
  );

  if (allInStock) return "green";

  // Check if missing items are at least in transit
  const missingItems = articleItems.filter(
    (item) => item.article!.currentStock < item.quantity
  );
  const allMissingInTransit = missingItems.every(
    (item) => item.article!.currentStock + item.article!.incomingStock >= item.quantity
  );

  if (allMissingInTransit) return "yellow";

  return "red";
}
