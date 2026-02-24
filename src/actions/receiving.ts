"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncOrderStatus } from "@/actions/orders";

export async function receiveOrderItem(data: {
  orderItemId: string;
  orderId: string;
  articleId: string;
  quantity: number;
  performedBy?: string;
  serialNumbers?: { serialNo: string; isUsed: boolean }[];
}) {
  try {
    await db.$transaction(async (tx) => {
      // Check if order is cancelled
      const order = await tx.order.findUniqueOrThrow({ where: { id: data.orderId } });
      if (order.status === "CANCELLED") {
        throw new Error("Wareneingang für stornierte Aufträge nicht möglich.");
      }

      // Check if item was already fully received
      const existingItem = await tx.orderItem.findUniqueOrThrow({ where: { id: data.orderItemId } });
      if (existingItem.receivedQty >= existingItem.quantity) {
        throw new Error("Artikel wurde bereits vollständig empfangen.");
      }

      // Update OrderItem receivedQty
      await tx.orderItem.update({
        where: { id: data.orderItemId },
        data: {
          receivedQty: data.quantity,
          receivedAt: new Date(),
        },
      });

      // Create StockMovement (IN)
      await tx.stockMovement.create({
        data: {
          articleId: data.articleId,
          type: "IN",
          quantity: data.quantity,
          reason: "Wareneingang (Auftrag)",
          performedBy: data.performedBy,
          orderId: data.orderId,
          orderItemId: data.orderItemId,
        },
      });

      // Update article: currentStock up, incomingStock down
      await tx.article.update({
        where: { id: data.articleId },
        data: {
          currentStock: { increment: data.quantity },
          incomingStock: { decrement: data.quantity },
        },
      });

      // Create serial numbers if provided
      if (data.serialNumbers && data.serialNumbers.length > 0) {
        await tx.serialNumber.createMany({
          data: data.serialNumbers.map((sn) => ({
            serialNo: sn.serialNo,
            articleId: data.articleId,
            isUsed: sn.isUsed,
            status: "IN_STOCK" as const,
            orderItemId: data.orderItemId,
          })),
        });
      }
    });

    await syncOrderStatus(data.orderId);
    revalidatePath("/wareneingang");
    revalidatePath("/lager");
    revalidatePath("/auftraege");
    revalidatePath(`/auftraege/${data.orderId}`);
    revalidatePath("/");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message.includes("Unique constraint")) {
        return { error: "Eine oder mehrere Seriennummern existieren bereits." };
      }
      return { error: e.message };
    }
    return { error: "Fehler beim Wareneingang." };
  }
}

export async function receiveFreeTextItem(data: {
  orderItemId: string;
  orderId: string;
  performedBy?: string;
}) {
  try {
    // Check if order is cancelled
    const order = await db.order.findUniqueOrThrow({ where: { id: data.orderId } });
    if (order.status === "CANCELLED") {
      throw new Error("Wareneingang für stornierte Aufträge nicht möglich.");
    }

    // Fetch item to get actual quantity
    const item = await db.orderItem.findUniqueOrThrow({ where: { id: data.orderItemId } });
    await db.orderItem.update({
      where: { id: data.orderItemId },
      data: {
        receivedQty: item.quantity,
        receivedAt: new Date(),
      },
    });

    await syncOrderStatus(data.orderId);
    revalidatePath("/wareneingang");
    revalidatePath("/auftraege");
    revalidatePath(`/auftraege/${data.orderId}`);
    return { success: true };
  } catch {
    return { error: "Fehler beim Wareneingang." };
  }
}

export async function receiveMobilfunk(data: {
  mobilfunkId: string;
  orderId: string;
}) {
  try {
    // Check if order is cancelled
    const order = await db.order.findUniqueOrThrow({ where: { id: data.orderId } });
    if (order.status === "CANCELLED") {
      throw new Error("Wareneingang für stornierte Aufträge nicht möglich.");
    }

    await db.orderMobilfunk.update({
      where: { id: data.mobilfunkId },
      data: {
        received: true,
        receivedAt: new Date(),
      },
    });

    await syncOrderStatus(data.orderId);
    revalidatePath("/wareneingang");
    revalidatePath("/auftraege");
    revalidatePath(`/auftraege/${data.orderId}`);
    return { success: true };
  } catch {
    return { error: "Fehler beim Wareneingang." };
  }
}
