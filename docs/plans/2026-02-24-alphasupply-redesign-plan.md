# AlphaSupply Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete UI/UX redesign with new color scheme, sidebar navigation, tier-based article categories, 3-step technician workflow, and action-oriented dashboard.

**Architecture:** Incremental migration on existing Next.js 16 + Prisma 7 + PostgreSQL stack. Schema changes first, then type system, then visual layer (CSS theme + layout), then page-by-page UI rebuild. Each task produces a working state.

**Tech Stack:** Next.js 16 App Router, Prisma 7, PostgreSQL 16, Tailwind CSS v4, shadcn/ui, Zod v4, next-themes

**Design Doc:** `docs/plans/2026-02-24-alphasupply-redesign-design.md`

---

## Task 1: Database Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_tier_rename_and_status_expansion/migration.sql`

**Step 1: Update enums in schema.prisma**

Replace `ArticleCategory`:
```prisma
enum ArticleCategory {
  HIGH_TIER   // Teure Artikel MIT Seriennummer, IMMER nachbestellen
  MID_TIER    // Artikel OHNE Seriennummer, nachbestellen pro Auftrag
  LOW_TIER    // Schüttgut (Kabel etc.), muss bei Aufträgen NICHT nachbestellt werden
}
```

Replace `OrderStatus`:
```prisma
enum OrderStatus {
  NEW              // Neu angelegt
  IN_COMMISSION    // Kommissionierung läuft
  IN_SETUP         // Einrichtung läuft
  READY_TO_SHIP    // Versandbereit
  SHIPPED          // Versendet/Abgeholt
  COMPLETED        // Abgeschlossen (inkl. Beschaffung + Wareneingang)
  CANCELLED        // Storniert
}
```

Add new fields on `Order` model (after `techDoneAt`/`procDoneAt`):
```prisma
  commissionedAt  DateTime?      // Alle Artikel kommissioniert
  commissionedBy  String?        // Wer hat kommissioniert
  setupDoneAt     DateTime?      // Einrichtung abgeschlossen
  setupDoneBy     String?        // Wer hat eingerichtet
```

Note: Keep `techDoneAt` and `technicianName` as-is for now (backward compat during migration). They will be superseded by the new fields but existing data stays intact.

**Step 2: Create migration**

Run: `npx prisma migrate dev --name tier_rename_and_status_expansion`

This will generate a SQL migration. The migration MUST handle existing data:
- Rename enum values: `SERIALIZED` → `HIGH_TIER`, `STANDARD` → `MID_TIER`, `CONSUMABLE` → `LOW_TIER`
- Rename order status values: `IN_PROGRESS` → `IN_COMMISSION`, `READY` → `READY_TO_SHIP`
- Add new enum values: `IN_SETUP`, `SHIPPED`
- Add new columns: `commissionedAt`, `commissionedBy`, `setupDoneAt`, `setupDoneBy`

**Important:** Prisma may not auto-generate enum renames. If the generated migration drops and recreates enums, manually edit it to use `ALTER TYPE ... RENAME VALUE` instead:
```sql
ALTER TYPE "ArticleCategory" RENAME VALUE 'SERIALIZED' TO 'HIGH_TIER';
ALTER TYPE "ArticleCategory" RENAME VALUE 'STANDARD' TO 'MID_TIER';
ALTER TYPE "ArticleCategory" RENAME VALUE 'CONSUMABLE' TO 'LOW_TIER';

ALTER TYPE "OrderStatus" RENAME VALUE 'IN_PROGRESS' TO 'IN_COMMISSION';
ALTER TYPE "OrderStatus" RENAME VALUE 'READY' TO 'READY_TO_SHIP';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_SETUP';
ALTER TYPE "OrderStatus" ADD VALUE 'SHIPPED';
```

**Step 3: Regenerate Prisma client**

