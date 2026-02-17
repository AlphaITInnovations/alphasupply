"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  LayoutDashboard,
  Warehouse,
  ArrowLeftRight,
  Factory,
  ListOrdered,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Lager",
    items: [
      { name: "Lagerbestand", href: "/inventory/stock", icon: Warehouse },
      { name: "Artikelliste", href: "/inventory", icon: ListOrdered },
      { name: "Lagerbewegungen", href: "/inventory/movements", icon: ArrowLeftRight },
      { name: "Lieferanten", href: "/inventory/suppliers", icon: Factory },
    ],
  },
  {
    name: "Aufträge",
    href: "/orders",
    icon: ClipboardList,
    disabled: true,
  },
  {
    name: "Beschaffung",
    href: "/procurement",
    icon: ShoppingCart,
    disabled: true,
  },
  {
    name: "Versand",
    href: "/shipping",
    icon: Truck,
    disabled: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-sidebar-foreground">
                AlphaSupply
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                Lagerverwaltung
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            if ("items" in item && item.items) {
              return (
                <div key={item.name} className="space-y-0.5">
                  <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {item.name}
                  </p>
                  {item.items.map((subItem) => {
                    const knownSubPaths = ["/inventory/stock", "/inventory/movements", "/inventory/suppliers", "/inventory/locations"];
                    const isActive =
                      subItem.href === "/inventory"
                        ? pathname === "/inventory" ||
                          (pathname.startsWith("/inventory/") &&
                            !knownSubPaths.some((p) => pathname.startsWith(p)))
                        : pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href!);
            const Icon = item.icon!;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/40 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase">
                    Bald
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-center text-[11px] font-medium text-muted-foreground">
            Alpha IT Innovations GmbH
          </p>
        </div>
      </aside>
    </>
  );
}
