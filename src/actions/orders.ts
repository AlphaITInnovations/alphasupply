"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createOrderSchema, computeOrderStatus, canCancelOrder } from "@/types/orders";
import type { MobilfunkItemInput } from "@/types/orders";
import { getNextOrderNumber } from "@/queries/orders";

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

  try {
    const orderNumber = await getNextOrderNumber();

    // Determine needsOrdering: ALL items need ordering UNLESS entire order is pure CONSUMABLE
    const articleIds = items.filter((i) => i.articleId).map((i) => i.articleId!);
    const articles = articleIds.length > 0
      ? await db.article.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, category: true },
        })
      : [];
    const articleMap = new Map(articles.map((a) => [a.id, a]));

    const hasFreeText = items.some((i) => !i.articleId);
    const hasMobilfunk = mobilfunk && mobilfunk.length > 0;
    const hasNonConsumable = items.some((i) => {
      if (!i.articleId) return true; // freeText = non-consumable
      const article = articleMap.get(i.articleId);
      return !article || article.category !== "CONSUMABLE";
    });

    // Order needs procurement if it has freeText, mobilfunk, or any non-CONSUMABLE article
    const orderNeedsOrdering = hasFreeText || hasMobilfunk || hasNonConsumable;

    const order = await db.order.create({
      data: {
        ...orderData,
        orderNumber,
        items: {
          create: items.map((item) => ({
            articleId: item.articleId || null,
            freeText: item.freeText || null,
            quantity: item.quantity,
            needsOrdering: orderNeedsOrdering,
          })),
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

    revalidatePath("/orders");
    revalidatePath("/");
    return { success: true, order };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    return { error: "Fehler beim Erstellen des Auftrags." };
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    await db.order.update({
      where: { id },
      data: {
        status: status as "NEW" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED",
      },
    });
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
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
      data: { status: computed as "NEW" | "IN_PROGRESS" | "READY" | "COMPLETED" | "CANCELLED" },
    });
  }
}

export async function toggleMobilfunkDelivered(id: string, delivered: boolean) {
  try {
    await db.orderMobilfunk.update({
      where: { id },
      data: { delivered },
    });
    revalidatePath("/orders");
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

    revalidatePath("/orders");
    revalidatePath(`/orders/${item.orderId}`);
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
