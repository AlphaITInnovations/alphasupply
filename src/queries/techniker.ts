import { db } from "@/lib/db";
import { computeOrderStatus } from "@/types/orders";

export async function getTechOrders() {
  const orders = await db.order.findMany({
    where: {
      status: { in: ["NEW", "IN_COMMISSION", "IN_SETUP", "READY_TO_SHIP"] },
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

  return orders
    .filter((order) => !order.techDoneAt)
    .map((order) => {
      // Calculate tech progress
      const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
      const pickedItems = order.items.reduce((sum, i) => sum + i.pickedQty, 0);
      const totalMf = order.mobilfunk.length;
      const setupMf = order.mobilfunk.filter((mf) => mf.setupDone).length;

      // Ampel: green = alles am Lager, yellow = knapp, red = fehlt/auf Zulauf
      const availability = computeAvailability(order.items);

      return {
        ...order,
        computedStatus: computeOrderStatus(order),
        totalItems,
        pickedItems,
        totalMf,
        setupMf,
        availability,
      };
    })
    // Nur Aufträge anzeigen wo Hardware verfügbar ist (grün/gelb)
    .filter((order) => order.availability !== "red");
}

/**
 * Berechnet die Lagerverfügbarkeit eines Auftrags.
 * Bereits entnommene Positionen werden ignoriert.
 * - green: alles am Lager (mehr als genug)
 * - yellow: alles am Lager, aber knapp (Bestand = benötigte Menge)
 * - red: Hardware fehlt oder auf Zulauf
 */
export type Availability = "green" | "yellow" | "red";

export function computeAvailability(
  items: { quantity: number; pickedQty: number; article: { currentStock: number } | null }[]
): Availability {
  let availability: Availability = "green";

  for (const item of items) {
    const remaining = item.quantity - item.pickedQty;
    if (remaining <= 0) continue; // Bereits vollständig entnommen

    if (!item.article) {
      // Freitext-Position noch nicht entnommen → Hardware fehlt
      availability = "red";
      break;
    }
    if (item.article.currentStock < remaining) {
      availability = "red";
      break;
    }
  }

  if (availability === "green") {
    // Prüfe ob Bestand nur knapp reicht
    const tight = items.some((i) => {
      const remaining = i.quantity - i.pickedQty;
      return remaining > 0 && i.article && i.article.currentStock === remaining;
    });
    if (tight) availability = "yellow";
  }

  return availability;
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
