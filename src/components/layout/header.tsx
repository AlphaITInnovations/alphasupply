"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard,
  Warehouse,
  ListOrdered,
  Factory,
  PackagePlus,
  ClipboardList,
  Plus,
  Wrench,
  ShoppingCart,
  Smartphone,
} from "lucide-react";

const pageConfig: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  "/": { title: "Dashboard", description: "Übersicht und Kennzahlen", icon: LayoutDashboard },
  "/inventory/stock": { title: "Lager", description: "Aktuelle Bestände und Seriennummern", icon: Warehouse },
  "/inventory/receiving": { title: "Wareneingang", description: "Ware einbuchen und Seriennummern erfassen", icon: PackagePlus },
  "/inventory": { title: "Artikelliste", description: "Alle Artikel verwalten", icon: ListOrdered },
  "/inventory/suppliers": { title: "Lieferanten", description: "Lieferantenstammdaten verwalten", icon: Factory },
  "/orders/new": { title: "Neuer Auftrag", description: "Auftrag manuell anlegen", icon: Plus },
  "/orders": { title: "Auftragswesen", description: "Aufträge verwalten und verfolgen", icon: ClipboardList },
  "/techniker": { title: "Techniker", description: "Aufträge bearbeiten und Artikel entnehmen", icon: Wrench },
  "/procurement": { title: "Bestellwesen", description: "Nachbestellungen verwalten", icon: ShoppingCart },
  "/mobilfunk": { title: "Mobilfunk", description: "Eingerichtete Geräte im Umlauf", icon: Smartphone },
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
  const Icon = config.icon;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold leading-none">{config.title}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{config.description}</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
