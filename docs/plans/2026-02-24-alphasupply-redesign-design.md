# AlphaSupply Redesign - Design Document

**Datum:** 2026-02-24
**Status:** Genehmigt

## Zusammenfassung

Vollständiges UI/UX-Redesign von AlphaSupply mit neuem Farbschema, Sidebar-Navigation, aktionsorientiertem Dashboard und durchdachtem Auftrags-Workflow. Zusätzlich: Umbenennung der Artikelkategorien auf Tier-System, 3-Schritte-Techniker-Workflow, eigene Wareneingang-Seite, getrennte Lager- und Artikelverwaltungs-Seiten.

---

## 1. Artikelkategorien (Tier-System)

| Tier | DB-Enum | Seriennummer | Nachbestellung | Beispiele |
|------|---------|-------------|----------------|-----------|
| **High-Tier** | `HIGH_TIER` | Ja, Pflicht | Ja, bei jedem Auftrag | Notebooks, Monitore, Docking Stations |
| **Mid-Tier** | `MID_TIER` | Nein | Ja, bei jedem Auftrag | Tastatur-Sets, Headsets, Webcams |
| **Low-Tier** | `LOW_TIER` | Nein | Nein (Bulk-Nachbestellung) | HDMI-Kabel, USB-Hubs, Adapter |

### Nachbestellungslogik
- High-Tier + Mid-Tier: Werden automatisch als "zu bestellen" markiert wenn ein Auftrag sie enthält
- Low-Tier: Werden aus dem Lagerbestand entnommen, keine Nachbestellung pro Auftrag
- Low-Tier Bulk-Bestellung: Manuell wenn Lagerbestand niedrig (Warnung auf Dashboard)

---

## 2. Navigation (Sidebar)

Linke Sidebar, einklappbar zu Icons. Enthält:

```
AlphaSupply [Logo]
────────────────
Dashboard        (Startseite)
Aufträge         (Liste + Anlegen)
────────────────
Lager            (Bestand + Zulauf)
Artikelverwaltung (Katalog)
Wareneingang     (Eingehende Ware)
────────────────
Lieferanten      (Stammdaten)
────────────────
☾/☀ Dark/Light Mode Toggle
```

### Mobile: Sidebar wird zum Hamburger-Menü

---

## 3. Dashboard (Landing Page `/`)

Aktionsorientierte Übersicht statt Kanban-Board.

### Zähler-Cards (oberer Bereich)
Fünf klickbare Karten, jede zeigt Anzahl offener Aufgaben:

| Card | Beschreibung | Klick-Aktion |
|------|-------------|--------------|
| **Bereit zur Kommissionierung** | Neue Aufträge, Ware auf Lager | Filtert Aufträge |
| **In Einrichtung** | Hardware wird aufgesetzt | Filtert Aufträge |
| **Versandbereit** | Eingerichtet, bereit zum Versenden | Filtert Aufträge |
| **Bestellungen offen** | High/Mid-Tier noch nicht bestellt | Filtert Aufträge |
| **Wareneingang erwartet** | Bestellt, noch nicht eingetroffen | Link zu /wareneingang |

### Auftrags-Tabelle (Hauptbereich)
- Zeigt aktive Aufträge
- Spalten: Auftragsnr, Empfänger, Kostenstelle, Status, Erstellt, Techniker
- Status als farbige Badges
- Sortierbar, durchsuchbar
- Klick öffnet Auftragsdetail

### Warnungen (unterer Bereich)
- Niedrige Lagerbestände (Artikel unter Mindestbestand)
- Link zur Lager-Seite

---

## 4. Auftrags-Lebenszyklus

### Phasen

```
         ┌──────────────────────────────────────────────┐
         │            TECHNIKER-STREAM                   │
         │  NEU → KOMMISSIONIERUNG → EINRICHTUNG → VERSAND → ABGESCHLOSSEN
         │                                               │
         │            BESCHAFFUNGS-STREAM (parallel)     │
         │       BESTELLEN → WARENEINGANG                │
         └──────────────────────────────────────────────┘
```

### Techniker-Stream (3 Schritte)

**Schritt 1: KOMMISSIONIERUNG**
- Techniker öffnet Auftrag
- Hakt jeden Artikel einzeln als "entnommen" ab
- Bei High-Tier: Wählt konkrete Seriennummer aus Dropdown
- Trägt seinen Namen ein (wird auf Auftrag gespeichert)
- Lagerbestand wird pro Artikel sofort decrementiert
- Teilkommissionierung möglich (wenn Artikel nicht auf Lager)

**Schritt 2: EINRICHTUNG**
- Kann am selben Tag oder Tage später passieren
- Notebook aufsetzen, Software installieren, konfigurieren
- Markiert als "eingerichtet" (pro Auftrag, nicht pro Artikel)

**Schritt 3: VERSAND**
- Paket verpacken
- Tracking-Nummer eintragen (optional)
- Versandart: Versand oder Abholung
- Bei Abholung: Name des Abholers eintragen
- Markiert als "versendet/abgeholt"

