"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncOrderStatus } from "@/actions/orders";

export async function setTechnicianName(orderId: string, name: string) {
  await db.order.update({
    where: { id: orderId },
    data: { technicianName: name },
  });
  revalidatePath(`/techniker/${orderId}`);
}

export async function pickItem(data: {
  orderItemId: string;
  orderId: string;
  articleId: string;
  quantity: number;
  serialNumberId?: string;
  technicianName: string;
}) {
  try {
    await db.$transaction(async (tx) => {
      const article = await tx.article.findUniqueOrThrow({
        where: { id: data.articleId },
      });

      if (article.currentStock < data.quantity) {
        throw new Error(`Nicht genug Bestand. Verfügbar: ${article.currentStock}`);
      }

      // Update OrderItem
      await tx.orderItem.update({
        where: { id: data.orderItemId },
        data: {
          pickedQty: data.quantity,
          pickedBy: data.technicianName,
          pickedAt: new Date(),
        },
      });

      // Create StockMovement (OUT)
      await tx.stockMovement.create({
        data: {
          articleId: data.articleId,
          type: "OUT",
          quantity: -data.quantity,
          reason: `Entnahme für Auftrag`,
          performedBy: data.technicianName,
          orderId: data.orderId,
          orderItemId: data.orderItemId,
        },
      });

      // Reduce currentStock
      await tx.article.update({
        where: { id: data.articleId },
        data: { currentStock: { decrement: data.quantity } },
      });

      // If SERIALIZED: set SN to DEPLOYED and link to order item
      if (data.serialNumberId) {
        await tx.serialNumber.update({
          where: { id: data.serialNumberId },
          data: {
            status: "DEPLOYED",
            orderItemId: data.orderItemId,
          },
        });
      }
    });

    await syncOrderStatus(data.orderId);
    revalidatePath(`/techniker/${data.orderId}`);
    revalidatePath("/techniker");
    revalidatePath("/orders");
    revalidatePath("/inventory/stock");
    revalidatePath("/inventory/movements");
    revalidatePath("/");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { error: e.message };
    return { error: "Fehler bei der Entnahme." };
  }
}

export async function unpickItem(data: {
  orderItemId: string;
  orderId: string;
  articleId: string;
  quantity: number;
  serialNumberId?: string;
  technicianName: string;
}) {
  try {
    await db.$transaction(async (tx) => {
      // Reset OrderItem
      await tx.orderItem.update({
        where: { id: data.orderItemId },
        data: {
          pickedQty: 0,
          pickedBy: null,
          pickedAt: null,
        },
      });

      // Create StockMovement (IN) to reverse
      await tx.stockMovement.create({
        data: {
          articleId: data.articleId,
          type: "IN",
          quantity: data.quantity,
          reason: `Rückbuchung Entnahme`,
          performedBy: data.technicianName,
          orderId: data.orderId,
          orderItemId: data.orderItemId,
        },
      });

      // Restore currentStock
      await tx.article.update({
        where: { id: data.articleId },
        data: { currentStock: { increment: data.quantity } },
      });

      // If SERIALIZED: reset SN
      if (data.serialNumberId) {
        await tx.serialNumber.update({
          where: { id: data.serialNumberId },
          data: {
            status: "IN_STOCK",
            orderItemId: null,
          },
        });
      }
    });

    await syncOrderStatus(data.orderId);
    revalidatePath(`/techniker/${data.orderId}`);
    revalidatePath("/techniker");
    revalidatePath("/orders");
    revalidatePath("/inventory/stock");
    revalidatePath("/");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { error: e.message };
    return { error: "Fehler bei der Rückbuchung." };
  }
}

export async function setupMobilfunk(data: {
  mobilfunkId: string;
  orderId: string;
  imei?: string;
  phoneNumber?: string;
  technicianName: string;
}) {
  try {
    await db.orderMobilfunk.update({
      where: { id: data.mobilfunkId },
      data: {
        imei: data.imei || null,
        phoneNumber: data.phoneNumber || null,
        setupDone: true,
        setupBy: data.technicianName,
        setupAt: new Date(),
      },
    });

    await syncOrderStatus(data.orderId);
    revalidatePath(`/techniker/${data.orderId}`);
    revalidatePath("/techniker");
    revalidatePath("/orders");
    return { success: true };
  } catch {
    return { error: "Fehler beim Speichern der Mobilfunk-Einrichtung." };
  }
}

export async function resetMobilfunkSetup(mobilfunkId: string, orderId: string) {
  try {
    await db.orderMobilfunk.update({
      where: { id: mobilfunkId },
      data: {
        imei: null,
        phoneNumber: null,
        setupDone: false,
        setupBy: null,
        setupAt: null,
      },
    });

    await syncOrderStatus(orderId);
    revalidatePath(`/techniker/${orderId}`);
    revalidatePath("/techniker");
    return { success: true };
  } catch {
    return { error: "Fehler beim Zurücksetzen." };
  }
}

export async function finishTechWork(data: {
  orderId: string;
  trackingNumber?: string;
  technicianName: string;
}) {
  try {
    await db.order.update({
      where: { id: data.orderId },
      data: {
        techDoneAt: new Date(),
        shippedBy: data.technicianName,
        shippedAt: new Date(),
        trackingNumber: data.trackingNumber || null,
      },
    });

    await syncOrderStatus(data.orderId);
    revalidatePath(`/techniker/${data.orderId}`);
    revalidatePath("/techniker");
    revalidatePath("/orders");
    revalidatePath(`/orders/${data.orderId}`);
    return { success: true };
  } catch {
    return { error: "Fehler beim Abschließen der Techniker-Arbeit." };
  }
}
