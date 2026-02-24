"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncOrderStatus } from "@/actions/orders";

export async function setTechnicianName(orderId: string, name: string) {
  try {
    await db.order.update({
      where: { id: orderId },
      data: { technicianName: name },
    });
    revalidatePath(`/auftraege/${orderId}`);
    return { success: true };
  } catch {
    return { error: "Fehler beim Setzen des Technikernamens." };
  }
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

      // HIGH_TIER articles require a serial number
      if (article.category === "HIGH_TIER" && !data.serialNumberId) {
        throw new Error("Seriennummer erforderlich für serialisierte Artikel.");
      }

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
    revalidatePath(`/auftraege/${data.orderId}`);
    revalidatePath("/auftraege");
    revalidatePath("/lager");
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
    revalidatePath(`/auftraege/${data.orderId}`);
    revalidatePath("/auftraege");
    revalidatePath("/lager");
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
    revalidatePath(`/auftraege/${data.orderId}`);
    revalidatePath("/auftraege");
    revalidatePath("/");
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
    revalidatePath(`/auftraege/${orderId}`);
    revalidatePath("/auftraege");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Fehler beim Zurücksetzen." };
  }
}

export async function finishSetup(data: {
  orderId: string;
  setupBy: string;
}) {
  try {
    await db.order.update({
      where: { id: data.orderId },
      data: {
        setupDoneAt: new Date(),
        setupDoneBy: data.setupBy,
      },
    });

    await syncOrderStatus(data.orderId);
    revalidatePath(`/auftraege/${data.orderId}`);
    revalidatePath("/auftraege");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Fehler beim Abschließen der Einrichtung." };
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
    revalidatePath(`/auftraege/${data.orderId}`);
    revalidatePath("/auftraege");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Fehler beim Abschließen der Techniker-Arbeit." };
  }
}
