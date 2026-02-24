"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  PackageCheck,
  Sun,
  Truck,
  Warehouse,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "sidebar-collapsed";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavSection = {
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Aufträge", href: "/auftraege", icon: ClipboardList },
    ],
  },
  {
    items: [
      { name: "Lager", href: "/lager", icon: Warehouse },
      { name: "Artikelliste", href: "/artikelverwaltung", icon: Package },
      { name: "Wareneingang", href: "/wareneingang", icon: PackageCheck },
    ],
  },
  {
    items: [{ name: "Lieferanten", href: "/lieferanten", icon: Truck }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItemLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
      {navSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {sectionIndex > 0 && (
            <Separator className="my-2" />
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
                onClick={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ThemeButton({ collapsed }: { collapsed: boolean }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const button = (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      className={cn(
        "w-full",
        !collapsed && "justify-start gap-3 px-3"
      )}
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      {mounted ? (
        resolvedTheme === "light" ? (
          <Sun className="h-4.5 w-4.5 shrink-0" />
        ) : (
          <Moon className="h-4.5 w-4.5 shrink-0" />
        )
      ) : (
        <Sun className="h-4.5 w-4.5 shrink-0" />
      )}
      {!collapsed && (
        <span className="text-sm font-medium">
          {mounted && resolvedTheme === "light" ? "Dark Mode" : "Light Mode"}
        </span>
      )}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          Theme wechseln
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
    setHydrated(true);
  }, []);

  // Persist collapsed state
  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu öffnen</span>
        </Button>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-[15px] font-bold tracking-tight">
            AlphaSupply
          </span>
        </Link>
      </div>

      {/* Mobile sidebar (Sheet overlay) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0" showCloseButton>
          <SheetHeader className="border-b border-border px-4 py-4">
            <SheetTitle asChild>
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                  <Package className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-[15px] font-bold tracking-tight">
                  AlphaSupply
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto border-t border-border p-3">
              <ThemeButton collapsed={false} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:shrink-0 border-r border-border bg-sidebar sticky top-0 h-screen transition-[width] duration-200 ease-out",
          hydrated
            ? collapsed
              ? "w-16"
              : "w-60"
            : "w-60"
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-[15px] font-bold tracking-tight">
                AlphaSupply
              </span>
            </Link>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className={cn("shrink-0", collapsed && "mx-auto")}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {collapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {collapsed ? "Ausklappen" : "Einklappen"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Theme toggle at bottom */}
        <div className="border-t border-border p-3">
          <ThemeButton collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}