Run: `npx prisma generate`

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: rename article categories to tier system, expand order status"
```

---

## Task 2: Type System & Business Logic Update

**Files:**
- Modify: `src/types/inventory.ts`
- Modify: `src/types/orders.ts`
- Modify: `src/actions/orders.ts` (createOrder needsOrdering logic)
- Modify: `src/actions/techniker.ts` (references to old enums)
- Modify: `src/actions/procurement.ts`
- Modify: `src/actions/receiving.ts`
- Modify: `src/actions/inventory.ts`
- Modify: `src/queries/inventory.ts`
- Modify: `src/queries/orders.ts`
- Modify: `src/queries/techniker.ts`
- Modify: `src/queries/procurement.ts`
- Modify: `src/queries/receiving.ts`

**Step 1: Update `src/types/inventory.ts`**

Replace category labels:
```typescript
export const articleCategoryLabels: Record<string, string> = {
  HIGH_TIER: "High-Tier",
  MID_TIER: "Mid-Tier",
  LOW_TIER: "Low-Tier",
};
```

Update Zod schema enum values:
```typescript
category: z.enum(["HIGH_TIER", "MID_TIER", "LOW_TIER"]),
```

**Step 2: Update `src/types/orders.ts`**

Replace status labels:
```typescript
export const orderStatusLabels: Record<string, string> = {
  NEW: "Neu",
  IN_COMMISSION: "Kommissionierung",
  IN_SETUP: "Einrichtung",
  READY_TO_SHIP: "Versandbereit",
  SHIPPED: "Versendet",
  COMPLETED: "Abgeschlossen",
  CANCELLED: "Storniert",
};
```

Replace status colors:
```typescript
export const orderStatusColors: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  IN_COMMISSION: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  IN_SETUP: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  READY_TO_SHIP: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  SHIPPED: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  COMPLETED: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
  CANCELLED: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
};
```

Rewrite `computeOrderStatus()` with new granular statuses:
```typescript
export function computeOrderStatus(order: OrderForStatus): string {
  if (order.status === "CANCELLED") return "CANCELLED";

  const hasArticles = order.items.length > 0;
  const hasMobilfunk = order.mobilfunk.length > 0;
  if (!hasArticles && !hasMobilfunk) return "NEW";

  const needsOrdering = order.items.some((i) => i.needsOrdering) || hasMobilfunk;

  // Techniker-Stream
  const allPicked = order.items.every((i) => i.pickedQty >= i.quantity);
  const allMfSetup = order.mobilfunk.every((mf) => mf.setupDone);
  const anyPicked = order.items.some((i) => i.pickedQty > 0);

  // Einrichtung & Versand
  const setupDone = !!order.setupDoneAt;
  const isShipped = !!order.shippedAt || !!order.trackingNumber;

  // Bestell-Stream
  const orderableItems = order.items.filter((i) => i.needsOrdering);
  const allOrdered = orderableItems.every((i) => i.orderedAt) &&
    order.mobilfunk.every((mf) => mf.ordered);
  const procDone = !needsOrdering || allOrdered;

  // Wareneingang-Stream
  const allReceived = orderableItems.every((i) => i.receivedQty >= i.quantity) &&
    order.mobilfunk.every((mf) => !mf.ordered || mf.received);
  const recvDone = !needsOrdering || allReceived;

  // Full completion: shipped + all procurement/receiving done
  if (isShipped && procDone && recvDone) return "COMPLETED";
  if (isShipped) return "SHIPPED";
  if (setupDone && allPicked && allMfSetup) return "READY_TO_SHIP";
  if (allPicked && allMfSetup) return "IN_SETUP";
  if (anyPicked) return "IN_COMMISSION";

  return "NEW";
}
```

Update `OrderForStatus` type to include new fields:
```typescript
type OrderForStatus = {
  status: string;
  items: { quantity: number; pickedQty: number; needsOrdering: boolean; orderedAt: Date | null; receivedQty: number; }[];
  mobilfunk: { setupDone: boolean; ordered: boolean; received: boolean; }[];
  trackingNumber: string | null;
  shippedAt: Date | null;
  setupDoneAt: Date | null;
  deliveryMethod: string;
};
```

**Step 3: Update all references to old enum values**

Search-and-replace across all `src/actions/` and `src/queries/` files:
- `"SERIALIZED"` → `"HIGH_TIER"`
- `"STANDARD"` → `"MID_TIER"`
- `"CONSUMABLE"` → `"LOW_TIER"`
- `"IN_PROGRESS"` → `"IN_COMMISSION"`
- `"READY"` → `"READY_TO_SHIP"` (careful: only where it refers to OrderStatus, not the word "ready" in other contexts)
- `techDoneAt` references: keep existing ones working, add `setupDoneAt` where the new flow needs it

**Step 4: Update `src/actions/orders.ts` createOrder()**

In the `needsOrdering` calculation, replace:
```typescript
// Old: category !== "CONSUMABLE"
// New:
const needsOrdering = item.article?.category !== "LOW_TIER";
```

**Step 5: Verify build compiles**

Run: `npm run build`

Fix any TypeScript errors from the enum renames.

**Step 6: Commit**

```bash
git add src/types/ src/actions/ src/queries/
git commit -m "feat: update type system for tier categories and granular order status"
```

---

## Task 3: New Color Scheme & CSS Theme

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace entire color scheme**

Design a new professional color palette. Replace the Slate/Indigo theme with a modern Teal/Zinc scheme:

- **Primary:** Teal (`oklch(0.55 0.15 180)`) - Professional, modern, distinct from generic blue
- **Neutrals:** Zinc-based grays
- **Status colors:** Keep green/amber/red/blue for universal recognition
- **Accent:** Warm amber for highlights

Replace `:root` and `.dark` CSS custom properties completely with the new palette. Remove all `--pipeline-*` variables (Kanban is being removed). Remove `--indigo*` variables.

Add new status-specific CSS variables:
```css
--status-new: oklch(0.55 0.15 250);
--status-commission: oklch(0.70 0.15 80);
--status-setup: oklch(0.55 0.18 300);
--status-ready: oklch(0.60 0.17 155);
--status-shipped: oklch(0.55 0.15 230);
--status-completed: oklch(0.55 0.02 260);
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: new teal/zinc color scheme replacing slate/indigo"
```

---

## Task 4: Sidebar Navigation & Layout Shell

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/navbar.tsx` (delete or repurpose)

