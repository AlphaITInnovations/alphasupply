import { db } from "@/lib/db";

export async function getPendingReceivingOrders() {
  const orders = await db.order.findMany({
    where: {
      status: { in: ["NEW", "IN_COMMISSION", "IN_SETUP", "READY_TO_SHIP", "SHIPPED"] },
      OR: [
        {
          items: {
            some: {
              needsOrdering: true,
              orderedAt: { not: null },
            },
          },
        },
        {
          mobilfunk: {
            some: {
              ordered: true,
              received: false,
            },
          },
        },
      ],
    },
    include: {
      items: {
        where: {
          needsOrdering: true,
          orderedAt: { not: null },
        },
        include: {
          article: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              unit: true,
            },
          },
          supplier: {
            select: { id: true, name: true },
          },
        },
      },
      mobilfunk: {
        where: {
          ordered: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => {
    const pendingItems = order.items.filter((i) => i.receivedQty < i.quantity);
    const pendingMf = order.mobilfunk.filter((mf) => !mf.received);
    const totalPending = pendingItems.length + pendingMf.length;
    const totalDone = (order.items.length - pendingItems.length) + (order.mobilfunk.length - pendingMf.length);

    return {
      ...order,
      pendingItems,
      pendingMf,
      totalPending,
      totalDone,
      totalItems: order.items.length + order.mobilfunk.length,
    };
  }).filter((o) => o.totalPending > 0);
}
