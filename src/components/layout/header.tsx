"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const pageConfig: Record<string, { title: string; description: string }> = {
  "/": { title: "Pipeline", description: "Übersicht und Kennzahlen" },
  "/inventory/stock": { title: "Lager", description: "Aktuelle Bestände und Seriennummern" },
  "/inventory/receiving": { title: "Wareneingang", description: "Ware einbuchen und Seriennummern erfassen" },
  "/inventory": { title: "Artikelliste", description: "Alle Artikel verwalten" },
  "/inventory/suppliers": { title: "Lieferanten", description: "Lieferantenstammdaten verwalten" },
  "/orders/new": { title: "Neuer Auftrag", description: "Auftrag manuell anlegen" },
  "/orders": { title: "Aufträge", description: "Aufträge verwalten und verfolgen" },
  "/techniker": { title: "Techniker", description: "Aufträge bearbeiten und Artikel entnehmen" },
  "/procurement": { title: "Bestellwesen", description: "Nachbestellungen verwalten" },
  "/mobilfunk": { title: "Mobilfunk", description: "Eingerichtete Geräte im Umlauf" },
};

function getPageConfig(pathname: string) {
  if (pageConfig[pathname]) return pageConfig[pathname];
  if (pathname.startsWith("/inventory/stock")) return pageConfig["/inventory/stock"];
  if (pathname.startsWith("/inventory/receiving")) return pageConfig["/inventory/receiving"];
  if (pathname.startsWith("/inventory/suppliers")) return pageConfig["/inventory/suppliers"];
  if (pathname.startsWith("/inventory")) return pageConfig["/inventory"];
  if (pathname.startsWith("/techniker")) return pageConfig["/techniker"];
  if (pathname.startsWith("/orders/new")) return pageConfig["/orders/new"];
  if (pathname.startsWith("/orders")) return pageConfig["/orders"];
  if (pathname.startsWith("/procurement")) return pageConfig["/procurement"];
  if (pathname.startsWith("/mobilfunk")) return pageConfig["/mobilfunk"];
  return pageConfig["/"];
}

export function Header() {
  const pathname = usePathname();
  const config = getPageConfig(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border/30 bg-background/80 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold leading-none">{config.title}</h2>
        <span className="text-xs text-muted-foreground">{config.description}</span>
      </div>
      <ThemeToggle />
    </header>
  );
}
