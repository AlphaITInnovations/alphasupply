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
  PackagePlus,
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
      { name: "Wareneingang", href: "/inventory/receiving", icon: PackagePlus },
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
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform duration-300 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-petrol-light to-petrol shadow-lg shadow-petrol/20">
            <Package className="h-5 w-5 text-white" />
          </div>
          <Link href="/" className="flex flex-col" onClick={() => setMobileOpen(false)}>
            <span className="text-[15px] font-bold tracking-tight text-white">
              AlphaSupply
            </span>
            <span className="text-[10px] font-medium tracking-wide text-sidebar-foreground/50">
              LAGERVERWALTUNG
            </span>
          </Link>
        </div>

        {/* Divider with subtle glow */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            if ("items" in item && item.items) {
              return (
                <div key={item.name} className="mb-2">
                  <p className="mb-1.5 px-3 pt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/40">
                    {item.name}
                  </p>
                  <div className="space-y-0.5">
                    {item.items.map((subItem) => {
                      const knownSubPaths = ["/inventory/stock", "/inventory/receiving", "/inventory/movements", "/inventory/suppliers", "/inventory/locations"];
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
                            "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                            isActive
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {isActive && (
                            <span className="absolute left-0 h-6 w-1 rounded-r-full bg-petrol-light shadow-[0_0_8px_var(--color-petrol-light)]" />
                          )}
                          <subItem.icon className={cn(
                            "h-[18px] w-[18px] transition-colors",
                            isActive ? "text-petrol-light" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                          )} />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href!);
            const Icon = item.icon!;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground/25 cursor-not-allowed"
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.name}
                  <span className="ml-auto rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sidebar-foreground/30">
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
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 h-6 w-1 rounded-r-full bg-petrol-light shadow-[0_0_8px_var(--color-petrol-light)]" />
                )}
                <Icon className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isActive ? "text-petrol-light" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
        <div className="px-5 py-4">
          <p className="text-[10px] font-medium tracking-wide text-sidebar-foreground/30">
            Alpha IT Innovations GmbH
          </p>
        </div>
      </aside>
    </>
  );
}
