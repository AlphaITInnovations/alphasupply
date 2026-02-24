# AlphaSupply

Interne IT Lager-, Bestell- und Auftragsverwaltung der Alpha IT Innovations.

## Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **ORM:** Prisma 7 + PostgreSQL 16
- **Validation:** Zod v4
- **Deployment:** Docker + docker-compose via Dokploy

## Projektstruktur
- `src/app/` - Next.js Seiten (App Router)
  - `/` - Dashboard (Aktionsübersicht)
  - `/auftraege` - Auftragsliste, Anlegen, Detail
  - `/lager` - Lagerbestand mit Seriennummern
  - `/artikelverwaltung` - Artikelkatalog (CRUD)
  - `/wareneingang` - Wareneingang (auftrags- und manuell)
  - `/lieferanten` - Lieferantenverwaltung
  - `/api/orders` - REST API für externe Auftragsanlage
- `src/components/ui/` - shadcn/ui Basis-Komponenten
- `src/components/layout/` - Sidebar, ThemeToggle, ThemeProvider
- `src/components/dashboard/` - Dashboard-Komponenten (ActionCards, OrderTable, LowStockAlert)
- `src/components/auftraege/` - Auftrags-Komponenten (List, Create, Detail, Positions, Procurement, Shipping)
- `src/components/lager/` - Lager-Komponenten (StockOverview)
- `src/components/artikelverwaltung/` - Artikelverwaltungs-Komponenten (Catalog, Detail, CreateForm)
- `src/components/wareneingang/` - Wareneingang-Komponenten
- `src/components/lieferanten/` - Lieferanten-Komponenten
- `src/actions/` - Server Actions (Mutationen)
- `src/queries/` - Daten-Abfragen (Server Components)
- `src/types/` - Zod-Schemas und TypeScript-Typen
- `src/lib/db.ts` - Prisma Client Singleton
- `prisma/schema.prisma` - Datenbank-Schema

## Befehle
- `npm run dev` - Entwicklungsserver (benötigt laufende PostgreSQL)
- `npm run build` - Produktion-Build
- `npx prisma migrate dev` - DB-Migration erstellen/anwenden
- `npx prisma generate` - Prisma Client generieren
- `npx prisma studio` - DB-Browser

## Artikel-Kategorien (Tier-System)
- **HIGH_TIER**: Teure Artikel MIT Seriennummer, IMMER nachbestellen (Notebooks, Monitore, Docking Stations)
- **MID_TIER**: Artikel OHNE Seriennummer, nachbestellen pro Auftrag (Headsets, Tastaturen, Webcams)
- **LOW_TIER**: Verbrauchsmaterial, NICHT pro Auftrag nachbestellen (Kabel, Adapter, USB-Hubs)

## Auftrags-Workflow
- **Techniker-Stream:** NEU → KOMMISSIONIERUNG → EINRICHTUNG → VERSANDBEREIT → VERSENDET
- **Beschaffungs-Stream (parallel):** BESTELLEN → WARENEINGANG
- **Status:** NEW, IN_COMMISSION, IN_SETUP, READY_TO_SHIP, SHIPPED, COMPLETED, CANCELLED
- Status wird automatisch berechnet via `computeOrderStatus()` in `src/types/orders.ts`

## Design
- Farbschema: Teal/Zinc, Sidebar-Navigation links (einklappbar)
- Dark/Light Mode via next-themes
- UI-Sprache: Deutsch

## Infrastruktur
- **Dokploy Server:** SRV-AI-APPS (10.120.200.57)
- **App-Port:** 3004
- **URL:** alphasupply.int.alpha-it-innovations.org
- **GitHub:** AlphaITInnovations/alphasupply
