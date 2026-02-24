"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ClipboardList,
  LayoutDashboard,
  Warehouse,
  ListOrdered,
  Factory,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const navigation: NavItem[] = [
  { name: "Pipeline", href: "/", icon: LayoutDashboard },
  { name: "Aufträge", href: "/orders", icon: ClipboardList },
  { name: "Lager", href: "/inventory/stock", icon: Warehouse },
  { name: "Artikelliste", href: "/inventory", icon: ListOrdered },
  { name: "Lieferanten", href: "/inventory/suppliers", icon: Factory },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    const knownSubPaths = [
      "/inventory/stock",
      "/inventory/receiving",
      "/inventory/movements",
      "/inventory/suppliers",
      "/inventory/locations",
    ];
    if (href === "/") return pathname === "/";
    if (href === "/inventory") {
      return (
        pathname === "/inventory" ||
        (pathname.startsWith("/inventory/") &&
          !knownSubPaths.some((p) => pathname.startsWith(p)))
      );
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-dark shadow-md shadow-primary/20">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            AlphaSupply
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-b border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto max-w-screen-2xl space-y-1 px-4 py-3">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
