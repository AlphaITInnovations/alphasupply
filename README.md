# AlphaSupply

Interne IT Lager- und Bestellverwaltung der Alpha IT Innovations.

## Schnellstart (Entwicklung)

```bash
# PostgreSQL starten (Docker)
docker compose -f docker-compose.dev.yml up -d

# Dependencies installieren
npm install

# Datenbank erstellen
npx prisma migrate dev

# Entwicklungsserver starten
npm run dev
```

## Deployment (Produktion)

```bash
docker compose up -d --build
```

Die App ist erreichbar unter `http://localhost:3004`.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Prisma + PostgreSQL 16
- Docker + docker-compose
