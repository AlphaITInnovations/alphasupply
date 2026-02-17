import { db } from "@/lib/db";
import { computeOrderStatus } from "@/types/orders";

export async function getTechOrders() {
  const orders = await db.order.findMany({
    where: {
      status: { in: ["NEW", "IN_PROGRESS"] },
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
              unit: true,
            },
          },
        },
      },
      mobilfunk: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => {
    // Calculate tech progress
    const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const pickedItems = order.items.reduce((sum, i) => sum + i.pickedQty, 0);
    const totalMf = order.mobilfunk.length;
    const setupMf = order.mobilfunk.filter((mf) => mf.setupDone).length;

    // Ampel: green = alles am Lager, yellow = teilweise, red = fehlt
    type Availability = "green" | "yellow" | "red";
    let availability: Availability = "green";
    for (const item of order.items) {
      if (!item.article) {
        availability = "red";
        break;
      }
      if (item.article.currentStock < item.quantity) {
        availability = "red";
        break;
      }
    }
    if (availability === "green" && order.items.some((i) => i.article && i.article.currentStock === i.quantity)) {
      availability = "yellow";
    }

    return {
      ...order,
      computedStatus: computeOrderStatus(order),
      totalItems,
      pickedItems,
      totalMf,
      setupMf,
      availability,
    };
  });
}

export async function getTechOrderById(id: string) {
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
              unit: true,
              serialNumbers: {
                where: { status: "IN_STOCK" },
                select: {
                  id: true,
                  serialNo: true,
                  isUsed: true,
                },
                orderBy: { serialNo: "asc" },
              },
            },
          },
          serialNumbers: {
            select: {
              id: true,
              serialNo: true,
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
    computedStatus: computeOrderStatus(order),
  };
}
