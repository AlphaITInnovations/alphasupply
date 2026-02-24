import { db } from "@/lib/db";

export async function getProcurementOrders() {
  const orders = await db.order.findMany({
    where: {
      status: { in: ["NEW", "IN_COMMISSION", "IN_SETUP", "READY_TO_SHIP", "SHIPPED"] },
      OR: [
        { items: { some: { needsOrdering: true } } },
        { mobilfunk: { some: {} } },
      ],
    },
    include: {
      items: {
        where: { needsOrdering: true },
        include: {
          article: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              unit: true,
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
        },
      },
      mobilfunk: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => {
    const orderableItems = order.items.filter((i) => i.needsOrdering);
    const orderedItems = orderableItems.filter((i) => i.orderedAt);
    const orderedMf = order.mobilfunk.filter((mf) => mf.ordered);
    const totalOrderable = orderableItems.length + order.mobilfunk.length;
    const totalOrdered = orderedItems.length + orderedMf.length;

    return {
      ...order,
      totalOrderable,
      totalOrdered,
    };
  });
}

export async function getSuppliers() {
  return db.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