**Step 1: Create Sidebar component**

Create `src/components/layout/sidebar.tsx`:
- Client component ("use client")
- Collapsible sidebar (wide: 240px with text labels, collapsed: 64px with icons only)
- Collapse state in localStorage for persistence
- Navigation items with lucide-react icons:
  - `LayoutDashboard` → Dashboard (/)
  - `ClipboardList` → Aufträge (/auftraege)
  - Separator
  - `Warehouse` → Lager (/lager)
  - `Package` → Artikelverwaltung (/artikelverwaltung)
  - `PackageCheck` → Wareneingang (/wareneingang)
  - Separator
  - `Truck` → Lieferanten (/lieferanten)
  - Separator (bottom)
  - Theme toggle (Sun/Moon)
- Active state highlighting via `usePathname()`
- Mobile: Sheet/drawer overlay triggered by hamburger button in a mobile header bar
- Tooltip on collapsed items showing the label

**Step 2: Update root layout**

Modify `src/app/layout.tsx`:
- Replace `<Navbar />` with `<Sidebar />`
- Change layout from vertical (`flex-col`) to horizontal (`flex`):
```tsx
<div className="flex min-h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto">
    <div className="mx-auto max-w-screen-xl px-6 py-6">
      {children}
    </div>
  </main>
</div>
```

**Step 3: Delete old Navbar**

Delete `src/components/layout/navbar.tsx` (no longer needed - sidebar replaces it entirely).

**Step 4: Verify layout works**

Run: `npm run dev` and check that the sidebar renders, collapses, navigates correctly.

**Step 5: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx
git commit -m "feat: replace top navbar with collapsible sidebar navigation"
```

---

## Task 5: Route Restructuring

**Files:**
- Create: `src/app/auftraege/page.tsx`
- Create: `src/app/auftraege/[id]/page.tsx`
- Create: `src/app/auftraege/neu/page.tsx`
- Create: `src/app/lager/page.tsx`
- Create: `src/app/artikelverwaltung/page.tsx`
- Create: `src/app/artikelverwaltung/[id]/page.tsx`
- Create: `src/app/artikelverwaltung/neu/page.tsx`
- Create: `src/app/wareneingang/page.tsx`
- Create: `src/app/lieferanten/page.tsx`
- Delete: Old route files (will be done in cleanup task)

**Step 1: Create new route stubs**

For each new route, create a minimal page that imports the existing query functions and renders placeholder content. This ensures the new routes work before the old ones are removed.

Each page stub follows this pattern:
```tsx
export const dynamic = "force-dynamic";

export default async function PageName() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Page Title</h1>
      <p className="text-muted-foreground">In Entwicklung...</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/auftraege/ src/app/lager/ src/app/artikelverwaltung/ src/app/wareneingang/ src/app/lieferanten/
