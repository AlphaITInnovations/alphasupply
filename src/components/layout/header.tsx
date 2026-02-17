"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import {
  LayoutDashboard,
  Warehouse,
  ListOrdered,
  ArrowLeftRight,
  Factory,
  PackagePlus,
} from "lucide-react";

const pageConfig: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  "/": { title: "Dashboard", description: "Übersicht aller Lagerdaten", icon: LayoutDashboard },
  "/inventory/stock": { title: "Lagerbestand", description: "Aktuelle Bestände und Seriennummern", icon: Warehouse },
  "/inventory/receiving": { title: "Wareneingang", description: "Ware einbuchen und Seriennummern erfassen", icon: PackagePlus },
  "/inventory": { title: "Artikelliste", description: "Alle Artikel verwalten", icon: ListOrdered },
  "/inventory/movements": { title: "Lagerbewegungen", description: "Ein- und Ausgänge nachverfolgen", icon: ArrowLeftRight },
  "/inventory/suppliers": { title: "Lieferanten", description: "Lieferantenstammdaten verwalten", icon: Factory },
};

function getPageConfig(pathname: string) {
  // Try exact match first
  if (pageConfig[pathname]) return pageConfig[pathname];
  // Try prefix matches for detail pages
  if (pathname.startsWith("/inventory/stock")) return pageConfig["/inventory/stock"];
  if (pathname.startsWith("/inventory/receiving")) return pageConfig["/inventory/receiving"];
  if (pathname.startsWith("/inventory/movements")) return pageConfig["/inventory/movements"];
  if (pathname.startsWith("/inventory/suppliers")) return pageConfig["/inventory/suppliers"];
  if (pathname.startsWith("/inventory")) return pageConfig["/inventory"];
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
