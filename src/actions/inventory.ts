"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  createArticleSchema,
  updateArticleSchema,
  createStockMovementSchema,
  createSerialNumberSchema,
  createWarehouseLocationSchema,
  createSupplierSchema,
  createArticleSupplierSchema,
} from "@/types/inventory";

// ─── ARTIKEL ─────────────────────────────────────────────

export async function createArticle(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createArticleSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const article = await db.article.create({ data: parsed.data });
    revalidatePath("/inventory");
    return { success: true, article };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Diese Artikelnummer (SKU) existiert bereits." };
    }
    return { error: "Fehler beim Erstellen des Artikels." };
  }
}

export async function updateArticle(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = updateArticleSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { id, ...data } = parsed.data;

  try {
    const article = await db.article.update({ where: { id }, data });
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { success: true, article };
  } catch {
    return { error: "Fehler beim Aktualisieren des Artikels." };
  }
}

export async function deleteArticle(id: string) {
  try {
    await db.article.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/inventory");
    return { success: true };
  } catch {
    return { error: "Fehler beim Löschen des Artikels." };
  }
}

// ─── LAGERBEWEGUNGEN ─────────────────────────────────────

export async function createStockMovement(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createStockMovementSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { articleId, type, quantity, reason, performedBy } = parsed.data;

  try {
    const quantityDelta = type === "OUT" ? -quantity : quantity;

    await db.$transaction(async (tx) => {
      // Prüfe ob genug Bestand vorhanden bei Ausgang
      if (type === "OUT") {
        const article = await tx.article.findUniqueOrThrow({
          where: { id: articleId },
        });
        if (article.currentStock < quantity) {
          throw new Error(
            `Nicht genug Bestand. Verfügbar: ${article.currentStock}, Angefordert: ${quantity}`
          );
        }
      }

      // Lagerbewegung erstellen
      await tx.stockMovement.create({
        data: {
          articleId,
          type,
          quantity: quantityDelta,
          reason,
          performedBy,
        },
      });

      // Bestand aktualisieren
      await tx.article.update({
        where: { id: articleId },
        data: {
          currentStock:
            type === "ADJUSTMENT"
              ? quantity // Bei Korrektur: absoluter Wert
              : { increment: quantityDelta },
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath(`/inventory/${articleId}`);
    revalidatePath("/inventory/movements");
    revalidatePath("/");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    return { error: "Fehler bei der Lagerbewegung." };
  }
}

// ─── SERIENNUMMERN ───────────────────────────────────────

export async function createSerialNumber(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createSerialNumberSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await db.serialNumber.create({ data: parsed.data });
    revalidatePath(`/inventory/${parsed.data.articleId}`);
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Diese Seriennummer existiert bereits." };
    }
    return { error: "Fehler beim Erstellen der Seriennummer." };
  }
}

export async function updateSerialNumberStatus(
  id: string,
  status: string,
  articleId: string
) {
  try {
    await db.serialNumber.update({
      where: { id },
      data: { status: status as "IN_STOCK" | "RESERVED" | "DEPLOYED" | "DEFECTIVE" | "RETURNED" | "DISPOSED" },
    });
    revalidatePath(`/inventory/${articleId}`);
    return { success: true };
  } catch {
    return { error: "Fehler beim Aktualisieren der Seriennummer." };
  }
}

// ─── LAGERORTE ───────────────────────────────────────────

export async function createWarehouseLocation(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createWarehouseLocationSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await db.warehouseLocation.create({ data: parsed.data });
    revalidatePath("/inventory/locations");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Dieser Lagerort existiert bereits." };
    }
    return { error: "Fehler beim Erstellen des Lagerorts." };
  }
}

export async function deleteWarehouseLocation(id: string) {
  try {
    await db.warehouseLocation.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/inventory/locations");
    return { success: true };
  } catch {
    return { error: "Fehler beim Löschen des Lagerorts." };
  }
}

// ─── LIEFERANTEN ─────────────────────────────────────────

export async function createSupplier(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createSupplierSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await db.supplier.create({ data: parsed.data });
    revalidatePath("/inventory/suppliers");
    return { success: true };
  } catch {
    return { error: "Fehler beim Erstellen des Lieferanten." };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await db.supplier.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/inventory/suppliers");
    return { success: true };
  } catch {
    return { error: "Fehler beim Löschen des Lieferanten." };
  }
}

// ─── ARTIKEL-LIEFERANTEN ─────────────────────────────────

export async function createArticleSupplier(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createArticleSupplierSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await db.articleSupplier.create({ data: parsed.data });
    revalidatePath("/inventory");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Dieser Lieferant ist bereits zugeordnet." };
    }
    return { error: "Fehler beim Zuordnen des Lieferanten." };
  }
}