git commit -m "feat: create new german route structure for all pages"
```

---

## Task 6: Dashboard Redesign

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/dashboard/action-cards.tsx`
- Create: `src/components/dashboard/order-table.tsx`
- Create: `src/components/dashboard/low-stock-alert.tsx`
- Modify: `src/queries/inventory.ts` (getPipelineOrders → getDashboardData)
- Delete later: `src/components/dashboard/pipeline-column.tsx`, `pipeline-card.tsx`

**Step 1: Create new dashboard query**

Add `getDashboardData()` to `src/queries/inventory.ts` (or create `src/queries/dashboard.ts`):
- Fetches all non-completed/cancelled orders with items and mobilfunk
- Computes status for each via `computeOrderStatus()`
- Returns counts per status bucket:
  - `readyToCommission`: orders with status NEW and green/yellow availability
  - `inSetup`: orders with status IN_SETUP
  - `readyToShip`: orders with status READY_TO_SHIP
  - `openProcurement`: count of items where needsOrdering=true && orderedAt=null
  - `pendingReceiving`: count of items where orderedAt!=null && receivedQty < quantity
- Returns the order list (active orders, sorted by createdAt desc)
- Returns low-stock articles (currentStock < minStockLevel)

**Step 2: Create ActionCards component**

`src/components/dashboard/action-cards.tsx`:
- 5 cards in a responsive grid (1 col mobile, 3 col tablet, 5 col desktop)
- Each card: icon, count (large number), label, subtle background color
- Cards are Next.js `<Link>` components:
  - "Kommissionierung" → `/auftraege?filter=commission`
  - "Einrichtung" → `/auftraege?filter=setup`
  - "Versandbereit" → `/auftraege?filter=ready`
  - "Zu bestellen" → `/auftraege?filter=procurement`
  - "Wareneingang" → `/wareneingang`

**Step 3: Create OrderTable component**

`src/components/dashboard/order-table.tsx`:
- Table with columns: Auftragsnr, Empfänger, Kostenstelle, Status (Badge), Positionen, Erstellt, Techniker
- Rows link to `/auftraege/[id]`
- Client component for sorting and search
- Shows only active orders (not completed/cancelled)

**Step 4: Create LowStockAlert component**

`src/components/dashboard/low-stock-alert.tsx`:
- Amber/warning card at bottom
- Shows articles below minStockLevel with current vs. min count
- Link to `/lager`

**Step 5: Wire up dashboard page**

Rewrite `src/app/page.tsx`:
```tsx
export const dynamic = "force-dynamic";
import { getDashboardData } from "@/queries/dashboard";
import { ActionCards } from "@/components/dashboard/action-cards";
import { OrderTable } from "@/components/dashboard/order-table";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht aller offenen Aufgaben</p>
      </div>
      <ActionCards counts={data.counts} />
      <OrderTable orders={data.orders} />
      {data.lowStockArticles.length > 0 && (
        <LowStockAlert articles={data.lowStockArticles} />
      )}
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/ src/queries/
git commit -m "feat: action-oriented dashboard with counter cards and order table"
```

---

## Task 7: Order List Page

**Files:**
- Modify: `src/app/auftraege/page.tsx`
- Create: `src/components/auftraege/order-list.tsx`
- Create: `src/components/auftraege/order-filters.tsx`
- Create: `src/components/auftraege/new-order-button.tsx`

**Step 1: Build order list page**

`src/app/auftraege/page.tsx`:
- Server component fetching orders via `getOrders()`
- Accepts `?filter=commission|setup|ready|procurement` search params
- Accepts `?search=` for text search
- Renders order list with filter controls

**Step 2: Create OrderList client component**

`src/components/auftraege/order-list.tsx`:
- Searchable, filterable table
- Columns: Auftragsnr, Empfänger, Kostenstelle, Status (colored Badge), Positionen (count), Erstellt, Techniker
- Click row → navigate to `/auftraege/[id]`
- Completed/cancelled orders in collapsible "Archiv" section

**Step 3: Create filter tabs**

`src/components/auftraege/order-filters.tsx`:
- Tabs/pills: Alle | Kommissionierung | Einrichtung | Versandbereit | Beschaffung
- Each tab updates URL search params
- Active tab styled distinctly

**Step 4: Create "Neuer Auftrag" button**

