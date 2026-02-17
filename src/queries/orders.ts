import { db } from "@/lib/db";
import type { StockAvailability } from "@/types/orders";

export async function getOrders(options?: {
  status?: string;
  search?: string;
}) {
  const { status, search } = options ?? {};

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

  // Calculate stock availability per order
  return orders.map((order) => ({
    ...order,
    stockAvailability: calculateStockAvailability(order.items),
  }));
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
        },
      },
      mobilfunk: true,
    },
  });

  if (!order) return null;

  return {
    ...order,
    stockAvailability: calculateStockAvailability(order.items),
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
