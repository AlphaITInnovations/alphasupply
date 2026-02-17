"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  Truck,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  ArrowLeftRight,
  Factory,
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
      { name: "Artikel", href: "/inventory", icon: Package },
      { name: "Lagerorte", href: "/inventory/locations", icon: MapPin },
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
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Package className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-sidebar-foreground">
              AlphaSupply
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => {
            if ("items" in item && item.items) {
              return (
                <div key={item.name} className="space-y-1">
                  <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.name}
                  </p>
                  {item.items.map((subItem) => {
                    const isActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary"
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
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  <span className="ml-auto text-[10px] uppercase">Demnächst</span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
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
        <div className="border-t border-sidebar-border p-3 text-center text-xs text-muted-foreground">
          Alpha IT Innovations
        </div>
      </aside>
    </>
  );
}