`src/components/auftraege/new-order-button.tsx`:
- Button that links to `/auftraege/neu`

**Step 5: Commit**

```bash
git add src/app/auftraege/ src/components/auftraege/
git commit -m "feat: new order list page with filter tabs at /auftraege"
```

---

## Task 8: Order Creation Page

**Files:**
- Modify: `src/app/auftraege/neu/page.tsx`
- Create: `src/components/auftraege/order-create-form.tsx`

**Step 1: Build order creation as full page (not dialog)**

`src/app/auftraege/neu/page.tsx`:
- Full page form instead of dialog (more space, better UX)
- Reuse logic from existing `src/components/orders/order-form.tsx` but rebuild UI

**Step 2: Create OrderCreateForm**

`src/components/auftraege/order-create-form.tsx`:
- Sections in a card layout:
  1. **Auftraggeber**: Besteller, Empfänger, Kostenstelle
  2. **Lieferung**: Toggle Versand/Abholung, address fields or pickup name
  3. **Artikel**: Search autocomplete from article catalog, add button, quantity. Each added article shows a row with tier badge and current stock. "Freitext hinzufügen" option for unresolved items.
  4. **Mobilfunk** (optional section, expandable): Add mobilfunk items with type/SIM/tariff
  5. **Notizen**: Textarea
- Submit calls `createOrder()` server action
- On success: redirect to `/auftraege/[newId]`

**Step 3: Commit**

```bash
git add src/app/auftraege/neu/ src/components/auftraege/order-create-form.tsx
git commit -m "feat: full-page order creation form at /auftraege/neu"
```

---

## Task 9: Order Detail Page (Core)

**Files:**
- Modify: `src/app/auftraege/[id]/page.tsx`
- Create: `src/components/auftraege/order-detail.tsx`
- Create: `src/components/auftraege/order-header.tsx`
- Create: `src/components/auftraege/order-progress.tsx`
- Create: `src/components/auftraege/order-positions.tsx`
- Create: `src/components/auftraege/order-procurement.tsx`
- Create: `src/components/auftraege/order-shipping.tsx`
- Create: `src/components/auftraege/order-mobilfunk.tsx`
- Create: `src/components/auftraege/order-notes.tsx`

This is the most complex page. Single-page layout (NO tabs), sections stacked vertically.

**Step 1: Create order detail page**

`src/app/auftraege/[id]/page.tsx`:
- Server component fetching full order via `getOrderDetailFull()`
- Renders `<OrderDetail order={order} />`

**Step 2: Create OrderHeader**

`src/components/auftraege/order-header.tsx`:
- Auftragsnummer (large), Status Badge (colored)
- Grid: Besteller | Empfänger | Kostenstelle | Erstellt am
- Techniker name (editable inline - calls `setTechnicianName`)
- Cancel button (if `canCancelOrder()`)

**Step 3: Create OrderProgress**

`src/components/auftraege/order-progress.tsx`:
- Horizontal stepper: Kommissionierung → Einrichtung → Versand
- Current step highlighted, completed steps with checkmark
- Each step shows completion percentage or "X/Y Artikel"

**Step 4: Create OrderPositions (Kommissionierung)**

`src/components/auftraege/order-positions.tsx`:
- Card section: "Positionen"
- Table of all order items
- Per row: Checkbox (entnommen), Artikelname, Tier Badge, Menge, Status
- HIGH_TIER: Serial number dropdown appears when checking "entnommen"
- Freetext items: Yellow warning badge, "Zuordnen" button opening FreetextResolveDialog
- Checking/unchecking calls `pickItem`/`unpickItem` server actions
- "Einrichtung abschließen" button (visible when all items picked, calls new action to set setupDoneAt)

**Step 5: Create OrderProcurement (Beschaffung)**

`src/components/auftraege/order-procurement.tsx`:
- Card section: "Beschaffung" (only shown if any needsOrdering items)
- Table of orderable items (HIGH_TIER + MID_TIER)
- Per row: Artikelname, Lieferant dropdown (pre-filled preferred), Bestellnr input, Status
- "Als bestellt markieren" button per item → calls `markItemOrdered`
- Mobilfunk procurement if applicable

**Step 6: Create OrderShipping (Versand)**

