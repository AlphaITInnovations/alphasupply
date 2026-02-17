import { z } from "zod/v4";

export const articleCategoryLabels: Record<string, string> = {
  SERIALIZED: "Mit Seriennummer",
  STANDARD: "Standard",
  CONSUMABLE: "Schüttgut",
};

export const stockMovementTypeLabels: Record<string, string> = {
  IN: "Wareneingang",
  OUT: "Warenausgang",
  ADJUSTMENT: "Korrektur",
};

export const serialNumberStatusLabels: Record<string, string> = {
  IN_STOCK: "Im Lager",
  RESERVED: "Reserviert",
  DEPLOYED: "Ausgeliefert",
  DEFECTIVE: "Defekt",
  RETURNED: "Rückläufer",
  DISPOSED: "Entsorgt",
};

// ─── ZOD SCHEMAS ─────────────────────────────────────────

export const createArticleSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
  sku: z.string().min(1, "Artikelnummer ist erforderlich"),
  category: z.enum(["SERIALIZED", "STANDARD", "CONSUMABLE"]),
  isUsed: z.coerce.boolean().default(false),
  productGroup: z.string().optional(),
  productSubGroup: z.string().optional(),
  unit: z.string().default("Stk"),
  minStockLevel: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  id: z.string(),
});

export const createStockMovementSchema = z.object({
  articleId: z.string().min(1, "Artikel ist erforderlich"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().min(1, "Menge muss mindestens 1 sein"),
  reason: z.string().optional(),
  performedBy: z.string().optional(),
});

export const createSerialNumberSchema = z.object({
  serialNo: z.string().min(1, "Seriennummer ist erforderlich"),
  articleId: z.string().min(1, "Artikel ist erforderlich"),
  locationId: z.string().optional(),
  notes: z.string().optional(),
});

export const createWarehouseLocationSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  contactName: z.string().optional(),
  email: z.email("Ungültige E-Mail-Adresse").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export const createArticleSupplierSchema = z.object({
  articleId: z.string().min(1, "Artikel ist erforderlich"),
  supplierId: z.string().min(1, "Lieferant ist erforderlich"),
  supplierSku: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Preis muss positiv sein"),
  currency: z.string().default("EUR"),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  minOrderQty: z.coerce.number().int().min(1).default(1),
  isPreferred: z.boolean().default(false),
  notes: z.string().optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type CreateSerialNumberInput = z.infer<typeof createSerialNumberSchema>;
export type CreateWarehouseLocationInput = z.infer<typeof createWarehouseLocationSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateArticleSupplierInput = z.infer<typeof createArticleSupplierSchema>;
