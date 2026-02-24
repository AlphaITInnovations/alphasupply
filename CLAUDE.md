# AlphaSupply

Interne IT Lager-, Bestell- und Auftragsverwaltung der Alpha IT Innovations.

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **ORM:** Prisma 7 + PostgreSQL 16
- **Validation:** Zod
- **Deployment:** Docker + docker-compose via Dokploy

## Projektstruktur
- `src/app/` - Next.js Seiten (App Router)
- `src/components/ui/` - shadcn/ui Basis-Komponenten
- `src/components/layout/` - Layout (Navbar, PageHeader, ThemeToggle)
- `src/components/inventory/` - Lagerverwaltungs-Komponenten
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

## Artikel-Kategorien
- **SERIALIZED**: Teure Artikel MIT Seriennummer, IMMER nachbestellen
- **STANDARD**: Artikel OHNE Seriennummer, nachbestellen pro Auftrag
- **CONSUMABLE**: Verbrauchsmaterial, nachbestellen wenn leer

## Design
- Farbschema: Slate/Indigo (Primary oklch(0.55 0.23 264)), horizontale Top-Nav
- Dark/Light Mode via next-themes
- UI-Sprache: Deutsch

## Phasen
- **Phase 1** (aktuell): Lagerverwaltung
- Phase 2: Auftragsverwaltung (Bestellungen)
- Phase 3: Beschaffungswesen (Nachbestellungen)
- Phase 4: Versand-/Liefertracking

## Infrastruktur
- **Dokploy Server:** SRV-AI-APPS (10.120.200.57)
- **App-Port:** 3004
- **URL:** alphasupply.int.alpha-it-innovations.org
- **GitHub:** AlphaITInnovations/alphasupply