`src/components/auftraege/order-shipping.tsx`:
- Card section: "Versand & Lieferung"
- Shows delivery method (Versand/Abholung)
- Versand: Address display, tracking number input, "Versendet" button
- Abholung: Pickup person input, "Abgeholt" button
- Calls `finishTechWork` action (repurposed)

**Step 7: Create OrderMobilfunk**

`src/components/auftraege/order-mobilfunk.tsx`:
- Card section: "Mobilfunk" (only shown if mobilfunk items exist)
- Per mobilfunk: Type badge, IMEI input, phone number input, setup toggle
- Procurement status, receiving status

**Step 8: Create OrderNotes**

`src/components/auftraege/order-notes.tsx`:
- Card section: "Notizen"
- Display existing notes
- Future: Timeline of actions (stretch goal)

**Step 9: Wire up OrderDetail**

`src/components/auftraege/order-detail.tsx`:
- Composes all sections vertically:
```tsx
<div className="space-y-6">
  <OrderHeader order={order} />
  <OrderProgress order={order} />
  <OrderPositions order={order} articles={articles} />
  {hasOrderableItems && <OrderProcurement order={order} suppliers={suppliers} />}
  <OrderShipping order={order} />
  {hasMobilfunk && <OrderMobilfunk order={order} />}
  <OrderNotes order={order} />
</div>
```

**Step 10: Commit**

```bash
git add src/app/auftraege/[id]/ src/components/auftraege/
git commit -m "feat: single-page order detail with commission/setup/shipping sections"
```

---

## Task 10: Lager Page

**Files:**
- Modify: `src/app/lager/page.tsx`
- Create: `src/components/lager/stock-overview.tsx`
- Modify: `src/queries/inventory.ts` (getStockArticles may need adjustment)

**Step 1: Create stock overview component**

`src/components/lager/stock-overview.tsx`:
- Client component for interactivity
- Fetches articles where `currentStock > 0` OR `incomingStock > 0`
- Table columns: Artikel, SKU, Tier Badge, Bestand, Im Zulauf, Min-Bestand, Lagerort
- Bestand cell: colored (green > min, yellow = min, red < min)
- HIGH_TIER rows: expandable chevron → shows serial numbers with status dots
- Sorting by any column
- Search bar
- Filter by tier (All | High | Mid | Low)

**Step 2: Build lager page**

`src/app/lager/page.tsx`:
```tsx
export const dynamic = "force-dynamic";
import { getStockArticles } from "@/queries/inventory";
import { StockOverview } from "@/components/lager/stock-overview";

export default async function LagerPage() {
  const articles = await getStockArticles();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lager</h1>
        <p className="text-muted-foreground">Aktueller Bestand und Zulauf</p>
      </div>
      <StockOverview articles={articles} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/lager/ src/components/lager/
git commit -m "feat: new lager page with expandable serial numbers and stock indicators"
```

---

## Task 11: Artikelverwaltung Page

**Files:**
- Modify: `src/app/artikelverwaltung/page.tsx`
- Modify: `src/app/artikelverwaltung/[id]/page.tsx`
- Modify: `src/app/artikelverwaltung/neu/page.tsx`
- Create: `src/components/artikelverwaltung/article-catalog.tsx`
- Create: `src/components/artikelverwaltung/article-detail.tsx`
- Create: `src/components/artikelverwaltung/article-create.tsx`

**Step 1: Article catalog list**

`src/components/artikelverwaltung/article-catalog.tsx`:
- All articles (active and inactive)
- Columns: Name, SKU, Tier Badge, Produktgruppe, Untergruppe, EK-Preis, Bestand, Aktiv
- Filter by tier, produktgruppe, search
- "Neuer Artikel" button → links to `/artikelverwaltung/neu`
- Row click → `/artikelverwaltung/[id]`

**Step 2: Article detail page**

`src/components/artikelverwaltung/article-detail.tsx`:
- Stammdaten card (editable via ArticleForm in dialog)
- Lieferanten card (list of assigned suppliers with prices)
- Seriennummern card (only HIGH_TIER - list with status, add button)
- Bewegungshistorie card (last 20 stock movements)

**Step 3: Article create page**

`src/components/artikelverwaltung/article-create.tsx`:
- Reuse existing ArticleForm logic but in full-page layout
- Auto-generate SKU

**Step 4: Commit**

```bash
git add src/app/artikelverwaltung/ src/components/artikelverwaltung/
git commit -m "feat: artikelverwaltung catalog with detail and create pages"
```

