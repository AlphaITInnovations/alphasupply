"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createOrderSchema, computeOrderStatus, canCancelOrder } from "@/types/orders";
import type { MobilfunkItemInput } from "@/types/orders";

const MAX_ORDER_CREATION_RETRIES = 5;

/**
 * Check if a Prisma error is a unique constraint violation on orderNumber.
 * Prisma error code P2002 = unique constraint failed.
 */
function isUniqueConstraintError(error: unknown): boolean {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    const meta = (error as { meta?: { target?: string[] } }).meta;
    if (meta?.target?.includes("orderNumber")) {
      return true;
    }
    // Some adapters may not include meta.target; treat any P2002 during
    // order creation as a likely orderNumber conflict.
    return true;
  }
  return false;
}

export async function createOrder(data: {
  orderedBy: string;
  orderedFor: string;
  costCenter: string;
  deliveryMethod: string;
  shippingCompany?: string;
  shippingStreet?: string;
  shippingZip?: string;
  shippingCity?: string;
  pickupBy?: string;
  notes?: string;
  items: { articleId?: string; freeText?: string; quantity: number }[];
  mobilfunk?: MobilfunkItemInput[];
}) {
  const parsed = createOrderSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { items, mobilfunk, ...orderData } = parsed.data;

  // Pre-fetch article categories (outside retry loop -- this data is stable)
  const articleIds = items.filter((i) => i.articleId).map((i) => i.articleId!);
  const articles = articleIds.length > 0
    ? await db.article.findMany({
        where: { id: { in: articleIds } },
        select: { id: true, category: true },
      })
    : [];
  const articleMap = new Map(articles.map((a) => [a.id, a]));

  // Retry loop: if a concurrent request grabbed the same order number,
  // the unique constraint on orderNumber will reject the insert.
  // We re-fetch the next number and retry.
  for (let attempt = 0; attempt < MAX_ORDER_CREATION_RETRIES; attempt++) {
    try {
      const order = await db.$transaction(async (tx) => {
        const orderNumber = await getNextOrderNumberTx(tx);

        return tx.order.create({
          data: {
            ...orderData,
            orderNumber,
            items: {
              create: items.map((item) => {
                let itemNeedsOrdering = false;
                if (!item.articleId) {
                  itemNeedsOrdering = true; // freeText = needs ordering
                } else {
                  const article = articleMap.get(item.articleId);
                  itemNeedsOrdering = !article || article.category !== "LOW_TIER";
                }
                return {
                  articleId: item.articleId || null,
                  freeText: item.freeText || null,
                  quantity: item.quantity,
                  needsOrdering: itemNeedsOrdering,
                };
              }),
            },
            ...(mobilfunk && mobilfunk.length > 0 && {
              mobilfunk: {
                create: mobilfunk.map((mf) => ({
                  type: mf.type,
                  simType: mf.simType || null,
                  tariff: mf.tariff || null,
                  phoneNote: mf.phoneNote || null,
                  simNote: mf.simNote || null,
                })),
              },
            }),
          },
          include: { items: true, mobilfunk: true },
        });
      });

      revalidatePath("/auftraege");
      revalidatePath("/");
      return { success: true, order };
    } catch (e: unknown) {
      // If unique constraint violation on orderNumber, retry with a fresh number
      if (isUniqueConstraintError(e) && attempt < MAX_ORDER_CREATION_RETRIES - 1) {
        continue;
      }
      if (e instanceof Error) {
        return { error: e.message };
      }
      return { error: "Fehler beim Erstellen des Auftrags." };
    }
  }

  return { error: "Auftragsnummer konnte nach mehreren Versuchen nicht vergeben werden." };
}

/**
 * Generate the next order number inside a transaction context.
 * This ensures the read-then-write happens atomically within
 * the same transaction that creates the order.
 */
async function getNextOrderNumberTx(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]
): Promise<string> {
  const latest = await tx.order.findFirst({
    where: { orderNumber: { startsWith: "AUFTRAG-" } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  if (!latest) return "AUFTRAG-0001";

  const num = parseInt(latest.orderNumber.replace("AUFTRAG-", ""), 10);
  return `AUFTRAG-${String(num + 1).padStart(4, "0")}`;
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    await db.order.update({
      where: { id },
      data: {
        status: status as "NEW" | "IN_COMMISSION" | "IN_SETUP" | "READY_TO_SHIP" | "SHIPPED" | "COMPLETED" | "CANCELLED",
      },
    });
    revalidatePath("/auftraege");
    revalidatePath(`/auftraege/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Fehler beim Aktualisieren des Status." };
  }
}

export async function syncOrderStatus(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, mobilfunk: true },
  });
  if (!order) return;

  const computed = computeOrderStatus(order);
  if (computed !== order.status) {
    await db.order.update({
      where: { id: orderId },
      data: { status: computed as "NEW" | "IN_COMMISSION" | "IN_SETUP" | "READY_TO_SHIP" | "SHIPPED" | "COMPLETED" | "CANCELLED" },
    });
  }
}

export async function toggleMobilfunkDelivered(id: string, delivered: boolean) {
  try {
    await db.orderMobilfunk.update({
      where: { id },
      data: { delivered },
    });
    revalidatePath("/auftraege");
    return { success: true };
  } catch {
    return { error: "Fehler beim Aktualisieren." };
  }
}

export async function fetchOrderDetail(id: string) {
  const { getOrderById } = await import("@/queries/orders");
  return getOrderById(id);
}

export async function resolveFreetextItem(orderItemId: string, articleId: string) {
  try {
    const item = await db.orderItem.findUnique({ where: { id: orderItemId } });
    if (!item) return { error: "Position nicht gefunden." };
    if (item.articleId) return { error: "Position hat bereits einen Artikel." };

    await db.orderItem.update({
      where: { id: orderItemId },
      data: { articleId, freeText: null },
    });

    revalidatePath("/auftraege");
    revalidatePath(`/auftraege/${item.orderId}`);
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Fehler beim Zuweisen des Artikels." };
  }
}

export async function cancelOrder(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, mobilfunk: true },
  });

  if (!order) return { error: "Auftrag nicht gefunden." };

  if (!canCancelOrder(order)) {
    return { error: "Auftrag kann nicht storniert werden. Es wurden bereits Artikel entnommen oder bestellt." };
  }

  return updateOrderStatus(id, "CANCELLED");
}