### Beschaffungs-Stream (parallel)

- Läuft unabhängig vom Techniker-Stream
- Nur High-Tier und Mid-Tier Positionen
- Pro Artikel: Lieferant auswählen, Bestellnummer eintragen
- Markiert Artikel als "bestellt" → `incomingStock++`
- Zwei Techniker haben Berechtigung zum Bestellen (keine Auth, Vertrauensbasis)

### Wareneingang-Stream

- Bestellte Ware trifft ein
- Eigene Seite `/wareneingang`
- Techniker markiert pro Artikel als "eingelagert"
- High-Tier: Seriennummer-Eingabe Pflicht
- `currentStock++`, `incomingStock--`

### Status-Berechnung (automatisch)

| Status | Bedingung |
|--------|-----------|
| `NEU` | Keine Aktivität |
| `IN_KOMMISSIONIERUNG` | Mindestens 1 Artikel entnommen, nicht alle |
| `IN_EINRICHTUNG` | Alle Artikel kommissioniert, Einrichtung nicht abgeschlossen |
| `VERSANDBEREIT` | Einrichtung abgeschlossen, nicht versendet |
| `VERSENDET` | Versand/Abholung erfolgt |
| `ABGESCHLOSSEN` | Versendet UND alle Beschaffungs-/Wareneingang-Streams fertig |
| `STORNIERT` | Manuell storniert (nur wenn nichts kommissioniert/bestellt) |

---

## 5. Auftragsdetail-Seite (`/auftraege/[id]`)

Alles auf einer Seite, keine Tabs. Aufgeteilt in Bereiche:

### Header
- Auftragsnummer (BES-XXX), Status-Badge
- Besteller, Empfänger, Kostenstelle
- Erstelldatum, Techniker-Name

### Fortschrittsleiste
- Visueller Fortschritt: Kommissionierung → Einrichtung → Versand
- Zeigt aktuellen Schritt farbig hervorgehoben

### Positionen-Tabelle
- Alle Artikel des Auftrags
- Pro Zeile: Artikelname, Kategorie-Badge (High/Mid/Low), Menge, Status
- Checkbox pro Artikel: "Entnommen" (Kommissionierung)
- High-Tier: Seriennummer-Dropdown wenn entnommen
- Freetext-Positionen: Markiert als "nicht aufgelöst", Button zum Zuordnen

### Beschaffungs-Bereich
- Nur sichtbar wenn High-Tier oder Mid-Tier Positionen vorhanden
- Pro Artikel: Lieferant-Dropdown, Bestellnummer-Input, Status
- "Als bestellt markieren" Button pro Artikel

### Versand-Bereich
- Versandart (Versand/Abholung)
- Adresse (bei Versand)
- Tracking-Nummer Input
- "Versand abschließen" / "Abholung bestätigen" Button

### Mobilfunk-Bereich (falls vorhanden)
- Typ (Phone+SIM, Phone only, SIM only)
- IMEI, Telefonnummer, Tarif
- Bestellstatus, Setup-Status

### Notizen & Timeline
- Freitext-Notizen
- Automatische Timeline: "Max hat Artikel X entnommen", "Lisa hat Monitor bestellt bei Dell"

---

## 6. Auftrags-Erstellung

Dialog oder eigene Seite mit:

- **Besteller** (wer den Auftrag anlegt)
- **Empfänger** (für wen)
- **Kostenstelle**
- **Lieferart:** Versand (+ Adresse) oder Abholung (+ Name)
- **Artikel hinzufügen:**
  - Suchfeld mit Autocomplete aus Artikelkatalog
  - Menge eingeben
  - Oder: Freitext-Position (wird später aufgelöst)
- **Mobilfunk hinzufügen** (optional)
- **Notizen** (Freitext)

### Automatische Logik bei Erstellung
- High-Tier + Mid-Tier Positionen → `needsOrdering = true`
- Low-Tier nur → `needsOrdering = false`
- Lagerbestand-Anzeige pro Artikel (ist genug da?)

---

## 7. Lager-Seite (`/lager`)

Zeigt nur Artikel mit `currentStock > 0` ODER `incomingStock > 0`.

### Ansicht
- Gruppierbar nach Tier (High/Mid/Low)
- Spalten: Artikel, SKU, Tier, Bestand, Im Zulauf, Min-Bestand, Lagerort
- Bestandsanzeige farbig: Grün (> min), Gelb (= min), Rot (< min)
- High-Tier Zeilen aufklappbar → individuelle Seriennummern mit Status (Im Lager / Reserviert / Ausgegeben / Defekt)

### Aktionen
- Manuelle Bestandskorrektur (Inventur)
- Seriennummer hinzufügen (bei High-Tier)

---

## 8. Artikelverwaltung (`/artikelverwaltung`)

Kompletter Katalog aller Artikel, auch ohne Bestand.

