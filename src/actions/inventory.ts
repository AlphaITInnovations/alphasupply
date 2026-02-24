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
  receivingSchema,
} from "@/types/inventory";

// ─── ARTIKEL ─────────────────────────────────────────────

/** Quick-create article from plain object (auto-generates SKU) */
export async function quickCreateArticle(data: {
  name: string;
  category: "HIGH_TIER" | "MID_TIER" | "LOW_TIER";
  unit?: string;
  minStockLevel?: number;
}) {
  try {
    // Auto-generate next SKU
    const latest = await db.article.findFirst({
      where: { sku: { startsWith: "ART-" } },
      orderBy: { sku: "desc" },
      select: { sku: true },
    });
    const num = latest ? parseInt(latest.sku.replace("ART-", ""), 10) + 1 : 1;
    const sku = `ART-${String(num).padStart(3, "0")}`;

    const article = await db.article.create({
      data: {
        name: data.name,
        sku,
        category: data.category,
        unit: data.unit || "Stk",
        minStockLevel: data.minStockLevel ?? 0,
      },
    });
    revalidatePath("/artikelverwaltung");
    revalidatePath("/lager");
    return { success: true as const, article: { id: article.id, name: article.name, sku: article.sku, category: article.category, unit: article.unit } };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { success: false as const, error: "Artikelnummer existiert bereits." };
    }
    return { success: false as const, error: "Fehler beim Erstellen des Artikels." };
  }
}

export async function createArticle(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createArticleSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const article = await db.article.create({ data: parsed.data });
    revalidatePath("/artikelverwaltung");
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
    revalidatePath("/artikelverwaltung");
    revalidatePath(`/artikelverwaltung/${id}`);
    return { success: true, article };
  } catch {
    return { error: "Fehler beim Aktualisieren des Artikels." };
  }
}

export async function deleteArticle(id: string) {
  try {
    await db.article.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/artikelverwaltung");
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

    revalidatePath("/artikelverwaltung");
    revalidatePath(`/artikelverwaltung/${articleId}`);
    revalidatePath("/lager");
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
    revalidatePath(`/artikelverwaltung/${parsed.data.articleId}`);
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
    revalidatePath(`/artikelverwaltung/${articleId}`);
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
    revalidatePath("/lager");
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
    revalidatePath("/lager");
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
    revalidatePath("/lieferanten");
    return { success: true };
  } catch {
    return { error: "Fehler beim Erstellen des Lieferanten." };
  }
}

export async function updateSupplier(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const id = raw.id as string;
  if (!id) return { error: "Lieferanten-ID fehlt." };

  const parsed = createSupplierSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await db.supplier.update({ where: { id }, data: parsed.data });
    revalidatePath("/lieferanten");
    return { success: true };
  } catch {
    return { error: "Fehler beim Aktualisieren des Lieferanten." };
  }
}

export async function deleteSupplier(id: string) {
  try {
    await db.supplier.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/lieferanten");
    return { success: true };
  } catch {
    return { error: "Fehler beim Löschen des Lieferanten." };
  }
}

// ─── WARENEINGANG ────────────────────────────────────────

export async function receiveGoods(data: {
  articleId: string;
  quantity: number;
  reason?: string;
  performedBy?: string;
  serialNumbers?: { serialNo: string; isUsed: boolean }[];
}) {
  const parsed = receivingSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { articleId, quantity, reason, performedBy, serialNumbers } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      // Create stock movement (IN)
      await tx.stockMovement.create({
        data: {
          articleId,
          type: "IN",
          quantity,
          reason: reason || "Wareneingang",
          performedBy,
        },
      });

      // Update article stock
      await tx.article.update({
        where: { id: articleId },
        data: { currentStock: { increment: quantity } },
      });

      // Create serial numbers if provided (SERIALIZED articles)
      if (serialNumbers && serialNumbers.length > 0) {
        await tx.serialNumber.createMany({
          data: serialNumbers.map((sn) => ({
            serialNo: sn.serialNo,
            articleId,
            isUsed: sn.isUsed,
            status: "IN_STOCK" as const,
          })),
        });
      }
    });

    revalidatePath("/artikelverwaltung");
    revalidatePath(`/artikelverwaltung/${articleId}`);
    revalidatePath("/lager");
    revalidatePath("/lager");
    revalidatePath("/wareneingang");
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

// ─── ARTIKEL-LIEFERANTEN ─────────────────────────────────

export async function createArticleSupplier(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = createArticleSupplierSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    await db.articleSupplier.create({ data: parsed.data });
    revalidatePath("/artikelverwaltung");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Dieser Lieferant ist bereits zugeordnet." };
    }
    return { error: "Fehler beim Zuordnen des Lieferanten." };
  }
}