---

## Task 12: Wareneingang Page

**Files:**
- Modify: `src/app/wareneingang/page.tsx`
- Create: `src/components/wareneingang/pending-deliveries.tsx`
- Create: `src/components/wareneingang/receive-dialog.tsx`
- Create: `src/components/wareneingang/manual-receiving.tsx`

**Step 1: Pending deliveries component**

`src/components/wareneingang/pending-deliveries.tsx`:
- Fetches ordered-but-not-received items via `getPendingReceivingOrders()`
- Grouped by order (collapsible cards)
- Per item: Artikelname, Auftragsnr, Lieferant, Bestellt am, Bestellnr
- "Einlagern" button per item

**Step 2: Receive dialog**

`src/components/wareneingang/receive-dialog.tsx`:
- Dialog that opens on "Einlagern" click
- Shows article name, expected quantity
- HIGH_TIER: Serial number input fields (one per quantity), with Neu/Gebraucht toggle
- MID_TIER/LOW_TIER: Just quantity confirmation
- Submit calls `receiveOrderItem()` server action

**Step 3: Manual receiving section**

`src/components/wareneingang/manual-receiving.tsx`:
- Expandable section at bottom: "Manueller Wareneingang"
- For goods not tied to an order (e.g., Low-Tier bulk)
- Article search, quantity, optional SN
- Calls `receiveGoods()` server action

**Step 4: Wire up page**

`src/app/wareneingang/page.tsx`:
```tsx
export const dynamic = "force-dynamic";
import { getPendingReceivingOrders } from "@/queries/receiving";
import { PendingDeliveries } from "@/components/wareneingang/pending-deliveries";
import { ManualReceiving } from "@/components/wareneingang/manual-receiving";

export default async function WareneingangPage() {
  const { orders, totals } = await getPendingReceivingOrders();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wareneingang</h1>
        <p className="text-muted-foreground">{totals.items} Positionen ausstehend</p>
      </div>
      <PendingDeliveries orders={orders} />
      <ManualReceiving />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/app/wareneingang/ src/components/wareneingang/
git commit -m "feat: standalone wareneingang page with order-based and manual receiving"
```

---

## Task 13: Lieferanten Page

**Files:**
- Modify: `src/app/lieferanten/page.tsx`
- Create: `src/components/lieferanten/supplier-list.tsx`

**Step 1: Rebuild supplier page**

Reuse existing `SupplierForm` and `SupplierTable` logic but with new styling:
- Card-based layout
- Supplier list table with edit/delete
- "Neuer Lieferant" button opening dialog

**Step 2: Commit**

```bash
git add src/app/lieferanten/ src/components/lieferanten/
git commit -m "feat: lieferanten page with new design"
```

---

## Task 14: New Server Action for Setup Completion

**Files:**
- Modify: `src/actions/techniker.ts`

**Step 1: Add `finishSetup` action**

```typescript
export async function finishSetup(data: { orderId: string; setupBy: string }) {
  await db.order.update({
    where: { id: data.orderId },
    data: {
      setupDoneAt: new Date(),
      setupDoneBy: data.setupBy,
    },
  });
  await syncOrderStatus(data.orderId);
  revalidatePath(`/auftraege/${data.orderId}`);
}
```

**Step 2: Commit**

```bash
git add src/actions/techniker.ts
git commit -m "feat: add finishSetup action for setup completion step"
```

---

## Task 15: API Route for External Order Creation

**Files:**
- Create: `src/app/api/orders/route.ts`

**Step 1: Create POST endpoint**

```typescript
import { NextResponse } from "next/server";
import { createOrderSchema } from "@/types/orders";
import { createOrder } from "@/actions/orders";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const result = await createOrder(parsed.data);
  if (result?.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, orderId: result?.orderId }, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add src/app/api/orders/
git commit -m "feat: REST API endpoint for external order creation"
```

---

## Task 16: Cleanup Old Routes & Dead Code