### Ansicht
- Alle Artikel, filterbar nach Tier, Produktgruppe, Suchtext
- Spalten: Name, SKU, Tier, Produktgruppe, Untergruppe, EK-Preis, Bestand, Status (aktiv/inaktiv)
- Inline-Edit oder Detail-Seite pro Artikel

### Artikel-Detail
- Stammdaten bearbeiten
- Zugewiesene Lieferanten mit Preisen
- Seriennummern-Liste (High-Tier)
- Bewegungshistorie (letzte Stock Movements)

### Artikel anlegen
- Name, Tier-Kategorie, Produktgruppe, Untergruppe
- EK-Preis, Einheit, Mindestbestand
- SKU wird automatisch generiert (ART-XXX)

---

## 9. Wareneingang-Seite (`/wareneingang`)

Eigene Seite für eingehende Lieferungen.

### Ansicht
- Liste aller bestellten, noch nicht eingetroffenen Positionen
- Gruppiert nach Auftrag
- Pro Position: Artikelname, Auftragsnr, Lieferant, Bestellt am, Bestellnr
- "Einlagern" Button pro Position

### Einlagerungs-Flow
1. Klick auf "Einlagern"
2. Bei High-Tier: Seriennummer-Eingabe (Pflicht), Neu/Gebraucht Toggle
3. Menge bestätigen
4. `currentStock++`, `incomingStock--`
5. Position als empfangen markiert
6. Auftragsstatus wird neu berechnet

### Zusätzlich: Manueller Wareneingang
- Für Ware die nicht zu einem Auftrag gehört (z.B. Low-Tier Bulk-Bestellung)
- Artikel suchen, Menge eingeben, ggf. SN eingeben

---

## 10. Lieferanten-Seite (`/lieferanten`)

- CRUD für Lieferantenstammdaten
- Name, Ansprechpartner, E-Mail, Telefon, Website
- Zugewiesene Artikel mit Preisen (Artikel-Lieferanten-Zuordnung)

---

## 11. Visuelles Design

### Prinzipien
- **Komplett neues Farbschema** - Modern, clean, professionell
- **Dark/Light Mode** via next-themes
- **Sidebar-Navigation** links, einklappbar
- **Card-basiertes Layout** mit klarer Hierarchie
- **Große, klickbare Elemente** - auch auf Tablets nutzbar
- **Viel Whitespace** - nicht überladen
- **Subtile Animationen** für Feedback
- **Deutsche UI-Sprache** durchgehend

### Farbschema (wird im Frontend-Design-Skill erarbeitet)
- Neues Primary Color (nicht mehr Indigo)
- Status-Farben: Grün (fertig), Gelb (in Arbeit), Rot (Achtung), Blau (Info)
- Neutrale Grautöne für Hintergründe

### Typografie
- Geist Sans bleibt (modern, gut lesbar)
- Klare Größen-Hierarchie

### Technologie
- Next.js 16 App Router (bleibt)
- Tailwind CSS v4 + shadcn/ui (bleibt, wird neu gestylt)
- Server Components + Server Actions (bleibt)
- Prisma 7 + PostgreSQL (bleibt)

---

## 12. DB-Schema-Änderungen

### Enum-Änderung: ArticleCategory
```
SERIALIZED → HIGH_TIER
STANDARD   → MID_TIER
CONSUMABLE → LOW_TIER
```

### Neue Felder auf Order
- `commissionedAt` (DateTime?) - Wann vollständig kommissioniert
- `commissionedBy` (String?) - Wer kommissioniert hat
- `setupDoneAt` (DateTime?) - Wann Einrichtung abgeschlossen (ersetzt techDoneAt)
- `setupDoneBy` (String?) - Wer eingerichtet hat

### Status-Enum erweitern
```
NEW
IN_COMMISSION    (neu)
IN_SETUP         (neu, ersetzt IN_PROGRESS)
READY_TO_SHIP    (neu, ersetzt READY)
SHIPPED
COMPLETED
CANCELLED
```

### Bestehende Felder beibehalten
- `pickedQty`, `pickedBy`, `pickedAt` auf OrderItem (für pro-Artikel Kommissionierung)
- `techDoneAt` → wird zu `setupDoneAt`
- Alle Beschaffungs-Felder bleiben
- Alle Wareneingang-Felder bleiben

---

## 13. API-Vorbereitung

Auftragsanlage soll von externen Tools ansteuerbar sein:
- Server Actions bleiben als primäre Mutation-Methode
- Zusätzlich: REST API Route für `POST /api/orders` (für externe Integration)
- Selbe Validierung (Zod Schema) wie bei manueller Anlage
- Freetext-Positionen erlaubt (werden manuell aufgelöst)

---

## 14. Was NICHT geändert wird

- PostgreSQL Datenbank und Prisma ORM
- Docker-Deployment auf Dokploy
- Server Components / Server Actions Architektur
- Grundlegende Datenmodelle (Article, SerialNumber, StockMovement, Supplier, etc.)
- Mobilfunk-Feature (bleibt wie implementiert)
- Auto-Deploy via GitHub Push to main
