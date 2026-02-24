"use client";

import Link from "next/link";
import { PackageSearch, Wrench, Send, ShoppingCart, PackageCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type DashboardCounts = {
  readyToCommission: number;
  inCommission: number;
  inSetup: number;
  readyToShip: number;
  openProcurement: number;
  pendingReceiving: number;
};

type ActionCard = {
  label: string;
  count: number;
  icon: LucideIcon;
  href: string;
  accent: string;
  iconColor: string;
};

export function ActionCards({ counts }: { counts: DashboardCounts }) {
  const cards: ActionCard[] = [
    {
      label: "Kommissionierung",
      count: counts.readyToCommission + counts.inCommission,
      icon: PackageSearch,
      href: "/auftraege?filter=commission",
      accent: "border-l-amber-500",
      iconColor: "text-amber-500",
    },
    {
      label: "Einrichtung",
      count: counts.inSetup,
      icon: Wrench,
      href: "/auftraege?filter=setup",
      accent: "border-l-violet-500",
      iconColor: "text-violet-500",
    },
    {
      label: "Versandbereit",
      count: counts.readyToShip,
      icon: Send,
      href: "/auftraege?filter=ready",
      accent: "border-l-emerald-500",
      iconColor: "text-emerald-500",
    },
    {
      label: "Zu bestellen",
      count: counts.openProcurement,
      icon: ShoppingCart,
      href: "/auftraege?filter=procurement",
      accent: "border-l-blue-500",
      iconColor: "text-blue-500",
    },
    {
      label: "Wareneingang",
      count: counts.pendingReceiving,
      icon: PackageCheck,
      href: "/wareneingang",
      accent: "border-l-teal-500",
      iconColor: "text-teal-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Link key={card.label} href={card.href}>
          <Card
            className={`border-l-4 ${card.accent} py-4 transition-shadow hover:shadow-md`}
          >
            <CardContent className="relative px-4">
              <card.icon
                className={`absolute right-0 top-0 h-5 w-5 ${card.iconColor} opacity-50`}
              />
              <div className="text-3xl font-bold">{card.count}</div>
              <div className="mt-1 text-sm text-muted-foreground">{card.label}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
