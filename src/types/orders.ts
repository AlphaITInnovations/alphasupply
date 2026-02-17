import { z } from "zod/v4";

export const orderStatusLabels: Record<string, string> = {
  NEW: "Neu",
  IN_PROGRESS: "In Bearbeitung",
  READY: "Bereit",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
};

export const orderStatusColors: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  COMPLETED: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
  CANCELLED: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};

export const deliveryMethodLabels: Record<string, string> = {
  SHIPPING: "Versand",
  PICKUP: "Abholung",
};

// ─── Mobilfunk Labels ──────────────────────────────────

export const mobilfunkTypeLabels: Record<string, string> = {
  PHONE_AND_SIM: "Handy + SIM",
  PHONE_ONLY: "Nur Handy",
  SIM_ONLY: "Nur SIM",
};

export const simTypeLabels: Record<string, string> = {
  SIM: "SIM-Karte",
  ESIM: "eSIM",
};

export const mobilfunkTariffLabels: Record<string, string> = {
  STANDARD: "Standard-Tarif",
  UNLIMITED: "Unbegrenzt-Tarif",
};

// ─── Schemas ───────────────────────────────────────────

export const mobilfunkItemSchema = z.object({
  type: z.enum(["PHONE_AND_SIM", "PHONE_ONLY", "SIM_ONLY"]),
  simType: z.enum(["SIM", "ESIM"]).optional(),
  tariff: z.enum(["STANDARD", "UNLIMITED"]).optional(),
  phoneNote: z.string().optional(),
  simNote: z.string().optional(),
});

export const createOrderSchema = z.object({
  orderedBy: z.string().min(1, "Besteller ist erforderlich"),
  orderedFor: z.string().min(1, "Empfänger ist erforderlich"),
  costCenter: z.string().min(1, "Kostenstelle ist erforderlich"),
  deliveryMethod: z.enum(["SHIPPING", "PICKUP"]),
  shippingCompany: z.string().optional(),
  shippingStreet: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCity: z.string().optional(),
  pickupBy: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    articleId: z.string().optional(),
    freeText: z.string().optional(),
    quantity: z.number().int().min(1),
  })),
  mobilfunk: z.array(mobilfunkItemSchema).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type MobilfunkItemInput = z.infer<typeof mobilfunkItemSchema>;

// Stock availability for an order
export type StockAvailability = "green" | "yellow" | "red";
