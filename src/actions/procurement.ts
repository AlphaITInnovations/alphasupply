"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncOrderStatus } from "@/actions/orders";

export async function markItemOrdered(data: {
  orderItemId: string;
  orderId: string;
  supplierId: string;
  supplierOrderNo: string;
  orderedBy: string;
}) {
  try {
    await db.orderItem.update({
      where: { id: data.orderItemId },
      data: {
        supplierId: data.supplierId,
        supplierOrderNo: data.supplierOrderNo,
        orderedAt: new Date(),
        orderedBy: data.orderedBy,
      },
    });

    // If article exists, increment incomingStock
    const item = await db.orderItem.findUnique({
      where: { id: data.orderItemId },
      select: { articleId: true, quantity: true },
    });
    if (item?.articleId) {
      await db.article.update({
        where: { id: item.articleId },
        data: { incomingStock: { increment: item.quantity } },
      });
    }

    await syncOrderStatus(data.orderId);
    revalidatePath("/procurement");
    revalidatePath("/orders");
    revalidatePath(`/orders/${data.orderId}`);
    revalidatePath("/inventory/stock");
    revalidatePath("/inventory/receiving");
    return { success: true };
  } catch {
    return { error: "Fehler beim Markieren als bestellt." };
  }
}

export async function markMobilfunkOrdered(data: {
  mobilfunkId: string;
  orderId: string;
  providerOrderNo: string;
  orderedBy: string;
}) {
  try {
    await db.orderMobilfunk.update({
      where: { id: data.mobilfunkId },
      data: {
        ordered: true,
        orderedBy: data.orderedBy,
        orderedAt: new Date(),
        providerOrderNo: data.providerOrderNo,
      },
    });

    await syncOrderStatus(data.orderId);
    revalidatePath("/procurement");
    revalidatePath("/orders");
    revalidatePath(`/orders/${data.orderId}`);
    revalidatePath("/inventory/receiving");
    return { success: true };
  } catch {
    return { error: "Fehler beim Markieren als bestellt." };
  }
}

export async function finishProcurement(orderId: string) {
  try {
    await db.order.update({
      where: { id: orderId },
      data: { procDoneAt: new Date() },
    });

    await syncOrderStatus(orderId);
    revalidatePath("/procurement");
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch {
    return { error: "Fehler beim Abschließen der Beschaffung." };
  }
}