**Files:**
- Delete: `src/app/orders/` (entire directory)
- Delete: `src/app/inventory/` (entire directory)
- Delete: `src/app/techniker/` (entire directory)
- Delete: `src/app/procurement/` (entire directory)
- Delete: `src/app/mobilfunk/` (entire directory)
- Delete: `src/components/orders/` (entire directory)
- Delete: `src/components/inventory/` (entire directory - reusable parts already migrated)
- Delete: `src/components/techniker/` (entire directory)
- Delete: `src/components/procurement/` (entire directory)
- Delete: `src/components/dashboard/pipeline-column.tsx`
- Delete: `src/components/dashboard/pipeline-card.tsx`
- Delete: `src/components/dashboard/low-stock-strip.tsx` (replaced by low-stock-alert)
- Delete: `src/components/layout/navbar.tsx`
- Delete: `src/components/layout/page-header.tsx` (if no longer used)

**Step 1: Verify new routes work**

Run: `npm run build` — ensure no import errors.

**Step 2: Delete old files**

Remove all files listed above.

**Step 3: Build again**

Run: `npm run build` — must succeed with no errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old route structure and dead components"
```

---

## Task 17: Update CLAUDE.md and Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update project structure**

Update the Projektstruktur section:
```markdown
- `src/app/` - Next.js Seiten (App Router)
  - `/` - Dashboard
  - `/auftraege` - Auftragsliste, Anlegen, Detail
  - `/lager` - Lagerbestand
  - `/artikelverwaltung` - Artikelkatalog
  - `/wareneingang` - Wareneingang
  - `/lieferanten` - Lieferantenverwaltung
  - `/api/orders` - REST API für externe Auftragsanlage
- `src/components/layout/` - Sidebar, ThemeToggle, ThemeProvider
- `src/components/dashboard/` - Dashboard-Komponenten
- `src/components/auftraege/` - Auftrags-Komponenten
- `src/components/lager/` - Lager-Komponenten
- `src/components/artikelverwaltung/` - Artikelverwaltungs-Komponenten
- `src/components/wareneingang/` - Wareneingang-Komponenten
- `src/components/lieferanten/` - Lieferanten-Komponenten
```

Update Artikel-Kategorien section:
```markdown
## Artikel-Kategorien
- **HIGH_TIER**: Teure Artikel MIT Seriennummer, IMMER nachbestellen (Notebooks, Monitore)
- **MID_TIER**: Artikel OHNE Seriennummer, nachbestellen pro Auftrag (Headsets, Tastaturen)
- **LOW_TIER**: Verbrauchsmaterial, NICHT pro Auftrag nachbestellen (Kabel, Adapter)
```

Update Design section:
```markdown
## Design
- Farbschema: Teal/Zinc (neues Design), Sidebar-Navigation links
- Dark/Light Mode via next-themes
- UI-Sprache: Deutsch
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for redesigned application"
```

---

## Task 18: Final Build & Deploy Verification

**Step 1: Full build**

Run: `npm run build`

All pages must compile without errors.

**Step 2: Push to main**

```bash
git push origin main
```

This triggers auto-deploy on Dokploy.

**Step 3: Verify deployment**

Check https://alphasupply.int.alpha-it-innovations.org after deploy completes.
Verify: Dashboard loads, sidebar works, orders page works, lager page works.

---

## Execution Order Summary

| # | Task | Depends On | Estimated Complexity |
|---|------|-----------|---------------------|
| 1 | DB Schema Migration | - | Medium (SQL migration) |
| 2 | Type System Update | 1 | Medium (many files) |
| 3 | CSS Theme | - | Small |
| 4 | Sidebar & Layout | 3 | Medium |
| 5 | Route Stubs | - | Small |
| 6 | Dashboard | 2, 4, 5 | Large |
| 7 | Order List | 2, 4, 5 | Medium |
| 8 | Order Creation | 2, 7 | Medium |
| 9 | Order Detail | 2, 7, 14 | Large (most complex) |
| 10 | Lager | 2, 4, 5 | Medium |
| 11 | Artikelverwaltung | 2, 4, 5 | Medium |
| 12 | Wareneingang | 2, 4, 5 | Medium |
| 13 | Lieferanten | 2, 4, 5 | Small |
| 14 | Setup Action | 1 | Small |
| 15 | API Route | 2 | Small |
| 16 | Cleanup | 6-13 | Medium (verify no breaks) |
| 17 | Update Docs | 16 | Small |
| 18 | Build & Deploy | 17 | Small |

**Parallelizable:** Tasks 3+5 can run parallel to 1+2. Tasks 6-13 can be parallelized in groups (but each needs 2+4+5 done first). Task 14 can be done with Task 2.
