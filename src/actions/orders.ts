"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createOrderSchema } from "@/types/orders";
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
}) {
  const parsed = createOrderSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { items, ...orderData } = parsed.data;

  try {
    const orderNumber = await getNextOrderNumber();

    const order = await db.order.create({
      data: {
        ...orderData,
        orderNumber,
        items: {
          create: items.map((item) => ({
            articleId: item.articleId || null,
            freeText: item.freeText || null,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
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

export async function cancelOrder(id: string) {
  return updateOrderStatus(id, "CANCELLED");
}
