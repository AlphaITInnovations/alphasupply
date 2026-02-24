"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ClipboardList,
  LayoutDashboard,
  Warehouse,
  Factory,
  ListOrdered,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  dividerBefore?: boolean;
};

const navigation: NavItem[] = [
  { name: "Pipeline", href: "/", icon: LayoutDashboard },
  { name: "Aufträge", href: "/orders", icon: ClipboardList },
  { name: "Lager", href: "/inventory/stock", icon: Warehouse, dividerBefore: true },
  { name: "Artikelliste", href: "/inventory", icon: ListOrdered },
  { name: "Lieferanten", href: "/inventory/suppliers", icon: Factory },
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
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-sidebar transition-transform duration-300 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-12 items-center gap-3 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-petrol-light to-petrol shadow-lg shadow-petrol/20">
            <Package className="h-4 w-4 text-white" />
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const knownSubPaths = ["/inventory/stock", "/inventory/receiving", "/inventory/movements", "/inventory/suppliers", "/inventory/locations"];
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/inventory"
                  ? pathname === "/inventory" ||
                    (pathname.startsWith("/inventory/") &&
                      !knownSubPaths.some((p) => pathname.startsWith(p)))
                  : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <div key={item.name}>
                {item.dividerBefore && (
                  <div className="mx-1 my-2 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />
                )}
                <Link
                  href={item.href}
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
              </div>
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
