import { db } from "@/lib/db";
import { computeOrderStatus } from "@/types/orders";

export async function getDashboardData() {
  // Fetch all active orders (not completed/cancelled)
  const orders = await db.order.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    include: {
      items: {
        include: {
          article: { select: { id: true, name: true, category: true, currentStock: true } },
        },
      },
      mobilfunk: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute status for each order
  const ordersWithStatus = orders.map((order) => {
    const computedStatus = computeOrderStatus({
      status: order.status,
      items: order.items.map((i) => ({
        quantity: i.quantity,
        pickedQty: i.pickedQty,
        needsOrdering: i.needsOrdering,
        orderedAt: i.orderedAt,
        receivedQty: i.receivedQty,
      })),
      mobilfunk: order.mobilfunk.map((mf) => ({
        setupDone: mf.setupDone,
        ordered: mf.ordered,
        received: mf.received,
      })),
      trackingNumber: order.trackingNumber,
      techDoneAt: order.techDoneAt,
      shippedAt: order.shippedAt,
      setupDoneAt: order.setupDoneAt,
      deliveryMethod: order.deliveryMethod,
    });

    return { ...order, computedStatus };
  });

  // Count orders per status bucket
  const counts = {
    readyToCommission: ordersWithStatus.filter((o) => o.computedStatus === "NEW").length,
    inCommission: ordersWithStatus.filter((o) => o.computedStatus === "IN_COMMISSION").length,
    inSetup: ordersWithStatus.filter((o) => o.computedStatus === "IN_SETUP").length,
    readyToShip: ordersWithStatus.filter((o) => o.computedStatus === "READY_TO_SHIP").length,
    openProcurement: ordersWithStatus.reduce((sum, o) => {
      return sum + o.items.filter((i) => i.needsOrdering && !i.orderedAt).length;
    }, 0),
    pendingReceiving: ordersWithStatus.reduce((sum, o) => {
      return sum + o.items.filter((i) => i.orderedAt && i.receivedQty < i.quantity).length;
    }, 0),
  };

  // Low stock articles - use field reference for column comparison
  let lowStockArticles: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStockLevel: number;
    category: string;
  }[];

  try {
    lowStockArticles = await db.article.findMany({
      where: {
        isActive: true,
        minStockLevel: { gt: 0 },
        currentStock: { lte: db.article.fields.minStockLevel },
      },
      select: { id: true, name: true, sku: true, currentStock: true, minStockLevel: true, category: true },
      orderBy: { currentStock: "asc" },
      take: 10,
    });
  } catch {
    // Fallback: fetch all articles with minStockLevel > 0, filter in JS
    const allWithMin = await db.article.findMany({
      where: { isActive: true, minStockLevel: { gt: 0 } },
      select: { id: true, name: true, sku: true, currentStock: true, minStockLevel: true, category: true },
      orderBy: { currentStock: "asc" },
    });
    lowStockArticles = allWithMin.filter((a) => a.currentStock < a.minStockLevel).slice(0, 10);
  }

  return { orders: ordersWithStatus, counts, lowStockArticles };
}
