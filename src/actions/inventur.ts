"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function startInventory(data: {
  name: string;
  startedBy: string;
  notes?: string;
}) {
  try {
    // Get all active articles with stock
    const articles = await db.article.findMany({
      where: { isActive: true },
      select: { id: true, currentStock: true },
    });

    const inventory = await db.inventory.create({
      data: {
        name: data.name.trim(),
        startedBy: data.startedBy.trim(),
        notes: data.notes?.trim() || null,
        items: {
          create: articles.map((a) => ({
            articleId: a.id,
            expectedQty: a.currentStock,
          })),
        },
      },
    });

    revalidatePath("/inventur");
    return { success: true, inventoryId: inventory.id };
  } catch {
    return { error: "Fehler beim Starten der Inventur." };
  }
}

export async function checkInventoryItem(data: {
  inventoryItemId: string;
  countedQty: number;
  checkedBy: string;
  notes?: string;
}) {
  try {
    const item = await db.inventoryItem.findUniqueOrThrow({
      where: { id: data.inventoryItemId },
    });

    const difference = data.countedQty - item.expectedQty;

    await db.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        countedQty: data.countedQty,
        difference,
        checked: true,
        checkedBy: data.checkedBy.trim(),
        checkedAt: new Date(),
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/inventur");
    return { success: true, difference };
  } catch {
    return { error: "Fehler beim Prüfen der Position." };
  }
}

export async function applyInventoryCorrections(inventoryId: string, performedBy: string) {
  try {
    const inventory = await db.inventory.findUniqueOrThrow({
      where: { id: inventoryId },
      include: {
        items: {
          where: { checked: true, difference: { not: 0 } },
          include: { article: { select: { id: true, name: true, currentStock: true } } },
        },
      },
    });

    if (inventory.status !== "IN_PROGRESS") {
      return { error: "Inventur ist nicht mehr aktiv." };
    }

    // Apply corrections in a transaction
    await db.$transaction(async (tx) => {
      for (const item of inventory.items) {
        if (item.countedQty === null || item.difference === null || item.difference === 0) continue;

        // Create stock movement for the correction
        await tx.stockMovement.create({
          data: {
            articleId: item.articleId,
            type: "ADJUSTMENT",
            quantity: item.countedQty,
            reason: `Inventurkorrektur (${inventory.name}): Soll ${item.expectedQty}, Ist ${item.countedQty}`,
            performedBy,
          },
        });

        // Update article stock to counted value
        await tx.article.update({
          where: { id: item.articleId },
          data: { currentStock: item.countedQty },
        });
      }

      // Mark inventory as completed
      await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    });

    revalidatePath("/inventur");
    revalidatePath("/lager");
    revalidatePath("/artikelverwaltung");
    return { success: true };
  } catch {
    return { error: "Fehler beim Anwenden der Korrekturen." };
  }
}

export async function completeInventoryWithoutCorrections(inventoryId: string) {
  try {
    await db.inventory.update({
      where: { id: inventoryId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    revalidatePath("/inventur");
    return { success: true };
  } catch {
    return { error: "Fehler beim Abschließen der Inventur." };
  }
}

export async function cancelInventory(inventoryId: string) {
  try {
    await db.inventory.update({
      where: { id: inventoryId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/inventur");
    return { success: true };
  } catch {
    return { error: "Fehler beim Abbrechen der Inventur." };
  }
}
