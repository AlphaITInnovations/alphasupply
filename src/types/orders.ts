import { z } from "zod/v4";

export const orderStatusLabels: Record<string, string> = {
  NEW: "Neu",
  IN_COMMISSION: "Kommissionierung",
  IN_SETUP: "Einrichtung",
  READY_TO_SHIP: "Versandbereit",
  SHIPPED: "Versendet",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
};

export const orderStatusColors: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  IN_COMMISSION: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  IN_SETUP: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  READY_TO_SHIP: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  SHIPPED: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
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

// ─── Order Status Computation ──────────────────────────

type OrderForStatus = {
  status: string;
  items: {
    quantity: number;
    pickedQty: number;
    needsOrdering: boolean;
    orderedAt: Date | null;
    receivedQty: number;
  }[];
  mobilfunk: {
    setupDone: boolean;
    ordered: boolean;
    received: boolean;
  }[];
  trackingNumber: string | null;
  techDoneAt: Date | null;
  setupDoneAt: Date | null;
  shippedAt: Date | null;
  deliveryMethod: string;
};

export function computeOrderStatus(order: OrderForStatus): string {
  if (order.status === "CANCELLED") return "CANCELLED";

  const hasArticles = order.items.length > 0;
  const hasMobilfunk = order.mobilfunk.length > 0;

  // Techniker-Stream
  const allPicked = order.items.every((i) => i.pickedQty >= i.quantity);
  const allMfSetup = order.mobilfunk.every((mf) => mf.setupDone);
  const isShipped = !!order.trackingNumber || !!order.shippedAt;

  // Bestell-Stream
  const needsOrdering = order.items.some((i) => i.needsOrdering) || hasMobilfunk;
  const orderableItems = order.items.filter((i) => i.needsOrdering);
  const allOrdered = orderableItems.every((i) => i.orderedAt) &&
    order.mobilfunk.every((mf) => mf.ordered);
  const procDone = !needsOrdering || allOrdered;

  // Wareneingang-Stream
  const allReceived = orderableItems.every((i) => i.receivedQty >= i.quantity) &&
    order.mobilfunk.every((mf) => !mf.ordered || mf.received);
  const recvDone = !needsOrdering || allReceived;

  // COMPLETED: shipped AND all procurement + receiving done
  if (isShipped && procDone && recvDone) return "COMPLETED";

  // SHIPPED: shipped (trackingNumber or shippedAt set)
  if (isShipped) return "SHIPPED";

  // READY_TO_SHIP: setupDoneAt set AND all items picked AND all mobilfunk setup
  if (order.setupDoneAt && allPicked && allMfSetup) return "READY_TO_SHIP";

  // IN_SETUP: all items picked AND all mobilfunk setup (but no setupDoneAt)
  if (allPicked && allMfSetup && (hasArticles || hasMobilfunk)) return "IN_SETUP";

  // IN_COMMISSION: any items picked
  const anyPicked = order.items.some((i) => i.pickedQty > 0);
  const anyMfSetup = order.mobilfunk.some((mf) => mf.setupDone);
  if (anyPicked || anyMfSetup) return "IN_COMMISSION";

  return "NEW";
}

// ─── Cancellation Check ────────────────────────────────

export function canCancelOrder(order: OrderForStatus): boolean {
  if (order.status === "CANCELLED" || order.status === "COMPLETED") return false;
  const anyOrdered = order.items.some((i) => i.orderedAt);
  const anyPicked = order.items.some((i) => i.pickedQty > 0);
  const anyMfOrdered = order.mobilfunk.some((mf) => mf.ordered);
  return !anyOrdered && !anyPicked && !anyMfOrdered;
}
